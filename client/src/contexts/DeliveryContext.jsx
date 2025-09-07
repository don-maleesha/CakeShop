import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const DeliveryContext = createContext();

export const DeliveryProvider = ({ children }) => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState({
    fee: 0,
    zone: 'other',
    zoneName: 'Other Areas',
    isFree: false,
    reason: 'Standard delivery',
    breakdown: null
  });
  const [deliveryOptions, setDeliveryOptions] = useState({
    zones: [],
    timeSlots: [],
    expressDelivery: null
  });
  const [freeDeliveryProgress, setFreeDeliveryProgress] = useState({
    threshold: 15000,
    current: 0,
    remaining: 15000,
    progress: 0,
    isEligible: false,
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Calculate delivery fee in real-time
  const calculateDeliveryFee = useCallback(async (subtotal, city, options = {}) => {
    if (!subtotal || subtotal <= 0) {
      setDeliveryFee(0);
      setDeliveryInfo({
        fee: 0,
        zone: 'other',
        zoneName: 'Other Areas',
        isFree: false,
        reason: 'No items in cart',
        breakdown: null
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:4000/delivery/calculate-fee', {
        subtotal,
        city: city || 'other',
        isExpress: options.isExpress || false,
        timeSlot: options.timeSlot || 'afternoon',
        customerTier: options.customerTier || 'regular'
      });

      if (response.data.success) {
        const data = response.data.data;
        setDeliveryFee(data.fee);
        setDeliveryInfo({
          fee: data.fee,
          zone: data.zone,
          zoneName: data.zoneName,
          isFree: data.isFree,
          reason: data.reason,
          breakdown: data.breakdown,
          savings: data.savings
        });
      }
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      // Fallback to basic calculation
      const basicFee = subtotal >= 9000 ? 0 : 500;
      setDeliveryFee(basicFee);
      setDeliveryInfo({
        fee: basicFee,
        zone: 'other',
        zoneName: 'Other Areas',
        isFree: basicFee === 0,
        reason: basicFee === 0 ? 'Free delivery (above threshold)' : 'Standard delivery',
        breakdown: null
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate free delivery progress
  const calculateFreeDeliveryProgress = useCallback(async (subtotal, city) => {
    if (!subtotal || subtotal <= 0) {
      setFreeDeliveryProgress({
        threshold: 15000,
        current: 0,
        remaining: 15000,
        progress: 0,
        isEligible: false,
        message: 'Add items to your cart'
      });
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/delivery/free-delivery-progress', {
        subtotal,
        city: city || 'other'
      });

      if (response.data.success) {
        setFreeDeliveryProgress(response.data.data);
      }
    } catch (error) {
      console.error('Error calculating free delivery progress:', error);
      // Fallback calculation
      const threshold = 9000;
      const remaining = Math.max(0, threshold - subtotal);
      const progress = Math.min(100, (subtotal / threshold) * 100);
      
      setFreeDeliveryProgress({
        threshold,
        current: subtotal,
        remaining,
        progress: Math.round(progress),
        isEligible: subtotal >= threshold,
        zone: 'other',
        zoneName: 'Other Areas',
        message: subtotal >= threshold 
          ? 'You qualify for free delivery!' 
          : `Add LKR ${remaining.toFixed(2)} more for free delivery!`
      });
    }
  }, []);

  // Fetch delivery options
  const fetchDeliveryOptions = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/delivery/options');
      if (response.data.success) {
        setDeliveryOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching delivery options:', error);
      // Set fallback options
      setDeliveryOptions({
        zones: [
          { id: 'other', name: 'Other Areas', fee: 500, freeThreshold: 9000, cities: [] }
        ],
        timeSlots: [
          { id: 'afternoon', name: '12:00 PM - 6:00 PM', multiplier: 1.0, isExpressSlot: false }
        ],
        expressDelivery: { multiplier: 1.5, minimumFee: 800 }
      });
    }
  }, []);

  // Get delivery zone for a city
  const getDeliveryZone = useCallback(async (city) => {
    if (!city) return null;
    
    try {
      const response = await axios.get(`http://localhost:4000/delivery/zone/${encodeURIComponent(city)}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error getting delivery zone:', error);
    }
    return null;
  }, []);

  // Update delivery calculation when cart or address changes
  const updateDeliveryCalculation = useCallback((subtotal, city, options = {}) => {
    calculateDeliveryFee(subtotal, city, options);
    calculateFreeDeliveryProgress(subtotal, city);
  }, [calculateDeliveryFee, calculateFreeDeliveryProgress]);

  const value = {
    deliveryFee,
    deliveryInfo,
    deliveryOptions,
    freeDeliveryProgress,
    isLoading,
    calculateDeliveryFee,
    calculateFreeDeliveryProgress,
    fetchDeliveryOptions,
    getDeliveryZone,
    updateDeliveryCalculation
  };

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};

export default DeliveryContext;
