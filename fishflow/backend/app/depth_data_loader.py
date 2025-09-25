import json
import boto3
from io import BytesIO
from pathlib import Path
from typing import List, Optional
from datetime import datetime, date, timedelta
import pandas as pd
from app.depth_models import (
    DepthScenarioSummary,
)
from app.movement_models import (
    GridGeometries,
    GeoJSONPolygon,
    GridCell,
)


class S3DepthDataLoader:
    def __init__(self, bucket_name: str, data_prefix: str = "depth"):
        self.bucket_name = bucket_name
        self.data_prefix = data_prefix
        self.s3_client = boto3.client("s3")
        self._load_scenarios()

    def _list_s3_objects(self, prefix: str):
        """List objects in S3 with given prefix"""
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name, Prefix=prefix
            )
            return response.get("Contents", [])
        except Exception as e:
            print(f"Error listing S3 objects with prefix {prefix}: {e}")
            return []

    def _read_s3_json(self, key: str):
        """Read and parse JSON file from S3"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            content = response["Body"].read()
            return json.loads(content)
        except Exception as e:
            print(f"Error reading JSON from S3 key {key}: {e}")
            return None

    def _read_s3_parquet(self, key: str):
        """Read parquet file from S3"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            content = response["Body"].read()
            return pd.read_parquet(BytesIO(content))
        except Exception as e:
            print(f"Error reading parquet from S3 key {key}: {e}")
            return None

    def _load_scenarios(self):
        """Load all scenario metadata from S3"""
        self.scenarios = []

        # List all objects with depth prefix to find scenario directories
        objects = self._list_s3_objects(f"{self.data_prefix}/")

        # Extract unique scenario IDs from object keys
        scenario_ids = set()
        for obj in objects:
            key_parts = obj["Key"].split("/")
            if len(key_parts) >= 3:  # depth/scenario_id/file
                scenario_id = key_parts[1]
                scenario_ids.add(scenario_id)

        # Load metadata for each scenario
        for scenario_id in scenario_ids:
            metadata_key = f"{self.data_prefix}/{scenario_id}/metadata.json"
            metadata = self._read_s3_json(metadata_key)

            if metadata:
                try:
                    # Convert date strings to date objects
                    metadata["time_window"] = [
                        datetime.strptime(d, "%Y-%m-%d").date()
                        for d in metadata["time_window"]
                    ]

                    scenario = DepthScenarioSummary(**metadata)
                    self.scenarios.append(scenario)
                    print(f"Loaded scenario: {scenario.scenario_id}")
                except Exception as e:
                    print(f"Error loading scenario {scenario_id}: {e}")

    def get_scenarios(self) -> List[DepthScenarioSummary]:
        """Get all available scenarios"""
        return self.scenarios

    def get_scenario_by_id(self, scenario_id: str) -> Optional[DepthScenarioSummary]:
        """Get a specific scenario by ID"""
        for scenario in self.scenarios:
            if scenario.scenario_id == scenario_id:
                return scenario
        return None

    def get_geometries(self, scenario_id: str) -> Optional[GridGeometries]:
        """Load geometries for a scenario from S3"""
        scenario = self.get_scenario_by_id(scenario_id)
        if not scenario:
            return None

        geometries_key = f"{self.data_prefix}/{scenario_id}/geometries.geojson"
        geojson_data = self._read_s3_json(geometries_key)

        if not geojson_data:
            return None

        try:
            # Validate GeoJSON structure
            if "features" not in geojson_data:
                print(f"Invalid GeoJSON: missing 'features' in {scenario_id}")
                return None

            # Convert GeoJSON FeatureCollection to our format
            grid_cells = []
            for feature in geojson_data["features"]:
                # Get cell_id from properties
                if (
                    "properties" not in feature
                    or "cell_id" not in feature["properties"]
                ):
                    print(f"Warning: Feature missing cell_id property in {scenario_id}")
                    continue

                cell_id = feature["properties"]["cell_id"]
                if not isinstance(cell_id, int):
                    print(
                        f"Warning: cell_id must be integer, got {type(cell_id)} in {scenario_id}"
                    )
                    continue

                # Validate geometry
                if "geometry" not in feature:
                    print(f"Warning: Feature missing geometry in {scenario_id}")
                    continue

                try:
                    geometry = GeoJSONPolygon(**feature["geometry"])
                    cell = GridCell(cell_id=cell_id, geometry=geometry)
                    grid_cells.append(cell)
                except Exception as e:
                    print(
                        f"Warning: Invalid geometry for cell {cell_id} in {scenario_id}: {e}"
                    )
                    continue

            if not grid_cells:
                print(f"No valid grid cells found in {scenario_id}")
                return None

            # Sort by cell_id to ensure consistent ordering
            grid_cells.sort(key=lambda x: x.cell_id)

            return GridGeometries(scenario_id=scenario_id, geometries=grid_cells)

        except Exception as e:
            print(f"Unexpected error processing geometries for {scenario_id}: {e}")
            return None

    def get_occupancy_data(
        self, scenario_id: str, month: str, depth_bin: int
    ) -> Optional[dict]:
        """Load occupancy data for a specific scenario, month, and depth bin from S3"""
        scenario = self.get_scenario_by_id(scenario_id)
        if not scenario:
            return None

        # Parse month (expecting format like "2024-01-01" for January 2024)
        try:
            month_date = datetime.strptime(month, "%Y-%m-%d").date()
            month_str = month_date.strftime("%Y-%m")  # Convert to "2024-01" format
        except ValueError:
            print(f"Invalid month format: {month}. Expected YYYY-MM-DD")
            return None

        # Construct S3 key
        parquet_key = f"{self.data_prefix}/{scenario_id}/{month_str}.parquet.gz"
        df = self._read_s3_parquet(parquet_key)

        if df is None:
            return None

        try:
            # Filter by depth bin
            df_filtered = df[df["depth_bin"] == depth_bin].copy()

            if df_filtered.empty:
                print(f"No data found for depth bin {depth_bin} in {month_str}")
                return None

            df_filtered["timestamp"] = pd.to_datetime(df_filtered["timestamp"])

            # Get unique timestamps (sorted) for reference
            timestamps = sorted(df_filtered["timestamp"].unique())
            timestamp_strings = [
                ts.strftime("%Y-%m-%dT%H:%M:%S%z") for ts in timestamps
            ]

            # Group by cell_id and create ordered probability lists
            cell_data = {}
            for cell_id, cell_group in df_filtered.groupby("cell_id"):
                # Sort by timestamp to ensure correct order
                cell_group_sorted = cell_group.sort_values("timestamp")

                # Create probability list in timestamp order
                probabilities = cell_group_sorted["probability"].tolist()
                cell_data[int(cell_id)] = probabilities

            return {
                "scenario_id": scenario_id,
                "month": month,
                "depth_bin": depth_bin,
                "data": {"timestamps": timestamp_strings, "cells": cell_data},
            }

        except Exception as e:
            print(
                f"Error processing occupancy data for {scenario_id}, {month_str}, depth {depth_bin}: {e}"
            )
            return None

    def get_cell_max_depths(self, scenario_id: str) -> Optional[dict]:
        """Load cell maximum depths for a scenario from S3"""
        scenario = self.get_scenario_by_id(scenario_id)
        if not scenario:
            return None

        # Construct S3 key
        cell_depths_key = f"{self.data_prefix}/{scenario_id}/cell_depths.json"
        cell_depths_data = self._read_s3_json(cell_depths_key)

        if not cell_depths_data:
            return None

        try:
            # Validate that it's a list/array
            if not isinstance(cell_depths_data, list):
                print(
                    f"Invalid cell depths format: expected array, got {type(cell_depths_data)}"
                )
                return None

            return {"scenario_id": scenario_id, "cell_max_depths": cell_depths_data}

        except Exception as e:
            print(f"Unexpected error processing cell depths for {scenario_id}: {e}")
            return None
