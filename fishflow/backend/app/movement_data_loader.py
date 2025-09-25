import json
import boto3
import h5py
from io import BytesIO
from pathlib import Path
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.movement_models import (
    MovementScenarioSummary,
    GridGeometries,
    GeoJSONPolygon,
    GridCell,
    HabitatDataItem,
    AllHabitatQuality,
    MovementMatrix,
    MovementMatrices,
)


class S3MovementDataLoader:
    def __init__(self, bucket_name: str, data_prefix: str = "movement"):
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

    def _read_s3_hdf5(self, key: str):
        """Read HDF5 file from S3 into memory"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            content = response["Body"].read()
            # Create a BytesIO object that h5py can read from
            return BytesIO(content)
        except Exception as e:
            print(f"Error reading HDF5 from S3 key {key}: {e}")
            return None

    def _load_scenarios(self):
        """Load all scenario metadata from S3"""
        self.scenarios = []

        # List all objects with movement prefix to find scenario directories
        objects = self._list_s3_objects(f"{self.data_prefix}/")

        # Extract unique scenario IDs from object keys
        scenario_ids = set()
        for obj in objects:
            key_parts = obj["Key"].split("/")
            if len(key_parts) >= 3:  # movement/scenario_id/file
                scenario_id = key_parts[1]
                scenario_ids.add(scenario_id)

        # Load metadata for each scenario
        for scenario_id in scenario_ids:
            metadata_key = f"{self.data_prefix}/{scenario_id}/metadata.json"
            metadata = self._read_s3_json(metadata_key)

            if metadata:
                try:
                    # Convert date strings to date objects
                    metadata["dates"] = [
                        datetime.strptime(d, "%Y-%m-%d").date()
                        for d in metadata["dates"]
                    ]

                    scenario = MovementScenarioSummary(**metadata)
                    self.scenarios.append(scenario)
                    print(f"Loaded scenario: {scenario.scenario_id}")
                except Exception as e:
                    print(f"Error loading scenario {scenario_id}: {e}")

    def get_scenarios(self) -> List[MovementScenarioSummary]:
        """Get all available scenarios"""
        return self.scenarios

    def get_scenario_by_id(self, scenario_id: str) -> Optional[MovementScenarioSummary]:
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

    def get_habitat_quality(self, scenario_id: str) -> Optional[AllHabitatQuality]:
        """Load all habitat quality data for a scenario from S3"""
        scenario = self.get_scenario_by_id(scenario_id)
        if not scenario:
            return None

        habitat_key = f"{self.data_prefix}/{scenario_id}/habitat.json"
        habitat_json = self._read_s3_json(habitat_key)

        if not habitat_json:
            return None

        try:
            # Validate structure and convert date strings to date objects
            habitat_data = []
            for item in habitat_json:
                item_date = datetime.strptime(item["date"], "%Y-%m-%d").date()
                habitat_data.append(
                    HabitatDataItem(
                        date=item_date,
                        r=float(item["r"]),
                        probability=item["probability"],
                    )
                )

            return AllHabitatQuality(scenario_id=scenario_id, habitat_data=habitat_data)

        except (KeyError, ValueError) as e:
            print(f"Error processing habitat data for {scenario_id}: {e}")
            return None

    def get_movement_matrices(
        self, scenario_id: str, start_date: date, end_date: date
    ) -> Optional[MovementMatrices]:
        """Load movement matrices for a date range from S3"""
        scenario = self.get_scenario_by_id(scenario_id)
        if not scenario:
            return None

        matrices_key = f"{self.data_prefix}/{scenario_id}/matrices.hdf5"
        hdf5_buffer = self._read_s3_hdf5(matrices_key)

        if not hdf5_buffer:
            return None

        try:
            with h5py.File(hdf5_buffer, "r") as f:
                matrices = []
                current_date = start_date

                while current_date <= end_date:
                    date_str = current_date.strftime("%Y-%m-%d")

                    if date_str in f:
                        try:
                            # Convert to list for JSON serialization
                            matrix_data = f[date_str][:, :].tolist()
                            matrices.append(
                                MovementMatrix(date=current_date, matrix=matrix_data)
                            )
                        except Exception as e:
                            print(
                                f"Error reading matrix for {date_str} in {scenario_id}: {e}"
                            )
                    else:
                        print(f"No matrix found for date {date_str} in {scenario_id}")

                    current_date += timedelta(days=1)

                if not matrices:
                    print(
                        f"No matrices found for date range {start_date} to {end_date} in {scenario_id}"
                    )
                    return None

                return MovementMatrices(
                    scenario_id=scenario_id,
                    start_date=start_date,
                    end_date=end_date,
                    matrices=matrices,
                )

        except Exception as e:
            print(f"Error processing matrices file for {scenario_id}: {e}")
            return None
