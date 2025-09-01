/**
 * Business Event Emitter
 * Handles business events and triggers across the application
 */

const EventEmitter = require('events');

class BusinessEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Order Events
    this.on('orderPending', this.handleOrderPending.bind(this));
    this.on('orderConfirmed', this.handleOrderConfirmed.bind(this));
    this.on('orderPreparing', this.handleOrderPreparing.bind(this));
    this.on('orderReady', this.handleOrderReady.bind(this));
    this.on('orderDelivered', this.handleOrderDelivered.bind(this));
    this.on('orderCancelled', this.handleOrderCancelled.bind(this));

    // Custom Order Events
    this.on('customOrderPending', this.handleCustomOrderPending.bind(this));
    this.on('customOrderConfirmed', this.handleCustomOrderConfirmed.bind(this));
    this.on('customOrderInProgress', this.handleCustomOrderInProgress.bind(this));
    this.on('customOrderCompleted', this.handleCustomOrderCompleted.bind(this));
    this.on('customOrderCancelled', this.handleCustomOrderCancelled.bind(this));

    // Payment Events
    this.on('paymentPending', this.handlePaymentPending.bind(this));
    this.on('paymentPaid', this.handlePaymentPaid.bind(this));
    this.on('paymentFailed', this.handlePaymentFailed.bind(this));
    this.on('paymentRefunded', this.handlePaymentRefunded.bind(this));

    // Stock Events
    this.on('stockLow', this.handleStockLow.bind(this));
    this.on('stockOut', this.handleStockOut.bind(this));
    this.on('stockRestored', this.handleStockRestored.bind(this));

    // Customer Events
    this.on('customerRegistered', this.handleCustomerRegistered.bind(this));
    this.on('customerContact', this.handleCustomerContact.bind(this));

    // State Transition Events
    this.on('stateTransition', this.handleStateTransition.bind(this));

    // Error Events
    this.on('businessError', this.handleBusinessError.bind(this));
  }

  // Override emit to add logging and history
  emit(eventName, eventData = {}) {
    const event = {
      name: eventName,
      data: eventData,
      timestamp: new Date(),
      id: this.generateEventId()
    };

    // Add to history
    this.addToHistory(event);

    // Log event
    console.log(`[BusinessEvent] ${eventName}:`, {
      id: event.id,
      timestamp: event.timestamp,
      data: this.sanitizeEventData(eventData)
    });

    // Call parent emit
    return super.emit(eventName, eventData);
  }

  addToHistory(event) {
    this.eventHistory.push(event);
    
    // Maintain history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeEventData(data) {
    // Remove sensitive information from logs
    const sanitized = { ...data };
    
    if (sanitized.order && sanitized.order.customerInfo) {
      delete sanitized.order.customerInfo.phone;
      delete sanitized.order.customerInfo.address;
    }
    
    if (sanitized.customOrder) {
      delete sanitized.customOrder.customerPhone;
    }
    
    if (sanitized.payment) {
      delete sanitized.payment.paymentDetails;
    }
    
    return sanitized;
  }

  // Order Event Handlers
  async handleOrderPending({ order, context }) {
    console.log(`Order ${order.orderId} is pending confirmation`);
    
    // Send order confirmation email to customer
    this.emit('sendEmail', {
      type: 'orderPending',
      to: order.customerInfo.email,
      data: { order }
    });

    // Notify admin about new order
    this.emit('adminNotification', {
      type: 'newOrder',
      message: `New order ${order.orderId} received`,
      data: { orderId: order.orderId }
    });
  }

  async handleOrderConfirmed({ order, context }) {
    console.log(`Order ${order.orderId} confirmed`);
    
    // Send confirmation email
    this.emit('sendEmail', {
      type: 'orderConfirmed',
      to: order.customerInfo.email,
      data: { order }
    });

    // Check and emit stock events if needed
    if (order.items) {
      for (const item of order.items) {
        await this.checkAndEmitStockEvents(item.product, -item.quantity);
      }
    }
  }

  async handleOrderPreparing({ order, context }) {
    console.log(`Order ${order.orderId} preparation started`);
    
    // Send preparation notification
    this.emit('sendEmail', {
      type: 'orderPreparing',
      to: order.customerInfo.email,
      data: { order }
    });
  }

  async handleOrderReady({ order, context }) {
    console.log(`Order ${order.orderId} is ready`);
    
    // Send ready notification
    this.emit('sendEmail', {
      type: 'orderReady',
      to: order.customerInfo.email,
      data: { order }
    });

    // Schedule delivery reminder
    this.emit('scheduleNotification', {
      type: 'deliveryReminder',
      scheduledFor: order.deliveryDate,
      data: { orderId: order.orderId }
    });
  }

  async handleOrderDelivered({ order, context }) {
    console.log(`Order ${order.orderId} delivered`);
    
    // Send thank you email
    this.emit('sendEmail', {
      type: 'orderDelivered',
      to: order.customerInfo.email,
      data: { order }
    });

    // Request feedback
    this.emit('scheduleNotification', {
      type: 'requestFeedback',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours later
      data: { orderId: order.orderId }
    });
  }

  async handleOrderCancelled({ order, context }) {
    console.log(`Order ${order.orderId} cancelled`);
    
    // Send cancellation email
    this.emit('sendEmail', {
      type: 'orderCancelled',
      to: order.customerInfo.email,
      data: { order, reason: context.reason }
    });

    // Restore stock if order was confirmed
    if (order.items && (order.status === 'confirmed' || order.status === 'preparing')) {
      for (const item of order.items) {
        await this.checkAndEmitStockEvents(item.product, item.quantity);
      }
    }

    // Handle refund if payment was made
    if (order.paymentStatus === 'paid') {
      this.emit('processRefund', {
        orderId: order.orderId,
        amount: order.totalAmount,
        reason: 'Order cancellation'
      });
    }
  }

  // Custom Order Event Handlers
  async handleCustomOrderPending({ customOrder, context }) {
    console.log(`Custom order ${customOrder.orderId} submitted`);
    
    // Send submission confirmation
    this.emit('sendEmail', {
      type: 'customOrderPending',
      to: customOrder.customerEmail,
      data: { customOrder }
    });

    // Notify admin
    this.emit('adminNotification', {
      type: 'newCustomOrder',
      message: `New custom order ${customOrder.orderId} received`,
      data: { orderId: customOrder.orderId }
    });
  }

  async handleCustomOrderConfirmed({ customOrder, context }) {
    console.log(`Custom order ${customOrder.orderId} confirmed with pricing`);
    
    // Send pricing confirmation
    this.emit('sendEmail', {
      type: 'customOrderConfirmed',
      to: customOrder.customerEmail,
      data: { customOrder }
    });

    // If advance payment required, send payment request
    if (customOrder.advanceAmount > 0) {
      this.emit('sendAdvancePaymentRequest', {
        customOrder
      });
    }
  }

  async handleCustomOrderInProgress({ customOrder, context }) {
    console.log(`Custom order ${customOrder.orderId} work started`);
    
    // Send progress update
    this.emit('sendEmail', {
      type: 'customOrderInProgress',
      to: customOrder.customerEmail,
      data: { customOrder }
    });
  }

  async handleCustomOrderCompleted({ customOrder, context }) {
    console.log(`Custom order ${customOrder.orderId} completed`);
    
    // Send completion notification
    this.emit('sendEmail', {
      type: 'customOrderCompleted',
      to: customOrder.customerEmail,
      data: { customOrder }
    });
  }

  async handleCustomOrderCancelled({ customOrder, context }) {
    console.log(`Custom order ${customOrder.orderId} cancelled`);
    
    // Send cancellation email
    this.emit('sendEmail', {
      type: 'customOrderCancelled',
      to: customOrder.customerEmail,
      data: { customOrder, reason: context.reason }
    });

    // Handle advance payment refund
    if (customOrder.advancePaymentStatus === 'paid') {
      this.emit('processRefund', {
        orderId: customOrder.orderId,
        amount: customOrder.advanceAmount,
        reason: 'Custom order cancellation'
      });
    }
  }

  // Payment Event Handlers
  async handlePaymentPending({ payment, context }) {
    console.log(`Payment for ${payment.orderId} initiated`);
    
    // Log payment attempt for audit
    this.emit('auditLog', {
      action: 'payment_initiated',
      entityId: payment.orderId,
      data: { amount: payment.amount }
    });
  }

  async handlePaymentPaid({ payment, context }) {
    console.log(`Payment for ${payment.orderId} completed`);
    
    // Send payment confirmation
    this.emit('sendEmail', {
      type: 'paymentPaid',
      to: payment.customerEmail,
      data: { payment }
    });

    // Update related order status
    this.emit('updateOrderAfterPayment', {
      orderId: payment.orderId,
      paymentStatus: 'paid'
    });

    // Log successful payment
    this.emit('auditLog', {
      action: 'payment_completed',
      entityId: payment.orderId,
      data: { amount: payment.amount, transactionId: payment.transactionId }
    });
  }

  async handlePaymentFailed({ payment, context }) {
    console.log(`Payment for ${payment.orderId} failed`);
    
    // Send payment failure notification
    this.emit('sendEmail', {
      type: 'paymentFailed',
      to: payment.customerEmail,
      data: { payment, reason: context.reason }
    });

    // Log failed payment
    this.emit('auditLog', {
      action: 'payment_failed',
      entityId: payment.orderId,
      data: { amount: payment.amount, reason: context.reason }
    });
  }

  async handlePaymentRefunded({ payment, context }) {
    console.log(`Payment for ${payment.orderId} refunded`);
    
    // Send refund confirmation
    this.emit('sendEmail', {
      type: 'paymentRefunded',
      to: payment.customerEmail,
      data: { payment }
    });

    // Log refund
    this.emit('auditLog', {
      action: 'payment_refunded',
      entityId: payment.orderId,
      data: { amount: payment.amount }
    });
  }

  // Stock Event Handlers
  async handleStockLow({ product, currentStock, threshold }) {
    console.log(`Low stock alert for ${product.name}: ${currentStock} remaining`);
    
    // Notify admin
    this.emit('adminNotification', {
      type: 'lowStock',
      message: `Low stock alert for ${product.name}`,
      data: { productId: product._id, currentStock, threshold }
    });

    // Log stock event
    this.emit('auditLog', {
      action: 'stock_low',
      entityId: product._id,
      data: { currentStock, threshold }
    });
  }

  async handleStockOut({ product }) {
    console.log(`Out of stock: ${product.name}`);
    
    // Notify admin urgently
    this.emit('adminNotification', {
      type: 'stockOut',
      urgent: true,
      message: `${product.name} is out of stock`,
      data: { productId: product._id }
    });

    // Disable product temporarily
    this.emit('disableProduct', {
      productId: product._id,
      reason: 'Out of stock'
    });
  }

  async handleStockRestored({ product, newStock }) {
    console.log(`Stock restored for ${product.name}: ${newStock} units`);
    
    // Re-enable product if it was disabled
    this.emit('enableProduct', {
      productId: product._id,
      reason: 'Stock restored'
    });
  }

  // Customer Event Handlers
  async handleCustomerRegistered({ customer }) {
    console.log(`New customer registered: ${customer.email}`);
    
    // Send welcome email
    this.emit('sendEmail', {
      type: 'welcome',
      to: customer.email,
      data: { customer }
    });
  }

  async handleCustomerContact({ contact }) {
    console.log(`New contact message from ${contact.customerEmail}`);
    
    // Send acknowledgment
    this.emit('sendEmail', {
      type: 'contactAcknowledgment',
      to: contact.customerEmail,
      data: { contact }
    });

    // Notify admin
    this.emit('adminNotification', {
      type: 'newContact',
      message: `New contact message: ${contact.subject}`,
      data: { contactId: contact._id }
    });
  }

  // State Transition Handler
  async handleStateTransition({ entityType, entityId, oldState, newState, entity, context }) {
    console.log(`State transition: ${entityType} ${entityId} from ${oldState} to ${newState}`);
    
    // Log state transition
    this.emit('auditLog', {
      action: 'state_transition',
      entityType,
      entityId,
      data: { oldState, newState, context }
    });
  }

  // Error Handler
  async handleBusinessError({ error, context }) {
    console.error(`Business error:`, error);
    
    // Log error
    this.emit('auditLog', {
      action: 'business_error',
      data: { error: error.message, context }
    });

    // Notify admin if critical
    if (context && context.critical) {
      this.emit('adminNotification', {
        type: 'criticalError',
        urgent: true,
        message: `Critical error: ${error.message}`,
        data: { error: error.message, context }
      });
    }
  }

  // Helper Methods
  async checkAndEmitStockEvents(productId, quantityChange) {
    try {
      const Product = require('../../models/Product');
      const product = await Product.findById(productId);
      
      if (!product) return;

      const newStock = product.stockQuantity + quantityChange;
      
      if (quantityChange < 0) { // Stock reduced
        if (newStock <= 0) {
          this.emit('stockOut', { product: { ...product.toObject(), stockQuantity: newStock } });
        } else if (newStock <= product.lowStockThreshold) {
          this.emit('stockLow', { 
            product: { ...product.toObject(), stockQuantity: newStock },
            currentStock: newStock,
            threshold: product.lowStockThreshold
          });
        }
      } else { // Stock increased
        if (product.stockQuantity <= 0 && newStock > 0) {
          this.emit('stockRestored', { 
            product: { ...product.toObject(), stockQuantity: newStock },
            newStock
          });
        }
      }
    } catch (error) {
      console.error('Error checking stock events:', error);
    }
  }

  // Event History Methods
  getEventHistory(filter = {}) {
    let history = this.eventHistory;
    
    if (filter.eventName) {
      history = history.filter(event => event.name === filter.eventName);
    }
    
    if (filter.since) {
      const since = new Date(filter.since);
      history = history.filter(event => event.timestamp >= since);
    }
    
    if (filter.limit) {
      history = history.slice(-filter.limit);
    }
    
    return history;
  }

  getEventStats() {
    const stats = {};
    
    this.eventHistory.forEach(event => {
      stats[event.name] = (stats[event.name] || 0) + 1;
    });
    
    return {
      totalEvents: this.eventHistory.length,
      eventTypes: Object.keys(stats).length,
      eventCounts: stats,
      oldestEvent: this.eventHistory[0]?.timestamp,
      newestEvent: this.eventHistory[this.eventHistory.length - 1]?.timestamp
    };
  }

  clearEventHistory() {
    this.eventHistory = [];
  }
}

// Singleton instance
const businessEventEmitter = new BusinessEventEmitter();

module.exports = businessEventEmitter;
