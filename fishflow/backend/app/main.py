from datetime import date, timedelta

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.movement_models import (
    MovementScenariosResponse,
    GridGeometries,
    AllHabitatQuality,
    MovementMatrices,
)
from app.movement_data_loader import movement_data_loader

app = FastAPI(
    title="FishFlow API",
    description="API for exploring fish movement patterns and habitat quality analysis",
    version="0.0.1",
)

# Add CORS middleware for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/v1/movement/scenarios", response_model=MovementScenariosResponse)
async def get_scenarios():
    """List all available scenarios"""
    scenarios = movement_data_loader.get_scenarios()
    return MovementScenariosResponse(scenarios=scenarios)


@app.get(
    "/v1/movement/scenario/{scenario_id}/geometries", response_model=GridGeometries
)
async def get_scenario_geometries(scenario_id: str):
    """Get spatial grid geometries for scenario"""
    geometries = movement_data_loader.get_geometries(scenario_id)
    if not geometries:
        raise HTTPException(
            status_code=404, detail="Scenario not found or geometries unavailable"
        )
    return geometries


@app.get(
    "/v1/movement/scenario/{scenario_id}/habitat", response_model=AllHabitatQuality
)
async def get_habitat_quality(scenario_id: str):
    """Get all habitat quality data for scenario"""
    habitat_data = movement_data_loader.get_habitat_quality(scenario_id)
    if not habitat_data:
        raise HTTPException(
            status_code=404, detail="Scenario not found or habitat data unavailable"
        )
    return habitat_data


@app.get(
    "/v1/movement/scenario/{scenario_id}/matrices", response_model=MovementMatrices
)
async def get_movement_matrices(
    scenario_id: str,
    start_date: date = Query(..., description="Start date for date range (ISO format)"),
    end_date: date = Query(
        ..., description="End date for date range (ISO format, inclusive)"
    ),
):
    """Get movement matrices for date range"""
    # Validate scenario exists
    scenario = movement_data_loader.get_scenario_by_id(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Validate date range
    if start_date > end_date:
        raise HTTPException(
            status_code=400, detail="start_date must be before or equal to end_date"
        )

    # Validate dates are within scenario's available range
    # Available range = any habitat date ± maximum_window_size

    earliest_available = None
    latest_available = None

    for habitat_date in scenario.dates:
        window_start = habitat_date - timedelta(days=scenario.maximum_window_size)
        window_end = habitat_date + timedelta(days=scenario.maximum_window_size)

        if earliest_available is None or window_start < earliest_available:
            earliest_available = window_start
        if latest_available is None or window_end > latest_available:
            latest_available = window_end

    # Check if requested range is within bounds
    if start_date < earliest_available:
        raise HTTPException(
            status_code=400,
            detail=f"start_date {start_date} is before earliest available date {earliest_available}",
        )

    if end_date > latest_available:
        raise HTTPException(
            status_code=400,
            detail=f"end_date {end_date} is after latest available date {latest_available}",
        )

    # Calculate total days requested (add reasonable limit)
    total_days = (end_date - start_date).days + 1
    if total_days > 60:  # Reasonable limit to prevent huge requests
        raise HTTPException(
            status_code=400,
            detail=f"Date range too large: {total_days} days requested (maximum 60 days)",
        )

    matrices = movement_data_loader.get_movement_matrices(
        scenario_id, start_date, end_date
    )
    if not matrices:
        raise HTTPException(
            status_code=404, detail="Movement matrices unavailable for this date range"
        )

    return matrices


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "FishFlow API is running", "version": "0.0.1"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
