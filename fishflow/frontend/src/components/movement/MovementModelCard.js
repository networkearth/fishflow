import React from 'react';
import { Map, Clock, MapPin } from 'lucide-react';
import ModelCard from '../ModelCard';

const MovementModelCard = ({ onNavigate }) => {
  const cardConfig = {
    title: "Movement Model",
    subtitle: "Migration pattern analysis",
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
        title: "Long-term Analysis",
        description: "Monthly and seasonal migration patterns with lag-based risk assessment"
      }
    ],
    keyFeatures: [
      "Movement matrix visualization",
      "Sliding time window analysis", 
      "Migration route optimization",
      "Historical pattern comparison"
    ],
    navigationTarget: "movement"
  };

  return <ModelCard {...cardConfig} onNavigate={onNavigate} />;
};

export default MovementModelCard;