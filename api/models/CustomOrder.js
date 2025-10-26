const mongoose = require('mongoose');
const OrderIdGenerator = require('../utils/orderIdGenerator');

const customOrderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'Birthday',
      'Wedding',
      'Anniversary',
      'Corporate Event',
      'Baby Shower',
      'Graduation',
      'Holiday Celebration',
      'Other'
    ]
  },
  cakeSize: {
    type: String,
    required: true,
    enum: [
      '6 inch (serves 6-8)',
      '8 inch (serves 12-15)',
      '10 inch (serves 20-25)',
      '12 inch (serves 30-35)',
      'Multi-tier',
      'Sheet cake'
    ]
  },
  flavor: {
    type: String,
    required: true,
    enum: [
      'Vanilla',
      'Chocolate',
      'Red Velvet',
      'Carrot',
      'Lemon',
      'Strawberry',
      'Funfetti',
      'Coffee/Mocha',
      'Custom flavor'
    ]
  },
  specialRequirements: {
    type: String,
    trim: true,
    maxlength: 500
  },
  deliveryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return date >= sevenDaysFromNow;
      },
      message: 'Delivery date must be at least 7 days from today'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  orderId: {
    type: String,
    unique: true
  },
  estimatedPrice: {
    type: Number,
    min: 0
  },
  advanceAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  advancePaymentStatus: {
    type: String,
    enum: ['not_required', 'pending', 'paid', 'failed'],
    default: 'not_required'
  },
  advancePaymentDetails: {
    paymentId: String,
    paymentDate: Date,
    paymentAmount: Number,
    paymentGateway: String,
    transactionId: String
  },
  paymentOrderId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when set
  },
  notes: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generate order ID before saving
customOrderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    try {
      // Generate meaningful order ID using OrderIdGenerator
      // Custom orders always use 'custom' type
      this.orderId = await OrderIdGenerator.generateOrderId('custom');
    } catch (error) {
      console.error('Error generating custom order ID:', error);
      // Fallback to simple ID generation
      this.orderId = 'ORD-CUS-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  }
  
  // Generate payment order ID when advance payment is required
  if (this.advanceAmount > 0 && this.advancePaymentStatus === 'pending' && !this.paymentOrderId) {
    this.paymentOrderId = 'PAY-' + this.orderId + '-ADV';
    console.log('Generated paymentOrderId:', this.paymentOrderId, 'for order:', this.orderId);
  }
  
  next();
});

module.exports = mongoose.model('CustomOrder', customOrderSchema);
