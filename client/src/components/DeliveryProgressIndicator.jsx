import React from 'react';
import { Truck, Gift, Clock, Star } from 'lucide-react';

const DeliveryProgressIndicator = ({ 
  progress, 
  isEligible, 
  remaining, 
  threshold, 
  zoneName,
  deliveryFee,
  savings = 0,
  className = '' 
}) => {
  const getProgressColor = () => {
    if (isEligible) return 'bg-green-500';
    if (progress > 70) return 'bg-yellow-500';
    if (progress > 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getBackgroundColor = () => {
    if (isEligible) return 'bg-green-50 border-green-200';
    if (progress > 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getTextColor = () => {
    if (isEligible) return 'text-green-800';
    if (progress > 70) return 'text-yellow-800';
    return 'text-gray-700';
  };

  const getIcon = () => {
    if (isEligible) return <Gift className="w-5 h-5 text-green-600" />;
    return <Truck className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className={`p-4 rounded-lg border ${getBackgroundColor()} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className={`font-medium ${getTextColor()}`}>
            {isEligible ? 'Free Delivery Unlocked!' : 'Free Delivery Progress'}
          </span>
        </div>
        {savings > 0 && (
          <div className="flex items-center space-x-1 text-green-600">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">Save LKR {savings}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className={getTextColor()}>
            LKR {(threshold - remaining).toFixed(2)} of LKR {threshold.toFixed(2)}
          </span>
          <span className={`font-medium ${getTextColor()}`}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${getProgressColor()}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Message */}
      <div className="flex items-start space-x-2">
        <div className="flex-1">
          {isEligible ? (
            <div className="space-y-1">
              <p className="text-green-800 font-medium">
                🎉 Congratulations! You qualify for free delivery to {zoneName}!
              </p>
              {deliveryFee > 0 && (
                <p className="text-sm text-green-700">
                  Additional charges may apply for express delivery or special time slots.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className={`font-medium ${getTextColor()}`}>
                Add LKR {remaining.toFixed(2)} more for free delivery!
              </p>
              <p className="text-sm text-gray-600">
                Free delivery to {zoneName} • Current delivery fee: LKR {deliveryFee}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {!isEligible && progress > 60 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            You're almost there! Add a few more items to save on delivery.
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryProgressIndicator;
