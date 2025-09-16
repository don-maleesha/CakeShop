import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CreditCard, MapPin, User, Mail, Phone, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useDelivery } from '../contexts/DeliveryContext';
import UserContext from '../pages/UserContext';
import PayHereForm from '../components/PayHereForm';
import DeliveryProgressIndicator from '../components/DeliveryProgressIndicator';
import DeliveryZoneSelector from '../components/DeliveryZoneSelector';
import axios from 'axios';

const CheckoutPage = () => {
  const { items, cartTotal, clearCart } = useCart();
  const { 
    deliveryFee, 
    deliveryInfo, 
    freeDeliveryProgress, 
    deliveryOptions,
    updateDeliveryCalculation
    // isLoading: deliveryLoading  // Commented out until needed
  } = useDelivery();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [orderData, setOrderData] = useState({
    customerInfo: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: {
        street: '',
        city: '',
        postalCode: '',
        country: 'Sri Lanka'
      }
    },
    deliveryDate: '',
    specialInstructions: '',
    paymentMethod: 'cash_on_delivery',
    // New delivery options
    isExpress: false,
    timeSlot: 'afternoon',
    customerTier: user?.tier || 'regular'
  });

  const totalAmount = cartTotal + deliveryFee;

  // Update delivery calculation when cart or address changes
  useEffect(() => {
    updateDeliveryCalculation(
      cartTotal, 
      orderData.customerInfo.address.city,
      {
        isExpress: orderData.isExpress,
        timeSlot: orderData.timeSlot,
        customerTier: orderData.customerTier
      }
    );
  }, [
    cartTotal, 
    orderData.customerInfo.address.city, 
    orderData.isExpress, 
    orderData.timeSlot, 
    orderData.customerTier,
    updateDeliveryCalculation
  ]);

  // PayHere form handlers
  const handlePaymentSuccess = (orderId) => {
    console.log("Payment completed. OrderID:" + orderId);
    
    // Clear cart after successful payment
    clearCart();
    
    setPaymentData(null);
    navigate('/payment/success', { 
      state: { 
        orderNumber: orderId 
      } 
    });
  };

  const handlePaymentError = (error) => {
    console.log("PayHere Error: " + error);
    setPaymentData(null);
    alert('Payment error: ' + error);
    navigate('/payment/cancel');
  };

  const handlePaymentCancel = () => {
    console.log("Payment dismissed");
    setPaymentData(null);
    navigate('/payment/cancel');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'address') {
        setOrderData(prev => ({
          ...prev,
          customerInfo: {
            ...prev.customerInfo,
            address: {
              ...prev.customerInfo.address,
              [child]: value
            }
          }
        }));
      } else if (parent === 'customerInfo') {
        setOrderData(prev => ({
          ...prev,
          customerInfo: {
            ...prev.customerInfo,
            [child]: value
          }
        }));
      }
    } else {
      setOrderData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const getTimeSlotPrice = (slotId) => {
    const slot = deliveryOptions.timeSlots?.find(s => s.id === slotId);
    if (!slot || !deliveryInfo.zone) return '';
    
    if (slot.multiplier === 1.0) return '';
    
    const currentZone = {
      fee: deliveryFee / (slot.multiplier || 1) // Calculate base fee
    };
    const additionalFee = Math.round(currentZone.fee * (slot.multiplier - 1.0));
    return additionalFee > 0 ? `(+LKR ${additionalFee})` : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('=== CHECKOUT FORM SUBMITTED ===');
    console.log('Order data:', JSON.stringify(orderData, null, 2));
    console.log('Payment method selected:', orderData.paymentMethod);
    console.log('Cart items:', items);

    try {
      // Pre-validate stock availability for all items before submitting order
      console.log('Validating stock availability...');
      
      // Fetch fresh product data to ensure stock quantities are current
      const freshProductData = [];
      for (const item of items) {
        try {
          const response = await axios.get(`http://localhost:4000/products/${item.product._id}`);
          if (response.data.success) {
            freshProductData.push(response.data.data);
          } else {
            throw new Error(`Cannot fetch current data for ${item.product.name}`);
          }
        } catch (fetchError) {
          console.error('Error fetching fresh product data:', fetchError);
          throw new Error(`Cannot verify current stock for ${item.product.name}. Please refresh the page and try again.`);
        }
      }
      
      // Validate stock with fresh data
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const freshProduct = freshProductData[i];
        
        if (!freshProduct.isActive) {
          throw new Error(`${freshProduct.name} is no longer available`);
        }
        if (freshProduct.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${freshProduct.name}. Available: ${freshProduct.stockQuantity}, Requested: ${item.quantity}`);
        }
      }

      // Prepare order items in the format expected by the API
      const orderItems = items.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      }));

      const orderPayload = {
        customerInfo: orderData.customerInfo,
        items: orderItems,
        deliveryDate: orderData.deliveryDate,
        specialInstructions: orderData.specialInstructions,
        paymentMethod: orderData.paymentMethod,
        // Enhanced delivery options
        isExpress: orderData.isExpress,
        timeSlot: orderData.timeSlot,
        customerTier: orderData.customerTier
      };

      // Debug: Log the payload being sent
      console.log('Order payload being sent:', JSON.stringify(orderPayload, null, 2));

      const response = await axios.post('http://localhost:4000/orders', orderPayload);
      
      if (response.data.success) {
        console.log('Order created successfully:', response.data.data);
        
        // If online payment, use PayHere JavaScript SDK
        if (orderData.paymentMethod === 'online_transfer') {
          console.log('Online payment method detected. Initializing PayHere...');
          
          try {
            console.log('Requesting payment initialization for orderId:', response.data.data.orderId);
            
            const paymentResponse = await axios.post('http://localhost:4000/payment/initialize', {
              orderId: response.data.data.orderId
            });

            console.log('Payment response received:', paymentResponse.data);

            if (paymentResponse.data.success) {
              const paymentFormData = paymentResponse.data.data;
              console.log('Payment data received:', JSON.stringify(paymentFormData, null, 2));
              
              // Show PayHere form (don't clear cart yet - wait for payment completion)
              console.log('Setting payment data for PayHere form:', paymentFormData);
              console.log('PaymentData state before setting:', paymentData);
              setPaymentData(paymentFormData);
              console.log('setPaymentData called successfully');
              
              // Debug: Check if paymentData state was set
              setTimeout(() => {
                console.log('PaymentData state after setting (delayed check):', paymentData);
              }, 100);
              
              return;
            } else {
              throw new Error(paymentResponse.data.error || 'Failed to initialize payment');
            }
          } catch (paymentError) {
            console.error('Payment initialization error:', paymentError);
            const errorMessage = paymentError.response?.data?.error ||
              paymentError.message ||
              'Failed to initialize payment. Please try again.';
            alert('Payment initialization failed: ' + errorMessage);
            return;
          }
        } else {
          console.log('Cash on delivery method selected');
          // Clear cart after successful cash on delivery order
          clearCart();
          // Redirect to order confirmation
          navigate('/order-confirmation', {
            state: {
              order: response.data.data,
              orderNumber: response.data.data.orderId
            }
          });
        }
      }
    } catch (error) {
      console.error('Order submission error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to place order. Please try again.';
      
      alert(`Order failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Minimum delivery date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious cakes to proceed with checkout.</p>
          <button
            onClick={() => navigate('/cakes')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Browse Cakes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Information & Delivery */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h2>
                
                {/* Name and Email - closely related contact info */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="customerInfo.name"
                        value={orderData.customerInfo.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="customerInfo.email"
                        value={orderData.customerInfo.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  
                  {/* Phone number - related to contact info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="customerInfo.phone"
                      value={orderData.customerInfo.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* Member Benefits for Non-Registered Users */}
                {!user && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-800 mb-2">🎉 Create an account and save!</h3>
                        <div className="space-y-1 text-xs text-red-700">
                          <p>✓ <strong>5% discount</strong> on this order (Save LKR {(totalAmount * 0.05).toFixed(2)})</p>
                          <p>✓ <strong>Faster checkout</strong> - save your details for next time</p>
                          <p>✓ <strong>Order history</strong> - track all your orders</p>
                          <p>✓ <strong>Exclusive offers</strong> - member-only deals and early access</p>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <button
                            type="button"
                            onClick={() => navigate('/register', { 
                              state: { returnTo: '/checkout', cartItems: items } 
                            })}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                          >
                            Create Account
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/login', { 
                              state: { returnTo: '/checkout' } 
                            })}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                          >
                            Login
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Delivery Address
                </h2>
                
                {/* Street Address first - main address field */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={orderData.customerInfo.address.street}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="Enter street address"
                    />
                  </div>
                  
                  {/* City and Postal Code - location details grouped together */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={orderData.customerInfo.address.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter city"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="address.postalCode"
                        value={orderData.customerInfo.address.postalCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>

                  {/* Country - less important, at the end */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={orderData.customerInfo.address.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 transition-all"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Delivery Options
                </h2>
                
                {/* Zone selector and delivery options grouped together */}
                <div className="space-y-4">
                  <DeliveryZoneSelector
                    selectedCity={orderData.customerInfo.address.city}
                    onCityChange={(city) => handleInputChange({ target: { name: 'address.city', value: city } })}
                    selectedTimeSlot={orderData.timeSlot}
                    onTimeSlotChange={(timeSlot) => setOrderData(prev => ({ ...prev, timeSlot }))}
                    isExpressDelivery={orderData.isExpress}
                    onExpressChange={(isExpress) => setOrderData(prev => ({ ...prev, isExpress }))}
                    showTimeSlots={false}
                    showExpressOptions={true}
                  />
                </div>
              </div>

              {/* Free Delivery Progress */}
              {cartTotal > 0 && (
                <DeliveryProgressIndicator
                  progress={freeDeliveryProgress.progress}
                  isEligible={freeDeliveryProgress.isEligible}
                  remaining={freeDeliveryProgress.remaining}
                  threshold={freeDeliveryProgress.threshold}
                  zoneName={deliveryInfo.zoneName}
                  deliveryFee={deliveryFee}
                  savings={deliveryInfo.savings}
                />
              )}

              {/* Delivery Schedule & Instructions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Delivery Schedule
                </h2>
                
                <div className="space-y-4">
                  {/* Delivery date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Delivery Date *
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={orderData.deliveryDate}
                      onChange={handleInputChange}
                      required
                      min={minDate}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Preferred Delivery Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Preferred Delivery Time *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {deliveryOptions.timeSlots && deliveryOptions.timeSlots
                        .filter(slot => !slot.isExpressSlot) // Filter out express delivery slots
                        .map((slot) => (
                        <label
                          key={slot.id}
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all"
                        >
                          <input
                            type="radio"
                            name="timeSlot"
                            value={slot.id}
                            checked={orderData.timeSlot === slot.id}
                            onChange={(e) => setOrderData(prev => ({ ...prev, timeSlot: e.target.value }))}
                            className="text-red-600 focus:ring-red-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{slot.name}</span>
                              {slot.multiplier > 1.0 && (
                                <span className="text-sm text-orange-600 font-medium">
                                  {getTimeSlotPrice(slot.id)}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Special instructions - related to delivery */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Special Instructions
                    </label>
                    <textarea
                      name="specialInstructions"
                      value={orderData.specialInstructions}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                      placeholder="Any special delivery instructions or notes..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Method
                </h2>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={orderData.paymentMethod === 'cash_on_delivery'}
                      onChange={handleInputChange}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-3 font-medium">Cash on Delivery</span>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online_transfer"
                      checked={orderData.paymentMethod === 'online_transfer'}
                      onChange={handleInputChange}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-3 font-medium">Online Transfer (PayHere)</span>

                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                {/* Order Items */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.key} className="flex items-center space-x-3">
                      <img
                        src={item.product.images?.[0] || '/placeholder-cake.jpg'}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </p>
                        {item.selectedSize && (
                          <p className="text-xs text-gray-500">{item.selectedSize.name}</p>
                        )}
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        LKR {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Pricing */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">LKR {cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-gray-900">
                      {deliveryFee === 0 ? 'Free' : `LKR ${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-red-600">LKR {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
                
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure & Safe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* PayHere Payment Form */}
        {paymentData && (
          <PayHereForm
            paymentData={paymentData}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handlePaymentCancel}
          />
        )}

        {/* Debug info - remove in production */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded text-xs max-w-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Payment Data: {paymentData ? 'SET' : 'NULL'}</p>
            {paymentData && <p>Order ID: {paymentData.order_id}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
