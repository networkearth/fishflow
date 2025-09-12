from typing import List
from pydantic import BaseModel
from datetime import date


class ScenarioSummary(BaseModel):
    scenario_id: str
    name: str
    species: str
    region: str
    description: str
    dates: List[date]
    maximum_window_size: int
    grid_size: int
    r_values: List[float]
    map_center: List[float]  # [lat, lng]
    map_zoom: int

    class Config:
        json_schema_extra = {
            "example": {
                "scenario_id": "chinook_gulf_of_alaska_2022",
                "name": "Chinook Salmon - Gulf of Alaska 2022",
                "species": "Chinook salmon",
                "region": "Gulf of Alaska",
                "description": "Daily movement patterns for Chinook salmon in the Gulf of Alaska",
                "dates": ["2022-01-01", "2022-04-01", "2022-07-01", "2022-10-01"],
                "maximum_window_size": 14,
                "grid_size": 233,
                "r_values": [0.025, 0.05, 0.075, 0.1, 0.125, 0.15],
                "map_center": [58.5, -152.0],
                "map_zoom": 6,
            }
        }


class ScenariosResponse(BaseModel):
    scenarios: List[ScenarioSummary]


class GeoJSONPolygon(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]


class GridCell(BaseModel):
    cell_id: int
    geometry: GeoJSONPolygon


class GridGeometries(BaseModel):
    scenario_id: str
    geometries: List[GridCell]


class HabitatDataItem(BaseModel):
    date: date
    r: float
    probability: List[float]


class AllHabitatQuality(BaseModel):
    scenario_id: str
    habitat_data: List[HabitatDataItem]
