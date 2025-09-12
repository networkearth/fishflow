import 'leaflet/dist/leaflet.css';
import './App.css';
import { MapContainer, TileLayer, Rectangle, useMapEvents } from 'react-leaflet';
import { useState, useMemo } from 'react';

// Generate mock basin data - shows what feeds into selected cells
const generateMockBasinData = (selectedCells) => {
  if (selectedCells.length === 0) return [];
  
  const data = [];
  for (let lat = 44.5; lat < 45.5; lat += 0.1) {
    for (let lng = -125.5; lng < -124.5; lng += 0.1) {
      // Mock: cells closer to selected areas have higher "feeding" percentages
      let maxFeedingPercent = 0;
      selectedCells.forEach(selected => {
        const centerLat = (selected.bounds[0][0] + selected.bounds[1][0]) / 2;
        const centerLng = (selected.bounds[0][1] + selected.bounds[1][1]) / 2;
        const distance = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
        const feedingPercent = Math.max(0, (0.5 - distance) * 100);
        maxFeedingPercent = Math.max(maxFeedingPercent, feedingPercent);
      });
      
      if (maxFeedingPercent > 0) {
        data.push({
          bounds: [[lat, lng], [lat + 0.1, lng + 0.1]],
          percentage: maxFeedingPercent,
        });
      }
    }
  }
  return data;
};

// Generate mock projection data - shows where selected cell density goes
const generateMockProjectionData = (selectedCells) => {
  if (selectedCells.length === 0) return [];
  
  const data = [];
  selectedCells.forEach(selected => {
    const centerLat = (selected.bounds[0][0] + selected.bounds[1][0]) / 2;
    const centerLng = (selected.bounds[0][1] + selected.bounds[1][1]) / 2;
    
    // Mock: density spreads outward from selected cells
    for (let lat = 44.5; lat < 45.5; lat += 0.1) {
      for (let lng = -125.5; lng < -124.5; lng += 0.1) {
        const distance = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
        const density = Math.max(0, Math.exp(-distance * 3)); // Exponential decay
        
        if (density > 0.01) {
          data.push({
            bounds: [[lat, lng], [lat + 0.1, lng + 0.1]],
            density: density,
          });
        }
      }
    }
  });
  return data;
};

// Color helpers
const getBasinColor = (percentage) => {
  const intensity = Math.min(percentage / 20, 1); // Scale to 0-1
  return `rgba(0, 0, 255, ${intensity})`; // Blue with varying opacity
};

const getProjectionColor = (density) => {
  const intensity = Math.min(density, 1);
  return `rgba(255, 0, 255, ${intensity})`; // Magenta with varying opacity
};

const generateMockHabitatData = () => {
  const data = [];
  // Create a grid of cells with random "habitat quality" values
  for (let lat = 44.5; lat < 45.5; lat += 0.1) {
    for (let lng = -125.5; lng < -124.5; lng += 0.1) {
      data.push({
        bounds: [[lat, lng], [lat + 0.1, lng + 0.1]],
        quality: Math.random() * 0.8 + 0.2, // Random between 0.2 and 1.0
      });
    }
  }
  return data;
};

// Helper function to convert quality to color
const getQualityColor = (quality) => {
  // Red (low) to Yellow (medium) to Green (high)
  if (quality < 0.5) {
    return `rgb(${255}, ${Math.floor(255 * quality * 2)}, 0)`; // Red to Yellow
  } else {
    return `rgb(${Math.floor(255 * (1 - quality) * 2)}, 255, 0)`; // Yellow to Green
  }
};

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function App() {

  const [selectedCells, setSelectedCells] = useState([]);

  const [habitatData] = useState(() => generateMockHabitatData());

  const basinData = useMemo(() => generateMockBasinData(selectedCells), [selectedCells]);
  const projectionData = useMemo(() => generateMockProjectionData(selectedCells), [selectedCells]);

  const handleMapClick = (latlng) => {
    // For now, let's just create a small rectangle around the click point
    const cellSize = 0.1; // degrees
    const newCell = {
      id: Date.now(), // Simple unique ID
      bounds: [
        [latlng.lat - cellSize/2, latlng.lng - cellSize/2],
        [latlng.lat + cellSize/2, latlng.lng + cellSize/2]
      ]
    };
    
    setSelectedCells(prev => [...prev, newCell]);
    console.log('Added cell:', newCell);
  };

  const clearSelection = () => {
    setSelectedCells([]);
  };


  return (
    <div className="App">
      <div className="main-panel">
        <div className="panel-header">
          FishFlow - Habitat Quality
          <button 
            onClick={clearSelection}
            style={{ float: 'right', padding: '5px 10px' }}
          >
            Clear Selection
          </button>
        </div>
        <div className="map-container">
          <MapContainer 
            center={[45.0, -125.0]} 
            zoom={7} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {habitatData.map((cell, index) => (
              <Rectangle
                key={`habitat-${index}`}
                bounds={cell.bounds}
                pathOptions={{ 
                  color: getQualityColor(cell.quality),
                  fillColor: getQualityColor(cell.quality),
                  fillOpacity: 0.6,
                  weight: 0
                }}
              />
            ))}

            <MapClickHandler onMapClick={handleMapClick} />
            {selectedCells.map(cell => (
              <Rectangle
                key={cell.id}
                bounds={cell.bounds}
                pathOptions={{ color: 'blue', fillOpacity: 0.0, weight: 3 }}
              />
            ))}
          </MapContainer>
        </div>
      </div>
      
      <div className="side-panels">
        <div className="basin-panel">
          <div className="panel-header">Basin Analysis</div>
          <div className="map-container">
            <MapContainer 
              center={[45.0, -125.0]} 
              zoom={7} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {basinData.map((cell, index) => (
                <Rectangle
                  key={`basin-${index}`}
                  bounds={cell.bounds}
                  pathOptions={{ 
                    color: getBasinColor(cell.percentage),
                    fillColor: getBasinColor(cell.percentage),
                    fillOpacity: 0.7,
                    weight: 0
                  }}
                />
              ))}
            </MapContainer>
          </div>
        </div>
        
        <div className="projection-panel">
          <div className="panel-header">Forward Projection</div>
          <div className="map-container">
            <MapContainer 
              center={[45.0, -125.0]} 
              zoom={7} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {projectionData.map((cell, index) => (
                <Rectangle
                  key={`projection-${index}`}
                  bounds={cell.bounds}
                  pathOptions={{ 
                    color: getProjectionColor(cell.density),
                    fillColor: getProjectionColor(cell.density),
                    fillOpacity: 0.7,
                    weight: 0
                  }}
                />
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;