from typing import List, Union, Any, Dict
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


class OccupancyData(BaseModel):
    timestamps: List[str]
    cells: Dict[int, List[float]]


class OccupancyResponse(BaseModel):
    scenario_id: str
    month: str
    depth_bin: int
    data: OccupancyData

    class Config:
        json_schema_extra = {
            "example": {
                "scenario_id": "chinook_goa_depth_2024",
                "month": "2024-01-01",
                "depth_bin": 100,
                "data": {
                    "timestamps": [
                        "2024-01-01T00:00:00-09:00",
                        "2024-01-01T01:00:00-09:00",
                    ],
                    "cells": {"0": [0.1, 0.15], "1": [0.2, 0.25], "5": [0.0, 0.05]},
                },
            }
        }
