import 'leaflet/dist/leaflet.css';
import './App.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useState, useEffect } from 'react';
import ScenarioSidebar from './components/ScenarioSidebar';
import HabitatMap from './components/HabitatMap';

function App() {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]); // Now array of cell IDs
  const [currentDate, setCurrentDate] = useState(null);
  
  // Data loading states
  const [habitatData, setHabitatData] = useState(null);
  const [geometries, setGeometries] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load scenario data when scenario changes
  useEffect(() => {
    if (!currentScenario) {
      setHabitatData(null);
      setGeometries(null);
      setCurrentDate(null);
      return;
    }

    const loadScenarioData = async () => {
      setLoading(true);
      try {
        // Load geometries and habitat data in parallel
        const [geometriesResponse, habitatResponse] = await Promise.all([
          fetch(`http://localhost:8000/v1/scenario/${currentScenario.scenario_id}/geometries`),
          fetch(`http://localhost:8000/v1/scenario/${currentScenario.scenario_id}/habitat`)
        ]);

        if (!geometriesResponse.ok || !habitatResponse.ok) {
          throw new Error('Failed to load scenario data');
        }

        const geometriesData = await geometriesResponse.json();
        const habitatData = await habitatResponse.json();

        setGeometries(geometriesData.geometries);
        setHabitatData(habitatData.habitat_data);
        
        // Set initial date to first available date
        if (habitatData.habitat_data.length > 0) {
          const availableDates = [...new Set(habitatData.habitat_data.map(item => item.date))].sort();
          setCurrentDate(availableDates[0]);
        }

      } catch (error) {
        console.error('Error loading scenario data:', error);
        // Handle error - maybe show notification
      } finally {
        setLoading(false);
      }
    };

    loadScenarioData();
  }, [currentScenario]);

  const handleScenarioLoad = (scenario) => {
    setCurrentScenario(scenario);
    setSelectedCells([]); // Clear any existing selections
    console.log('Loading scenario:', scenario);
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleCellsChange = (newSelectedCells) => {
    setSelectedCells(newSelectedCells);
  };


  return (
    <div className="App">
      <div className="scenario-panel">
        <ScenarioSidebar onScenarioLoad={handleScenarioLoad} currentScenario={currentScenario} />
      </div>
      <div className="main-panel">
        <div className="panel-header">
          FishFlow - Habitat Quality
        </div>
        <div className="map-container">
          <HabitatMap
            habitatData={habitatData}
            geometries={geometries}
            currentDate={currentDate}
            onDateChange={handleDateChange}
            selectedCells={selectedCells}
            onCellsChange={handleCellsChange}
            scenario={currentScenario}
          />
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
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;