import json
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from app.models import (
    ScenarioSummary,
    GridGeometries,
    GeoJSONPolygon,
    GridCell,
    HabitatDataItem,
    AllHabitatQuality,
)


class DataLoader:
    def __init__(self, data_dir: str = "data"):
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
                        metadata["dates"] = [
                            datetime.strptime(d, "%Y-%m-%d").date()
                            for d in metadata["dates"]
                        ]

                        scenario = ScenarioSummary(**metadata)
                        self.scenarios.append(scenario)
                        print(f"Loaded scenario: {scenario.scenario_id}")
                    except Exception as e:
                        print(f"Error loading scenario from {scenario_dir}: {e}")

    def get_scenarios(self) -> List[ScenarioSummary]:
        """Get all available scenarios"""
        return self.scenarios

    def get_scenario_by_id(self, scenario_id: str) -> Optional[ScenarioSummary]:
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

    def get_habitat_quality(self, scenario_id: str) -> Optional[AllHabitatQuality]:
        """Load all habitat quality data for a scenario"""
        scenario = self.get_scenario_by_id(scenario_id)
        if not scenario:
            return None

        habitat_file = self.data_dir / scenario_id / "habitat.json"
        if not habitat_file.exists():
            print(f"Habitat file not found: {habitat_file}")
            return None

        try:
            with open(habitat_file, "r") as f:
                habitat_json = json.load(f)

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

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Error loading habitat data for {scenario_id}: {e}")
            return None


data_loader = DataLoader()
