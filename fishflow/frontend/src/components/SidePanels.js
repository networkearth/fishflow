import { Matrix } from 'ml-matrix';
import { useState } from 'react';
import MovementPanel from './MovementPanel';
import './SidePanels.css';

const calculateProjectionAnalysis = ({ movementMatrices, selectedCells, currentDate, timeWindow }) => {
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
  
  const firstMatrix = movementMatrices[dates[0]];
  const n = firstMatrix.length;
  
  // Create initial vector
  const x = new Array(n).fill(0);
  selectedCells.forEach(cellId => {
    if (cellId < n) x[cellId] = 1;
  });
  
  let result = Matrix.columnVector(x);
  
  // Apply matrices sequentially using ml-matrix
  for (const dateStr of dates) {
    const M = new Matrix(movementMatrices[dateStr]);
    result = M.mmul(result);
  }
  
  // Convert back to object
  const analysisResult = {};
  for (let i = 0; i < n; i++) {
    analysisResult[i] = result.get(i, 0);
  }
  
  return analysisResult;
};

const calculateBasinAnalysis = ({ movementMatrices, selectedCells, currentDate, timeWindow }) => {
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
  
  const firstMatrix = movementMatrices[dates[0]];
  const n = firstMatrix.length;
  
  // Create target vector
  const x = new Array(n).fill(0);
  selectedCells.forEach(cellId => {
    if (cellId < n) x[cellId] = 1;
  });
  
  // Compute composite matrix B using ml-matrix
  let B = new Matrix(movementMatrices[dates[0]]);
  
  for (let i = 1; i < dates.length; i++) {
    const M = new Matrix(movementMatrices[dates[i]]);
    B = B.mmul(M);
  }
  
  // Compute dot products for each column
  const analysisResult = {};
  for (let j = 0; j < n; j++) {
    const column = B.getColumn(j);
    let dotProduct = 0;
    for (let i = 0; i < n; i++) {
      dotProduct += column[i] * x[i];
    }
    analysisResult[j] = dotProduct;
  }
  
  return analysisResult;
};

// Color functions for the two analysis types
const getBasinColor = (value, colorMax = 1.0) => {
  const clampedValue = Math.min(value, colorMax);
  const normalizedValue = Math.max(0, clampedValue / colorMax);
  const baseColor = [0, 100, 255]; // Blue
  
  // Near white at 0, full saturation at 1
  const r = Math.round(255 - (255 - baseColor[0]) * normalizedValue);
  const g = Math.round(255 - (255 - baseColor[1]) * normalizedValue);
  const b = Math.round(255 - (255 - baseColor[2]) * normalizedValue);
  
  return `rgb(${r}, ${g}, ${b})`;
};

const getProjectionColor = (value, colorMax = 1.0) => {
  const clampedValue = Math.min(value, colorMax);
  const normalizedValue = Math.max(0, clampedValue / colorMax);
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