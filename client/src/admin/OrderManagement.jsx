import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Mail,
  Phone
} from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: '',
    paymentStatus: '',
    notes: ''
  });

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', color: 'blue' },
    { value: 'preparing', label: 'Preparing', color: 'orange' },
    { value: 'ready', label: 'Ready', color: 'green' },
    { value: 'delivered', label: 'Delivered', color: 'teal' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'paid', label: 'Paid', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' },
    { value: 'refunded', label: 'Refunded', color: 'gray' }
  ];

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filterStatus, filterPaymentStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(filterStatus && { status: filterStatus }),
        ...(filterPaymentStatus && { paymentStatus: filterPaymentStatus })
      });

      const response = await axios.get(`http://localhost:4000/orders?${params}`);
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const response = await axios.get(`http://localhost:4000/orders/${orderId}`);
      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setShowOrderModal(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setEditFormData({
      status: order.status,
      paymentStatus: order.paymentStatus,
      notes: order.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateOrder = async () => {
    try {
      const response = await axios.put(
        `http://localhost:4000/orders/${selectedOrder._id}`,
        editFormData
      );
      
      if (response.data.success) {
        setShowEditModal(false);
        setSelectedOrder(null);
        fetchOrders(); // Refresh orders list
        showSuccess('Order updated successfully!');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showError('Failed to update order. Please try again.');
    }
  };

  const getStatusBadge = (status, type = 'status') => {
    const options = type === 'status' ? statusOptions : paymentStatusOptions;
    const statusConfig = options.find(opt => opt.value === status) || 
                        { label: status, color: 'gray' };
    
    const colorClasses = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
      teal: 'bg-teal-100 text-teal-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[statusConfig.color]}`}>
        {statusConfig.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => 
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage customer orders and track delivery status</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Order ID, Name, or Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Payment Status</option>
            {paymentStatusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Export Button */}
          <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerInfo.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerInfo.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.customerInfo.phone}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.paymentMethod === 'cash_on_delivery' ? 'COD' : 'Online'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.paymentStatus, 'payment')}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(order.deliveryDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.deliveryTime}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewOrder(order._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Order"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span> ({pagination.totalOrders} total orders)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Order Details - {selectedOrder.orderId}
                </h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Customer Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div>
                      <span className="font-medium">Name:</span> {selectedOrder.customerInfo.name}
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {selectedOrder.customerInfo.email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {selectedOrder.customerInfo.phone}
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-1" />
                      <div>
                        {selectedOrder.customerInfo.address.street}<br />
                        {selectedOrder.customerInfo.address.city}, {selectedOrder.customerInfo.address.postalCode}<br />
                        {selectedOrder.customerInfo.address.country}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Order Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div>
                      <span className="font-medium">Order ID:</span> {selectedOrder.orderId}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div>
                      <span className="font-medium">Payment Status:</span> {getStatusBadge(selectedOrder.paymentStatus, 'payment')}
                    </div>
                    <div>
                      <span className="font-medium">Payment Method:</span> 
                      {selectedOrder.paymentMethod === 'cash_on_delivery' ? ' Cash on Delivery' : ' Online Transfer'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">Delivery:</span> 
                      {new Date(selectedOrder.deliveryDate).toLocaleDateString()} at {selectedOrder.deliveryTime}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {formatDate(selectedOrder.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300 bg-gray-100">
                        <td colSpan="3" className="px-4 py-3 text-sm font-bold text-gray-900">Total Amount:</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatCurrency(selectedOrder.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.specialInstructions && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Special Instructions</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">{selectedOrder.specialInstructions}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Admin Notes</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    handleEditOrder(selectedOrder);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Edit Order - {selectedOrder.orderId}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={editFormData.paymentStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paymentStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add notes about this order..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderManagement;
