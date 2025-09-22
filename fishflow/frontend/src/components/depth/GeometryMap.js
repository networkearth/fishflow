import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './GeometryMap.css';

const GeometryMap = ({ geometries, scenario, selectedCell, onCellSelect }) => {
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

  // Style function for GeoJSON
  const getFeatureStyle = (feature) => {
    const cellId = feature.properties.cell_id;
    const isSelected = selectedCell === cellId;
    
    return {
      fillColor: '#60a5fa',      // Light blue fill
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#dc2626' : '#ffffff', // Red border if selected, white otherwise
      dashArray: '',
      fillOpacity: 0.6
    };
  };

  // Handle cell interactions
  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        const cellId = feature.properties.cell_id;
        // Toggle selection - click same cell to deselect
        onCellSelect(cellId === selectedCell ? null : cellId);
      },
      mouseover: () => {
        layer.setStyle({
          weight: 3,
          color: '#dc2626', // Red on hover
        });
      },
      mouseout: () => {
        const cellId = feature.properties.cell_id;
        const isSelected = selectedCell === cellId;
        layer.setStyle({
          weight: isSelected ? 3 : 1,
          color: isSelected ? '#dc2626' : '#ffffff',
        });
      }
    });
  };

  if (!scenario) {
    return (
      <div className="geometry-map-container">
        <div className="no-scenario-message">
          Select a scenario to view the map
        </div>
      </div>
    );
  }

  if (!geometries) {
    return (
      <div className="geometry-map-container">
        <div className="loading-message">
          Loading geometries...
        </div>
      </div>
    );
  }

  return (
    <div className="geometry-map-container">
      <MapContainer
        center={scenario.map_center || [58.5, -152.0]}
        zoom={scenario.map_zoom || 6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {geoJsonData && (
          <GeoJSON
            key={`geometries-${selectedCell}`}
            data={geoJsonData}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      
      {selectedCell !== null && (
        <div className="selection-info">
          <span>Selected Cell: {selectedCell}</span>
          <button onClick={() => onCellSelect(null)} className="clear-selection">
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default GeometryMap;