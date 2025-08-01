import React, { useState } from 'react';
import axios from 'axios';

export default function CustomOrder() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventType: '',
    cakeSize: '',
    flavor: '',
    specialRequirements: '',
    deliveryDate: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:4000/custom-orders', {
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim().toLowerCase(),
        customerPhone: formData.customerPhone.trim(),
        eventType: formData.eventType,
        cakeSize: formData.cakeSize,
        flavor: formData.flavor,
        specialRequirements: formData.specialRequirements.trim(),
        deliveryDate: formData.deliveryDate
      });

      if (response.data.success) {
        console.log('Custom order submitted:', response.data);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Custom order submission error:', error);
      alert(error.response?.data?.error || 'Failed to submit order. Please try again.');
    }
  };

  const eventTypes = [
    'Birthday',
    'Wedding',
    'Anniversary',
    'Corporate Event',
    'Baby Shower',
    'Graduation',
    'Holiday Celebration',
    'Other'
  ];

  const cakeSizes = [
    '6 inch (serves 6-8)',
    '8 inch (serves 12-15)',
    '10 inch (serves 20-25)',
    '12 inch (serves 30-35)',
    'Multi-tier',
    'Sheet cake'
  ];

  const flavors = [
    'Vanilla',
    'Chocolate',
    'Red Velvet',
    'Carrot',
    'Lemon',
    'Strawberry',
    'Funfetti',
    'Coffee/Mocha',
    'Custom flavor'
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🧁</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your custom cake order. We'll review your requirements and get back to you within 24 hours with a quote and timeline.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Our team will review your custom requirements</li>
                <li>• We'll contact you with a detailed quote</li>
                <li>• Once approved, we'll schedule your cake creation</li>
                <li>• Your cake will be ready on your requested delivery date</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  customerName: '',
                  customerEmail: '',
                  customerPhone: '',
                  eventType: '',
                  cakeSize: '',
                  flavor: '',
                  specialRequirements: '',
                  deliveryDate: ''
                });
              }}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              Submit Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Custom Cake Order</h1>
          <p className="text-xl text-gray-600">
            Create the perfect cake for your special occasion
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-5 h-5 mr-2 text-red-500 flex items-center justify-center">👤</span>
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="customerEmail"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* Event Details */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-5 h-5 mr-2 text-red-500 flex items-center justify-center">📅</span>
                    Event Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Type *
                      </label>
                      <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select event type</option>
                        {eventTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Date *
                      </label>
                      <input
                        type="date"
                        name="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={handleInputChange}
                        required
                        min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Cake Specifications */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-5 h-5 mr-2 text-red-500 flex items-center justify-center">🧁</span>
                    Cake Specifications
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cake Size *
                      </label>
                      <select
                        name="cakeSize"
                        value={formData.cakeSize}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select cake size</option>
                        {cakeSizes.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Flavor *
                      </label>
                      <select
                        name="flavor"
                        value={formData.flavor}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select flavor</option>
                        {flavors.map((flavor) => (
                          <option key={flavor} value={flavor}>{flavor}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Special Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requirements & Design Details
                  </label>
                  <textarea
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Please describe your design preferences, colors, decorations, text on cake, dietary restrictions, or any other special requirements..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-500 text-white py-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Submit Custom Order Request
                </button>
              </form>
            </div>
          </div>

          {/* Information Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-red-500 mt-0.5 flex items-center justify-center">⏰</span>
                  <div>
                    <p className="font-medium text-gray-900">Processing Time</p>
                    <p className="text-gray-600">Minimum 7 days notice required for custom orders</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-red-500 mt-0.5 flex items-center justify-center">✉️</span>
                  <div>
                    <p className="font-medium text-gray-900">Confirmation</p>
                    <p className="text-gray-600">You'll receive a quote within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-red-500 mt-0.5 flex items-center justify-center">📞</span>
                  <div>
                    <p className="font-medium text-gray-900">Questions?</p>
                    <p className="text-gray-600">Call us at (555) 123-4567</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Pricing Guide</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• 6" cakes start at $45</li>
                  <li>• 8" cakes start at $65</li>
                  <li>• 10" cakes start at $85</li>
                  <li>• Complex designs may add 20-50%</li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Dietary Options</h4>
                <p className="text-sm text-yellow-800">
                  We offer gluten-free, sugar-free, and vegan options. Please mention in special requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}