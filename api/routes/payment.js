const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CustomOrder = require('../models/CustomOrder');
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

// Initialize payment for custom order advance - return payment data for JS SDK
router.post('/initialize-custom-order', async (req, res) => {
  try {
    const { customOrderId } = req.body;
    console.log('Custom order payment initialization request for orderId:', customOrderId);
    
    // Find the custom order
    const customOrder = await CustomOrder.findOne({ orderId: customOrderId });
    if (!customOrder) {
      console.log('Custom order not found:', customOrderId);
      return res.status(404).json({
        success: false,
        error: 'Custom order not found'
      });
    }

    console.log('Custom order found:', {
      orderId: customOrder.orderId,
      advanceAmount: customOrder.advanceAmount,
      customerName: customOrder.customerName,
      email: customOrder.customerEmail,
      phone: customOrder.customerPhone,
      status: customOrder.status,
      advancePaymentStatus: customOrder.advancePaymentStatus
    });

    // Check if advance payment is required and pending
    if (customOrder.advancePaymentStatus !== 'pending' || !customOrder.advanceAmount || customOrder.advanceAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Advance payment is not required or already completed for this order'
      });
    }

    // Validate required customer info
    if (!customOrder.customerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required for payment'
      });
    }

    // Create payment request data for JavaScript SDK
    const paymentData = payHereService.createPaymentRequest({
      orderId: customOrder.paymentOrderId || customOrder.orderId + '-ADV',
      amount: customOrder.advanceAmount,
      customerName: customOrder.customerName,
      email: customOrder.customerEmail,
      phone: customOrder.customerPhone,
      address: 'Custom Order Address', // Default for custom orders
      city: 'Colombo' // Default city
    });

    // Override items description for custom orders
    paymentData.items = `Custom Order Advance Payment - ${customOrder.orderId}`;

    console.log('Generated custom order payment data:', {
      orderId: paymentData.order_id,
      amount: paymentData.amount,
      items: paymentData.items,
      customerEmail: paymentData.email,
      customOrderId: customOrder.orderId,
      paymentOrderId: customOrder.paymentOrderId
    });

    res.json({
      success: true,
      data: paymentData
    });

  } catch (error) {
    console.error('Custom order payment initialization error:', error);
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

    // Find and update order (check both regular orders and custom orders)
    let order = await Order.findOne({ orderId: order_id });
    let customOrder = null;
    let isCustomOrder = false;
    
    if (!order) {
      // Check if this is a custom order advance payment
      console.log('Regular order not found, checking for custom order with order_id:', order_id);
      
      customOrder = await CustomOrder.findOne({ 
        $or: [
          { paymentOrderId: order_id },
          { orderId: order_id.replace('-ADV', '') },
          { orderId: order_id } // Also check direct order ID match
        ]
      });
      
      if (customOrder) {
        isCustomOrder = true;
        console.log('Custom order found for payment:', {
          orderId: customOrder.orderId,
          paymentOrderId: customOrder.paymentOrderId,
          advanceAmount: customOrder.advanceAmount,
          currentPaymentStatus: customOrder.advancePaymentStatus
        });
      } else {
        console.error('Neither regular order nor custom order found for order_id:', order_id);
        console.log('Searched for custom orders with:');
        console.log('- paymentOrderId:', order_id);
        console.log('- orderId:', order_id.replace('-ADV', ''));
        console.log('- orderId direct:', order_id);
        return res.status(404).send('Order not found');
      }
    }

    // Update payment status based on status code
    if (status_code === '2') { // Success
      if (isCustomOrder) {
        console.log('Updating custom order advance payment status to paid...');
        customOrder.advancePaymentStatus = 'paid';
        customOrder.advancePaymentDetails = {
          paymentId: payment_id,
          paymentDate: new Date(),
          paymentAmount: parseFloat(payhere_amount),
          paymentGateway: 'PayHere',
          transactionId: payment_id
        };
        await customOrder.save();
        console.log('Custom order advance payment updated successfully:', {
          orderId: customOrder.orderId,
          paymentStatus: customOrder.advancePaymentStatus,
          paymentAmount: customOrder.advancePaymentDetails.paymentAmount,
          transactionId: customOrder.advancePaymentDetails.transactionId
        });
      } else {
        order.paymentStatus = 'paid';
        order.paymentDetails = {
          paymentId: payment_id,
          paymentDate: new Date(),
          paymentAmount: parseFloat(payhere_amount),
          paymentGateway: 'PayHere',
          transactionId: payment_id
        };
        order.status = 'confirmed';
        await order.save();
        console.log('Regular order updated successfully:', order_id);
      }
    } else if (status_code === '-1' || status_code === '-2') { // Cancelled or Failed
      if (isCustomOrder) {
        console.log('Updating custom order advance payment status to failed...');
        customOrder.advancePaymentStatus = 'failed';
        await customOrder.save();
        console.log('Custom order advance payment marked as failed:', customOrder.orderId);
      } else {
        order.paymentStatus = 'failed';
        await order.save();
        console.log('Regular order marked as failed:', order_id);
      }
    } else {
      console.log('Unknown payment status code:', status_code);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Payment notification error:', error);
    res.status(500).send('Internal server error');
  }
});

// Manual payment confirmation endpoint (for development/testing)
router.post('/confirm-payment', async (req, res) => {
  try {
    const { orderId, paymentId, transactionDetails } = req.body;
    console.log('Manual payment confirmation request:', { orderId, paymentId, transactionDetails });

    // Find the custom order
    const customOrder = await CustomOrder.findOne({ 
      $or: [
        { orderId },
        { paymentOrderId: orderId },
        { orderId: orderId.replace('-ADV', '') }
      ]
    });

    if (!customOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    console.log('Found custom order for manual confirmation:', {
      orderId: customOrder.orderId,
      paymentOrderId: customOrder.paymentOrderId,
      currentStatus: customOrder.advancePaymentStatus
    });

    // Update payment status
    customOrder.advancePaymentStatus = 'paid';
    customOrder.advancePaymentDetails = {
      paymentId: paymentId || `MANUAL_${Date.now()}`,
      paymentDate: new Date(),
      paymentAmount: customOrder.advanceAmount,
      paymentGateway: 'PayHere',
      transactionId: paymentId || `TXN_${Date.now()}`,
      ...(transactionDetails && { notes: 'Manually confirmed payment' })
    };

    await customOrder.save();

    console.log('Payment manually confirmed for order:', customOrder.orderId);

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        orderId: customOrder.orderId,
        paymentStatus: customOrder.advancePaymentStatus,
        paymentDetails: customOrder.advancePaymentDetails
      }
    });

  } catch (error) {
    console.error('Manual payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment'
    });
  }
});

// Check payment status
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Check regular orders first
    let order = await Order.findOne({ orderId });
    if (order) {
      return res.json({
        success: true,
        data: {
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          paymentDetails: order.paymentDetails
        }
      });
    }

    // Check custom orders
    const customOrder = await CustomOrder.findOne({ 
      $or: [
        { orderId },
        { paymentOrderId: orderId }
      ]
    });
    
    if (customOrder) {
      return res.json({
        success: true,
        data: {
          paymentStatus: customOrder.advancePaymentStatus,
          orderStatus: customOrder.status,
          paymentDetails: customOrder.advancePaymentDetails,
          isCustomOrder: true
        }
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Order not found'
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
