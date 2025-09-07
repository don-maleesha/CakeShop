const express = require('express');
const router = express.Router();
const businessRules = require('../business/rules/BusinessRules');

// Calculate delivery fee endpoint
router.post('/calculate-fee', async (req, res) => {
  try {
    const { 
      subtotal, 
      city, 
      isExpress = false, 
      timeSlot = 'afternoon', 
      customerTier = 'regular' 
    } = req.body;

    console.log('Delivery fee calculation request:', { subtotal, city, isExpress, timeSlot, customerTier });

    // Validate required fields
    if (!subtotal || subtotal < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid subtotal is required'
      });
    }

    // Calculate delivery fee with detailed breakdown
    const deliveryInfo = businessRules.calculateDeliveryFee(subtotal, city, {
      isExpress,
      timeSlot,
      customerTier
    });

    console.log('Delivery fee calculated:', deliveryInfo);

    res.json({
      success: true,
      data: {
        fee: deliveryInfo.fee,
        zone: deliveryInfo.zone,
        zoneName: deliveryInfo.zoneName,
        isFree: deliveryInfo.isFree,
        reason: deliveryInfo.reason,
        breakdown: deliveryInfo.breakdown,
        savings: subtotal >= deliveryInfo.breakdown.threshold ? deliveryInfo.breakdown.baseFee : 0
      }
    });

  } catch (error) {
    console.error('Delivery fee calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate delivery fee'
    });
  }
});

// Get delivery options endpoint
router.get('/options', async (req, res) => {
  try {
    const options = businessRules.getDeliveryOptions();
    
    // Format zones for frontend consumption
    const formattedZones = Object.entries(options.zones).map(([key, zone]) => ({
      id: key,
      name: zone.name,
      fee: zone.fee,
      freeThreshold: zone.freeThreshold,
      cities: zone.cities
    }));

    // Format time slots
    const formattedTimeSlots = Object.entries(options.timeSlots).map(([key, slot]) => ({
      id: key,
      name: slot.name,
      multiplier: slot.multiplier,
      isExpressSlot: key === 'express'
    }));

    res.json({
      success: true,
      data: {
        zones: formattedZones,
        timeSlots: formattedTimeSlots,
        expressDelivery: options.expressDelivery
      }
    });

  } catch (error) {
    console.error('Delivery options fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery options'
    });
  }
});

// Get delivery zones by city endpoint
router.get('/zone/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const options = businessRules.getDeliveryOptions();
    const helpers = businessRules.getRule('order.deliveryFeeHelpers');
    
    const zone = helpers.getDeliveryZone(city, options.zones);
    const zoneConfig = options.zones[zone];

    res.json({
      success: true,
      data: {
        zone: zone,
        zoneName: zoneConfig.name,
        fee: zoneConfig.fee,
        freeThreshold: zoneConfig.freeThreshold,
        cities: zoneConfig.cities
      }
    });

  } catch (error) {
    console.error('Zone lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to determine delivery zone'
    });
  }
});

// Calculate free delivery progress endpoint
router.post('/free-delivery-progress', async (req, res) => {
  try {
    const { subtotal, city } = req.body;

    if (!subtotal || subtotal < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid subtotal is required'
      });
    }

    const options = businessRules.getDeliveryOptions();
    const helpers = businessRules.getRule('order.deliveryFeeHelpers');
    
    const zone = helpers.getDeliveryZone(city, options.zones);
    const zoneConfig = options.zones[zone];
    
    const threshold = zoneConfig.freeThreshold;
    const remaining = Math.max(0, threshold - subtotal);
    const progress = Math.min(100, (subtotal / threshold) * 100);
    const isEligible = subtotal >= threshold;

    res.json({
      success: true,
      data: {
        threshold: threshold,
        current: subtotal,
        remaining: remaining,
        progress: Math.round(progress),
        isEligible: isEligible,
        zone: zone,
        zoneName: zoneConfig.name,
        message: isEligible 
          ? 'You qualify for free delivery!' 
          : `Add LKR ${remaining.toFixed(2)} more for free delivery!`
      }
    });

  } catch (error) {
    console.error('Free delivery progress calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate free delivery progress'
    });
  }
});

module.exports = router;
