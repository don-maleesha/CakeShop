/**
 * Order Service - Business Logic Layer
 * Centralizes all order-related business operations
 */

const businessRules = require('../rules/BusinessRules');
const DataValidators = require('../validators/DataValidators');
const WorkflowManager = require('../workflows/OrderWorkflowManager');
const EventEmitter = require('../events/BusinessEventEmitter');

const Order = require('../../models/Order');
const CustomOrder = require('../../models/CustomOrder');
const Product = require('../../models/Product');

class OrderService {
  
  // Regular Order Operations
  async createOrder(orderData) {
    try {
      console.log('OrderService: Creating new order');
      
      // 1. Validate input data
      const validationErrors = DataValidators.validateOrder(orderData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // 2. Check business rules
      const canPlace = businessRules.canPlaceOrder(orderData);
      if (!canPlace.canPlace) {
        throw new Error(`Business rules violation: ${canPlace.errors.join(', ')}`);
      }

      // 3. Validate and process items (includes stock validation with real product objects)
      const processedItems = await this.processOrderItems(orderData.items);
      
      // 4. Calculate totals with delivery options
      const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      // Extract delivery options from order data
      const deliveryOptions = {
        city: orderData.customerInfo?.address?.city,
        isExpress: orderData.isExpress || false,
        timeSlot: orderData.timeSlot || 'afternoon',
        customerTier: orderData.customerTier || 'regular'
      };
      
      const totals = businessRules.calculateOrderTotals(processedItems, subtotal, deliveryOptions);
      const deliveryInfo = businessRules.calculateDeliveryFee(subtotal, deliveryOptions.city, deliveryOptions);

      // Debug: Check for delivery fee consistency
      console.log('=== DELIVERY FEE CONSISTENCY CHECK ===');
      console.log('Totals.deliveryFee:', totals.deliveryFee);
      console.log('DeliveryInfo.fee:', deliveryInfo.fee);
      console.log('Delivery fee match:', totals.deliveryFee === deliveryInfo.fee);
      
      // Use the deliveryFee from totals to ensure consistency
      const finalDeliveryFee = totals.deliveryFee;
      
      // Get delivery options and resolve time slot name
      const deliveryOptionsConfig = businessRules.getDeliveryOptions();
      const timeSlotName = deliveryOptionsConfig.timeSlots[deliveryOptions.timeSlot]?.name || 'Standard Time';
      
      // Debug: Log time slot resolution
      console.log('=== TIME SLOT RESOLUTION ===');
      console.log('Selected timeSlot:', deliveryOptions.timeSlot);
      console.log('Available timeSlots:', Object.keys(deliveryOptionsConfig.timeSlots));
      console.log('Resolved timeSlotName:', timeSlotName);

      // 5. Create order entity with enhanced delivery information
      const orderData_final = {
        customerInfo: orderData.customerInfo,
        items: processedItems,
        pricing: {
          subtotal: totals.subtotal,
          deliveryFee: totals.deliveryFee,
          totalAmount: totals.total
        },
        delivery: {
          fee: deliveryInfo.fee,
          zone: deliveryInfo.zone,
          zoneName: deliveryInfo.zoneName,
          isFree: deliveryInfo.isFree,
          reason: deliveryInfo.reason,
          isExpress: deliveryOptions.isExpress,
          timeSlot: deliveryOptions.timeSlot,
          timeSlotName: businessRules.getDeliveryOptions().timeSlots[deliveryOptions.timeSlot]?.name || 'Standard'
        },
        totalAmount: totals.total,
        deliveryDate: orderData.deliveryDate,
        specialInstructions: orderData.specialInstructions,
        paymentMethod: orderData.paymentMethod
      };
      const order = new Order({
        orderId: 'ORD' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase(),
        customerInfo: {
          name: orderData.customerInfo.name.trim(),
          email: orderData.customerInfo.email.trim().toLowerCase(),
          phone: orderData.customerInfo.phone.trim(),
          address: orderData.customerInfo.address
        },
        items: processedItems,
        pricing: {
          subtotal: totals.subtotal,
          deliveryFee: totals.deliveryFee,
          totalAmount: totals.total
        },
        delivery: {
          fee: deliveryInfo.fee,
          zone: deliveryInfo.zone,
          zoneName: deliveryInfo.zoneName,
          isFree: deliveryInfo.isFree,
          reason: deliveryInfo.reason,
          isExpress: deliveryOptions.isExpress,
          timeSlot: deliveryOptions.timeSlot,
          timeSlotName: timeSlotName
        },
        totalAmount: totals.total,
        deliveryDate: new Date(orderData.deliveryDate),
        deliveryTime: timeSlotName, // Add for easier access and backward compatibility
        specialInstructions: orderData.specialInstructions?.trim() || '',
        paymentMethod: orderData.paymentMethod || 'cash_on_delivery'
      });

      // Debug: Log the totals being used
      console.log('=== ORDER SERVICE TOTALS ===');
      console.log('Calculated totals:', totals);
      console.log('DeliveryInfo fee:', deliveryInfo.fee);
      console.log('Order totalAmount:', totals.total);
      console.log('Order pricing:', {
        subtotal: totals.subtotal,
        deliveryFee: finalDeliveryFee,
        totalAmount: totals.total
      });

      // 6. Validate cross-field consistency
      const consistencyErrors = DataValidators.validateOrderConsistency(order.toObject());
      if (consistencyErrors.length > 0) {
        throw new Error(`Consistency validation failed: ${consistencyErrors.join(', ')}`);
      }

      // 7. Save order and reduce stock in transaction-like manner
      await order.save();

      try {
        // 8. Reduce stock quantities for ordered items
        console.log('OrderService: Reducing stock quantities for ordered items');
        for (const processedItem of processedItems) {
          await Product.findByIdAndUpdate(
            processedItem.product,
            { 
              $inc: { 
                stockQuantity: -processedItem.quantity,
                soldCount: processedItem.quantity 
              }
            }
          );
          console.log(`Stock reduced for ${processedItem.name}: -${processedItem.quantity}`);
        }

        // 9. Execute workflow transition to initial state (only if not already in that state)
        if (order.status !== 'pending') {
          await WorkflowManager.transitionState(order, 'order', 'pending', {
            action: 'orderCreated',
            user: orderData.createdBy || 'customer'
          });
        }
      } catch (stockError) {
        console.error('OrderService: Error during stock reduction, rolling back order:', stockError);
        // If stock reduction fails, delete the order to maintain consistency
        await Order.findByIdAndDelete(order._id);
        throw new Error(`Failed to process order: ${stockError.message}`);
      }

      // 10. Populate order for response
      const populatedOrder = await Order.findById(order._id).populate('items.product', 'name images category');

      console.log(`OrderService: Order ${order.orderId} created successfully`);
      return {
        success: true,
        order: populatedOrder,
        totals: {
          subtotal: subtotal,
          deliveryFee: totals.deliveryFee,
          total: totals.total,
          freeDelivery: totals.freeDelivery
        }
      };

    } catch (error) {
      console.error('OrderService: Error creating order:', error);
      EventEmitter.emit('businessError', { 
        error, 
        context: { operation: 'createOrder', data: orderData } 
      });
      throw error;
    }
  }

  async processOrderItems(items) {
    const processedItems = [];

    console.log('OrderService: Processing', items.length, 'items');

    for (const item of items) {
      const productId = item.productId || item.product;
      const quantity = parseInt(item.quantity);

      console.log(`Processing item: ProductID=${productId}, Quantity=${quantity}`);

      // Fetch product details
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        throw new Error(`Product not found or unavailable: ${productId}`);
      }

      console.log(`Product found: ${product.name}, Stock=${product.stockQuantity}, Active=${product.isActive}`);

      // Check stock availability
      if (!businessRules.validateRule('order.stockAvailability', product, quantity)) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${quantity}`);
      }

      // Calculate item subtotal
      const price = product.discountPrice || product.price;
      const subtotal = price * quantity;

      processedItems.push({
        product: productId,
        name: product.name,
        price: price,
        quantity: quantity,
        subtotal: subtotal
      });
    }

    return processedItems;
  }

  async updateOrderStatus(orderId, newStatus, context = {}) {
    try {
      console.log(`OrderService: Updating order ${orderId} status to ${newStatus}`);

      const order = await Order.findOne({ orderId });
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if transition is allowed
      if (!WorkflowManager.canTransition(order, 'order', newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      }

      // Execute workflow transition
      await WorkflowManager.transitionState(order, 'order', newStatus, context);
      
      // Save updated order
      await order.save();

      console.log(`OrderService: Order ${orderId} status updated to ${newStatus}`);
      return { success: true, order };

    } catch (error) {
      console.error(`OrderService: Error updating order status:`, error);
      EventEmitter.emit('businessError', { 
        error, 
        context: { operation: 'updateOrderStatus', orderId, newStatus } 
      });
      throw error;
    }
  }

  async cancelOrder(orderId, reason, cancelledBy) {
    try {
      console.log(`OrderService: Cancelling order ${orderId}`);

      const order = await Order.findOne({ orderId });
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order can be cancelled
      if (['delivered', 'cancelled'].includes(order.status)) {
        throw new Error(`Cannot cancel order in ${order.status} status`);
      }

      // Execute cancellation workflow
      await WorkflowManager.transitionState(order, 'order', 'cancelled', {
        reason,
        cancelledBy,
        cancelledAt: new Date()
      });

      // Save updated order
      order.notes = `Cancelled by ${cancelledBy}: ${reason}`;
      await order.save();

      console.log(`OrderService: Order ${orderId} cancelled successfully`);
      return { success: true, order };

    } catch (error) {
      console.error(`OrderService: Error cancelling order:`, error);
      EventEmitter.emit('businessError', { 
        error, 
        context: { operation: 'cancelOrder', orderId, reason } 
      });
      throw error;
    }
  }

  // Custom Order Operations
  async createCustomOrder(customOrderData) {
    try {
      console.log('OrderService: Creating new custom order');

      // 1. Validate input data
      const validationErrors = DataValidators.validateCustomOrder(customOrderData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // 2. Check business rules
      const canPlace = businessRules.canPlaceCustomOrder(customOrderData);
      if (!canPlace.canPlace) {
        throw new Error(`Business rules violation: ${canPlace.errors.join(', ')}`);
      }

      // 3. Create custom order entity
      const customOrder = new CustomOrder({
        customerName: customOrderData.customerName.trim(),
        customerEmail: customOrderData.customerEmail.trim().toLowerCase(),
        customerPhone: customOrderData.customerPhone.trim(),
        eventType: customOrderData.eventType,
        cakeSize: customOrderData.cakeSize,
        flavor: customOrderData.flavor,
        specialRequirements: customOrderData.specialRequirements?.trim() || '',
        deliveryDate: new Date(customOrderData.deliveryDate)
      });

      // 4. Save custom order
      await customOrder.save();

      // 5. Execute workflow transition to initial state
      await WorkflowManager.transitionState(customOrder, 'customOrder', 'pending', {
        action: 'customOrderCreated',
        user: customOrderData.createdBy || 'customer'
      });

      console.log(`OrderService: Custom order ${customOrder.orderId} created successfully`);
      return {
        success: true,
        customOrder
      };

    } catch (error) {
      console.error('OrderService: Error creating custom order:', error);
      EventEmitter.emit('businessError', { 
        error, 
        context: { operation: 'createCustomOrder', data: customOrderData } 
      });
      throw error;
    }
  }

  async updateCustomOrderStatus(orderId, newStatus, updateData = {}) {
    try {
      console.log(`OrderService: Updating custom order ${orderId} status to ${newStatus}`);

      const customOrder = await CustomOrder.findOne({ orderId });
      if (!customOrder) {
        throw new Error('Custom order not found');
      }

      // Check if transition is allowed
      if (!WorkflowManager.canTransition(customOrder, 'customOrder', newStatus)) {
        throw new Error(`Invalid status transition from ${customOrder.status} to ${newStatus}`);
      }

      // Update additional fields if provided
      if (updateData.estimatedPrice !== undefined) {
        customOrder.estimatedPrice = updateData.estimatedPrice;
        
        // Calculate advance payment if confirming order
        if (newStatus === 'confirmed') {
          const advanceInfo = businessRules.calculateAdvancePayment(customOrder);
          if (advanceInfo.required) {
            customOrder.advanceAmount = advanceInfo.amount;
            customOrder.advancePaymentStatus = 'pending';
          }
        }
      }

      if (updateData.advanceAmount !== undefined) {
        customOrder.advanceAmount = updateData.advanceAmount;
        if (updateData.advanceAmount > 0) {
          customOrder.advancePaymentStatus = 'pending';
        }
      }

      if (updateData.adminNotes !== undefined) {
        customOrder.adminNotes = updateData.adminNotes;
      }

      if (updateData.notes !== undefined) {
        customOrder.notes = updateData.notes;
      }

      // Validate consistency after updates
      const consistencyErrors = DataValidators.validateCustomOrderConsistency(customOrder.toObject());
      if (consistencyErrors.length > 0) {
        throw new Error(`Consistency validation failed: ${consistencyErrors.join(', ')}`);
      }

      // Execute workflow transition
      await WorkflowManager.transitionState(customOrder, 'customOrder', newStatus, updateData);
      
      // Save updated custom order
      await customOrder.save();

      console.log(`OrderService: Custom order ${orderId} status updated to ${newStatus}`);
      return { success: true, customOrder };

    } catch (error) {
      console.error(`OrderService: Error updating custom order status:`, error);
      EventEmitter.emit('businessError', { 
        error, 
        context: { operation: 'updateCustomOrderStatus', orderId, newStatus } 
      });
      throw error;
    }
  }

  async cancelCustomOrder(orderId, reason, cancelledBy) {
    try {
      console.log(`OrderService: Cancelling custom order ${orderId}`);

      const customOrder = await CustomOrder.findOne({ orderId });
      if (!customOrder) {
        throw new Error('Custom order not found');
      }

      // Check if order can be cancelled
      if (['completed', 'cancelled'].includes(customOrder.status)) {
        throw new Error(`Cannot cancel custom order in ${customOrder.status} status`);
      }

      // Execute cancellation workflow
      await WorkflowManager.transitionState(customOrder, 'customOrder', 'cancelled', {
        reason,
        cancelledBy,
        cancelledAt: new Date()
      });

      // Save updated custom order
      customOrder.notes = `Cancelled by ${cancelledBy}: ${reason}`;
      await customOrder.save();

      console.log(`OrderService: Custom order ${orderId} cancelled successfully`);
      return { success: true, customOrder };

    } catch (error) {
      console.error(`OrderService: Error cancelling custom order:`, error);
      EventEmitter.emit('businessError', { 
        error, 
        context: { operation: 'cancelCustomOrder', orderId, reason } 
      });
      throw error;
    }
  }

  // Order Analysis and Reporting
  async getOrderAnalytics(filters = {}) {
    try {
      const { startDate, endDate, status, paymentStatus } = filters;
      
      // Build query
      let query = {};
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      if (status) query.status = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;

      // Get orders
      const orders = await Order.find(query);
      const customOrders = await CustomOrder.find(query);

      // Calculate analytics
      const analytics = {
        regular_orders: {
          count: orders.length,
          total_revenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          average_order_value: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
          status_breakdown: this.getStatusBreakdown(orders, 'status'),
          payment_breakdown: this.getStatusBreakdown(orders, 'paymentStatus')
        },
        custom_orders: {
          count: customOrders.length,
          total_estimated_value: customOrders.reduce((sum, order) => sum + (order.estimatedPrice || 0), 0),
          total_advance_collected: customOrders.reduce((sum, order) => sum + (order.advancePaymentStatus === 'paid' ? order.advanceAmount : 0), 0),
          status_breakdown: this.getStatusBreakdown(customOrders, 'status'),
          advance_payment_breakdown: this.getStatusBreakdown(customOrders, 'advancePaymentStatus')
        },
        totals: {
          all_orders: orders.length + customOrders.length,
          total_revenue: orders.reduce((sum, order) => sum + order.totalAmount, 0) + 
                        customOrders.reduce((sum, order) => sum + (order.advancePaymentStatus === 'paid' ? order.advanceAmount : 0), 0)
        }
      };

      return analytics;

    } catch (error) {
      console.error('OrderService: Error getting order analytics:', error);
      throw error;
    }
  }

  getStatusBreakdown(orders, statusField) {
    const breakdown = {};
    orders.forEach(order => {
      const status = order[statusField];
      breakdown[status] = (breakdown[status] || 0) + 1;
    });
    return breakdown;
  }

  // Order Validation Helpers
  async validateOrderModification(orderId, modifications) {
    const order = await Order.findOne({ orderId });
    if (!order) {
      throw new Error('Order not found');
    }

    const errors = [];

    // Check if order can be modified
    if (['delivered', 'cancelled'].includes(order.status)) {
      errors.push('Cannot modify completed or cancelled orders');
    }

    // Check specific modifications
    if (modifications.items) {
      // Validate new items
      try {
        await this.processOrderItems(modifications.items);
      } catch (error) {
        errors.push(`Item validation failed: ${error.message}`);
      }
    }

    if (modifications.deliveryDate) {
      try {
        businessRules.validateRule('order.minimumAdvanceNotice', modifications.deliveryDate);
      } catch (error) {
        errors.push(`Delivery date validation failed: ${error.message}`);
      }
    }

    return {
      canModify: errors.length === 0,
      errors
    };
  }

  // Stock Management Integration
  async checkStockAvailability(items) {
    const stockCheck = [];

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product) {
        stockCheck.push({
          productId: item.productId || item.product,
          available: false,
          error: 'Product not found'
        });
        continue;
      }

      const available = businessRules.validateRule('order.stockAvailability', product, item.quantity);
      stockCheck.push({
        productId: product._id,
        productName: product.name,
        requestedQuantity: item.quantity,
        availableStock: product.stockQuantity,
        available,
        isAvailableOnOrder: product.isAvailableOnOrder
      });
    }

    return stockCheck;
  }

  // Order History and Customer Analytics
  async getCustomerOrderHistory(customerEmail) {
    try {
      const regularOrders = await Order.find({ 
        'customerInfo.email': customerEmail.toLowerCase() 
      }).sort({ createdAt: -1 });

      const customOrders = await CustomOrder.find({ 
        customerEmail: customerEmail.toLowerCase() 
      }).sort({ createdAt: -1 });

      const analytics = {
        total_orders: regularOrders.length + customOrders.length,
        total_spent: regularOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        average_order_value: regularOrders.length > 0 ? 
          regularOrders.reduce((sum, order) => sum + order.totalAmount, 0) / regularOrders.length : 0,
        customer_since: Math.min(
          regularOrders.length > 0 ? regularOrders[regularOrders.length - 1].createdAt : Date.now(),
          customOrders.length > 0 ? customOrders[customOrders.length - 1].createdAt : Date.now()
        ),
        order_frequency: this.calculateOrderFrequency(regularOrders, customOrders)
      };

      return {
        regularOrders,
        customOrders,
        analytics
      };

    } catch (error) {
      console.error('OrderService: Error getting customer order history:', error);
      throw error;
    }
  }

  calculateOrderFrequency(regularOrders, customOrders) {
    const allOrders = [...regularOrders, ...customOrders];
    if (allOrders.length < 2) return 'N/A';

    const sortedOrders = allOrders.sort((a, b) => a.createdAt - b.createdAt);
    const daysBetweenFirstAndLast = (sortedOrders[sortedOrders.length - 1].createdAt - sortedOrders[0].createdAt) / (1000 * 60 * 60 * 24);
    
    if (daysBetweenFirstAndLast === 0) return 'N/A';
    
    const ordersPerDay = allOrders.length / daysBetweenFirstAndLast;
    
    if (ordersPerDay >= 1) return `${ordersPerDay.toFixed(1)} orders/day`;
    if (ordersPerDay >= 1/7) return `${(ordersPerDay * 7).toFixed(1)} orders/week`;
    return `${(ordersPerDay * 30).toFixed(1)} orders/month`;
  }

  // Business Intelligence Methods
  async getBusinessInsights(period = '30d') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const analytics = await this.getOrderAnalytics({ startDate, endDate });
      
      // Get popular products
      const orders = await Order.find({ 
        createdAt: { $gte: startDate, $lte: endDate } 
      }).populate('items.product', 'name category');

      const productSales = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          const productId = item.product._id.toString();
          if (!productSales[productId]) {
            productSales[productId] = {
              product: item.product,
              totalQuantity: 0,
              totalRevenue: 0
            };
          }
          productSales[productId].totalQuantity += item.quantity;
          productSales[productId].totalRevenue += item.subtotal;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      return {
        period,
        analytics,
        topProducts,
        insights: {
          busiest_day: this.getBusiestDay(orders),
          peak_order_time: this.getPeakOrderTime(orders),
          average_delivery_lead_time: this.getAverageDeliveryLeadTime(orders),
          customer_retention_rate: await this.getCustomerRetentionRate(startDate, endDate)
        }
      };

    } catch (error) {
      console.error('OrderService: Error getting business insights:', error);
      throw error;
    }
  }

  getBusiestDay(orders) {
    const dayCount = {};
    orders.forEach(order => {
      const day = order.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    return Object.entries(dayCount).reduce((a, b) => dayCount[a[0]] > dayCount[b[0]] ? a : b, ['N/A', 0])[0];
  }

  getPeakOrderTime(orders) {
    const hourCount = {};
    orders.forEach(order => {
      const hour = order.createdAt.getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourCount).reduce((a, b) => hourCount[a[0]] > hourCount[b[0]] ? a : b, [0, 0])[0];
    return `${peakHour}:00`;
  }

  getAverageDeliveryLeadTime(orders) {
    const leadTimes = orders
      .filter(order => order.deliveryDate)
      .map(order => (order.deliveryDate - order.createdAt) / (1000 * 60 * 60 * 24));
    
    if (leadTimes.length === 0) return 0;
    
    return leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length;
  }

  async getCustomerRetentionRate(startDate, endDate) {
    // Get customers who placed orders in this period
    const currentPeriodOrders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    const currentCustomers = new Set(currentPeriodOrders.map(order => order.customerInfo.email));
    
    // Get customers from previous period
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - (endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const previousPeriodOrders = await Order.find({
      createdAt: { $gte: prevStartDate, $lt: startDate }
    });
    
    const previousCustomers = new Set(previousPeriodOrders.map(order => order.customerInfo.email));
    
    // Calculate retention
    let retainedCustomers = 0;
    previousCustomers.forEach(customer => {
      if (currentCustomers.has(customer)) {
        retainedCustomers++;
      }
    });
    
    return previousCustomers.size > 0 ? (retainedCustomers / previousCustomers.size) * 100 : 0;
  }
}

// Singleton instance
const orderService = new OrderService();

module.exports = orderService;
