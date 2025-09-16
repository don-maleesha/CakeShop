const mongoose = require('mongoose');

/**
 * Generates a meaningful order ID with the following format:
 * CS-YYMMDD-XXX-C
 * 
 * Where:
 * CS = CakeShop prefix
 * YYMMDD = Year, Month, Day
 * XXX = Sequential number for the day (001, 002, etc.)
 * C = Category indicator (B=Birthday, W=Wedding, C=Custom, G=General)
 * 
 * Example: CS-241225-001-B (First birthday cake order on Dec 25, 2024)
 */

class OrderIdGenerator {
  static async generateOrderId(orderCategory = 'general') {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Category mapping
    const categoryMap = {
      'birthday': 'B',
      'wedding': 'W',
      'custom': 'C',
      'anniversary': 'A',
      'celebration': 'E',
      'general': 'G'
    };
    
    const categoryCode = categoryMap[orderCategory.toLowerCase()] || 'G';
    
    // Find the count of orders for today to generate sequential number
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    try {
      const Order = mongoose.model('Order');
      
      // Count orders created today
      const todayOrderCount = await Order.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });
      
      // Generate sequential number (starting from 1)
      const sequentialNumber = (todayOrderCount + 1).toString().padStart(3, '0');
      
      // Generate the order ID
      const orderId = `CS-${dateStr}-${sequentialNumber}-${categoryCode}`;
      
      // Check if this ID already exists (very unlikely but safety check)
      const existingOrder = await Order.findOne({ orderId });
      if (existingOrder) {
        // If somehow it exists, add a random suffix
        const randomSuffix = Math.random().toString(36).substr(2, 2).toUpperCase();
        return `${orderId}${randomSuffix}`;
      }
      
      return orderId;
    } catch (error) {
      console.error('Error generating order ID:', error);
      // Fallback to timestamp-based ID if database query fails
      return `CS-${dateStr}-${Date.now().toString().slice(-6)}-${categoryCode}`;
    }
  }

  /**
   * Parse order ID to extract information
   * @param {string} orderId - The order ID to parse
   * @returns {object} Parsed order information
   */
  static parseOrderId(orderId) {
    try {
      const parts = orderId.split('-');
      if (parts.length < 4 || parts[0] !== 'CS') {
        return { isValid: false };
      }

      const dateStr = parts[1];
      const sequentialNum = parts[2];
      const categoryCode = parts[3].charAt(0);

      const year = 2000 + parseInt(dateStr.slice(0, 2));
      const month = parseInt(dateStr.slice(2, 4));
      const day = parseInt(dateStr.slice(4, 6));

      const categoryMap = {
        'B': 'Birthday',
        'W': 'Wedding',
        'C': 'Custom',
        'A': 'Anniversary',
        'E': 'Celebration',
        'G': 'General'
      };

      return {
        isValid: true,
        prefix: 'CS',
        date: new Date(year, month - 1, day),
        sequentialNumber: parseInt(sequentialNum),
        category: categoryMap[categoryCode] || 'Unknown',
        categoryCode: categoryCode
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Determine category from order items
   * @param {Array} items - Order items
   * @returns {string} Category name
   */
  static determineCategoryFromItems(items) {
    if (!items || items.length === 0) {
      return 'general';
    }

    // Check item names/descriptions for category keywords
    const itemText = items.map(item => 
      `${item.name || ''} ${item.description || ''}`.toLowerCase()
    ).join(' ');

    if (itemText.includes('birthday') || itemText.includes('bday')) {
      return 'birthday';
    }
    if (itemText.includes('wedding')) {
      return 'wedding';
    }
    if (itemText.includes('anniversary')) {
      return 'anniversary';
    }
    if (itemText.includes('custom')) {
      return 'custom';
    }
    if (itemText.includes('celebration') || itemText.includes('party')) {
      return 'celebration';
    }

    return 'general';
  }
}

module.exports = OrderIdGenerator;
