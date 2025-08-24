const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const payHereService = require('../services/payHereService');

// Initialize payment - return payment data for JS SDK
router.post('/initialize', async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('Payment initialization request for orderId:', orderId);
    
    // Find the order
    const order = await Order.findOne({ orderId });
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    console.log('Order found:', {
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      customerName: order.customerInfo.name,
      email: order.customerInfo.email,
      phone: order.customerInfo.phone,
      address: order.customerInfo.address
    });

    // Validate required customer info
    if (!order.customerInfo.phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required for payment'
      });
    }

    if (!order.customerInfo.address.street || !order.customerInfo.address.city) {
      return res.status(400).json({
        success: false,
        error: 'Complete address is required for payment'
      });
    }

    // Create payment request data for JavaScript SDK
    const paymentData = payHereService.createPaymentRequest({
      orderId: order.orderId,
      amount: order.totalAmount,
      customerName: order.customerInfo.name,
      email: order.customerInfo.email,
      phone: order.customerInfo.phone,
      address: order.customerInfo.address.street,
      city: order.customerInfo.address.city
    });

    console.log('Generated payment data:', JSON.stringify(paymentData, null, 2));

    res.json({
      success: true,
      data: paymentData
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment'
    });
  }
});

// PayHere notification endpoint
router.post('/notify', async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id,
      custom_1,
      custom_2
    } = req.body;

    console.log('Payment notification received:', req.body);

    // Verify payment using the correct field names from JS SDK
    const isValid = payHereService.verifyPayment(
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig
    );

    if (!isValid) {
      console.error('Invalid payment notification');
      return res.status(400).send('Invalid notification');
    }

    // Find and update order
    const order = await Order.findOne({ orderId: order_id });
    if (!order) {
      console.error('Order not found:', order_id);
      return res.status(404).send('Order not found');
    }

    // Update payment status based on status code
    if (status_code === '2') { // Success
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        paymentId: payment_id,
        paymentDate: new Date(),
        paymentAmount: parseFloat(payhere_amount),
        paymentGateway: 'PayHere',
        transactionId: payment_id
      };
      order.status = 'confirmed';
    } else if (status_code === '-1') { // Cancelled
      order.paymentStatus = 'failed';
    } else if (status_code === '-2') { // Failed
      order.paymentStatus = 'failed';
    }

    await order.save();
    console.log('Order updated successfully:', order_id);

    res.status(200).send('OK');

  } catch (error) {
    console.error('Payment notification error:', error);
    res.status(500).send('Internal server error');
  }
});

// Check payment status
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        paymentDetails: order.paymentDetails
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status'
    });
  }
});

module.exports = router;
