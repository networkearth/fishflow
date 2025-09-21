import json
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


class DepthDataLoader:
    def __init__(self, data_dir: str = "data/depth"):
        self.data_dir = Path(data_dir)
        self._load_scenarios()

    def _load_scenarios(self):
        """Load all scenario metadata from directory structure"""
        self.scenarios = []

        if not self.data_dir.exists():
            print(f"Warning: Data directory {self.data_dir} does not exist")
            return

        for scenario_dir in self.data_dir.iterdir():
            if scenario_dir.is_dir():
                metadata_file = scenario_dir / "metadata.json"
                if metadata_file.exists():
                    try:
                        with open(metadata_file, "r") as f:
                            metadata = json.load(f)

                        # Convert date strings to date objects
                        metadata["time_window"] = [
                            datetime.strptime(d, "%Y-%m-%d").date()
                            for d in metadata["time_window"]
                        ]

                        scenario = DepthScenarioSummary(**metadata)
                        self.scenarios.append(scenario)
                        print(f"Loaded scenario: {scenario.scenario_id}")
                    except Exception as e:
                        print(f"Error loading scenario from {scenario_dir}: {e}")

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
        """Load geometries for a scenario"""
        scenario = self.get_scenario_by_id(scenario_id)
        if not scenario:
            return None

        geometries_file = self.data_dir / scenario_id / "geometries.geojson"
        if not geometries_file.exists():
            print(f"Geometries file not found: {geometries_file}")
            return None

        try:
            with open(geometries_file, "r") as f:
                geojson_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Invalid JSON in geometries file for {scenario_id}: {e}")
            return None
        except IOError as e:
            print(f"Error reading geometries file for {scenario_id}: {e}")
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
        """Load occupancy data for a specific scenario, month, and depth bin"""
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

        # Construct file path
        parquet_file = self.data_dir / scenario_id / f"{month_str}.parquet.gz"
        if not parquet_file.exists():
            print(f"Occupancy data file not found: {parquet_file}")
            return None

        try:
            # Load parquet file
            df = pd.read_parquet(parquet_file)

            # Filter by depth bin
            df_filtered = df[df["depth_bin"] == depth_bin].copy()

            if df_filtered.empty:
                print(f"No data found for depth bin {depth_bin} in {month_str}")
                return None

            df_filtered["timestamp"] = pd.to_datetime(df_filtered["timestamp"])

            # Get unique timestamps (sorted)
            timestamps = sorted(
                df_filtered["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%S%z").unique()
            )

            # Pivot to get 2D array structure: [timestamp][cell]
            pivot_df = df_filtered.pivot(
                index="timestamp", columns="cell_id", values="probability"
            )

            # Convert to list of lists (timestamps × cells)
            probabilities = pivot_df.values.tolist()

            return {
                "scenario_id": scenario_id,
                "month": month,
                "depth_bin": depth_bin,
                "data": {"timestamps": timestamps, "probabilities": probabilities},
            }

        except Exception as e:
            print(
                f"Error loading occupancy data for {scenario_id}, {month_str}, depth {depth_bin}: {e}"
            )
            return None


depth_data_loader = DepthDataLoader()
