import React, { useState, useEffect, useContext } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye, Calendar, MapPin, CreditCard, Phone, Mail, Info } from 'lucide-react';
import axios from 'axios';
import UserContext from './UserContext';
import { OrderIdParser } from '../utils/orderIdParser';

export default function MyOrdersPage() {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [filter, setFilter] = useState('all');

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
      
      const response = await axios.get('http://localhost:4000/my-orders', { 
        withCredentials: true,
        timeout: 10000
      });
      
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
      } else {
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

  // Filter orders based on status
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // Get status badge color and icon
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
          <p className="text-gray-600 mt-2">Track and manage your cake orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Orders', count: orders.length },
                { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
                { key: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
                { key: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
                { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length }
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
              <a 
                href="/cakes" 
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                Browse Cakes
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const orderIdInfo = formatOrderIdDisplay(order.orderId);
              return (
                <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{orderIdInfo.icon}</div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Order #{orderIdInfo.displayText}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderIdInfo.colorClass}`}>
                                {orderIdInfo.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Placed on {formatDate(order.createdAt)}
                            </p>
                            {orderIdInfo.tooltip && (
                              <p className="text-xs text-gray-400 mt-1">
                                {orderIdInfo.category} order #{orderIdInfo.sequentialNumber} from {orderIdInfo.date}
                              </p>
                            )}
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
                        <span>{order.customerInfo.address.city}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => viewOrderDetails(order)}
                      className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
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
                    return (
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">{orderIdInfo.icon}</div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            Order Details - #{orderIdInfo.displayText}
                          </h2>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderIdInfo.colorClass}`}>
                            {orderIdInfo.category}
                          </span>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Order Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-medium">{selectedOrder.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span>{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="capitalize">{selectedOrder.paymentMethod.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Customer Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedOrder.customerInfo.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedOrder.customerInfo.phone}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p>{selectedOrder.customerInfo.address.street}</p>
                          <p>{selectedOrder.customerInfo.address.city}, {selectedOrder.customerInfo.address.postalCode}</p>
                          <p>{selectedOrder.customerInfo.address.country}</p>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Delivery Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Date:</span>
                        <span>{formatDate(selectedOrder.deliveryDate)}</span>
                      </div>
                      {selectedOrder.delivery?.timeSlotName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time Slot:</span>
                          <span>{selectedOrder.delivery.timeSlotName}</span>
                        </div>
                      )}
                      {selectedOrder.delivery?.zoneName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Zone:</span>
                          <span>{selectedOrder.delivery.zoneName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items and Pricing */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item, index) => (
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
                          <span>LKR {selectedOrder.pricing?.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        {selectedOrder.pricing?.deliveryFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Fee:</span>
                            <span>LKR {selectedOrder.pricing.deliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedOrder.pricing?.tax > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax:</span>
                            <span>LKR {selectedOrder.pricing.tax.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedOrder.pricing?.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-LKR {selectedOrder.pricing.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                          <span>Total:</span>
                          <span>LKR {selectedOrder.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {selectedOrder.specialInstructions && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Special Instructions</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {selectedOrder.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
