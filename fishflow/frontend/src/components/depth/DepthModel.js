import React, { useState } from 'react';
import './DepthModel.css';
import DepthScenarioSelector from './DepthScenarioSelector';

const DepthModel = ({ onNavigate }) => {
  // Core state for the depth model
  const [currentScenario, setCurrentScenario] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [tolerance, setTolerance] = useState(0.05);

  // Filter states
  const [selectedDepthBins, setSelectedDepthBins] = useState([]);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [timeOfDay, setTimeOfDay] = useState([]);

  return (
    <div className="depth-model">
        {/* Left Sidebar - Scenario Selection */}
        <div className="scenario-sidebar">
            <DepthScenarioSelector 
                onScenarioLoad={setCurrentScenario} 
                currentScenario={currentScenario} 
            />
        </div>

      {/* Center Panel - Map and Time Series */}
      <div className="center-panels">
        {/* Main Map Panel */}
        <div className="map-panel">
          <div className="panel-header">
            <h3>Minimum Risk by H3 Cell</h3>
            <button onClick={() => onNavigate('home')} className="back-button">
                ← Home
            </button>
          </div>
          <div className="map-container">
            {/* Placeholder for depth map */}
            <div className="map-placeholder">
              <p>Main risk map will be displayed here</p>
              <p>H3 cells showing minimum risk values</p>
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
      <div className="filter-sidebar">
        <div className="sidebar-header">
          <h3>Filters</h3>
        </div>

        {/* Depth Filter Panel */}
        <div className="filter-panel depth-filter-panel">
          <div className="filter-header">
            <h4>Depth Selection</h4>
            <span className="expand-icon">▼</span>
          </div>
          <div className="filter-content">
            <div className="depth-placeholder">
              <p>Depth bin selection will go here</p>
              <p>Interactive depth bin selector (0-500m, 10 bins)</p>
              <div className="apply-button-placeholder">
                <button className="apply-button">Apply Filters</button>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Filter Panel */}
        <div className="filter-panel date-filter-panel collapsed">
          <div className="filter-header">
            <h4>Date Range</h4>
            <span className="expand-icon">▶</span>
          </div>
          <div className="filter-summary">
            Jan 1 - Dec 31, 2024
          </div>
        </div>

        {/* Time of Day Filter Panel */}
        <div className="filter-panel time-filter-panel collapsed">
          <div className="filter-header">
            <h4>Time of Day</h4>
            <span className="expand-icon">▶</span>
          </div>
          <div className="filter-summary">
            6:00-10:00, 18:00-22:00
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepthModel;