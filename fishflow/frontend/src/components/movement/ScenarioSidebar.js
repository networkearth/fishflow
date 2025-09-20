import { useState, useEffect } from 'react';
import './ScenarioSidebar.css';

function ScenarioSidebar({ onScenarioLoad, currentScenario }) {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch scenarios on component mount
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch('http://localhost:8000/v1/movement/scenarios');
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

  if (loading) {
    return (
      <div className="scenario-sidebar">
        <h3>Loading scenarios...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scenario-sidebar">
        <h3>Error</h3>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="scenario-sidebar">
      <h3>Scenarios</h3>
      
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
            <strong>Dates Available:</strong> {selectedScenario.dates.length} dates
          </div>
          <div className="detail-item">
            <strong>Max Window:</strong> ±{selectedScenario.maximum_window_size} days
          </div>
          <div className="detail-item">
            <strong>R Values:</strong> {selectedScenario.r_values.join(', ')}
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

export default ScenarioSidebar;