const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest orders
  },
  customerInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'Sri Lanka' }
    }
  },
  items: [orderItemSchema],
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  delivery: {
    fee: {
      type: Number,
      default: 0,
      min: 0
    },
    zone: {
      type: String,
      enum: ['colombo', 'gampaha', 'kalutara', 'kandy', 'other'],
      default: 'other'
    },
    zoneName: {
      type: String,
      default: 'Other Areas'
    },
    isFree: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      default: 'Standard delivery'
    },
    isExpress: {
      type: Boolean,
      default: false
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'express'],
      default: 'afternoon'
    },
    timeSlotName: {
      type: String,
      default: '12:00 PM - 6:00 PM'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'online_transfer'],
    default: 'cash_on_delivery'
  },
  paymentDetails: {
    paymentId: String,
    paymentDate: Date,
    paymentAmount: Number,
    paymentGateway: String,
    transactionId: String
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryTime: {
    type: String,
    required: false  // Made optional since we now use delivery.timeSlot
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generate order ID before saving
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'ORD' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

// Calculate subtotal for order items
orderItemSchema.pre('save', function(next) {
  this.subtotal = this.price * this.quantity;
  next();
});

// Index for better query performance
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderId: 1 });

module.exports = mongoose.model('Order', orderSchema);
