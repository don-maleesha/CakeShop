import React, { useState, useEffect, useContext } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye, Calendar, MapPin, CreditCard, Phone, Mail, Info } from 'lucide-react';
import axios from 'axios';
import UserContext from './UserContext';
import { OrderIdParser } from '../utils/orderIdParser';

// Premade Order Card Component
function PremadeOrderCard({ order, onViewDetails }) {
  const orderIdInfo = OrderIdParser.formatOrderIdDisplay(order.orderId);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract a simpler order number from the full order ID
  const getSimpleOrderNumber = (orderId) => {
    // Extract just the last part after the last hyphen, or use a substring
    const parts = orderId.split('-');
    if (parts.length >= 3) {
      // For format like ORD-PRM-20241026-001, take the date and number
      return parts.slice(-2).join('-');
    }
    return orderId.substring(orderId.length - 8); // Last 8 characters as fallback
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Confirmed' },
      preparing: { color: 'bg-orange-100 text-orange-800', icon: Package, text: 'Preparing' },
      ready: { color: 'bg-purple-100 text-purple-800', icon: Package, text: 'Ready' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', text: 'Refunded' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-blue-500">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{orderIdInfo.icon}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Premade Order
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    #{getSimpleOrderNumber(order.orderId)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Placed on {formatDate(order.createdAt)}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  ID: {order.orderId}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(order.status)}
            {getPaymentStatusBadge(order.paymentStatus)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* Order Items */}
          <div className="md:col-span-2">
            <h4 className="font-medium text-gray-900 mb-2">Items</h4>
            <div className="space-y-2">
              {order.items.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    🧁
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} × LKR {item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className="text-sm text-gray-500">
                  +{order.items.length - 2} more item(s)
                </p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Order Total</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>LKR {order.pricing?.subtotal?.toFixed(2) || order.totalAmount.toFixed(2)}</span>
              </div>
              {order.pricing?.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery:</span>
                  <span>LKR {order.pricing.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-gray-900 pt-1 border-t">
                <span>Total:</span>
                <span>LKR {order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Truck className="w-4 h-4" />
              <span>Delivery: {formatDate(order.deliveryDate)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{order.customerInfo.address?.city || 'N/A'}</span>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(order)}
            className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom Order Card Component
function CustomOrderCard({ order, onViewDetails }) {
  const orderIdInfo = OrderIdParser.formatOrderIdDisplay(order.orderId);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extract a simpler order number from the full order ID
  const getSimpleOrderNumber = (orderId) => {
    const parts = orderId.split('-');
    if (parts.length >= 3) {
      return parts.slice(-2).join('-');
    }
    return orderId.substring(orderId.length - 8);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending Review' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Confirmed' },
      'in-progress': { color: 'bg-orange-100 text-orange-800', icon: Package, text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getPaymentBadge = (advancePaymentStatus, advanceAmount) => {
    if (!advanceAmount || advanceAmount === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Advance Required
        </span>
      );
    }

    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Payment Pending' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Advance Paid' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Payment Failed' }
    };
    
    const config = statusConfig[advancePaymentStatus] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-purple-500">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{orderIdInfo.icon}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Custom Cake Order
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    #{getSimpleOrderNumber(order.orderId)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Placed on {formatDate(order.createdAt)}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  ID: {order.orderId}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(order.status)}
            {getPaymentBadge(order.advancePaymentStatus, order.advanceAmount)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* Custom Order Details */}
          <div className="md:col-span-2">
            <h4 className="font-medium text-gray-900 mb-2">Custom Cake Details</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                  🎂
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{order.eventType} Cake</p>
                  <p className="text-sm text-gray-500">
                    {order.cakeSize} • {order.flavor} flavor
                  </p>
                  {order.specialRequirements && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {order.specialRequirements}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Pricing</h4>
            <div className="space-y-1 text-sm">
              {order.totalAmount > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Price:</span>
                    <span>LKR {order.totalAmount.toFixed(2)}</span>
                  </div>
                  {order.advanceAmount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Advance Payment:</span>
                      <span>LKR {order.advanceAmount.toFixed(2)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  <Info className="w-4 h-4 inline mr-1" />
                  Awaiting quote
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Event Date: {formatDate(order.deliveryDate)}</span>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(order)}
            className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Premade Order Details Component (for modal)
function PremadeOrderDetails({ order, getStatusBadge, getPaymentStatusBadge, formatDate }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Order Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium">{order.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Order Date:</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            {getStatusBadge(order.status, 'premade')}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Status:</span>
            {getPaymentStatusBadge(order.paymentStatus)}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <span className="capitalize">{order.paymentMethod?.replace('_', ' ') || 'N/A'}</span>
          </div>
        </div>

        {/* Customer Information */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Customer Information</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{order.customerInfo.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{order.customerInfo.phone}</span>
          </div>
          {order.customerInfo.address && (
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p>{order.customerInfo.address.street}</p>
                <p>{order.customerInfo.address.city}, {order.customerInfo.address.postalCode}</p>
                <p>{order.customerInfo.address.country}</p>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Information */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Delivery Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Date:</span>
            <span>{formatDate(order.deliveryDate)}</span>
          </div>
          {order.delivery?.timeSlotName && (
            <div className="flex justify-between">
              <span className="text-gray-600">Time Slot:</span>
              <span>{order.delivery.timeSlotName}</span>
            </div>
          )}
          {order.delivery?.zoneName && (
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Zone:</span>
              <span>{order.delivery.zoneName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Items and Pricing */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                🧁
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600">
                  LKR {item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">LKR {item.subtotal.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>LKR {order.pricing?.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            {order.pricing?.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span>LKR {order.pricing.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {order.pricing?.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span>LKR {order.pricing.tax.toFixed(2)}</span>
              </div>
            )}
            {order.pricing?.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-LKR {order.pricing.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
              <span>Total:</span>
              <span>LKR {order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-2">Special Instructions</h4>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
              {order.specialInstructions}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Order Details Component (for modal)
function CustomOrderDetails({ order, getStatusBadge, formatDate }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Order Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium">{order.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Order Date:</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            {getStatusBadge(order.status, 'custom')}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Event Type:</span>
            <span className="font-medium">{order.eventType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Event Date:</span>
            <span>{formatDate(order.deliveryDate)}</span>
          </div>
        </div>

        {/* Customer Information */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Customer Information</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{order.customerInfo.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{order.customerInfo.phone}</span>
          </div>
        </div>

        {/* Payment Information */}
        {order.totalAmount > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Payment Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Price:</span>
                <span className="font-medium">LKR {order.totalAmount.toFixed(2)}</span>
              </div>
              {order.advanceAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance Payment:</span>
                    <span className="font-medium text-orange-600">LKR {order.advanceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.advancePaymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : order.advancePaymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.advancePaymentStatus === 'paid' ? 'Paid' : order.advancePaymentStatus === 'pending' ? 'Pending' : 'Failed'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Custom Cake Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Cake Details</h3>
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="text-3xl">🎂</div>
              <div>
                <p className="font-semibold text-gray-900">{order.eventType} Cake</p>
                <p className="text-sm text-gray-600">{order.flavor} flavor</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cake Size:</span>
                <span className="font-medium">{order.cakeSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Flavor:</span>
                <span className="font-medium">{order.flavor}</span>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          {order.specialRequirements && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Special Requirements</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                {order.specialRequirements}
              </p>
            </div>
          )}

          {/* Admin Notes */}
          {order.adminNotes && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Admin Notes</h4>
              <p className="text-gray-600 bg-blue-50 p-3 rounded-lg text-sm">
                {order.adminNotes}
              </p>
            </div>
          )}

          {/* Status Timeline Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Order Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Placed:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.totalAmount > 0 && order.status === 'pending' && (
                <div className="text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
                  <Info className="w-4 h-4 inline mr-1" />
                  Awaiting admin review and quote
                </div>
              )}
              {order.status === 'confirmed' && order.advanceAmount > 0 && order.advancePaymentStatus === 'pending' && (
                <div className="text-orange-700 bg-orange-50 p-2 rounded mt-2">
                  <Info className="w-4 h-4 inline mr-1" />
                  Please complete advance payment to proceed
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [orderType, setOrderType] = useState('all'); // 'all', 'premade', 'custom'

  // Fetch user orders
  useEffect(() => {
    if (!user) {
      setError('Please log in to view your orders');
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch both premade and custom orders in parallel
      const [premadeResponse, customResponse] = await Promise.all([
        axios.get('http://localhost:4000/my-orders', { 
          withCredentials: true,
          timeout: 10000
        }),
        axios.get(`http://localhost:4000/my-custom-orders?email=${encodeURIComponent(user.email)}`, { 
          timeout: 10000
        })
      ]);
      
      if (premadeResponse.data.success) {
        setOrders(premadeResponse.data.data.orders || []);
      } else {
        console.error('Failed to fetch premade orders');
      }

      if (customResponse.data.success) {
        setCustomOrders(customResponse.data.orders || []);
      } else {
        console.error('Failed to fetch custom orders');
      }
      
      // Only show error if both requests fail
      if (!premadeResponse.data.success && !customResponse.data.success) {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout - server may be unavailable');
      } else if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        setError('Cannot connect to server - please ensure the API server is running');
      } else {
        setError('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on status and order type
  const getFilteredOrders = () => {
    let allOrders = [];
    
    // Convert custom orders to a similar format as premade orders for unified display
    const normalizedCustomOrders = customOrders.map(order => ({
      ...order,
      _id: order._id,
      orderId: order.orderId,
      orderType: 'custom',
      status: order.status,
      totalAmount: order.estimatedPrice || 0,
      createdAt: order.createdAt,
      deliveryDate: order.deliveryDate,
      customerInfo: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone
      },
      // Custom order specific fields
      eventType: order.eventType,
      cakeSize: order.cakeSize,
      flavor: order.flavor,
      specialRequirements: order.specialRequirements,
      advanceAmount: order.advanceAmount,
      advancePaymentStatus: order.advancePaymentStatus
    }));

    const normalizedPremadeOrders = orders.map(order => ({
      ...order,
      orderType: 'premade'
    }));

    // Combine based on orderType filter
    if (orderType === 'all') {
      allOrders = [...normalizedPremadeOrders, ...normalizedCustomOrders];
    } else if (orderType === 'premade') {
      allOrders = normalizedPremadeOrders;
    } else if (orderType === 'custom') {
      allOrders = normalizedCustomOrders;
    }

    // Sort by creation date (newest first)
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter by status
    if (filter === 'all') {
      return allOrders;
    }
    
    return allOrders.filter(order => {
      // Map custom order statuses to match premade order statuses where applicable
      const mappedStatus = order.orderType === 'custom' ? mapCustomStatus(order.status) : order.status;
      return mappedStatus === filter;
    });
  };

  // Map custom order statuses to premade order statuses for filtering
  const mapCustomStatus = (status) => {
    const statusMap = {
      'pending': 'pending',
      'confirmed': 'confirmed',
      'in-progress': 'preparing',
      'completed': 'delivered',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || status;
  };

  const filteredOrders = getFilteredOrders();

  // Get status badge color and icon
  const getStatusBadge = (status, orderType = 'premade') => {
    if (orderType === 'custom') {
      const statusConfig = {
        pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending Review' },
        confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Confirmed' },
        'in-progress': { color: 'bg-orange-100 text-orange-800', icon: Package, text: 'In Progress' },
        completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' },
        cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' }
      };
      
      const config = statusConfig[status] || statusConfig.pending;
      const IconComponent = config.icon;
      
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          <IconComponent className="w-3 h-3 mr-1" />
          {config.text}
        </span>
      );
    } else {
      const statusConfig = {
        pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
        confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Confirmed' },
        preparing: { color: 'bg-orange-100 text-orange-800', icon: Package, text: 'Preparing' },
        ready: { color: 'bg-purple-100 text-purple-800', icon: Package, text: 'Ready' },
        delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Delivered' },
        cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' }
      };
      
      const config = statusConfig[status] || statusConfig.pending;
      const IconComponent = config.icon;
      
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          <IconComponent className="w-3 h-3 mr-1" />
          {config.text}
        </span>
      );
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', text: 'Refunded' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Open order details modal
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Close order details modal
  const closeOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
  };

  // Format order ID for display
  const formatOrderIdDisplay = (orderId) => {
    return OrderIdParser.formatOrderIdDisplay(orderId);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            {error}
          </div>
          <button 
            onClick={fetchOrders}
            className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage all your cake orders - both premade and custom</p>
        </div>

        {/* Order Type Filter */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex space-x-1">
            <button
              onClick={() => setOrderType('all')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                orderType === 'all'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Orders ({orders.length + customOrders.length})
            </button>
            <button
              onClick={() => setOrderType('premade')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                orderType === 'premade'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Premade Orders ({orders.length})
            </button>
            <button
              onClick={() => setOrderType('custom')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                orderType === 'custom'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Custom Orders ({customOrders.length})
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Status', count: getFilteredOrders().length },
                { key: 'pending', label: 'Pending', count: getFilteredOrders().filter(o => {
                  const status = o.orderType === 'custom' ? mapCustomStatus(o.status) : o.status;
                  return status === 'pending';
                }).length },
                { key: 'confirmed', label: 'Confirmed', count: getFilteredOrders().filter(o => {
                  const status = o.orderType === 'custom' ? mapCustomStatus(o.status) : o.status;
                  return status === 'confirmed';
                }).length },
                { key: 'preparing', label: 'Preparing', count: getFilteredOrders().filter(o => {
                  const status = o.orderType === 'custom' ? mapCustomStatus(o.status) : o.status;
                  return status === 'preparing';
                }).length },
                { key: 'delivered', label: 'Delivered', count: getFilteredOrders().filter(o => {
                  const status = o.orderType === 'custom' ? mapCustomStatus(o.status) : o.status;
                  return status === 'delivered';
                }).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </h3>
            <p className="mt-2 text-gray-500">
              {filter === 'all' 
                ? 'Start by browsing our delicious cake collection!'
                : `You don't have any ${filter} orders at the moment.`
              }
            </p>
            {filter === 'all' && (
              <div className="mt-4 space-x-4">
                <a 
                  href="/cakes" 
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                >
                  Browse Cakes
                </a>
                <a 
                  href="/custom-order" 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create Custom Order
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              if (order.orderType === 'custom') {
                return <CustomOrderCard key={order._id} order={order} onViewDetails={viewOrderDetails} />;
              } else {
                return <PremadeOrderCard key={order._id} order={order} onViewDetails={viewOrderDetails} />;
              }
            })}
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  {(() => {
                    const orderIdInfo = formatOrderIdDisplay(selectedOrder.orderId);
                    const getSimpleOrderNumber = (orderId) => {
                      const parts = orderId.split('-');
                      if (parts.length >= 3) {
                        return parts.slice(-2).join('-');
                      }
                      return orderId.substring(orderId.length - 8);
                    };
                    
                    return (
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">{orderIdInfo.icon}</div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            {selectedOrder.orderType === 'custom' ? 'Custom Cake Order' : 'Premade Order'} #{getSimpleOrderNumber(selectedOrder.orderId)}
                          </h2>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            Order ID: {selectedOrder.orderId}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  <button
                    onClick={closeOrderModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {selectedOrder.orderType === 'custom' ? (
                  <CustomOrderDetails order={selectedOrder} getStatusBadge={getStatusBadge} formatDate={formatDate} />
                ) : (
                  <PremadeOrderDetails order={selectedOrder} getStatusBadge={getStatusBadge} getPaymentStatusBadge={getPaymentStatusBadge} formatDate={formatDate} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
