import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  IoCalendar, 
  IoMail, 
  IoCall, 
  IoCheckmarkCircle, 
  IoCloseCircle,
  IoTime,
  IoCash,
  IoEye,
  IoSend
} from 'react-icons/io5';
import { showSuccess, showError, showWarning } from '../utils/toast';

const CustomOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:4000/custom-orders');
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error fetching custom orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, estimatedPrice = null, advanceAmount = null, adminNotes = null) => {
    setActionLoading(true);
    try {
      const updateData = { 
        status: newStatus,
        adminNotes: adminNotes
      };
      
      if (estimatedPrice !== null) {
        updateData.estimatedPrice = estimatedPrice;
      }
      
      if (advanceAmount !== null && advanceAmount > 0) {
        updateData.advanceAmount = advanceAmount;
        updateData.advancePaymentStatus = 'pending';
      }

      const response = await axios.put(`http://localhost:4000/custom-orders/${orderId}`, updateData);
      
      if (response.data.success) {
        await fetchOrders();
        
        // If confirming with advance payment, automatically send email
        if (newStatus === 'confirmed' && advanceAmount > 0) {
          const updatedOrder = response.data.order;
          try {
            const emailResponse = await axios.post(`http://localhost:4000/custom-orders/${updatedOrder._id}/notify`, {
              subject: `Advance Payment Required - Custom Order ${updatedOrder.orderId}`,
              message: 'Auto-generated beautiful email'
            });
            
            if (emailResponse.data.success) {
              showSuccess('Order updated successfully and payment notification email sent!');
            } else {
              showWarning('Order updated successfully, but failed to send email notification.');
            }
          } catch (emailError) {
            console.error('Email sending error:', emailError);
            showWarning('Order updated successfully, but failed to send email notification.');
          }
        } else {
          showSuccess('Order updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showError('Failed to update order');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusStyles = {
      not_required: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    const statusText = {
      not_required: 'Not Required',
      pending: 'Payment Pending',
      paid: 'Paid',
      failed: 'Failed'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Custom Order Management</h1>
        <div className="text-sm text-gray-500">
          Total Orders: {orders.length}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Order #{order.orderId}</h3>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <div className="mt-1">
                    {getPaymentStatusBadge(order.advancePaymentStatus)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <IoCalendar className="w-4 h-4 mr-2 text-red-500" />
                  <span>Event: {order.eventType}</span>
                </div>
                <div className="flex items-center">
                  <IoTime className="w-4 h-4 mr-2 text-red-500" />
                  <span>Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <IoMail className="w-4 h-4 mr-2 text-red-500" />
                  <span>{order.customerEmail}</span>
                </div>
                <div className="flex items-center">
                  <IoCall className="w-4 h-4 mr-2 text-red-500" />
                  <span>{order.customerPhone}</span>
                </div>
                {order.estimatedPrice && (
                  <div className="flex items-center">
                    <IoCash className="w-4 h-4 mr-2 text-red-500" />
                    <span>Estimated: LKR {order.estimatedPrice}</span>
                  </div>
                )}
                {order.advanceAmount > 0 && (
                  <div className="flex items-center">
                    <IoCash className="w-4 h-4 mr-2 text-green-500" />
                    <span>Advance: LKR {order.advanceAmount}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowModal(true);
                  }}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <IoEye className="w-4 h-4 mr-1" />
                  View Details
                </button>
                {order.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowModal(true);
                    }}
                    className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors flex items-center justify-center"
                  >
                    <IoCheckmarkCircle className="w-4 h-4 mr-1" />
                    Process
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No custom orders found</p>
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowModal(false);
            setSelectedOrder(null);
          }}
          onStatusUpdate={handleStatusUpdate}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onStatusUpdate, actionLoading }) => {
  const [estimatedPrice, setEstimatedPrice] = useState(order.estimatedPrice || '');
  const [advanceAmount, setAdvanceAmount] = useState(order.advanceAmount || '');
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');

  const handleConfirmOrder = () => {
    if (!estimatedPrice) {
      showWarning('Please enter estimated price');
      return;
    }
    onStatusUpdate(order._id, 'confirmed', parseFloat(estimatedPrice), parseFloat(advanceAmount) || 0, adminNotes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Order Details - #{order.orderId}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <IoCloseCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="mt-1">
                    {order.status === 'pending' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending Review
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Event Type:</span>
                  <p className="font-medium">{order.eventType}</p>
                </div>
                <div>
                  <span className="text-gray-600">Delivery Date:</span>
                  <p className="font-medium">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Cake Size:</span>
                  <p className="font-medium">{order.cakeSize}</p>
                </div>
                <div>
                  <span className="text-gray-600">Flavor:</span>
                  <p className="font-medium">{order.flavor}</p>
                </div>
              </div>
              
              {order.specialRequirements && (
                <div className="mt-4">
                  <span className="text-gray-600">Special Requirements:</span>
                  <p className="font-medium mt-1 p-3 bg-gray-50 rounded">{order.specialRequirements}</p>
                </div>
              )}
            </div>

            {/* Admin Actions */}
            {order.status === 'pending' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Admin Actions</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Price (LKR) *
                      </label>
                      <input
                        type="number"
                        value={estimatedPrice}
                        onChange={(e) => setEstimatedPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter estimated price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Advance Amount (LKR)
                      </label>
                      <input
                        type="number"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                        placeholder="Optional advance payment"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                      rows={3}
                      placeholder="Add any notes for this order..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information */}
            {order.estimatedPrice && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Estimated Price:</span>
                    <p className="font-medium">LKR {order.estimatedPrice}</p>
                  </div>
                  {order.advanceAmount > 0 && (
                    <>
                      <div>
                        <span className="text-gray-600">Advance Amount:</span>
                        <p className="font-medium">LKR {order.advanceAmount}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Advance Status:</span>
                        <div className="mt-1">
                          {order.advancePaymentStatus === 'pending' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Payment Pending
                            </span>
                          )}
                          {order.advancePaymentStatus === 'paid' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Advance Payment Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t">
              {order.status === 'pending' && (
                <>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={actionLoading}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Order'}
                  </button>
                  <button
                    onClick={() => onStatusUpdate(order._id, 'cancelled', null, null, adminNotes)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              
              {order.status === 'confirmed' && (
                <button
                  onClick={() => onStatusUpdate(order._id, 'in-progress')}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  Start Production
                </button>
              )}
              
              {order.status === 'in-progress' && (
                <button
                  onClick={() => onStatusUpdate(order._id, 'completed')}
                  disabled={actionLoading}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  Mark Completed
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomOrderManagement;
