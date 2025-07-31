const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: true,
    enum: [
      'General Inquiry',
      'Order Status',
      'Custom Cake Question',
      'Delivery Information',
      'Pricing Question',
      'Complaint',
      'Compliment',
      'Other'
    ]
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  ticketId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Generate ticket ID before saving
contactSchema.pre('save', function(next) {
  if (!this.ticketId) {
    this.ticketId = 'TKT' + Date.now().toString().slice(-6);
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema);
