const mongoose = require('mongoose');

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
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generate order ID before saving
customOrderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'CO' + Date.now().toString().slice(-6);
  }
  next();
});

module.exports = mongoose.model('CustomOrder', customOrderSchema);
module.exports = mongoose.model('CustomOrder', customOrderSchema);
