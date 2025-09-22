import React from 'react';
import { Layers, Clock } from 'lucide-react';
import ModelCard from '../ModelCard';

const DepthModelCard = ({ onNavigate }) => {
  const cardConfig = {
    title: "Depth Occupancy Model",
    subtitle: "Depth occupancy analysis",
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
        description: "Inform the when of bycatch avoidance."
      }
    ],
    keyFeatures: [
      "Depth occupancy predictions",
      "Hourly resolution",
    ],
    navigationTarget: "depth"
  };

  return <ModelCard {...cardConfig} onNavigate={onNavigate} />;
};

export default DepthModelCard;