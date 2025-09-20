// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import MovementModel from './components/movement/MovementModel';
import DepthModel from './components/depth/DepthModel';

// Wrapper component for LandingPage to handle navigation
const LandingPageWithRouter = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (route) => {
    if (route === 'home') {
      navigate('/');
    } else {
      navigate(`/${route}`);
    }
  };

  return <LandingPage onNavigate={handleNavigate} />;
};

// Wrapper component for MovementModel to handle navigation
const MovementModelWithRouter = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (route) => {
    if (route === 'home') {
      navigate('/');
    } else {
      navigate(`/${route}`);
    }
  };

  return <MovementModel onNavigate={handleNavigate} />;
};

// Wrapper component for MovementModel to handle navigation
const DepthModelWithRouter = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (route) => {
    if (route === 'home') {
      navigate('/');
    } else {
      navigate(`/${route}`);
    }
  };

  return <DepthModel onNavigate={handleNavigate} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPageWithRouter />} />
        <Route path="/movement" element={<MovementModelWithRouter />} />
        <Route path="/depth" element={<DepthModelWithRouter />} />
      </Routes>
    </Router>
  );
}

export default App;