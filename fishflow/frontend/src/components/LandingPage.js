import React from 'react';
import { Fish } from 'lucide-react';
import MovementModelCard from './movement/MovementModelCard';
import DepthModelCard from './depth/DepthModelCard';
import './LandingPage.css';

const LandingPage = ({ onNavigate }) => {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <div className="landing-header-title">
            <Fish className="landing-logo" />
            <h1 className="landing-title">Fish Flow</h1>
          </div>
          <p className="landing-subtitle">Bycatch Risk Assessment Platform</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        <div className="landing-intro">
          <h2 className="landing-heading">Choose Your Analysis Model</h2>
          <p className="landing-description">
            Select the appropriate model for your risk assessment needs. 
          </p>
        </div>

        {/* Model Cards */}
        <div className="landing-cards">
          <MovementModelCard onNavigate={onNavigate} />
          <DepthModelCard onNavigate={onNavigate} />
        </div>

      </main>
    </div>
  );
};

export default LandingPage;