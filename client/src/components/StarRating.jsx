import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ 
  rating = 0, 
  totalReviews = 0, 
  size = 'small', 
  showCount = true,
  interactive = false,
  onClick 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        // Full star
        stars.push(
          <Star
            key={i}
            className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        // Half star
        stars.push(
          <div key={i} className="relative">
            <Star className={`${sizeClasses[size]} text-gray-300`} />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        );
      } else {
        // Empty star
        stars.push(
          <Star
            key={i}
            className={`${sizeClasses[size]} text-gray-300`}
          />
        );
      }
    }

    return stars;
  };

  const containerClasses = interactive
    ? 'cursor-pointer hover:opacity-80 transition-opacity'
    : '';

  return (
    <div
      className={`flex items-center space-x-1 ${containerClasses}`}
      onClick={interactive ? onClick : undefined}
    >
      <div className="flex items-center">
        {renderStars()}
      </div>
      
      {showCount && totalReviews > 0 && (
        <span className={`${textSizeClasses[size]} text-gray-600 ml-1`}>
          ({totalReviews})
        </span>
      )}
      
      {showCount && rating > 0 && (
        <span className={`${textSizeClasses[size]} text-gray-700 font-medium ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
