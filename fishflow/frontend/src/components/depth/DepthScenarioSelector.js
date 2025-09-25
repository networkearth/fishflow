import { useState, useEffect } from 'react';
import './DepthScenarioSelector.css';

function DepthScenarioSelector({ onScenarioLoad, currentScenario }) {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch scenarios on component mount
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch('https://api.networkearth.io/v1/depth/scenarios');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setScenarios(data.scenarios);
      } catch (err) {
        setError(`Failed to load scenarios: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  const handleLoadScenario = () => {
    if (selectedScenario) {
      onScenarioLoad(selectedScenario);
    }
  };

  const formatTimeWindow = (timeWindow) => {
    if (!timeWindow || timeWindow.length !== 2) return 'Unknown';
    return `${timeWindow[0]} to ${timeWindow[1]}`;
  };

  const formatDepthBins = (depthBins) => {
    if (!depthBins || depthBins.length === 0) return 'Unknown';
    return `${depthBins.length} bins (${depthBins[0]}m - ${depthBins[depthBins.length - 1]}m)`;
  };

  if (loading) {
    return (
      <div className="depth-scenario-selector">
        <h3>Loading scenarios...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="depth-scenario-selector">
        <h3>Error</h3>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="depth-scenario-selector">
      <h3>Depth Model Scenarios</h3>
      
      {currentScenario && (
        <div className="current-scenario">
          <h4>Currently Loaded:</h4>
          <div className="current-scenario-name">{currentScenario.name}</div>
        </div>
      )}
      
      <div className="scenario-list">
        {scenarios.map((scenario) => (
          <div
            key={scenario.scenario_id}
            className={`scenario-item ${selectedScenario?.scenario_id === scenario.scenario_id ? 'selected' : ''} ${currentScenario?.scenario_id === scenario.scenario_id ? 'current' : ''}`}
            onClick={() => setSelectedScenario(scenario)}
          >
            <h4>{scenario.name}</h4>
            <p className="scenario-species">{scenario.species}</p>
            <p className="scenario-region">{scenario.region}</p>
            <p className="scenario-resolution">{scenario.resolution} resolution</p>
            {currentScenario?.scenario_id === scenario.scenario_id && (
              <div className="current-indicator">✓ Loaded</div>
            )}
          </div>
        ))}
      </div>

      {selectedScenario && (
        <div className="scenario-details">
          <h4>Scenario Details</h4>
          <div className="detail-item">
            <strong>Species:</strong> {selectedScenario.species}
          </div>
          <div className="detail-item">
            <strong>Region:</strong> {selectedScenario.region}
          </div>
          <div className="detail-item">
            <strong>Description:</strong> {selectedScenario.description}
          </div>
          <div className="detail-item">
            <strong>Grid Size:</strong> {selectedScenario.grid_size} cells
          </div>
          <div className="detail-item">
            <strong>Time Window:</strong> {formatTimeWindow(selectedScenario.time_window)}
          </div>
          <div className="detail-item">
            <strong>Resolution:</strong> {selectedScenario.resolution}
          </div>
          <div className="detail-item">
            <strong>Depth Coverage:</strong> {formatDepthBins(selectedScenario.depth_bins)}
          </div>
          <div className="detail-item">
            <strong>Available Depths:</strong> {selectedScenario.depth_bins?.join('m, ')}m
          </div>
          
          <button 
            className="load-scenario-btn"
            onClick={handleLoadScenario}
            disabled={currentScenario?.scenario_id === selectedScenario.scenario_id}
          >
            {currentScenario?.scenario_id === selectedScenario.scenario_id ? 'Already Loaded' : 'Load This Scenario'}
          </button>
        </div>
      )}
    </div>
  );
}

export default DepthScenarioSelector;