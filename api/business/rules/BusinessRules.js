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

    this.addRule('order.minimumAmount', {
      description: 'Orders below minimum amount incur delivery charges',
      config: {
        minimumAmount: 9000, // LKR
        deliveryFee: 500     // LKR
      },
      calculate: (subtotal) => {
        const rule = this.getRule('order.minimumAmount');
        const { minimumAmount, deliveryFee } = rule.config;
        return subtotal >= minimumAmount ? 0 : deliveryFee;
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

  calculateOrderTotals(items, subtotal) {
    const deliveryFee = this.calculateRule('order.minimumAmount', subtotal);
    
    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      freeDelivery: deliveryFee === 0
    };
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
