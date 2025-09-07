import React, { useState, useEffect } from 'react';
import { Clock, Truck, Star, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useDelivery } from '../contexts/DeliveryContext';

const AdvancedDeliveryOptions = ({ 
  onOptionsChange,
  subtotal = 0,
  selectedCity = '',
  customerTier = 'regular'
}) => {
  const { deliveryOptions, fetchDeliveryOptions } = useDelivery();
  const [selectedOptions, setSelectedOptions] = useState({
    timeSlot: 'afternoon',
    isExpress: false,
    isSameDay: false,
    isPremiumDelivery: false
  });
  const [deliveryDate, setDeliveryDate] = useState('');
  const [estimatedFees, setEstimatedFees] = useState({});

  useEffect(() => {
    fetchDeliveryOptions();
  }, [fetchDeliveryOptions]);

  useEffect(() => {
    calculateEstimatedFees();
    if (onOptionsChange) {
      onOptionsChange(selectedOptions);
    }
  }, [selectedOptions, subtotal, selectedCity, customerTier]);

  const calculateEstimatedFees = () => {
    // This would typically call the delivery calculation API
    // For now, we'll do basic calculation
    const baseFee = subtotal >= 9000 ? 0 : 500;
    let adjustedFee = baseFee;

    if (selectedOptions.isExpress) {
      adjustedFee = Math.max(adjustedFee * 1.5, 800);
    }

    if (selectedOptions.timeSlot === 'evening') {
      adjustedFee *= 1.2;
    }

    if (selectedOptions.isSameDay) {
      adjustedFee += 300;
    }

    // Customer tier discounts
    if (customerTier === 'premium') {
      adjustedFee *= 0.5;
    } else if (customerTier === 'gold') {
      adjustedFee *= 0.8;
    }

    setEstimatedFees({
      base: baseFee,
      adjusted: Math.round(adjustedFee),
      savings: baseFee > 0 ? Math.round(baseFee - adjustedFee) : 0
    });
  };

  const handleOptionChange = (option, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const getDeliveryDateOptions = () => {
    const options = [];
    const today = new Date();
    
    // Regular delivery: tomorrow onwards
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      options.push({
        value: date.toISOString().split('T')[0],
        label: i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        }),
        isSameDay: false,
        isExpress: i === 1
      });
    }

    // Same-day delivery (if before 2 PM)
    const currentHour = new Date().getHours();
    if (currentHour < 14) {
      options.unshift({
        value: today.toISOString().split('T')[0],
        label: 'Today (Same-day)',
        isSameDay: true,
        isExpress: true
      });
    }

    return options;
  };

  const getTimeSlotPrice = (slotId) => {
    if (slotId === 'afternoon') return 0;
    if (slotId === 'evening') return Math.round(500 * 0.2);
    if (slotId === 'express') return Math.round(500 * 0.5);
    return 0;
  };

  const getTierBadge = () => {
    if (customerTier === 'premium') {
      return (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Star className="w-3 h-3 mr-1" />
          Premium Member
        </div>
      );
    }
    if (customerTier === 'gold') {
      return (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Star className="w-3 h-3 mr-1" />
          Gold Member
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Customer Tier */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Delivery Options</h3>
        {getTierBadge()}
      </div>

      {/* Delivery Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Calendar className="w-4 h-4 inline mr-1" />
          Delivery Date
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {getDeliveryDateOptions().map((option) => (
            <label
              key={option.value}
              className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                deliveryDate === option.value 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="deliveryDate"
                value={option.value}
                checked={deliveryDate === option.value}
                onChange={(e) => {
                  setDeliveryDate(e.target.value);
                  handleOptionChange('isSameDay', option.isSameDay);
                  handleOptionChange('isExpress', option.isExpress);
                }}
                className="text-red-600 focus:ring-red-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{option.label}</span>
                  {option.isSameDay && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Same-day +LKR 300
                    </span>
                  )}
                  {option.isExpress && !option.isSameDay && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      Express
                    </span>
                  )}
                </div>
                {option.isSameDay && (
                  <p className="text-xs text-gray-600 mt-1">
                    Order by 2:00 PM for same-day delivery
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Time Slot Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Clock className="w-4 h-4 inline mr-1" />
          Preferred Time Slot
        </label>
        <div className="space-y-2">
          {[
            { id: 'morning', name: '8:00 AM - 12:00 PM', multiplier: 1.0 },
            { id: 'afternoon', name: '12:00 PM - 6:00 PM', multiplier: 1.0 },
            { id: 'evening', name: '6:00 PM - 9:00 PM', multiplier: 1.2 }
          ].map((slot) => (
            <label
              key={slot.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                selectedOptions.timeSlot === slot.id 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="timeSlot"
                value={slot.id}
                checked={selectedOptions.timeSlot === slot.id}
                onChange={(e) => handleOptionChange('timeSlot', e.target.value)}
                className="text-red-600 focus:ring-red-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{slot.name}</span>
                  {slot.multiplier > 1.0 && (
                    <span className="text-sm text-orange-600 font-medium">
                      +LKR {getTimeSlotPrice(slot.id)}
                    </span>
                  )}
                </div>
                {slot.id === 'evening' && (
                  <p className="text-xs text-gray-600 mt-1">
                    Evening delivery includes additional handling
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Premium Delivery Options */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-3 flex items-center">
          <Truck className="w-4 h-4 mr-2" />
          Premium Delivery Services
        </h4>
        
        <div className="space-y-3">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={selectedOptions.isPremiumDelivery}
              onChange={(e) => handleOptionChange('isPremiumDelivery', e.target.checked)}
              className="text-purple-600 focus:ring-purple-500 mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">White-glove Delivery</span>
                <span className="text-sm text-purple-600 font-medium">+LKR 200</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Careful handling, setup assistance, and presentation-ready delivery
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Delivery Cost Breakdown</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Base delivery fee:</span>
            <span className="text-gray-900">
              {estimatedFees.base === 0 ? 'Free' : `LKR ${estimatedFees.base}`}
            </span>
          </div>
          
          {selectedOptions.isExpress && (
            <div className="flex justify-between">
              <span className="text-gray-600">Express delivery:</span>
              <span className="text-orange-600">+50%</span>
            </div>
          )}
          
          {selectedOptions.isSameDay && (
            <div className="flex justify-between">
              <span className="text-gray-600">Same-day surcharge:</span>
              <span className="text-red-600">+LKR 300</span>
            </div>
          )}
          
          {selectedOptions.timeSlot === 'evening' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Evening delivery:</span>
              <span className="text-orange-600">+20%</span>
            </div>
          )}
          
          {customerTier === 'premium' && (
            <div className="flex justify-between">
              <span className="text-green-600">Premium member discount:</span>
              <span className="text-green-600">-50%</span>
            </div>
          )}
          
          {customerTier === 'gold' && (
            <div className="flex justify-between">
              <span className="text-yellow-600">Gold member discount:</span>
              <span className="text-yellow-600">-20%</span>
            </div>
          )}
          
          <div className="border-t pt-2 flex justify-between font-medium">
            <span className="text-gray-900">Total delivery fee:</span>
            <span className="text-red-600">
              {estimatedFees.adjusted === 0 ? 'Free' : `LKR ${estimatedFees.adjusted}`}
            </span>
          </div>
          
          {estimatedFees.savings > 0 && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              You save LKR {estimatedFees.savings} with member benefits!
            </div>
          )}
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Delivery Information:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Same-day delivery available until 2:00 PM</li>
              <li>• Express delivery includes real-time tracking</li>
              <li>• Premium delivery includes setup and presentation</li>
              <li>• Member discounts applied automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDeliveryOptions;
