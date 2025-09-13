import { useState } from 'react';
import MovementPanel from './MovementPanel';
import './SidePanels.css';

// Placeholder calculation functions - replace with real matrix math later
const calculateBasinAnalysis = ({ movementMatrices, selectedCells, currentDate, timeWindow }) => {
  // Mock: cells closer to selected cells have higher "feeding" values
  const result = {};
  
  // Generate some mock values for demonstration
  for (let cellId = 0; cellId < 1000; cellId++) {
    if (selectedCells.includes(cellId)) {
      result[cellId] = 0; // Selected cells don't feed into themselves for basin analysis
    } else {
      // Mock calculation based on distance from selected cells
      const mockValue = Math.random() * 0.5 * (timeWindow / 10); // Scale with time window
      result[cellId] = mockValue;
    }
  }
  
  return result;
};

const calculateProjectionAnalysis = ({ movementMatrices, selectedCells, currentDate, timeWindow }) => {
  // Mock: density spreads outward from selected cells
  const result = {};
  
  // Generate some mock values for demonstration
  for (let cellId = 0; cellId < 1000; cellId++) {
    if (selectedCells.includes(cellId)) {
      result[cellId] = 1.0; // Selected cells have high projection values
    } else {
      // Mock calculation - spreading outward with decay
      const mockValue = Math.random() * 0.3 * (timeWindow / 15); // Scale with time window
      result[cellId] = mockValue;
    }
  }
  
  return result;
};

// Color functions for the two analysis types
const getBasinColor = (value) => {
  // Blue color scale for basin analysis
  const intensity = Math.min(value, 1);
  return `rgba(0, 100, 255, ${intensity})`;
};

const getProjectionColor = (value) => {
  // Orange color scale for projection analysis
  const intensity = Math.min(value, 1);
  return `rgba(255, 140, 0, ${intensity})`;
};

function SidePanels({ 
  geometries,
  movementMatrices,
  selectedCells,
  currentDate,
  scenario
}) {
  const [timeWindow, setTimeWindow] = useState(7); // Default to 7 days
  
  const handleTimeWindowChange = (event) => {
    setTimeWindow(parseInt(event.target.value));
  };
  
  const maxTimeWindow = scenario?.maximum_window_size || 30;
  
  return (
    <div className="side-panels-container">
      {/* Basin Analysis Panel */}
      <div className="analysis-panel">
        <div className="panel-header">Basin Analysis</div>
        <MovementPanel
          geometries={geometries}
          movementMatrices={movementMatrices}
          selectedCells={selectedCells}
          currentDate={currentDate}
          scenario={scenario}
          timeWindow={timeWindow}
          calculationFunction={calculateBasinAnalysis}
          title="Basin Analysis"
          colorFunction={getBasinColor}
        />
      </div>
      
      {/* Projection Analysis Panel */}
      <div className="analysis-panel">
        <div className="panel-header">Forward Projection</div>
        <MovementPanel
          geometries={geometries}
          movementMatrices={movementMatrices}
          selectedCells={selectedCells}
          currentDate={currentDate}
          scenario={scenario}
          timeWindow={timeWindow}
          calculationFunction={calculateProjectionAnalysis}
          title="Forward Projection"
          colorFunction={getProjectionColor}
        />
      </div>
      
      {/* Shared time window control at bottom */}
      <div className="time-control-footer">
        <div className="time-window-control">
          <label>Time Window: {timeWindow} days</label>
          <input
            type="range"
            min="1"
            max={maxTimeWindow}
            value={timeWindow}
            onChange={handleTimeWindowChange}
            className="time-window-slider"
          />
          <div className="time-range-labels">
            <span>1 day</span>
            <span>{maxTimeWindow} days</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidePanels;