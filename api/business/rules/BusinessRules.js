/**
 * Central Business Rules Engine
 * Contains all business rules and policies for the CakeShop application
 */

class BusinessRules {
  constructor() {
    this.rules = new Map();
    this.initializeRules();
  }

  initializeRules() {
    // Order-related rules
    this.addRule('order.minimumAdvanceNotice', {
      description: 'Orders must be placed with minimum advance notice',
      validate: (deliveryDate) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const orderDeliveryDate = new Date(deliveryDate);
        orderDeliveryDate.setHours(0, 0, 0, 0);
        
        return orderDeliveryDate >= tomorrow;
      },
      error: 'Orders must be placed at least 1 day in advance'
    });

    this.addRule('customOrder.minimumAdvanceNotice', {
      description: 'Custom orders must be placed with minimum 7 days advance notice',
      validate: (deliveryDate) => {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        sevenDaysFromNow.setHours(0, 0, 0, 0);
        
        const orderDeliveryDate = new Date(deliveryDate);
        orderDeliveryDate.setHours(0, 0, 0, 0);
        
        return orderDeliveryDate >= sevenDaysFromNow;
      },
      error: 'Custom orders must be placed at least 7 days in advance'
    });

    this.addRule('order.stockAvailability', {
      description: 'Order items must have sufficient stock',
      validate: (product, requestedQuantity) => {
        if (!product.isActive) return false;
        if (product.isAvailableOnOrder) return true; // Custom orders bypass stock check
        return product.stockQuantity >= requestedQuantity;
      },
      error: 'Insufficient stock for requested quantity'
    });

    this.addRule('order.deliveryFee', {
      description: 'Calculate delivery fee based on order amount and delivery zone',
      config: {
        defaultThreshold: 9000,  // LKR
        defaultFee: 500,         // LKR
        zones: {
          'colombo': { 
            fee: 300, 
            freeThreshold: 8000, 
            name: 'Colombo District',
            cities: ['colombo', 'mount lavinia', 'dehiwala', 'moratuwa', 'kotte', 'maharagama']
          },
          'gampaha': { 
            fee: 500, 
            freeThreshold: 9000, 
            name: 'Gampaha District',
            cities: ['gampaha', 'negombo', 'kelaniya', 'kadawatha', 'ja-ela', 'wattala']
          },
          'kalutara': { 
            fee: 600, 
            freeThreshold: 10000, 
            name: 'Kalutara District',
            cities: ['kalutara', 'panadura', 'horana', 'beruwala', 'aluthgama']
          },
          'kandy': { 
            fee: 800, 
            freeThreshold: 12000, 
            name: 'Kandy District',
            cities: ['kandy', 'peradeniya', 'gampola', 'nawalapitiya']
          },
          'other': { 
            fee: 1000, 
            freeThreshold: 15000, 
            name: 'Other Areas',
            cities: []
          }
        },
        expressDelivery: {
          multiplier: 1.5,
          minimumFee: 800,
          description: 'Same-day delivery (additional charges apply)'
        },
        timeSlots: {
          'morning': { multiplier: 1.0, name: '8:00 AM - 12:00 PM' },
          'afternoon': { multiplier: 1.0, name: '12:00 PM - 6:00 PM' },
          'evening': { multiplier: 1.0, name: '6:00 PM - 9:00 PM' },
          'express': { multiplier: 1.5, name: 'Express (within 4 hours)' }
        }
      },
      calculate: (subtotal, options = {}) => {
        const { city, isExpress = false, timeSlot = 'afternoon', customerTier = 'regular' } = options;
        const rule = this.getRule('order.deliveryFee');
        const config = rule.config;
        
        // Get helpers for delivery zone calculation
        const helpersRule = this.getRule('order.deliveryFeeHelpers');
        
        // Determine delivery zone
        const zone = helpersRule.getDeliveryZone(city, config.zones);
        const zoneConfig = config.zones[zone];
        
        // Check if eligible for free delivery
        if (subtotal >= zoneConfig.freeThreshold) {
          // Premium customers get free delivery even with express/time slot charges
          if (customerTier === 'premium') {
            return {
              fee: 0,
              zone: zone,
              zoneName: zoneConfig.name,
              isFree: true,
              reason: 'Premium customer - Free delivery'
            };
          }
          
          // Regular customers - only time slot charges apply for free delivery eligible orders
          const timeMultiplier = config.timeSlots[timeSlot]?.multiplier || 1.0;
          const additionalFee = timeMultiplier > 1.0 ? (zoneConfig.fee * (timeMultiplier - 1.0)) : 0;
          
          return {
            fee: additionalFee,
            zone: zone,
            zoneName: zoneConfig.name,
            isFree: additionalFee === 0,
            reason: additionalFee === 0 ? 'Free delivery (above threshold)' : 'Free delivery + time slot fee'
          };
        }
        
        // Calculate base delivery fee
        let deliveryFee = zoneConfig.fee;
        
        // Apply express delivery multiplier
        if (isExpress) {
          deliveryFee = Math.max(deliveryFee * config.expressDelivery.multiplier, config.expressDelivery.minimumFee);
        }
        
        // Apply time slot multiplier
        const timeMultiplier = config.timeSlots[timeSlot]?.multiplier || 1.0;
        deliveryFee *= timeMultiplier;
        
        // Apply customer tier discounts
        if (customerTier === 'premium') {
          deliveryFee *= 0.5; // 50% discount for premium customers
        } else if (customerTier === 'gold') {
          deliveryFee *= 0.8; // 20% discount for gold customers
        }
        
        return {
          fee: Math.round(deliveryFee),
          zone: zone,
          zoneName: zoneConfig.name,
          isFree: false,
          reason: helpersRule.buildDeliveryReason(isExpress, timeSlot, customerTier)
        };
      }
    });

    // Add helper methods for delivery fee calculation
    this.addRule('order.deliveryFeeHelpers', {
      description: 'Helper methods for delivery fee calculation',
      getDeliveryZone: (city, zones) => {
        if (!city) return 'other';
        
        const cityLower = city.toLowerCase().trim();
        
        for (const [zoneKey, zoneConfig] of Object.entries(zones)) {
          if (zoneKey === 'other') continue;
          if (zoneConfig.cities.some(zoneCity => cityLower.includes(zoneCity))) {
            return zoneKey;
          }
        }
        
        return 'other';
      },
      buildDeliveryReason: (isExpress, timeSlot, customerTier) => {
        const reasons = [];
        if (isExpress) reasons.push('Express delivery');
        if (timeSlot === 'evening') reasons.push('Evening delivery');
        if (timeSlot === 'express') reasons.push('Express time slot');
        if (customerTier === 'premium') reasons.push('Premium discount applied');
        if (customerTier === 'gold') reasons.push('Gold member discount');
        
        return reasons.length > 0 ? reasons.join(', ') : 'Standard delivery';
      }
    });

    this.addRule('payment.advanceRequired', {
      description: 'Custom orders may require advance payment',
      validate: (customOrder) => {
        // Advance required for orders above certain amount or complex requirements
        if (customOrder.estimatedPrice > 10000) return true;
        if (customOrder.specialRequirements && customOrder.specialRequirements.length > 100) return true;
        if (customOrder.cakeSize === 'Multi-tier') return true;
        return false;
      },
      calculate: (estimatedPrice) => {
        // Calculate advance amount (30% of estimated price, minimum 2000 LKR)
        const advancePercentage = 0.3;
        const minimumAdvance = 2000;
        return Math.max(estimatedPrice * advancePercentage, minimumAdvance);
      }
    });

    this.addRule('product.pricing', {
      description: 'Product pricing rules',
      validate: (product) => {
        if (product.price <= 0) return false;
        if (product.discountPrice && product.discountPrice >= product.price) return false;
        return true;
      },
      error: 'Invalid product pricing'
    });

    this.addRule('order.statusTransition', {
      description: 'Valid order status transitions',
      transitions: {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['preparing', 'cancelled'],
        'preparing': ['ready', 'cancelled'],
        'ready': ['delivered'],
        'delivered': [], // Terminal state
        'cancelled': []  // Terminal state
      },
      validate: (currentStatus, newStatus) => {
        const rule = this.getRule('order.statusTransition');
        const allowedTransitions = rule.transitions[currentStatus] || [];
        return allowedTransitions.includes(newStatus);
      },
      error: 'Invalid status transition'
    });

    this.addRule('customOrder.statusTransition', {
      description: 'Valid custom order status transitions',
      transitions: {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['in-progress', 'cancelled'],
        'in-progress': ['completed', 'cancelled'],
        'completed': [], // Terminal state
        'cancelled': []  // Terminal state
      },
      validate: (currentStatus, newStatus) => {
        const rule = this.getRule('customOrder.statusTransition');
        const allowedTransitions = rule.transitions[currentStatus] || [];
        return allowedTransitions.includes(newStatus);
      },
      error: 'Invalid status transition'
    });

    this.addRule('payment.statusTransition', {
      description: 'Valid payment status transitions',
      transitions: {
        'pending': ['paid', 'failed'],
        'paid': ['refunded'],
        'failed': ['pending'], // Allow retry
        'refunded': []  // Terminal state
      },
      validate: (currentStatus, newStatus) => {
        const rule = this.getRule('payment.statusTransition');
        const allowedTransitions = rule.transitions[currentStatus] || [];
        return allowedTransitions.includes(newStatus);
      },
      error: 'Invalid payment status transition'
    });

    this.addRule('inventory.lowStockAlert', {
      description: 'Alert when product stock is low',
      validate: (product) => {
        return product.stockQuantity <= product.lowStockThreshold;
      },
      calculate: (product) => {
        return {
          isLowStock: product.stockQuantity <= product.lowStockThreshold,
          stockPercentage: (product.stockQuantity / (product.lowStockThreshold * 2)) * 100,
          urgency: product.stockQuantity === 0 ? 'critical' : 
                  product.stockQuantity <= product.lowStockThreshold / 2 ? 'high' : 'medium'
        };
      }
    });

    this.addRule('customer.validation', {
      description: 'Customer information validation rules',
      validate: (customerInfo) => {
        const { name, email, phone, address } = customerInfo;
        
        // Name validation
        if (!name || name.trim().length < 2 || name.trim().length > 50) {
          throw new Error('Name must be between 2 and 50 characters');
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email.trim())) {
          throw new Error('Please provide a valid email address');
        }
        
        // Phone validation (Sri Lankan format)
        const phoneRegex = /^(\+94|0)?[1-9]\d{8}$/;
        if (!phone || !phoneRegex.test(phone.replace(/\s/g, ''))) {
          throw new Error('Please provide a valid Sri Lankan phone number');
        }
        
        // Address validation
        if (typeof address === 'object') {
          if (!address.street || !address.city) {
            throw new Error('Complete address with street and city is required');
          }
        } else if (!address || address.trim().length < 10) {
          throw new Error('Please provide a complete address');
        }
        
        return true;
      }
    });
  }

  addRule(name, rule) {
    this.rules.set(name, rule);
  }

  getRule(name) {
    return this.rules.get(name);
  }

  validateRule(ruleName, ...args) {
    const rule = this.getRule(ruleName);
    if (!rule) {
      throw new Error(`Business rule '${ruleName}' not found`);
    }
    
    try {
      return rule.validate(...args);
    } catch (error) {
      throw new Error(rule.error || error.message);
    }
  }

  calculateRule(ruleName, ...args) {
    const rule = this.getRule(ruleName);
    if (!rule || !rule.calculate) {
      throw new Error(`Calculation rule '${ruleName}' not found`);
    }
    
    return rule.calculate(...args);
  }

  getAllRules() {
    return Array.from(this.rules.entries()).map(([name, rule]) => ({
      name,
      description: rule.description,
      config: rule.config
    }));
  }

  // Business logic validators
  canPlaceOrder(orderData) {
    const errors = [];
    
    try {
      // Validate delivery date
      this.validateRule('order.minimumAdvanceNotice', orderData.deliveryDate);
      
      // Validate customer info
      this.validateRule('customer.validation', orderData.customerInfo);
      
      // Validate items and stock
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          // Skip stock validation if product is just an ID (will be validated later with full product objects)
          if (item.product && typeof item.product === 'object' && item.product.stockQuantity !== undefined) {
            if (!this.validateRule('order.stockAvailability', item.product, item.quantity)) {
              errors.push(`Insufficient stock for ${item.product.name}`);
            }
          }
          // If item.product is just an ID string, stock validation will be done later in processOrderItems
        }
      }
    } catch (error) {
      errors.push(error.message);
    }
    
    return {
      canPlace: errors.length === 0,
      errors
    };
  }

  canPlaceCustomOrder(customOrderData) {
    const errors = [];
    
    try {
      // Validate delivery date
      this.validateRule('customOrder.minimumAdvanceNotice', customOrderData.deliveryDate);
      
      // Validate customer info
      this.validateRule('customer.validation', {
        name: customOrderData.customerName,
        email: customOrderData.customerEmail,
        phone: customOrderData.customerPhone,
        address: 'Custom order address' // Custom orders don't need full address upfront
      });
      
    } catch (error) {
      errors.push(error.message);
    }
    
    return {
      canPlace: errors.length === 0,
      errors
    };
  }

  canTransitionOrderStatus(currentStatus, newStatus, orderType = 'order') {
    const ruleName = orderType === 'custom' ? 'customOrder.statusTransition' : 'order.statusTransition';
    
    try {
      return this.validateRule(ruleName, currentStatus, newStatus);
    } catch (error) {
      return false;
    }
  }

  canTransitionPaymentStatus(currentStatus, newStatus) {
    try {
      return this.validateRule('payment.statusTransition', currentStatus, newStatus);
    } catch (error) {
      return false;
    }
  }

  calculateOrderTotals(items, subtotal, deliveryOptions = {}) {
    const deliveryResult = this.calculateRule('order.deliveryFee', subtotal, deliveryOptions);
    const deliveryFee = typeof deliveryResult === 'object' ? deliveryResult.fee : deliveryResult;
    
    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      freeDelivery: deliveryFee === 0,
      deliveryInfo: typeof deliveryResult === 'object' ? deliveryResult : null
    };
  }

  // New method to get delivery zones and options
  getDeliveryOptions() {
    const rule = this.getRule('order.deliveryFee');
    return {
      zones: rule.config.zones,
      timeSlots: rule.config.timeSlots,
      expressDelivery: rule.config.expressDelivery
    };
  }

  // New method to calculate delivery fee with detailed breakdown
  calculateDeliveryFee(subtotal, city, options = {}) {
    const deliveryRule = this.getRule('order.deliveryFee');
    const helpersRule = this.getRule('order.deliveryFeeHelpers');
    
    const zone = helpersRule.getDeliveryZone(city, deliveryRule.config.zones);
    const result = deliveryRule.calculate(subtotal, { city, ...options });
    
    return {
      ...result,
      breakdown: {
        baseZone: zone,
        baseFee: deliveryRule.config.zones[zone].fee,
        threshold: deliveryRule.config.zones[zone].freeThreshold,
        appliedDiscounts: this.getAppliedDiscounts(subtotal, options),
        timeSlotInfo: deliveryRule.config.timeSlots[options.timeSlot || 'afternoon']
      }
    };
  }

  getAppliedDiscounts(subtotal, options) {
    const discounts = [];
    const { customerTier, isExpress, timeSlot } = options;
    
    if (customerTier === 'premium') {
      discounts.push({ type: 'premium', description: '50% off delivery', value: 0.5 });
    } else if (customerTier === 'gold') {
      discounts.push({ type: 'gold', description: '20% off delivery', value: 0.2 });
    }
    
    return discounts;
  }

  calculateAdvancePayment(customOrder) {
    const requiresAdvance = this.validateRule('payment.advanceRequired', customOrder);
    
    if (!requiresAdvance || !customOrder.estimatedPrice) {
      return {
        required: false,
        amount: 0
      };
    }
    
    const amount = this.calculateRule('payment.advanceRequired', customOrder.estimatedPrice);
    
    return {
      required: true,
      amount: Math.round(amount),
      percentage: Math.round((amount / customOrder.estimatedPrice) * 100)
    };
  }
}

// Singleton instance
const businessRules = new BusinessRules();

module.exports = businessRules;
