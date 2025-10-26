const mongoose = require('mongoose');

/**
 * Generates a meaningful order ID with the following format:
 * [Prefix]-[TypeCode]-[DateCode]-[Sequence]
 * 
 * Where:
 * Prefix = ORD
 * TypeCode = PRM (premade) or CUS (custom)
 * DateCode = YYYYMMDD (full year, month, day)
 * Sequence = 4-digit sequential number for the day (0001, 0002, etc.)
 * 
 * Examples:
 * ORD-PRM-20251024-0012 (12th premade order on Oct 24, 2025)
 * ORD-CUS-20251024-0008 (8th custom order on Oct 24, 2025)
 */

class OrderIdGenerator {
  static async generateOrderId(orderType = 'premade') {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Type mapping
    const typeCode = orderType.toLowerCase() === 'custom' ? 'CUS' : 'PRM';
    
    // Find the count of orders for today to generate sequential number
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    try {
      const Order = mongoose.model('Order');
      const CustomOrder = mongoose.model('CustomOrder');
      
      // Count orders created today with the same type from BOTH collections
      const pattern = `^ORD-${typeCode}-${dateStr}-`;
      
      // Count from Order collection
      const orderCount = await Order.countDocuments({
        orderId: { $regex: pattern },
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });
      
      // Count from CustomOrder collection (for CUS type)
      let customOrderCount = 0;
      if (typeCode === 'CUS') {
        customOrderCount = await CustomOrder.countDocuments({
          orderId: { $regex: pattern },
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        });
      }
      
      // Total count from both collections
      const todayOrderCount = orderCount + customOrderCount;
      
      // Generate sequential number (starting from 1)
      const sequentialNumber = (todayOrderCount + 1).toString().padStart(4, '0');
      
      // Generate the order ID
      const orderId = `ORD-${typeCode}-${dateStr}-${sequentialNumber}`;
      
      // Check if this ID already exists in BOTH collections (safety check)
      const existingOrder = await Order.findOne({ orderId });
      const existingCustomOrder = typeCode === 'CUS' ? await CustomOrder.findOne({ orderId }) : null;
      
      if (existingOrder || existingCustomOrder) {
        // If somehow it exists, increment the sequence
        const nextSequence = (todayOrderCount + 2).toString().padStart(4, '0');
        return `ORD-${typeCode}-${dateStr}-${nextSequence}`;
      }
      
      return orderId;
    } catch (error) {
      console.error('Error generating order ID:', error);
      // Fallback to timestamp-based ID if database query fails
      const fallbackSeq = Date.now().toString().slice(-4);
      return `ORD-${typeCode}-${dateStr}-${fallbackSeq}`;
    }
  }

  /**
   * Parse order ID to extract information
   * @param {string} orderId - The order ID to parse (format: ORD-PRM-20251024-0012)
   * @returns {object} Parsed order information
   */
  static parseOrderId(orderId) {
    try {
      const parts = orderId.split('-');
      if (parts.length !== 4 || parts[0] !== 'ORD') {
        return { isValid: false };
      }

      const prefix = parts[0];
      const typeCode = parts[1];
      const dateStr = parts[2];
      const sequentialNum = parts[3];

      const year = parseInt(dateStr.slice(0, 4));
      const month = parseInt(dateStr.slice(4, 6));
      const day = parseInt(dateStr.slice(6, 8));

      const typeMap = {
        'PRM': 'Premade',
        'CUS': 'Custom'
      };

      return {
        isValid: true,
        prefix: prefix,
        type: typeMap[typeCode] || 'Unknown',
        typeCode: typeCode,
        date: new Date(year, month - 1, day),
        sequentialNumber: parseInt(sequentialNum),
        formattedDate: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Determine order type from order data
   * @param {Object} orderData - Order data including items
   * @returns {string} Order type ('premade' or 'custom')
   */
  static determineOrderType(orderData) {
    // Check if it's a custom order based on customization fields
    if (orderData.isCustom || orderData.customization) {
      return 'custom';
    }

    // Check items for custom indicators
    if (orderData.items && orderData.items.length > 0) {
      const hasCustomItem = orderData.items.some(item => 
        item.isCustom || 
        item.customization ||
        (item.name && item.name.toLowerCase().includes('custom'))
      );
      
      if (hasCustomItem) {
        return 'custom';
      }
    }

    // Default to premade
    return 'premade';
  }
}

module.exports = OrderIdGenerator;
