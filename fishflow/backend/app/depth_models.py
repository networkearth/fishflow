from typing import List, Union, Any
from pydantic import BaseModel
from datetime import date


class DepthScenarioSummary(BaseModel):
    scenario_id: str
    name: str
    species: str
    region: str
    description: str
    time_window: List[date]
    grid_size: int
    depth_bins: List[int]
    resolution: str
    map_center: List[float]  # [lat, lng]
    map_zoom: int

    class Config:
        json_schema_extra = {
            "example": {
                "scenario_id": "chinook_gulf_of_alaska_2022",
                "name": "Chinook Salmon - Gulf of Alaska 2022",
                "species": "Chinook salmon",
                "region": "Gulf of Alaska",
                "description": "Hourly depth occupancy for Chinook salmon in the Gulf of Alaska",
                "time_window": ["2022-01-01", "2022-12-31"],
                "depth_bins": [25, 50, 75, 100, 150, 200, 250, 300, 400, 500],
                "grid_size": 233,
                "map_center": [58.5, -152.0],
                "map_zoom": 6,
                "resolution": "hourly",
            }
        }


class DepthScenariosResponse(BaseModel):
    scenarios: List[DepthScenarioSummary]
