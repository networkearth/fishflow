import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import './MovementPanel.css';

// Map updater for centering
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
}

function MovementPanel({ 
  geometries,
  movementMatrices, 
  selectedCells,
  currentDate,
  scenario,
  timeWindow,
  calculationFunction,
  title,
  colorFunction
}) {
  const [loading, setLoading] = useState(false);
  
  // Calculate the movement analysis data
  const analysisData = useMemo(() => {
    if (!geometries || !movementMatrices || !selectedCells || selectedCells.length === 0 || !currentDate) {
      return null;
    }
    
    setLoading(true);
    
    try {
      // Call the provided calculation function
      const result = calculationFunction({
        movementMatrices,
        selectedCells,
        currentDate,
        timeWindow
      });
      
      return result;
    } catch (error) {
      console.error(`Error calculating ${title}:`, error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [geometries, movementMatrices, selectedCells, currentDate, timeWindow, calculationFunction, title]);
  
  if (!scenario) {
    return (
      <div className="movement-panel">
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
          </MapContainer>
        </div>
      </div>
    );
  }
  
  return (
    <div className="movement-panel">
      {/* Map */}
      <div className="map-container">
        <MapContainer 
          center={scenario.map_center} 
          zoom={scenario.map_zoom} 
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater center={scenario.map_center} zoom={scenario.map_zoom} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Analysis result polygons */}
          {analysisData && geometries && geometries.map((cell) => {
            const analysisValue = analysisData[cell.cell_id] || 0;
            const isSelected = selectedCells.includes(cell.cell_id);
            
            return (
              <Polygon
                key={cell.cell_id}
                positions={cell.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
                pathOptions={{
                  fillColor: colorFunction(analysisValue),
                  fillOpacity: analysisValue > 0 ? 0.7 : 0.1,
                  color: isSelected ? '#ff0000' : '#333',
                  weight: isSelected ? 2 : 0.5,
                  opacity: 1
                }}
                eventHandlers={{
                  mouseover: (e) => {
                    const tooltip = `Cell ${cell.cell_id}: ${analysisValue.toFixed(4)}`;
                    e.target.bindTooltip(tooltip, {
                      permanent: false,
                      direction: 'top',
                      className: 'analysis-tooltip'
                    }).openTooltip();
                  },
                  mouseout: (e) => {
                    e.target.closeTooltip();
                  }
                }}
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default MovementPanel;