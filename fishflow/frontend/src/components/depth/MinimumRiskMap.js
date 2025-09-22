import React, { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MinimumRiskMap.css';


function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
}

const MinimumRiskMap = ({ 
  geometries, 
  loadedData, 
  filterState, 
  scenario,
  cellMaxDepths,
  selectedCell,
  onCellSelect 
}) => {
  const mapRef = useRef();

  // Helper function to determine max depth for a cell
  const getCellMaxDepth = (cellId) => {
    if (!cellMaxDepths || cellId >= cellMaxDepths.length) return null;
    
    // Get the max depth directly from the preloaded array
    return cellMaxDepths[cellId];
    };

  useEffect(() => {
    if (!mapRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
        // Small delay to let the layout settle
        setTimeout(() => {
            mapRef.current.invalidateSize();
        }, 50);
        }
    });
    
    // Watch the map container for size changes
    const mapContainer = mapRef.current.getContainer();
    if (mapContainer) {
        resizeObserver.observe(mapContainer.parentElement);
    }
    
    return () => resizeObserver.disconnect();
    }, []);

  // Helper function to get selected depths for a cell based on its max depth
  const getSelectedDepthsForCell = (cellMaxDepth) => {
    if (!cellMaxDepth || !filterState.depthBins) return [];
    return filterState.depthBins[cellMaxDepth] || [];
  };

  // Helper function to filter timestamps by time of day
  const filterTimestampsByTimeOfDay = (timestamps) => {
    if (!filterState.timeOfDay || filterState.timeOfDay.length === 0) {
      return timestamps; // Return all if no time filter
    }
    
    return timestamps.filter(timestamp => {
      const date = new Date(timestamp);
      const timeStr = date.toTimeString().slice(0, 5); // "HH:MM"
      
      return filterState.timeOfDay.some(range => {
        return timeStr >= range.start && timeStr <= range.end;
      });
    });
  };

  // Helper function to filter timestamps by date range
  const filterTimestampsByDateRange = (timestamps) => {
    if (!filterState.dateRange.start || !filterState.dateRange.end) {
      return timestamps;
    }
    
    const startDate = new Date(filterState.dateRange.start);
    const endDate = new Date(filterState.dateRange.end);
    
    return timestamps.filter(timestamp => {
      const date = new Date(timestamp);
      return date >= startDate && date <= endDate;
    });
  };

  // Calculate minimum risk for all cells
  const cellMinimumRisk = useMemo(() => {
    if (!geometries || !scenario) return {};
    
    // If no data is loaded yet, return default high risk (1.0) for all cells
    if (!loadedData || Object.keys(loadedData).length === 0) {
      const defaultRisk = {};
      return defaultRisk;
    }
    
    const riskData = {};
    
    geometries.forEach(({ cell_id }) => {
      // Step 1: Determine max depth for this cell
      const cellMaxDepth = getCellMaxDepth(cell_id);
      if (!cellMaxDepth) {
        return;
      }
      
      // Step 2: Get selected depths for this cell's max depth
      const selectedDepths = getSelectedDepthsForCell(cellMaxDepth);
      if (selectedDepths.length === 0) {
        return;
      }
      
      // Step 3: Collect all probabilities across months, depths, and filtered timestamps
      const allProbabilities = [];
      
      // Iterate through all loaded months
      for (const month in loadedData) {
        // Get timestamps for this month (using first available depth for timestamps)
        const firstDepthData = loadedData[month][selectedDepths[0]];
        if (!firstDepthData) continue;
        
        const rawTimestamps = firstDepthData.timestamps;
        
        // Filter timestamps by date range and time of day
        const dateFilteredTimestamps = filterTimestampsByDateRange(rawTimestamps);
        const finalFilteredTimestamps = filterTimestampsByTimeOfDay(dateFilteredTimestamps);
        
        if (finalFilteredTimestamps.length === 0) continue;
        
        // For each filtered timestamp, sum probabilities across selected depths
        finalFilteredTimestamps.forEach(timestamp => {
          const timestampIndex = rawTimestamps.indexOf(timestamp);
          if (timestampIndex === -1) return;
          
          let sumProbability = 0;
          let hasData = false;
          
          selectedDepths.forEach(depth => {
            const depthData = loadedData[month][depth];
            if (!depthData || !depthData.cells[cell_id]) return;
            
            const cellProbabilities = depthData.cells[cell_id];
            if (timestampIndex < cellProbabilities.length) {
              sumProbability += cellProbabilities[timestampIndex];
              hasData = true;
            }
          });
          
          if (hasData) {
            allProbabilities.push(sumProbability);
          }
        });
      }
      
      // Step 4: Find minimum value, or default to high risk if no data
      if (allProbabilities.length > 0) {
        riskData[cell_id] = Math.min(...allProbabilities);
      }
    });
    
    return riskData;
  }, [geometries, loadedData, filterState, scenario]);

  // Get color for risk value
  const getRiskColor = (risk) => {
    if (risk === undefined || risk === null) return '#cccccc'; // No data
    
    // Color scale from green (low risk) to red (high risk)
    if (risk <= 0.1) return '#22c55e';      // Green
    if (risk <= 0.2) return '#84cc16';      // Light green  
    if (risk <= 0.3) return '#eab308';      // Yellow
    if (risk <= 0.5) return '#f97316';      // Orange
    return '#ef4444';                       // Red
  };

  // Style function for GeoJSON
  const getFeatureStyle = (feature) => {
    const cellId = feature.properties.cell_id;
    const risk = cellMinimumRisk[cellId];
    const isSelected = selectedCell === cellId;
    
    // If no risk value, show transparent fill with gray outline
    if (risk === undefined || risk === null) {
        return {
        fillColor: 'transparent',
        weight: isSelected ? 3 : 1,
        opacity: 1,
        color: isSelected ? '#2563eb' : '#888888',
        dashArray: '',
        fillOpacity: 0
        };
    }
    
    return {
        fillColor: getRiskColor(risk),
        weight: isSelected ? 3 : 1,
        opacity: 1,
        color: isSelected ? '#2563eb' : '#ffffff',
        dashArray: '',
        fillOpacity: 0.7
    };
    };

  // Handle cell click
  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        const cellId = feature.properties.cell_id;
        onCellSelect(cellId === selectedCell ? null : cellId);
      }
    });
  };

  // Convert geometries to GeoJSON format
  const geoJsonData = useMemo(() => {
    if (!geometries) return null;
    
    return {
      type: 'FeatureCollection',
      features: geometries.map(({ cell_id, geometry }) => ({
        type: 'Feature',
        properties: { cell_id },
        geometry
      }))
    };
  }, [geometries]);

  // Set map view when scenario changes
  useEffect(() => {
    if (scenario && mapRef.current) {
      const map = mapRef.current;
      map.setView(scenario.map_center, scenario.map_zoom);
    }
  }, [scenario]);

  if (!scenario) {
    return (
      <div className="risk-map-container">
        <div className="no-scenario-message">
          Select a scenario to view the risk map
        </div>
      </div>
    );
  }

  return (
    <div className="risk-map-container">
      <MapContainer
        ref={mapRef}
        center={scenario.map_center}
        zoom={scenario.map_zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <MapUpdater center={scenario?.map_center} zoom={scenario?.map_zoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {geoJsonData && (
          <GeoJSON
            key={`${JSON.stringify(cellMinimumRisk)}-${selectedCell}`}
            data={geoJsonData}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      
      {/* Risk Legend */}
      <div className="risk-legend">
        <h4>Minimum Risk</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#22c55e' }}></div>
            <span>Very Low (≤0.1)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#84cc16' }}></div>
            <span>Low (0.1-0.2)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#eab308' }}></div>
            <span>Medium (0.2-0.3)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f97316' }}></div>
            <span>High (0.3-0.5)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Very High (>0.5)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#cccccc' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimumRiskMap;