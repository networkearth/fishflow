import 'leaflet/dist/leaflet.css';
import './App.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useState, useEffect } from 'react';
import ScenarioSidebar from './components/ScenarioSidebar';
import HabitatMap from './components/HabitatMap';
import SidePanels from './components/SidePanels';

function App() {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]); // Now array of cell IDs
  const [currentDate, setCurrentDate] = useState(null);
  
  // Data loading states
  const [habitatData, setHabitatData] = useState(null);
  const [geometries, setGeometries] = useState(null);
  const [loading, setLoading] = useState(false);

  const [movementMatrices, setMovementMatrices] = useState({});
  const [loadingMatrices, setLoadingMatrices] = useState(false);

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


  // Function to calculate required date range using scenario's max window
  const getRequiredDateRange = (currentDate, scenario) => {
    if (!currentDate || !scenario) return null;
    
    const current = new Date(currentDate);
    const startDate = new Date(current);
    const endDate = new Date(current);
    
    startDate.setDate(current.getDate() - scenario.maximum_window_size);
    endDate.setDate(current.getDate() + scenario.maximum_window_size);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  // Function to check if we need to load more matrices
  const needsMatrices = (requiredRange, existingMatrices) => {
    if (!requiredRange) return false;
    
    const start = new Date(requiredRange.start);
    const end = new Date(requiredRange.end);
    
    // Check if we have all dates in the required range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!existingMatrices[dateStr]) {
        return true;
      }
    }
    
    return false;
  };

  // Function to load matrices for the full required range
  const loadMatricesForRange = async (range, scenario) => {
    if (!range) return {};
    
    setLoadingMatrices(true);
    
    try {
      const response = await fetch(
        `http://localhost:8000/v1/scenario/${scenario.scenario_id}/matrices?start_date=${range.start}&end_date=${range.end}`
      );
      
      if (!response.ok) throw new Error('Failed to load matrices');
      
      const data = await response.json();
      const matrices = {};
      
      data.matrices.forEach(matrixData => {
        matrices[matrixData.date] = matrixData.matrix;
      });
      
      return matrices;
    } catch (error) {
      console.error('Error loading movement matrices:', error);
      return {};
    } finally {
      setLoadingMatrices(false);
    }
  };

  // Clear matrices when scenario changes
  useEffect(() => {
    setMovementMatrices({});
  }, [currentScenario]);

  // Load matrices when date changes (but keep existing cache)
  useEffect(() => {
    if (!currentScenario || !currentDate) return;
    
    const requiredRange = getRequiredDateRange(currentDate, currentScenario);
    
    if (needsMatrices(requiredRange, movementMatrices)) {
      const loadMatrices = async () => {
        const newMatrices = await loadMatricesForRange(requiredRange, currentScenario);
        setMovementMatrices(prev => ({
          ...prev,
          ...newMatrices
        }));
      };
      
      loadMatrices();
    }
  }, [currentDate, currentScenario, movementMatrices]);

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
      
      <SidePanels
          geometries={geometries}
          movementMatrices={movementMatrices}
          selectedCells={selectedCells}
          currentDate={currentDate}
          scenario={currentScenario}
        />
        

    </div>
  );
}

export default App;