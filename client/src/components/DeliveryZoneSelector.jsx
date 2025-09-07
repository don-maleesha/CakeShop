import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Truck, Info } from 'lucide-react';
import { useDelivery } from '../contexts/DeliveryContext';

const DeliveryZoneSelector = ({ 
  selectedCity = '', 
  onCityChange,
  selectedTimeSlot = 'afternoon',
  onTimeSlotChange,
  isExpressDelivery = false,
  onExpressChange,
  showTimeSlots = true,
  showExpressOptions = true,
  className = ''
}) => {
  const { deliveryOptions, fetchDeliveryOptions, getDeliveryZone } = useDelivery();
  const [currentZone, setCurrentZone] = useState(null);
  const [isLoadingZone, setIsLoadingZone] = useState(false);

  useEffect(() => {
    fetchDeliveryOptions();
  }, [fetchDeliveryOptions]);

  useEffect(() => {
    if (selectedCity) {
      setIsLoadingZone(true);
      getDeliveryZone(selectedCity)
        .then(zone => {
          setCurrentZone(zone);
        })
        .finally(() => {
          setIsLoadingZone(false);
        });
    } else {
      setCurrentZone(null);
    }
  }, [selectedCity, getDeliveryZone]);

  const handleCityChange = (e) => {
    const city = e.target.value;
    onCityChange(city);
  };

  const getTimeSlotPrice = (slotId) => {
    const slot = deliveryOptions.timeSlots.find(s => s.id === slotId);
    if (!slot || !currentZone) return '';
    
    if (slot.multiplier === 1.0) return '';
    
    const additionalFee = Math.round(currentZone.fee * (slot.multiplier - 1.0));
    return additionalFee > 0 ? `(+LKR ${additionalFee})` : '';
  };

  const getExpressPrice = () => {
    if (!currentZone || !deliveryOptions.expressDelivery) return '';
    
    const expressFee = Math.max(
      currentZone.fee * deliveryOptions.expressDelivery.multiplier,
      deliveryOptions.expressDelivery.minimumFee
    );
    const additionalFee = Math.round(expressFee - currentZone.fee);
    
    return additionalFee > 0 ? `(+LKR ${additionalFee})` : '';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Delivery City *
        </label>
        <input
          type="text"
          value={selectedCity}
          onChange={handleCityChange}
          placeholder="Enter your city (e.g., Colombo, Kandy, Gampaha)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          required
        />
        
        {/* Zone Information */}
        {isLoadingZone ? (
          <div className="mt-2 text-sm text-gray-500">
            Checking delivery zone...
          </div>
        ) : currentZone ? (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{currentZone.zoneName}</span>
            </div>
            <div className="text-sm text-blue-700 mt-1">
              Delivery fee: LKR {currentZone.fee} • 
              Free delivery above LKR {currentZone.freeThreshold}
            </div>
            {currentZone.cities.length > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                Coverage: {currentZone.cities.slice(0, 3).join(', ')}
                {currentZone.cities.length > 3 && ` and ${currentZone.cities.length - 3} more areas`}
              </div>
            )}
          </div>
        ) : selectedCity && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 text-gray-600">
              <Info className="w-4 h-4" />
              <span className="text-sm">Standard delivery rates will apply</span>
            </div>
          </div>
        )}
      </div>

      {/* Express Delivery Option */}
      {showExpressOptions && deliveryOptions.expressDelivery && (
        <div>
          <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={isExpressDelivery}
              onChange={(e) => onExpressChange(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-900">Express Delivery</span>
                <span className="text-sm text-red-600 font-medium">
                  {getExpressPrice()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {deliveryOptions.expressDelivery.description}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Time Slot Selection */}
      {showTimeSlots && deliveryOptions.timeSlots.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Preferred Delivery Time
          </label>
          <div className="grid grid-cols-1 gap-2">
            {deliveryOptions.timeSlots
              .filter(slot => !isExpressDelivery || !slot.isExpressSlot)
              .map((slot) => (
              <label
                key={slot.id}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="timeSlot"
                  value={slot.id}
                  checked={selectedTimeSlot === slot.id}
                  onChange={(e) => onTimeSlotChange(e.target.value)}
                  className="text-red-600 focus:ring-red-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{slot.name}</span>
                    {slot.multiplier > 1.0 && (
                      <span className="text-sm text-orange-600 font-medium">
                        {getTimeSlotPrice(slot.id)}
                      </span>
                    )}
                  </div>
                  {slot.isExpressSlot && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚡ Express delivery slot
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Delivery Information:</p>
            <ul className="space-y-1 text-yellow-700">
              <li>• <strong>Advance Notice:</strong> Orders must be placed at least 1 day before delivery date</li>
              <li>• <strong>Express Delivery:</strong> Available island-wide with 1.5x delivery fee (minimum LKR 800)</li>
              <li>• <strong>Time Slots:</strong> Morning (8AM-12PM), Afternoon (12PM-6PM), Evening (6PM-9PM), Express (within 4 hours)</li>
              <li>• <strong>Free Delivery:</strong> Colombo: LKR 8,000+ | Gampaha: LKR 9,000+ | Kalutara: LKR 10,000+ | Kandy: LKR 12,000+ | Other Areas: LKR 15,000+</li>
              <li>• <strong>Coverage Areas:</strong> Colombo, Gampaha, Kalutara, Kandy districts and surrounding areas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryZoneSelector;
