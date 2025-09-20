import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import './HabitatMap.css';

function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
}

const getHabitatColor = (value, minVal, maxVal) => {
  // Clamp value to the percentile range instead of masking
  const clampedValue = Math.max(minVal, Math.min(maxVal, value));
  
  // Normalize clamped value to 0-1 range within the visible range
  const normalized = (clampedValue - minVal) / (maxVal - minVal);
  
  // Purple scale: light purple (low) to dark purple (high)
  const purpleColors = [
    [245, 224, 251],  // Almost white with purple tint (lowest suitability)
    [218, 175, 234],  // Very light purple
    [177, 122, 204],  // Lighter purple
    [140, 81, 184],   // Light purple
    [103, 37, 147],   // Medium purple
    [59, 15, 112],    // Dark purple
    [25, 4, 51]       // Very dark purple (highest suitability)
  ];
  
  // Interpolate between colors
  const scaledIndex = normalized * (purpleColors.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(lowerIndex + 1, purpleColors.length - 1);
  const factor = scaledIndex - lowerIndex;
  
  const lower = purpleColors[lowerIndex];
  const upper = purpleColors[upperIndex];
  
  const r = Math.round(lower[0] + (upper[0] - lower[0]) * factor);
  const g = Math.round(lower[1] + (upper[1] - lower[1]) * factor);
  const b = Math.round(lower[2] + (upper[2] - lower[2]) * factor);
  
  return `rgb(${r}, ${g}, ${b})`;
};

function HabitatMap({ 
  habitatData, 
  geometries, 
  currentDate, 
  onDateChange, 
  selectedCells, 
  onCellsChange,
  scenario 
}) {
  const [rValue, setRValue] = useState(null); // Default r-value
  const [percentileRange, setPercentileRange] = useState([0.0, 1.0]); // Min, Max percentiles
  
  // Get available dates and r-values from habitat data
  const availableDates = useMemo(() => {
    if (!habitatData) return [];
    const dates = [...new Set(habitatData.map(item => item.date))];
    return dates.sort();
  }, [habitatData]);
  
  const availableRValues = useMemo(() => {
    if (!habitatData) return [];
    const rValues = [...new Set(habitatData.map(item => item.r))];
    return rValues.sort((a, b) => a - b);
  }, [habitatData]);

  useEffect(() => {
    if (availableRValues.length > 0) {
        if (rValue === null || !availableRValues.includes(rValue)) {
        // Set to maximum r-value (last in sorted array)
        setRValue(availableRValues[availableRValues.length - 1]);
        }
    }
  }, [availableRValues, rValue]);
  
  // Get current habitat data for selected date and r-value
  const currentHabitatData = useMemo(() => {
    if (!habitatData || !currentDate) return null;
    
    return habitatData.find(item => 
      item.date === currentDate && item.r === rValue
    );
  }, [habitatData, currentDate, rValue]);
  
  // Calculate percentile range for masking
  const { minVal, maxVal } = useMemo(() => {
    if (!currentHabitatData) return { minVal: 0, maxVal: 1 };
    
    const values = [...currentHabitatData.probability].sort((a, b) => a - b);
    const minIndex = Math.floor(values.length * percentileRange[0]);
    const maxIndex = percentileRange[1] === 1.0 ? values.length - 1 : Math.floor(values.length * percentileRange[1]);
    
    return {
      minVal: values[minIndex] || 0,
      maxVal: values[Math.min(maxIndex, values.length - 1)] || 1
    };
  }, [currentHabitatData, percentileRange]);
  
  // Handle date slider change
  const handleDateChange = (event) => {
    const dateIndex = parseInt(event.target.value);
    const newDate = availableDates[dateIndex];
    onDateChange(newDate);
  };
  
  // Handle cell click for selection
  const handleCellClick = (cellId, event) => {
    event.originalEvent.preventDefault(); // Prevent map click
    
    const isSelected = selectedCells.includes(cellId);
    let newSelection;
    
    if (isSelected) {
      // Deselect cell
      newSelection = selectedCells.filter(id => id !== cellId);
    } else {
      // Select cell
      newSelection = [...selectedCells, cellId];
    }
    
    onCellsChange(newSelection);
  };

  // Handle r-value slider change
  const handleRValueChange = (event) => {
    const rIndex = parseInt(event.target.value);
    const newRValue = availableRValues[rIndex];
    setRValue(newRValue);
  };
  
  if (!habitatData || !geometries || !currentHabitatData) {
    return (
        <div className="habitat-map-container">
        {/* Show controls even while loading */}
        <div className="habitat-controls">
            <div className="control-group">
            <label>Percentile Range:</label>
            <div className="percentile-inputs">
                <input type="number" min="0" max="1" step="0.1" value={0.0} disabled />
                <span>to</span>
                <input type="number" min="0" max="1" step="0.1" value={1.0} disabled />
            </div>
            </div>
        </div>
        
        <div className="date-control">
            <label>Loading dates...</label>
            <input type="range" disabled className="date-slider" />
        </div>
        
        <div className="r-value-control">
            <div className="r-value-labels">
            <span>Loading...</span>
            </div>
            <input type="range" disabled className="r-value-slider" />
            <label className="r-value-title">R-Value: --</label>
        </div>
        
        <div className="map-container">
            <MapContainer 
            center={scenario?.map_center || [45.0, -125.0]} 
            zoom={scenario?.map_zoom || 7} 
            style={{ height: '100%', width: '100%' }}
            >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            </MapContainer>
        </div>
        </div>
    );
  }
  
  const currentDateIndex = availableDates.indexOf(currentDate);
  const currentRIndex = availableRValues.indexOf(rValue);
  
  return (
    <div className="habitat-map-container">
      {/* Controls */}
      <div className="habitat-controls">
        <div className="control-group">
          <label>Percentile Range:</label>
          <div className="percentile-inputs">
            <input 
              type="number" 
              min="0" 
              max="1" 
              step="0.1"
              value={percentileRange[0]}
              onChange={(e) => setPercentileRange([parseFloat(e.target.value), percentileRange[1]])}
            />
            <span>to</span>
            <input 
              type="number" 
              min="0" 
              max="1" 
              step="0.1"
              value={percentileRange[1]}
              onChange={(e) => setPercentileRange([percentileRange[0], parseFloat(e.target.value)])}
            />
          </div>
        </div>
      </div>
      
      {/* Date Slider */}
      <div className="date-control">
        <label>Date: {currentDate}</label>
        <input
          type="range"
          min="0"
          max={availableDates.length - 1}
          value={currentDateIndex}
          onChange={handleDateChange}
          className="date-slider"
        />
        <div className="date-range-labels">
          <span>{availableDates[0]}</span>
          <span>{availableDates[availableDates.length - 1]}</span>
        </div>
      </div>
      
      {/* R-Value Vertical Slider */}
      <div className="r-value-control">
        <div className="r-value-labels">
          {availableRValues.map((r, index) => (
            <span 
              key={r} 
              className={`r-label ${index === currentRIndex ? 'active' : ''}`}
            >
              {r}
            </span>
          )).reverse()} {/* Reverse so highest values are at top */}
        </div>
        <input
          type="range"
          min="0"
          max={availableRValues.length - 1}
          value={currentRIndex}
          onChange={handleRValueChange}
          className="r-value-slider"
          orient="vertical"
        />
        <label className="r-value-title">R-Value: {rValue}</label>
      </div>
      
      {/* Map */}
      <div className="map-container">
        <MapContainer 
          center={scenario.map_center} 
          zoom={scenario.map_zoom} 
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater center={scenario?.map_center} zoom={scenario?.map_zoom} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Habitat quality polygons */}
          {geometries.map((cell, index) => {
            const probabilityValue = currentHabitatData.probability[cell.cell_id];
            const isSelected = selectedCells.includes(cell.cell_id);
            
            return (
              <Polygon
                key={cell.cell_id}
                positions={cell.geometry.coordinates[0].map(coord => [coord[1], coord[0]])} // Convert [lng,lat] to [lat,lng]
                pathOptions={{
                  fillColor: getHabitatColor(probabilityValue, minVal, maxVal),
                  fillOpacity: 0.7,
                  color: isSelected ? '#0066cc' : '#333',
                  weight: isSelected ? 3 : 0.5,
                  opacity: 1
                }}
                eventHandlers={{
                  click: (e) => handleCellClick(cell.cell_id, e)
                }}
              />
            );
          })}
        </MapContainer>
      </div>
      
      {/* Selected cells info */}
      {selectedCells.length > 0 && (
        <div className="selection-info">
          <span>{selectedCells.length} cells selected</span>
          <button 
            onClick={() => onCellsChange([])}
            className="clear-selection-btn"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}

export default HabitatMap;