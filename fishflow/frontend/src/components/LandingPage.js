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
          <p className="landing-subtitle">Fisheries Risk Assessment Platform</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        <div className="landing-intro">
          <h2 className="landing-heading">Choose Your Analysis Model</h2>
          <p className="landing-description">
            Select the appropriate model for your fisheries risk assessment needs. 
            Each model provides specialized analysis for different operational scenarios.
          </p>
        </div>

        {/* Model Cards */}
        <div className="landing-cards">
          <MovementModelCard onNavigate={onNavigate} />
          <DepthModelCard onNavigate={onNavigate} />
        </div>

        {/* Footer Info */}
        <div className="landing-footer">
          <div className="footer-info">
            <h3 className="footer-title">Getting Started</h3>
            <p className="footer-description">
              Choose the model that best fits your analysis needs. Both models provide comprehensive 
              risk assessment tools for sustainable fisheries management.
            </p>
            <div className="footer-grid">
              <div className="footer-item">
                <p className="footer-item-title">Movement Model Best For:</p>
                <p className="footer-item-text">Long-term planning, seasonal analysis, migration studies</p>
              </div>
              <div className="footer-item">
                <p className="footer-item-title">Depth Model Best For:</p>
                <p className="footer-item-text">Real-time decisions, depth-specific operations, hourly planning</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;