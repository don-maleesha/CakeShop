/**
 * Comprehensive data validation layer
 * Provides centralized validation for all business entities
 */

const businessRules = require('../rules/BusinessRules');

class DataValidators {
  // Base validation helper
  static validate(data, rules) {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      // Required field validation
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      // Skip other validations if field is not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Type validation
      if (rule.type) {
        let typeValid = false;
        
        switch (rule.type) {
          case 'date':
            // For date type, check if it's a valid date string or Date object
            const dateValue = new Date(value);
            typeValid = !isNaN(dateValue.getTime()) && value !== '';
            break;
          case 'array':
            typeValid = Array.isArray(value);
            break;
          default:
            typeValid = typeof value === rule.type;
            break;
        }
        
        if (!typeValid) {
          errors.push(`${field} must be of type ${rule.type}`);
          continue;
        }
      }
      
      // String validations
      if (rule.type === 'string') {
        if (rule.minLength && value.trim().length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength && value.trim().length > rule.maxLength) {
          errors.push(`${field} cannot exceed ${rule.maxLength} characters`);
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
        if (rule.enum && !rule.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
        }
      }
      
      // Number validations
      if (rule.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`${field} must be a valid number`);
          continue;
        }
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push(`${field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push(`${field} cannot exceed ${rule.max}`);
        }
      }
      
      // Date validations
      if (rule.type === 'date') {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push(`${field} must be a valid date`);
          continue;
        }
        if (rule.minDate) {
          const minDate = typeof rule.minDate === 'function' ? rule.minDate() : new Date(rule.minDate);
          if (dateValue < minDate) {
            errors.push(`${field} cannot be before ${minDate.toDateString()}`);
          }
        }
        if (rule.maxDate) {
          const maxDate = typeof rule.maxDate === 'function' ? rule.maxDate() : new Date(rule.maxDate);
          if (dateValue > maxDate) {
            errors.push(`${field} cannot be after ${maxDate.toDateString()}`);
          }
        }
      }
      
      // Array validations
      if (rule.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`);
          continue;
        }
        if (rule.minItems && value.length < rule.minItems) {
          errors.push(`${field} must have at least ${rule.minItems} items`);
        }
        if (rule.maxItems && value.length > rule.maxItems) {
          errors.push(`${field} cannot have more than ${rule.maxItems} items`);
        }
      }
      
      // Custom validation
      if (rule.custom && typeof rule.custom === 'function') {
        try {
          const result = rule.custom(value, data);
          if (result !== true && typeof result === 'string') {
            errors.push(result);
          }
        } catch (error) {
          errors.push(`${field} validation error: ${error.message}`);
        }
      }
    }
    
    return errors;
  }

  // Customer validation
  static validateCustomer(customerData) {
    const rules = {
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50
      },
      email: {
        required: true,
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value) => {
          const email = value.trim().toLowerCase();
          if (email.length > 100) return 'Email address is too long';
          return true;
        }
      },
      phone: {
        required: true,
        type: 'string',
        pattern: /^(\+94|0)?[1-9]\d{8}$/,
        custom: (value) => {
          const cleanPhone = value.replace(/\s/g, '');
          if (cleanPhone.length < 10 || cleanPhone.length > 12) {
            return 'Please provide a valid Sri Lankan phone number';
          }
          return true;
        }
      }
    };

    return this.validate(customerData, rules);
  }

  // Order validation
  static validateOrder(orderData) {
    const rules = {
      customerInfo: {
        required: true,
        type: 'object',
        custom: (value) => {
          const customerErrors = this.validateCustomer(value);
          if (customerErrors.length > 0) {
            return `Customer info errors: ${customerErrors.join(', ')}`;
          }
          
          // Validate address
          if (!value.address) return 'Address is required';
          
          if (typeof value.address === 'object') {
            if (!value.address.street || value.address.street.trim().length < 5) {
              return 'Street address must be at least 5 characters';
            }
            if (!value.address.city || value.address.city.trim().length < 2) {
              return 'City is required';
            }
          } else if (typeof value.address === 'string') {
            if (value.address.trim().length < 10) {
              return 'Address must be at least 10 characters';
            }
          }
          
          return true;
        }
      },
      items: {
        required: true,
        type: 'array',
        minItems: 1,
        custom: (items) => {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.productId && !item.product) {
              return `Item ${i + 1}: Product ID is required`;
            }
            if (!item.quantity || item.quantity < 1) {
              return `Item ${i + 1}: Valid quantity is required`;
            }
            if (item.quantity > 100) {
              return `Item ${i + 1}: Quantity cannot exceed 100`;
            }
          }
          return true;
        }
      },
      deliveryDate: {
        required: true,
        type: 'date',
        minDate: () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow;
        },
        custom: (value) => {
          // Check business rule for minimum advance notice
          try {
            businessRules.validateRule('order.minimumAdvanceNotice', value);
            return true;
          } catch (error) {
            return error.message;
          }
        }
      },
      deliveryTime: {
        required: true,
        type: 'string',
        enum: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM', '6:00 PM - 9:00 PM']
      },
      specialInstructions: {
        required: false,
        type: 'string',
        maxLength: 500
      },
      paymentMethod: {
        required: false,
        type: 'string',
        enum: ['cash_on_delivery', 'online_transfer']
      }
    };

    return this.validate(orderData, rules);
  }

  // Custom order validation
  static validateCustomOrder(customOrderData) {
    const rules = {
      customerName: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50
      },
      customerEmail: {
        required: true,
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      customerPhone: {
        required: true,
        type: 'string',
        pattern: /^(\+94|0)?[1-9]\d{8}$/
      },
      eventType: {
        required: true,
        type: 'string',
        enum: [
          'Birthday',
          'Wedding',
          'Anniversary',
          'Corporate Event',
          'Baby Shower',
          'Graduation',
          'Holiday Celebration',
          'Other'
        ]
      },
      cakeSize: {
        required: true,
        type: 'string',
        enum: [
          '6 inch (serves 6-8)',
          '8 inch (serves 12-15)',
          '10 inch (serves 20-25)',
          '12 inch (serves 30-35)',
          'Multi-tier',
          'Sheet cake'
        ]
      },
      flavor: {
        required: true,
        type: 'string',
        enum: [
          'Vanilla',
          'Chocolate',
          'Red Velvet',
          'Carrot',
          'Lemon',
          'Strawberry',
          'Funfetti',
          'Coffee/Mocha',
          'Custom flavor'
        ]
      },
      deliveryDate: {
        required: true,
        type: 'date',
        custom: (value) => {
          try {
            businessRules.validateRule('customOrder.minimumAdvanceNotice', value);
            return true;
          } catch (error) {
            return error.message;
          }
        }
      },
      specialRequirements: {
        required: false,
        type: 'string',
        maxLength: 500
      }
    };

    return this.validate(customOrderData, rules);
  }

  // Product validation
  static validateProduct(productData) {
    const rules = {
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      description: {
        required: true,
        type: 'string',
        minLength: 10,
        maxLength: 1000
      },
      price: {
        required: true,
        type: 'number',
        min: 1,
        max: 1000000 // 1 million LKR max
      },
      discountPrice: {
        required: false,
        type: 'number',
        min: 0,
        custom: (value, data) => {
          if (value && data.price && value >= data.price) {
            return 'Discount price must be less than regular price';
          }
          return true;
        }
      },
      category: {
        required: true,
        type: 'string'
      },
      type: {
        required: false,
        type: 'string',
        enum: ['regular', 'custom', 'seasonal']
      },
      stockQuantity: {
        required: true,
        type: 'number',
        min: 0,
        max: 10000
      },
      lowStockThreshold: {
        required: false,
        type: 'number',
        min: 0,
        max: 1000
      },
      preparationTime: {
        required: false,
        type: 'number',
        min: 1,
        max: 720 // 30 days in hours
      },
      weight: {
        required: false,
        type: 'number',
        min: 0,
        max: 50000 // 50kg in grams
      }
    };

    return this.validate(productData, rules);
  }

  // Payment validation
  static validatePayment(paymentData) {
    const rules = {
      orderId: {
        required: true,
        type: 'string',
        pattern: /^(ORD|CO|PAY)/
      },
      amount: {
        required: true,
        type: 'number',
        min: 100, // Minimum 100 LKR
        max: 1000000 // Maximum 1M LKR
      },
      customerName: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50
      },
      email: {
        required: true,
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      phone: {
        required: true,
        type: 'string',
        pattern: /^(\+94|0)?[1-9]\d{8}$/
      }
    };

    return this.validate(paymentData, rules);
  }

  // Contact form validation
  static validateContact(contactData) {
    const rules = {
      customerName: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50
      },
      customerEmail: {
        required: true,
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      subject: {
        required: true,
        type: 'string',
        minLength: 5,
        maxLength: 100
      },
      message: {
        required: true,
        type: 'string',
        minLength: 10,
        maxLength: 1000
      }
    };

    return this.validate(contactData, rules);
  }

  // Generic validation result formatter
  static formatValidationResult(errors) {
    return {
      isValid: errors.length === 0,
      errors,
      summary: errors.length === 0 ? 'Validation passed' : `${errors.length} validation error(s)`
    };
  }

  // Cross-field validation helpers
  static validateOrderConsistency(orderData) {
    const errors = [];
    
    // Check if delivery date is not in the past
    const deliveryDate = new Date(orderData.deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deliveryDate < today) {
      errors.push('Delivery date cannot be in the past');
    }
    
    // Check if total amount matches items
    if (orderData.items && orderData.totalAmount) {
      let calculatedTotal = 0;
      for (const item of orderData.items) {
        calculatedTotal += (item.price || 0) * (item.quantity || 0);
      }
      
      // Add delivery fee calculation
      const deliveryFee = businessRules.calculateRule('order.minimumAmount', calculatedTotal);
      calculatedTotal += deliveryFee;
      
      const difference = Math.abs(calculatedTotal - orderData.totalAmount);
      if (difference > 0.01) { // Allow for small rounding differences
        errors.push('Order total amount does not match calculated total');
      }
    }
    
    return errors;
  }

  static validateCustomOrderConsistency(customOrderData) {
    const errors = [];
    
    // Check advance payment logic
    if (customOrderData.advanceAmount > 0) {
      if (!customOrderData.estimatedPrice) {
        errors.push('Estimated price is required when advance payment is set');
      } else if (customOrderData.advanceAmount > customOrderData.estimatedPrice) {
        errors.push('Advance amount cannot exceed estimated price');
      }
    }
    
    // Check if advance payment status is consistent
    if (customOrderData.advanceAmount > 0 && customOrderData.advancePaymentStatus === 'not_required') {
      errors.push('Advance payment status should not be "not_required" when advance amount is set');
    }
    
    if (customOrderData.advanceAmount === 0 && customOrderData.advancePaymentStatus !== 'not_required') {
      errors.push('Advance payment status should be "not_required" when no advance amount is set');
    }
    
    return errors;
  }
}

module.exports = DataValidators;
