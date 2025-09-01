/**
 * Business Logic Facade
 * Centralized access point for all business logic components
 * This file provides a unified interface to the business layer
 */

const BusinessRules = require('./rules/BusinessRules');
const DataValidators = require('./validators/DataValidators');
const OrderWorkflowManager = require('./workflows/OrderWorkflowManager');
const BusinessEventEmitter = require('./events/BusinessEventEmitter');
// Lazy load OrderService to avoid MongoDB connection on import
let OrderService = null;

// Business Logic Facade Class
class BusinessLogicFacade {
  constructor() {
    this.rules = BusinessRules;
    this.validators = DataValidators;
    this.workflows = OrderWorkflowManager;
    this.events = BusinessEventEmitter;
    this._orderService = null;
  }

  // Lazy getter for OrderService
  get orders() {
    if (!this._orderService) {
      if (!OrderService) {
        OrderService = require('./services/OrderService');
      }
      this._orderService = OrderService;
    }
    return this._orderService;
  }

  // Quick access methods for common operations
  
  // Validation
  validateOrder(orderData) {
    return this.validators.formatValidationResult(
      this.validators.validateOrder(orderData)
    );
  }

  validateCustomOrder(customOrderData) {
    return this.validators.formatValidationResult(
      this.validators.validateCustomOrder(customOrderData)
    );
  }

  validateProduct(productData) {
    return this.validators.formatValidationResult(
      this.validators.validateProduct(productData)
    );
  }

  // Business Rules
  canPlaceOrder(orderData) {
    return this.rules.canPlaceOrder(orderData);
  }

  canPlaceCustomOrder(customOrderData) {
    return this.rules.canPlaceCustomOrder(customOrderData);
  }

  calculateOrderTotals(items, subtotal) {
    return this.rules.calculateOrderTotals(items, subtotal);
  }

  calculateAdvancePayment(customOrder) {
    return this.rules.calculateAdvancePayment(customOrder);
  }

  // Workflow Management
  async transitionOrderStatus(order, newStatus, context = {}) {
    return await this.workflows.transitionState(order, 'order', newStatus, context);
  }

  async transitionCustomOrderStatus(customOrder, newStatus, context = {}) {
    return await this.workflows.transitionState(customOrder, 'customOrder', newStatus, context);
  }

  getNextPossibleStates(entity, entityType) {
    return this.workflows.getNextPossibleStates(entity, entityType);
  }

  // Order Operations
  async createOrder(orderData) {
    return await this.orders.createOrder(orderData);
  }

  async createCustomOrder(customOrderData) {
    return await this.orders.createCustomOrder(customOrderData);
  }

  async updateOrderStatus(orderId, newStatus, context = {}) {
    return await this.orders.updateOrderStatus(orderId, newStatus, context);
  }

  async updateCustomOrderStatus(orderId, newStatus, updateData = {}) {
    return await this.orders.updateCustomOrderStatus(orderId, newStatus, updateData);
  }

  async cancelOrder(orderId, reason, cancelledBy) {
    return await this.orders.cancelOrder(orderId, reason, cancelledBy);
  }

  async cancelCustomOrder(orderId, reason, cancelledBy) {
    return await this.orders.cancelCustomOrder(orderId, reason, cancelledBy);
  }

  // Analytics and Insights
  async getOrderAnalytics(filters = {}) {
    return await this.orders.getOrderAnalytics(filters);
  }

  async getBusinessInsights(period = '30d') {
    return await this.orders.getBusinessInsights(period);
  }

  async getCustomerOrderHistory(customerEmail) {
    return await this.orders.getCustomerOrderHistory(customerEmail);
  }

  // Event Management
  emitBusinessEvent(eventName, eventData) {
    this.events.emit(eventName, eventData);
  }

  getEventHistory(filter = {}) {
    return this.events.getEventHistory(filter);
  }

  getEventStats() {
    return this.events.getEventStats();
  }

  // Utility Methods
  getAllBusinessRules() {
    return this.rules.getAllRules();
  }

  getWorkflowStates(workflowType) {
    return this.workflows.getWorkflowStates(workflowType);
  }

  // Health Check
  getHealthStatus() {
    return {
      businessLogic: 'operational',
      components: {
        rulesEngine: this.rules ? '✅ Active' : '❌ Inactive',
        validators: this.validators ? '✅ Active' : '❌ Inactive',
        workflowManager: this.workflows ? '✅ Active' : '❌ Inactive',
        eventEmitter: this.events ? '✅ Active' : '❌ Inactive',
        orderService: this._orderService ? '✅ Active' : '⏳ Lazy-loaded'
      },
      stats: {
        totalRules: this.rules.getAllRules().length,
        eventHistory: this.events.getEventHistory().length,
        workflowTypes: Object.keys(this.workflows.workflows).length
      },
      timestamp: new Date()
    };
  }
}

// Create singleton instance
const businessLogicFacade = new BusinessLogicFacade();

module.exports = {
  // Main facade (renamed for clarity)
  BusinessLogic: businessLogicFacade,
  BusinessLogicFacade: businessLogicFacade,
  
  // Individual components (for direct access if needed)
  BusinessRules,
  DataValidators,
  OrderWorkflowManager,
  BusinessEventEmitter,
  // OrderService is lazy-loaded
  get OrderService() {
    if (!OrderService) {
      OrderService = require('./services/OrderService');
    }
    return OrderService;
  },
  
  // Default export is the main facade
  default: businessLogicFacade
};
