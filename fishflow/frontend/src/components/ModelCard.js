import React from 'react';
import { ArrowRight } from 'lucide-react';
import './ModelCard.css';

const ModelCard = ({ 
  title, 
  subtitle, 
  icon: IconComponent, 
  colorScheme, 
  features, 
  keyFeatures, 
  onNavigate, 
  navigationTarget 
}) => {
  return (
    <div className="model-card">
      <div className="card-content">
        <div className="card-header">
          <div className={`card-icon card-icon-${colorScheme}`}>
            <IconComponent className="icon" />
          </div>
          <div className="card-title-section">
            <h3 className="card-title">{title}</h3>
            <p className="card-subtitle">{subtitle}</p>
          </div>
        </div>
        
        <div className="card-features">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <feature.icon className="feature-icon" />
              <div className="feature-text">
                <p className="feature-title">{feature.title}</p>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card-specs">
          <h4 className="specs-title">Key Features:</h4>
          <ul className="specs-list">
            {keyFeatures.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => onNavigate(navigationTarget)}
          className={`card-button card-button-${colorScheme}`}
        >
          <span>Launch {title}</span>
          <ArrowRight className="button-icon" />
        </button>
      </div>
    </div>
  );
};

export default ModelCard;