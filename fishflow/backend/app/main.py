from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    ScenariosResponse,
)
from app.data_loader import data_loader

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


@app.get("/v1/scenarios", response_model=ScenariosResponse)
async def get_scenarios():
    """List all available scenarios"""
    scenarios = data_loader.get_scenarios()
    return ScenariosResponse(scenarios=scenarios)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "FishFlow API is running", "version": "0.0.1"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
