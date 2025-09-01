/**
 * Order Workflow Manager
 * Handles the complete order lifecycle and state transitions
 */

const businessRules = require('../rules/BusinessRules');
const EventEmitter = require('../events/BusinessEventEmitter');

class OrderWorkflowManager {
  constructor() {
    this.workflows = {
      order: this.createOrderWorkflow(),
      customOrder: this.createCustomOrderWorkflow(),
      payment: this.createPaymentWorkflow()
    };
  }

  createOrderWorkflow() {
    return {
      states: {
        'pending': {
          description: 'Order placed, awaiting confirmation',
          allowedTransitions: ['confirmed', 'cancelled'],
          actions: {
            onEnter: this.onOrderPending.bind(this),
            onExit: this.onOrderPendingExit.bind(this)
          },
          validations: [
            'checkStockAvailability',
            'validateDeliveryDate',
            'validateCustomerInfo'
          ]
        },
        'confirmed': {
          description: 'Order confirmed, ready for preparation',
          allowedTransitions: ['preparing', 'cancelled'],
          actions: {
            onEnter: this.onOrderConfirmed.bind(this),
            onExit: this.onOrderConfirmedExit.bind(this)
          },
          validations: [
            'ensurePaymentInitiated'
          ]
        },
        'preparing': {
          description: 'Order being prepared',
          allowedTransitions: ['ready', 'cancelled'],
          actions: {
            onEnter: this.onOrderPreparing.bind(this),
            onExit: this.onOrderPreparingExit.bind(this)
          }
        },
        'ready': {
          description: 'Order ready for delivery/pickup',
          allowedTransitions: ['delivered'],
          actions: {
            onEnter: this.onOrderReady.bind(this),
            onExit: this.onOrderReadyExit.bind(this)
          }
        },
        'delivered': {
          description: 'Order completed and delivered',
          allowedTransitions: [],
          actions: {
            onEnter: this.onOrderDelivered.bind(this)
          },
          terminal: true
        },
        'cancelled': {
          description: 'Order cancelled',
          allowedTransitions: [],
          actions: {
            onEnter: this.onOrderCancelled.bind(this)
          },
          terminal: true
        }
      },
      initialState: 'pending'
    };
  }

  createCustomOrderWorkflow() {
    return {
      states: {
        'pending': {
          description: 'Custom order submitted, awaiting review',
          allowedTransitions: ['confirmed', 'cancelled'],
          actions: {
            onEnter: this.onCustomOrderPending.bind(this),
            onExit: this.onCustomOrderPendingExit.bind(this)
          },
          validations: [
            'validateCustomOrderRequirements',
            'checkDeliveryDateFeasibility'
          ]
        },
        'confirmed': {
          description: 'Custom order confirmed with pricing',
          allowedTransitions: ['in-progress', 'cancelled'],
          actions: {
            onEnter: this.onCustomOrderConfirmed.bind(this),
            onExit: this.onCustomOrderConfirmedExit.bind(this)
          },
          validations: [
            'ensurePricingSet',
            'checkAdvancePaymentIfRequired'
          ]
        },
        'in-progress': {
          description: 'Custom order in progress',
          allowedTransitions: ['completed', 'cancelled'],
          actions: {
            onEnter: this.onCustomOrderInProgress.bind(this),
            onExit: this.onCustomOrderInProgressExit.bind(this)
          }
        },
        'completed': {
          description: 'Custom order completed',
          allowedTransitions: [],
          actions: {
            onEnter: this.onCustomOrderCompleted.bind(this)
          },
          terminal: true
        },
        'cancelled': {
          description: 'Custom order cancelled',
          allowedTransitions: [],
          actions: {
            onEnter: this.onCustomOrderCancelled.bind(this)
          },
          terminal: true
        }
      },
      initialState: 'pending'
    };
  }

  createPaymentWorkflow() {
    return {
      states: {
        'pending': {
          description: 'Payment initiated, awaiting completion',
          allowedTransitions: ['paid', 'failed'],
          actions: {
            onEnter: this.onPaymentPending.bind(this),
            onExit: this.onPaymentPendingExit.bind(this)
          }
        },
        'paid': {
          description: 'Payment completed successfully',
          allowedTransitions: ['refunded'],
          actions: {
            onEnter: this.onPaymentPaid.bind(this),
            onExit: this.onPaymentPaidExit.bind(this)
          }
        },
        'failed': {
          description: 'Payment failed',
          allowedTransitions: ['pending'],
          actions: {
            onEnter: this.onPaymentFailed.bind(this),
            onExit: this.onPaymentFailedExit.bind(this)
          }
        },
        'refunded': {
          description: 'Payment refunded',
          allowedTransitions: [],
          actions: {
            onEnter: this.onPaymentRefunded.bind(this)
          },
          terminal: true
        }
      },
      initialState: 'pending'
    };
  }

  // Workflow transition method
  async transitionState(entity, entityType, newState, context = {}) {
    const workflow = this.workflows[entityType];
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${entityType}`);
    }

    const currentState = entity.status || entity.paymentStatus;
    const currentStateConfig = workflow.states[currentState];
    const newStateConfig = workflow.states[newState];

    if (!currentStateConfig) {
      throw new Error(`Invalid current state: ${currentState}`);
    }

    if (!newStateConfig) {
      throw new Error(`Invalid new state: ${newState}`);
    }

    // Check if transition is allowed
    if (!currentStateConfig.allowedTransitions.includes(newState)) {
      throw new Error(`Invalid transition from ${currentState} to ${newState}`);
    }

    // Validate business rules
    const canTransition = businessRules.canTransitionOrderStatus(
      currentState, 
      newState, 
      entityType === 'customOrder' ? 'custom' : 'order'
    );

    if (!canTransition) {
      throw new Error(`Business rules prevent transition from ${currentState} to ${newState}`);
    }

    // Run validations for the new state
    if (newStateConfig.validations) {
      for (const validation of newStateConfig.validations) {
        await this.runValidation(validation, entity, context);
      }
    }

    // Execute exit actions for current state
    if (currentStateConfig.actions && currentStateConfig.actions.onExit) {
      await currentStateConfig.actions.onExit(entity, context);
    }

    // Update entity state
    const stateField = entityType === 'payment' ? 'paymentStatus' : 'status';
    const oldState = entity[stateField];
    entity[stateField] = newState;

    // Execute enter actions for new state
    if (newStateConfig.actions && newStateConfig.actions.onEnter) {
      await newStateConfig.actions.onEnter(entity, context);
    }

    // Emit state transition event
    EventEmitter.emit('stateTransition', {
      entityType,
      entityId: entity._id || entity.orderId,
      oldState,
      newState,
      entity,
      context,
      timestamp: new Date()
    });

    return entity;
  }

  // Validation methods
  async runValidation(validationName, entity, context) {
    switch (validationName) {
      case 'checkStockAvailability':
        return this.validateStockAvailability(entity);
      case 'validateDeliveryDate':
        return this.validateDeliveryDate(entity);
      case 'validateCustomerInfo':
        return this.validateCustomerInfo(entity);
      case 'ensurePaymentInitiated':
        return this.validatePaymentInitiated(entity);
      case 'validateCustomOrderRequirements':
        return this.validateCustomOrderRequirements(entity);
      case 'checkDeliveryDateFeasibility':
        return this.validateCustomOrderDeliveryDate(entity);
      case 'ensurePricingSet':
        return this.validatePricingSet(entity);
      case 'checkAdvancePaymentIfRequired':
        return this.validateAdvancePayment(entity);
      default:
        throw new Error(`Unknown validation: ${validationName}`);
    }
  }

  validateStockAvailability(order) {
    for (const item of order.items) {
      if (!businessRules.validateRule('order.stockAvailability', item.product, item.quantity)) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
    }
    return true;
  }

  validateDeliveryDate(order) {
    try {
      businessRules.validateRule('order.minimumAdvanceNotice', order.deliveryDate);
      return true;
    } catch (error) {
      throw new Error(`Delivery date validation failed: ${error.message}`);
    }
  }

  validateCustomerInfo(order) {
    try {
      businessRules.validateRule('customer.validation', order.customerInfo);
      return true;
    } catch (error) {
      throw new Error(`Customer info validation failed: ${error.message}`);
    }
  }

  validatePaymentInitiated(order) {
    if (order.paymentMethod === 'online_transfer' && order.paymentStatus === 'pending') {
      // For online payments, ensure payment has been initiated
      return true;
    }
    if (order.paymentMethod === 'cash_on_delivery') {
      // COD orders don't need payment initiation
      return true;
    }
    throw new Error('Payment must be initiated before confirming order');
  }

  validateCustomOrderRequirements(customOrder) {
    try {
      businessRules.validateRule('customOrder.minimumAdvanceNotice', customOrder.deliveryDate);
      return true;
    } catch (error) {
      throw new Error(`Custom order requirements validation failed: ${error.message}`);
    }
  }

  validateCustomOrderDeliveryDate(customOrder) {
    const deliveryDate = new Date(customOrder.deliveryDate);
    const today = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 6); // 6 months max

    if (deliveryDate > maxFutureDate) {
      throw new Error('Delivery date cannot be more than 6 months in the future');
    }
    return true;
  }

  validatePricingSet(customOrder) {
    if (!customOrder.estimatedPrice || customOrder.estimatedPrice <= 0) {
      throw new Error('Estimated price must be set before confirming custom order');
    }
    return true;
  }

  validateAdvancePayment(customOrder) {
    const advanceInfo = businessRules.calculateAdvancePayment(customOrder);
    
    if (advanceInfo.required) {
      if (customOrder.advanceAmount <= 0) {
        throw new Error('Advance payment amount must be set for this custom order');
      }
      if (customOrder.advancePaymentStatus !== 'paid' && customOrder.advancePaymentStatus !== 'pending') {
        throw new Error('Advance payment must be processed before confirming custom order');
      }
    }
    return true;
  }

  // State action methods for regular orders
  async onOrderPending(order, context) {
    console.log(`Order ${order.orderId} entered pending state`);
    
    // Reserve stock for the order items
    if (order.items) {
      for (const item of order.items) {
        // In a real system, you might want to implement stock reservation
        console.log(`Reserving ${item.quantity} units of ${item.name}`);
      }
    }

    EventEmitter.emit('orderPending', { order, context });
  }

  async onOrderPendingExit(order, context) {
    console.log(`Order ${order.orderId} exiting pending state`);
  }

  async onOrderConfirmed(order, context) {
    console.log(`Order ${order.orderId} confirmed`);
    
    // Update stock quantities
    const Product = require('../../models/Product');
    if (order.items) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: -item.quantity, soldCount: item.quantity }
        });
      }
    }

    EventEmitter.emit('orderConfirmed', { order, context });
  }

  async onOrderConfirmedExit(order, context) {
    console.log(`Order ${order.orderId} exiting confirmed state`);
  }

  async onOrderPreparing(order, context) {
    console.log(`Order ${order.orderId} preparation started`);
    EventEmitter.emit('orderPreparing', { order, context });
  }

  async onOrderPreparingExit(order, context) {
    console.log(`Order ${order.orderId} preparation completed`);
  }

  async onOrderReady(order, context) {
    console.log(`Order ${order.orderId} is ready for delivery`);
    EventEmitter.emit('orderReady', { order, context });
  }

  async onOrderReadyExit(order, context) {
    console.log(`Order ${order.orderId} out for delivery`);
  }

  async onOrderDelivered(order, context) {
    console.log(`Order ${order.orderId} delivered successfully`);
    EventEmitter.emit('orderDelivered', { order, context });
  }

  async onOrderCancelled(order, context) {
    console.log(`Order ${order.orderId} cancelled`);
    
    // Restore stock quantities if order was confirmed
    const Product = require('../../models/Product');
    if (order.items && (order.status === 'confirmed' || order.status === 'preparing')) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity, soldCount: -item.quantity }
        });
      }
    }

    EventEmitter.emit('orderCancelled', { order, context });
  }

  // State action methods for custom orders
  async onCustomOrderPending(customOrder, context) {
    console.log(`Custom order ${customOrder.orderId} submitted`);
    EventEmitter.emit('customOrderPending', { customOrder, context });
  }

  async onCustomOrderPendingExit(customOrder, context) {
    console.log(`Custom order ${customOrder.orderId} exiting pending state`);
  }

  async onCustomOrderConfirmed(customOrder, context) {
    console.log(`Custom order ${customOrder.orderId} confirmed with pricing`);
    
    // Calculate and set advance payment if required
    const advanceInfo = businessRules.calculateAdvancePayment(customOrder);
    if (advanceInfo.required && customOrder.advanceAmount === 0) {
      customOrder.advanceAmount = advanceInfo.amount;
      customOrder.advancePaymentStatus = 'pending';
    }

    EventEmitter.emit('customOrderConfirmed', { customOrder, context });
  }

  async onCustomOrderConfirmedExit(customOrder, context) {
    console.log(`Custom order ${customOrder.orderId} exiting confirmed state`);
  }

  async onCustomOrderInProgress(customOrder, context) {
    console.log(`Custom order ${customOrder.orderId} work started`);
    EventEmitter.emit('customOrderInProgress', { customOrder, context });
  }

  async onCustomOrderInProgressExit(customOrder, context) {
    console.log(`Custom order ${customOrder.orderId} work completed`);
  }

  async onCustomOrderCompleted(customOrder, context) {
    console.log(`Custom order ${customOrder.orderId} completed`);
    EventEmitter.emit('customOrderCompleted', { customOrder, context });
  }

  async onCustomOrderCancelled(customOrder, context) {
    console.log(`Custom order ${customOrder.orderId} cancelled`);
    
    // Handle advance payment refund if applicable
    if (customOrder.advancePaymentStatus === 'paid') {
      console.log(`Initiating refund for advance payment of order ${customOrder.orderId}`);
      // In a real system, trigger refund process
    }

    EventEmitter.emit('customOrderCancelled', { customOrder, context });
  }

  // State action methods for payments
  async onPaymentPending(payment, context) {
    console.log(`Payment ${payment.orderId} initiated`);
    EventEmitter.emit('paymentPending', { payment, context });
  }

  async onPaymentPendingExit(payment, context) {
    console.log(`Payment ${payment.orderId} exiting pending state`);
  }

  async onPaymentPaid(payment, context) {
    console.log(`Payment ${payment.orderId} completed successfully`);
    EventEmitter.emit('paymentPaid', { payment, context });
  }

  async onPaymentPaidExit(payment, context) {
    console.log(`Payment ${payment.orderId} exiting paid state`);
  }

  async onPaymentFailed(payment, context) {
    console.log(`Payment ${payment.orderId} failed`);
    EventEmitter.emit('paymentFailed', { payment, context });
  }

  async onPaymentFailedExit(payment, context) {
    console.log(`Payment ${payment.orderId} exiting failed state`);
  }

  async onPaymentRefunded(payment, context) {
    console.log(`Payment ${payment.orderId} refunded`);
    EventEmitter.emit('paymentRefunded', { payment, context });
  }

  // Utility methods
  getWorkflowStates(workflowType) {
    const workflow = this.workflows[workflowType];
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }
    
    return Object.entries(workflow.states).map(([state, config]) => ({
      state,
      description: config.description,
      allowedTransitions: config.allowedTransitions,
      terminal: config.terminal || false
    }));
  }

  canTransition(entity, entityType, newState) {
    try {
      const workflow = this.workflows[entityType];
      if (!workflow) return false;

      const currentState = entity.status || entity.paymentStatus;
      const currentStateConfig = workflow.states[currentState];
      
      if (!currentStateConfig) return false;
      
      return currentStateConfig.allowedTransitions.includes(newState);
    } catch (error) {
      return false;
    }
  }

  getNextPossibleStates(entity, entityType) {
    const workflow = this.workflows[entityType];
    if (!workflow) return [];

    const currentState = entity.status || entity.paymentStatus;
    const currentStateConfig = workflow.states[currentState];
    
    if (!currentStateConfig) return [];
    
    return currentStateConfig.allowedTransitions.map(state => ({
      state,
      description: workflow.states[state].description
    }));
  }
}

// Singleton instance
const workflowManager = new OrderWorkflowManager();

module.exports = workflowManager;
