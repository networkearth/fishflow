import React from 'react';
import { Map, Clock, MapPin } from 'lucide-react';
import ModelCard from '../ModelCard';

const MovementModelCard = ({ onNavigate }) => {
  const cardConfig = {
    title: "Movement Model",
    subtitle: "Movement pattern analysis",
    icon: Map,
    colorScheme: "blue",
    features: [
      {
        icon: MapPin,
        title: "Spatial Movement Tracking",
        description: "Analyze fish movement patterns across geographic regions with sliding time windows"
      },
      {
        icon: Clock,
        title: "Daily Resolution",
        description: "Assess how risk moves over days"
      }
    ],
    keyFeatures: [
      "Spatial risk analysis",
      "Daily resolution", 
    ],
    navigationTarget: "movement"
  };

  return <ModelCard {...cardConfig} onNavigate={onNavigate} />;
};

export default MovementModelCard;