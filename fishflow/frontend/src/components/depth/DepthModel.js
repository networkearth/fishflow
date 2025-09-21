import React, { useState } from 'react';
import './DepthModel.css';
import DepthScenarioSelector from './DepthScenarioSelector';
import FilterPanels from './FilterPanels';
import { loadRequiredData } from './depthDataLoader';

const DepthModel = ({ onNavigate }) => {
  // Core state for the depth model
  const [currentScenario, setCurrentScenario] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [tolerance, setTolerance] = useState(0.05);

  const [filterState, setFilterState] = useState({
    depthBins: {},  // Changed to object format for new depth filter
    dateRange: { start: null, end: null },
    timeOfDay: [{ start: '00:00', end: '23:59' }]  // Default to full day
  });

  // Data loading states
  const [loadedData, setLoadedData] = useState({});
  const [geometries, setGeometries] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0, isLoading: false });
  const [dataError, setDataError] = useState(null);
  const [geometryError, setGeometryError] = useState(null);

  // Handle filter changes and trigger data loading
  const handleFiltersChange = async (newFilters) => {
    setFilterState(newFilters);
    
    if (!currentScenario) {
      console.log('No scenario selected, skipping data load');
      return;
    }

    setLoadingProgress(prev => ({ ...prev, isLoading: true }));
    setDataError(null);

    try {
      console.log('Loading data for filters:', newFilters);
      
      const newData = await loadRequiredData(
        currentScenario.scenario_id,
        newFilters,
        loadedData,
        (loaded, total) => {
          setLoadingProgress({ loaded, total, isLoading: true });
        }
      );
      
      // Merge new data with existing
      setLoadedData(prev => ({ ...prev, ...newData }));
      
      console.log(`Loaded ${Object.keys(newData).length} new data chunks`);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setDataError(error.message);
    } finally {
      setLoadingProgress(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle scenario changes
  const handleScenarioChange = async (scenario) => {
    setCurrentScenario(scenario);
    
    // Reset data when scenario changes
    setLoadedData({});
    setGeometries(null);
    setLoadingProgress({ loaded: 0, total: 0, isLoading: false });
    setDataError(null);
    setGeometryError(null);
    
    if (!scenario) return;
    
    // Set default date range to scenario's time window
    if (scenario.time_window && scenario.time_window.length >= 2) {
      setFilterState(prev => ({
        ...prev,
        dateRange: {
          start: scenario.time_window[0],
          end: scenario.time_window[1]
        }
      }));
    }
    
    // Load geometries for this scenario
    try {
      console.log(`Loading geometries for scenario: ${scenario.scenario_id}`);
      
      const response = await fetch(
        `http://localhost:8000/v1/depth/scenario/${scenario.scenario_id}/geometries`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to load geometries: ${response.status}`);
      }
      
      const geometryData = await response.json();
      setGeometries(geometryData.geometries);
      
      console.log(`Loaded ${geometryData.geometries.length} geometries`);
      
    } catch (error) {
      console.error('Error loading geometries:', error);
      setGeometryError(error.message);
    }
  };

  return (
    <div className="depth-model">
        {/* Left Sidebar - Scenario Selection */}
        <div className="scenario-sidebar">
            <DepthScenarioSelector 
                onScenarioLoad={handleScenarioChange} 
                currentScenario={currentScenario} 
            />
        </div>

      {/* Center Panel - Map and Time Series */}
      <div className="center-panels">
        {/* Main Map Panel */}
        <div className="map-panel">
          <div className="panel-header">
            <h3>Minimum Risk by H3 Cell</h3>
            <div className="panel-header-controls">
              {loadingProgress.isLoading && (
                <div className="loading-indicator">
                  Loading: {loadingProgress.loaded}/{loadingProgress.total} chunks
                </div>
              )}
              <button onClick={() => onNavigate('home')} className="back-button">
                  ← Home
              </button>
            </div>
          </div>
          <div className="map-container">
            {/* Placeholder for depth map */}
            <div className="map-placeholder">
              <p>Main risk map will be displayed here</p>
              <p>H3 cells showing minimum risk values</p>
              
              {geometryError && (
                <div className="error-message">
                  <p>Error loading geometries: {geometryError}</p>
                </div>
              )}
              
              {dataError && (
                <div className="error-message">
                  <p>Error loading data: {dataError}</p>
                </div>
              )}
              
              {geometries && (
                <div className="geometry-status">
                  <p>Loaded {geometries.length} cell geometries</p>
                </div>
              )}
              
              {Object.keys(loadedData).length > 0 && (
                <div className="data-status">
                  <p>Loaded {Object.keys(loadedData).length} data chunks</p>
                </div>
              )}
              
              {selectedCell && (
                <p>Selected cell: {selectedCell}</p>
              )}
            </div>
          </div>
        </div>

        {/* Time Series Panel */}
        <div className="timeseries-panel">
          <div className="panel-header">
            <h3>Risk Over Time - Selected Cell</h3>
            <div className="tolerance-controls">
              <label>Tolerance: </label>
              <input 
                type="range" 
                min="0.01" 
                max="0.2" 
                step="0.01"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                className="tolerance-slider"
              />
              <span>±{tolerance.toFixed(2)}</span>
            </div>
          </div>
          <div className="timeseries-container">
            {selectedCell ? (
              <div className="timeseries-placeholder">
                <p>Time series chart will be displayed here</p>
                <p>Showing risk over time for selected cell</p>
                <p>Tolerance bands and minimum risk periods highlighted</p>
              </div>
            ) : (
              <div className="timeseries-empty">
                <p>Select a cell on the map to view risk over time</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Filter Panels */}
      <FilterPanels 
        scenario={currentScenario}
        selectedDepthBins={filterState.depthBins}
        dateRange={filterState.dateRange}
        timeOfDay={filterState.timeOfDay}
        onFiltersChange={handleFiltersChange}
      />
    </div>
  );
};

export default DepthModel;