import json
from pathlib import Path
from typing import List
from datetime import datetime
from app.models import ScenarioSummary


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


data_loader = DataLoader()
