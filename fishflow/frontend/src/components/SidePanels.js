import { useState } from 'react';
import MovementPanel from './MovementPanel';
import './SidePanels.css';

const calculateBasinAnalysis = ({ movementMatrices, selectedCells, currentDate, timeWindow }) => {
  // Get the required date sequence for backward projection
  const dates = [];
  const startDate = new Date(currentDate);
  
  for (let i = 1; i <= timeWindow; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!movementMatrices[dateStr]) {
      console.warn(`Missing matrix for date ${dateStr}`);
      return {};
    }
    dates.push(dateStr);
  }
  
  // Get matrix dimensions
  const firstMatrix = movementMatrices[dates[0]];
  const n = firstMatrix.length;
  
  // Create target vector x with 1s for selected cells, 0s elsewhere
  const x = new Array(n).fill(0);
  selectedCells.forEach(cellId => {
    if (cellId < n) {
      x[cellId] = 1;
    }
  });
  
  // Compute composite matrix B = M(t-1) * M(t-2) * ... * M(t-w)
  let B = null;
  
  for (const dateStr of dates) {
    const M = movementMatrices[dateStr];
    
    if (B === null) {
      // Initialize B with first matrix
      B = M.map(row => [...row]);
    } else {
      // Multiply B = B * M
      const newB = Array(n).fill(null).map(() => Array(n).fill(0));
      
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          for (let k = 0; k < n; k++) {
            newB[i][j] += B[i][k] * M[k][j];
          }
        }
      }
      
      B = newB;
    }
  }
  
  // For each cell, compute dot product of its column in B with target vector x
  const analysisResult = {};
  
  for (let j = 0; j < n; j++) {
    let dotProduct = 0;
    for (let i = 0; i < n; i++) {
      dotProduct += B[i][j] * x[i];
    }
    analysisResult[j] = dotProduct;
  }
  
  return analysisResult;
};

const calculateProjectionAnalysis = ({ movementMatrices, selectedCells, currentDate, timeWindow }) => {
  // Get the required date sequence for forward projection
  const dates = [];
  const startDate = new Date(currentDate);
  
  for (let i = 0; i < timeWindow; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!movementMatrices[dateStr]) {
      console.warn(`Missing matrix for date ${dateStr}`);
      return {};
    }
    dates.push(dateStr);
  }
  
  // Get matrix dimensions
  const firstMatrix = movementMatrices[dates[0]];
  const n = firstMatrix.length;
  
  // Create initial vector x with 1s for selected cells, 0s elsewhere
  const x = new Array(n).fill(0);
  selectedCells.forEach(cellId => {
    if (cellId < n) {
      x[cellId] = 1;
    }
  });
  
  // Apply matrices sequentially: x' = M(t+w-1) * ... * M(t+1) * M(t) * x
  let result = [...x];
  
  for (const dateStr of dates) {
    const M = movementMatrices[dateStr];
    const newResult = new Array(n).fill(0);
    
    // Matrix-vector multiplication: newResult = M * result
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newResult[i] += M[i][j] * result[j];
      }
    }
    
    result = newResult;
  }
  
  // Convert result array to object mapping cell_id -> probability
  const analysisResult = {};
  for (let i = 0; i < n; i++) {
    analysisResult[i] = result[i];
  }
  
  return analysisResult;
};

// Color functions for the two analysis types
const getBasinColor = (value) => {
  // Normalize to 0-1 range and create blue color scale
  const normalizedValue = Math.max(0, Math.min(1, value));
  const baseColor = [0, 100, 255]; // Blue
  
  // Near white at 0, full saturation at 1
  const r = Math.round(255 - (255 - baseColor[0]) * normalizedValue);
  const g = Math.round(255 - (255 - baseColor[1]) * normalizedValue);
  const b = Math.round(255 - (255 - baseColor[2]) * normalizedValue);
  
  return `rgb(${r}, ${g}, ${b})`;
};

const getProjectionColor = (value) => {
  // Normalize to 0-1 range and create orange color scale
  const normalizedValue = Math.max(0, Math.min(1, value));
  const baseColor = [255, 140, 0]; // Orange
  
  // Near white at 0, full saturation at 1
  const r = Math.round(255 - (255 - baseColor[0]) * normalizedValue);
  const g = Math.round(255 - (255 - baseColor[1]) * normalizedValue);
  const b = Math.round(255 - (255 - baseColor[2]) * normalizedValue);
  
  return `rgb(${r}, ${g}, ${b})`;
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