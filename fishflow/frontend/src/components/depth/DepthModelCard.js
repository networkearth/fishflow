import React from 'react';
import { Layers, Clock } from 'lucide-react';
import ModelCard from '../ModelCard';

const DepthModelCard = ({ onNavigate }) => {
  const cardConfig = {
    title: "Depth Occupancy Model",
    subtitle: "Real-time depth analysis",
    icon: Layers,
    colorScheme: "green",
    features: [
      {
        icon: Layers,
        title: "Depth Layer Analysis",
        description: "Track fish occupancy across multiple depth bins in the water column"
      },
      {
        icon: Clock,
        title: "Hourly Resolution",
        description: "Real-time risk assessment with hourly granularity for immediate decisions"
      }
    ],
    keyFeatures: [
      "Multi-depth occupancy tracking",
      "Hourly risk assessment",
      "Minimum risk optimization", 
      "Time-of-day filtering"
    ],
    navigationTarget: "depth"
  };

  return <ModelCard {...cardConfig} onNavigate={onNavigate} />;
};

export default DepthModelCard;