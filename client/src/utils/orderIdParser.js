/**
 * Client-side utility for parsing meaningful order IDs
 * Format: ORD-PRM-20251024-0012 or ORD-CUS-20251024-0008
 */

export class OrderIdParser {
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
   * Get type icon based on type code
   * @param {string} typeCode - The type code (PRM or CUS)
   * @returns {string} Icon emoji
   */
  static getTypeIcon(typeCode) {
    const iconMap = {
      'PRM': '🧁', // Premade
      'CUS': '🎨'  // Custom
    };
    return iconMap[typeCode] || '🧁';
  }

  /**
   * Get type color class based on type code
   * @param {string} typeCode - The type code (PRM or CUS)
   * @returns {string} Tailwind color class
   */
  static getTypeColor(typeCode) {
    const colorMap = {
      'PRM': 'bg-blue-100 text-blue-800',    // Premade
      'CUS': 'bg-purple-100 text-purple-800' // Custom
    };
    return colorMap[typeCode] || 'bg-gray-100 text-gray-800';
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
        type: 'Unknown',
        icon: '🧁',
        colorClass: 'bg-gray-100 text-gray-800'
      };
    }

    return {
      orderId: orderId,
      displayText: `${parsed.prefix}-${parsed.sequentialNumber}`,
      fullId: orderId,
      type: parsed.type,
      icon: this.getTypeIcon(parsed.typeCode),
      colorClass: this.getTypeColor(parsed.typeCode),
      date: parsed.formattedDate,
      sequentialNumber: parsed.sequentialNumber,
      tooltip: `${parsed.type} order #${parsed.sequentialNumber} from ${parsed.formattedDate}`
    };
  }
}
