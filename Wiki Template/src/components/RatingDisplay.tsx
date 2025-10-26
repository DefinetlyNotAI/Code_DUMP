import React from 'react';
import { Rating } from '../types/WikiTypes';

interface RatingDisplayProps {
  rating: Rating;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({ rating }) => {
  const getStarColor = (rating: Rating) => {
    switch (rating) {
      case 5: return 'text-yellow-400'; // Gold
      case 4: return 'text-purple-400'; // Epic
      case 3: return 'text-blue-400';   // Rare
      case 2: return 'text-green-400';  // Uncommon
      case 1: return 'text-gray-400';   // Common
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${getStarColor(rating)}`}>
      {[...Array(rating)].map((_, i) => (
        <span key={i} className="text-xl">★</span>
      ))}
    </div>
  );
};

export default RatingDisplay;