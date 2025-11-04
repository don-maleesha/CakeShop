const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const CustomOrder = require('../models/CustomOrder');
const Contact = require('../models/Contact');

// Helper function to get date range
const getDateRange = (period) => {
  const now = new Date();
  const startDate = new Date();
  
  switch(period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2000); // Beginning of time
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }
  
  return { startDate, endDate: now };
};

// Dashboard Overview (existing endpoint)
router.get('/dashboard', async (req, res) => {
  try {
    // Get paid orders for revenue calculation
    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // Get all orders for status counts
    const allOrders = await Order.find();
    const pendingOrders = allOrders.filter(order => order.status === 'pending').length;

    // Get product statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({ 
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      isActive: true
    });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });

    res.json({
      success: true,
      data: {
        revenue: {
          total: Math.round(totalRevenue),
          averageOrderValue: Math.round(averageOrderValue)
        },
        orders: {
          total: allOrders.length,
          pending: pendingOrders
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
          featured: featuredProducts
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
});

// Sales & Revenue Analytics
router.get('/sales', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get all paid orders in the period
    const orders = await Order.find({
      paymentStatus: 'paid',
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    // Calculate revenue trends
    const revenueByDay = {};
    const revenueByPaymentMethod = {};
    let totalRevenue = 0;
    let totalOrders = orders.length;

    orders.forEach(order => {
      // Revenue by day
      const dateKey = order.createdAt.toISOString().split('T')[0];
      revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + order.totalAmount;

      // Revenue by payment method
      revenueByPaymentMethod[order.paymentMethod] = 
        (revenueByPaymentMethod[order.paymentMethod] || 0) + order.totalAmount;

      totalRevenue += order.totalAmount;
    });

    // Calculate revenue trends (format for charts)
    const revenueTrends = Object.keys(revenueByDay).map(date => ({
      date,
      revenue: revenueByDay[date],
      orderCount: orders.filter(o => o.createdAt.toISOString().split('T')[0] === date).length
    }));

    // Get custom orders revenue
    const customOrders = await CustomOrder.find({
      advancePaymentStatus: 'paid',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const customOrderRevenue = customOrders.reduce((sum, order) => sum + (order.advanceAmount || 0), 0);

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate order value distribution
    const orderValueRanges = {
      '0-1000': 0,
      '1000-2500': 0,
      '2500-5000': 0,
      '5000-10000': 0,
      '10000+': 0
    };

    orders.forEach(order => {
      const amount = order.totalAmount;
      if (amount < 1000) orderValueRanges['0-1000']++;
      else if (amount < 2500) orderValueRanges['1000-2500']++;
      else if (amount < 5000) orderValueRanges['2500-5000']++;
      else if (amount < 10000) orderValueRanges['5000-10000']++;
      else orderValueRanges['10000+']++;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: Math.round(totalRevenue),
          customOrderRevenue: Math.round(customOrderRevenue),
          totalOrders,
          averageOrderValue: Math.round(averageOrderValue),
          period
        },
        revenueTrends,
        revenueByPaymentMethod,
        orderValueDistribution: orderValueRanges
      }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics',
      error: error.message
    });
  }
});

// Order Analytics
router.get('/orders', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Order status distribution
    const statusDistribution = {};
    orders.forEach(order => {
      statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
    });

    // Orders by day of week
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const ordersByDay = {};
    dayOfWeek.forEach(day => ordersByDay[day] = 0);

    orders.forEach(order => {
      const day = dayOfWeek[order.createdAt.getDay()];
      ordersByDay[day]++;
    });

    // Orders by time of day
    const ordersByHour = {};
    orders.forEach(order => {
      const hour = order.createdAt.getHours();
      ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
    });

    // Delivery zone distribution
    const deliveryZones = {};
    orders.forEach(order => {
      const zone = order.delivery?.zoneName || 'Other';
      deliveryZones[zone] = (deliveryZones[zone] || 0) + 1;
    });

    // Payment status distribution
    const paymentStatusDistribution = {};
    orders.forEach(order => {
      paymentStatusDistribution[order.paymentStatus] = 
        (paymentStatusDistribution[order.paymentStatus] || 0) + 1;
    });

    // Delivery type distribution
    const deliveryTypes = {
      express: 0,
      standard: 0,
      free: 0
    };
    orders.forEach(order => {
      if (order.delivery?.isExpress) deliveryTypes.express++;
      else if (order.delivery?.isFree) deliveryTypes.free++;
      else deliveryTypes.standard++;
    });

    // Calculate completion metrics
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const completionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;
    const cancellationRate = orders.length > 0 ? (cancelledOrders / orders.length) * 100 : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders: orders.length,
          completedOrders,
          cancelledOrders,
          completionRate: Math.round(completionRate * 10) / 10,
          cancellationRate: Math.round(cancellationRate * 10) / 10,
          period
        },
        statusDistribution,
        ordersByDayOfWeek: ordersByDay,
        ordersByHour,
        deliveryZones,
        paymentStatusDistribution,
        deliveryTypes
      }
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order analytics',
      error: error.message
    });
  }
});

// Product Analytics
router.get('/products', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate } = getDateRange(period);

    // Get all products
    const products = await Product.find().populate('category');

    // Get top selling products
    const topSellingByQuantity = await Product.find()
      .sort({ soldCount: -1 })
      .limit(10)
      .populate('category')
      .select('name soldCount price category images');

    // Calculate revenue per product (need to check orders)
    const orders = await Order.find({
      paymentStatus: 'paid',
      createdAt: { $gte: startDate }
    });

    const productRevenue = {};
    const productQuantity = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.toString();
        productRevenue[productId] = (productRevenue[productId] || 0) + item.subtotal;
        productQuantity[productId] = (productQuantity[productId] || 0) + item.quantity;
      });
    });

    // Get top products by revenue
    const topByRevenue = await Promise.all(
      Object.keys(productRevenue)
        .sort((a, b) => productRevenue[b] - productRevenue[a])
        .slice(0, 10)
        .map(async (productId) => {
          const product = await Product.findById(productId).populate('category');
          return {
            _id: product._id,
            name: product.name,
            revenue: productRevenue[productId],
            quantity: productQuantity[productId],
            category: product.category?.name || 'Unknown',
            image: product.images?.[0] || null
          };
        })
    );

    // Revenue by category
    const categoryRevenue = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p._id.toString() === item.product.toString());
        if (product && product.category) {
          const categoryName = product.category.name;
          categoryRevenue[categoryName] = (categoryRevenue[categoryName] || 0) + item.subtotal;
        }
      });
    });

    // Low stock products
    const lowStockProducts = products.filter(p => 
      p.stockQuantity <= p.lowStockThreshold && p.isActive
    ).map(p => ({
      _id: p._id,
      name: p.name,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      category: p.category?.name || 'Unknown'
    }));

    // Product attribute analysis
    const flavorDistribution = {};
    const sizeDistribution = {};
    products.forEach(product => {
      if (product.flavour) {
        flavorDistribution[product.flavour] = (flavorDistribution[product.flavour] || 0) + 1;
      }
      if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach(size => {
          sizeDistribution[size.name] = (sizeDistribution[size.name] || 0) + 1;
        });
      }
    });

    // Product type distribution
    const typeDistribution = {};
    products.forEach(product => {
      typeDistribution[product.type] = (typeDistribution[product.type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts: products.length,
          activeProducts: products.filter(p => p.isActive).length,
          lowStockCount: lowStockProducts.length,
          featuredCount: products.filter(p => p.isFeatured).length,
          period
        },
        topSellingByQuantity: topSellingByQuantity.map(p => ({
          _id: p._id,
          name: p.name,
          soldCount: p.soldCount,
          category: p.category?.name || 'Unknown',
          image: p.images?.[0] || null
        })),
        topByRevenue,
        categoryRevenue,
        lowStockProducts,
        flavorDistribution,
        sizeDistribution,
        typeDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product analytics',
      error: error.message
    });
  }
});

// Customer Analytics
router.get('/customers', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get all users
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get all orders
    const allOrders = await Order.find({
      paymentStatus: 'paid'
    });

    // Calculate customer metrics
    const customerOrders = {};
    const customerRevenue = {};
    const guestOrders = allOrders.filter(o => !o.customer).length;
    const registeredOrders = allOrders.filter(o => o.customer).length;

    allOrders.forEach(order => {
      if (order.customer) {
        const customerId = order.customer.toString();
        customerOrders[customerId] = (customerOrders[customerId] || 0) + 1;
        customerRevenue[customerId] = (customerRevenue[customerId] || 0) + order.totalAmount;
      }
    });

    // Get top customers
    const topCustomerIds = Object.keys(customerRevenue)
      .sort((a, b) => customerRevenue[b] - customerRevenue[a])
      .slice(0, 10);

    const topCustomers = await Promise.all(
      topCustomerIds.map(async (customerId) => {
        const user = await User.findById(customerId);
        return {
          _id: customerId,
          name: user?.name || 'Unknown',
          email: user?.email || 'Unknown',
          totalRevenue: customerRevenue[customerId],
          orderCount: customerOrders[customerId]
        };
      })
    );

    // Customer location distribution (by city)
    const locationDistribution = {};
    allOrders.forEach(order => {
      const city = order.customerInfo?.address?.city || 'Unknown';
      locationDistribution[city] = (locationDistribution[city] || 0) + 1;
    });

    // Customer order frequency
    const orderFrequency = {
      '1': 0,
      '2-3': 0,
      '4-5': 0,
      '6-10': 0,
      '10+': 0
    };

    Object.values(customerOrders).forEach(count => {
      if (count === 1) orderFrequency['1']++;
      else if (count <= 3) orderFrequency['2-3']++;
      else if (count <= 5) orderFrequency['4-5']++;
      else if (count <= 10) orderFrequency['6-10']++;
      else orderFrequency['10+']++;
    });

    // Calculate retention metrics
    const returningCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const totalCustomers = Object.keys(customerOrders).length;
    const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          newUsers,
          totalCustomers,
          returningCustomers,
          retentionRate: Math.round(retentionRate * 10) / 10,
          guestOrders,
          registeredOrders,
          period
        },
        topCustomers,
        locationDistribution,
        orderFrequency
      }
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics',
      error: error.message
    });
  }
});

// Custom Order Analytics
router.get('/custom-orders', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const customOrders = await CustomOrder.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Status distribution
    const statusDistribution = {};
    customOrders.forEach(order => {
      statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
    });

    // Event type distribution
    const eventTypeDistribution = {};
    customOrders.forEach(order => {
      eventTypeDistribution[order.eventType] = (eventTypeDistribution[order.eventType] || 0) + 1;
    });

    // Cake size distribution
    const sizeDistribution = {};
    customOrders.forEach(order => {
      sizeDistribution[order.cakeSize] = (sizeDistribution[order.cakeSize] || 0) + 1;
    });

    // Flavor distribution
    const flavorDistribution = {};
    customOrders.forEach(order => {
      flavorDistribution[order.flavor] = (flavorDistribution[order.flavor] || 0) + 1;
    });

    // Calculate average estimated price
    const ordersWithPrice = customOrders.filter(o => o.estimatedPrice > 0);
    const averagePrice = ordersWithPrice.length > 0
      ? ordersWithPrice.reduce((sum, o) => sum + o.estimatedPrice, 0) / ordersWithPrice.length
      : 0;

    // Calculate advance payment metrics
    const advancePaid = customOrders.filter(o => o.advancePaymentStatus === 'paid').length;
    const advanceRevenue = customOrders
      .filter(o => o.advancePaymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.advanceAmount || 0), 0);

    // Calculate conversion rate
    const completedOrders = customOrders.filter(o => o.status === 'completed').length;
    const conversionRate = customOrders.length > 0 
      ? (completedOrders / customOrders.length) * 100 
      : 0;

    // Calculate average lead time (days between order and delivery)
    const leadTimes = customOrders
      .filter(o => o.deliveryDate)
      .map(o => {
        const orderDate = new Date(o.createdAt);
        const deliveryDate = new Date(o.deliveryDate);
        return Math.ceil((deliveryDate - orderDate) / (1000 * 60 * 60 * 24));
      });
    
    const averageLeadTime = leadTimes.length > 0
      ? leadTimes.reduce((sum, days) => sum + days, 0) / leadTimes.length
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomOrders: customOrders.length,
          completedOrders,
          conversionRate: Math.round(conversionRate * 10) / 10,
          averagePrice: Math.round(averagePrice),
          advanceRevenue: Math.round(advanceRevenue),
          averageLeadTime: Math.round(averageLeadTime),
          period
        },
        statusDistribution,
        eventTypeDistribution,
        sizeDistribution,
        flavorDistribution,
        advancePaymentMetrics: {
          paid: advancePaid,
          pending: customOrders.filter(o => o.advancePaymentStatus === 'pending').length,
          notRequired: customOrders.filter(o => o.advancePaymentStatus === 'not_required').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching custom order analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom order analytics',
      error: error.message
    });
  }
});

// Comparative Analytics (Period Comparison)
router.get('/comparison', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Current period
    const currentRange = getDateRange(period);
    
    // Previous period
    const timeDiff = currentRange.endDate - currentRange.startDate;
    const previousStartDate = new Date(currentRange.startDate.getTime() - timeDiff);
    const previousEndDate = new Date(currentRange.startDate);

    // Get orders for both periods
    const currentOrders = await Order.find({
      paymentStatus: 'paid',
      createdAt: { $gte: currentRange.startDate, $lte: currentRange.endDate }
    });

    const previousOrders = await Order.find({
      paymentStatus: 'paid',
      createdAt: { $gte: previousStartDate, $lte: previousEndDate }
    });

    // Calculate metrics
    const currentRevenue = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const orderGrowth = previousOrders.length > 0
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
      : 0;

    const currentAvgOrder = currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0;
    const previousAvgOrder = previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;
    const avgOrderGrowth = previousAvgOrder > 0
      ? ((currentAvgOrder - previousAvgOrder) / previousAvgOrder) * 100
      : 0;

    res.json({
      success: true,
      data: {
        current: {
          revenue: Math.round(currentRevenue),
          orders: currentOrders.length,
          averageOrder: Math.round(currentAvgOrder)
        },
        previous: {
          revenue: Math.round(previousRevenue),
          orders: previousOrders.length,
          averageOrder: Math.round(previousAvgOrder)
        },
        growth: {
          revenue: Math.round(revenueGrowth * 10) / 10,
          orders: Math.round(orderGrowth * 10) / 10,
          averageOrder: Math.round(avgOrderGrowth * 10) / 10
        },
        period
      }
    });
  } catch (error) {
    console.error('Error fetching comparison analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparison analytics',
      error: error.message
    });
  }
});

module.exports = router;
