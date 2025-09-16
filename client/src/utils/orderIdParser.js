/**
 * Client-side utility for parsing meaningful order IDs
 * Matches the server-side OrderIdGenerator functionality
 */

export class OrderIdParser {
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
        categoryCode: categoryCode,
        formattedDate: new Date(year, month - 1, day).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Get category icon based on category code
   * @param {string} categoryCode - The category code
   * @returns {string} Icon emoji
   */
  static getCategoryIcon(categoryCode) {
    const iconMap = {
      'B': '🎂', // Birthday
      'W': '👰', // Wedding
      'C': '🎨', // Custom
      'A': '💕', // Anniversary
      'E': '🎉', // Celebration
      'G': '🧁'  // General
    };
    return iconMap[categoryCode] || '🧁';
  }

  /**
   * Get category color class based on category code
   * @param {string} categoryCode - The category code
   * @returns {string} Tailwind color class
   */
  static getCategoryColor(categoryCode) {
    const colorMap = {
      'B': 'bg-pink-100 text-pink-800',     // Birthday
      'W': 'bg-purple-100 text-purple-800', // Wedding
      'C': 'bg-blue-100 text-blue-800',     // Custom
      'A': 'bg-red-100 text-red-800',       // Anniversary
      'E': 'bg-yellow-100 text-yellow-800', // Celebration
      'G': 'bg-gray-100 text-gray-800'      // General
    };
    return colorMap[categoryCode] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format order ID for display with additional information
   * @param {string} orderId - The order ID to format
   * @returns {object} Formatted order display info
   */
  static formatOrderIdDisplay(orderId) {
    const parsed = this.parseOrderId(orderId);
    
    if (!parsed.isValid) {
      return {
        orderId: orderId,
        displayText: orderId,
        category: 'Unknown',
        icon: '🧁',
        colorClass: 'bg-gray-100 text-gray-800'
      };
    }

    return {
      orderId: orderId,
      displayText: `${parsed.prefix}-${parsed.sequentialNumber}`,
      fullId: orderId,
      category: parsed.category,
      icon: this.getCategoryIcon(parsed.categoryCode),
      colorClass: this.getCategoryColor(parsed.categoryCode),
      date: parsed.formattedDate,
      sequentialNumber: parsed.sequentialNumber,
      tooltip: `${parsed.category} cake order #${parsed.sequentialNumber} from ${parsed.formattedDate}`
    };
  }
}
