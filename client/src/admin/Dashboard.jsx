import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  MessageCircle, 
  Package, 
  Tag, 
  TrendingUp,
  Users,
  AlertTriangle,
  Star
} from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    customOrders: 0,
    contactMessages: 0,
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalUsers: 0,
    featuredProducts: 0,
    pendingOrders: 0,
    averageOrderValue: 0
  });

  // Removed unused variables and functions
  // const [revenueFilter, setRevenueFilter] = useState('all');
  // const fetchProductStats function is now handled by dashboard analytics endpoint

  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchAllStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrderStats(), // This now includes product stats
        fetchCustomOrderStats(),
        fetchContactStats(),
        fetchUserStats(),
        fetchRecentActivity()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      // Use the new analytics endpoint for better performance
      const response = await axios.get('http://localhost:4000/analytics/dashboard');
      if (response.data.success) {
        const { revenue, orders, products } = response.data.data;
        
        setStats(prev => ({
          ...prev,
          totalOrders: orders.total,
          totalRevenue: revenue.total,
          paidRevenue: revenue.total,
          pendingRevenue: 0, // Will be calculated separately if needed
          pendingOrders: orders.pending,
          averageOrderValue: revenue.averageOrderValue,
          // Update product stats from the same call
          totalProducts: products.total,
          activeProducts: products.active,
          lowStockProducts: products.lowStock,
          featuredProducts: products.featured
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      // Fallback to individual API calls if analytics endpoint fails
      await fetchOrderStatsFallback();
    }
  };

  const fetchOrderStatsFallback = async () => {
    try {
      const response = await axios.get('http://localhost:4000/orders?limit=1000');
      if (response.data.success) {
        const orders = response.data.data.orders;
        
        // Separate paid and pending orders for accurate revenue calculation
        const paidOrders = orders.filter(order => order.paymentStatus === 'paid');
        const pendingOrders = orders.filter(order => order.status === 'pending');
        const pendingPaymentOrders = orders.filter(order => order.paymentStatus === 'pending');
        
        // Calculate revenues
        const paidRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const pendingRevenue = pendingPaymentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Calculate average order value (only for paid orders)
        const averageOrderValue = paidOrders.length > 0 ? paidRevenue / paidOrders.length : 0;
        
        setStats(prev => ({
          ...prev,
          totalOrders: orders.length,
          totalRevenue: Math.round(paidRevenue),
          paidRevenue: Math.round(paidRevenue),
          pendingRevenue: Math.round(pendingRevenue),
          pendingOrders: pendingOrders.length,
          averageOrderValue: Math.round(averageOrderValue)
        }));
      }
    } catch (error) {
      console.error('Error fetching order stats fallback:', error);
    }
  };

  // All stats fetching is now handled by the dashboard analytics endpoint

  const fetchCustomOrderStats = async () => {
    try {
      const response = await axios.get('http://localhost:4000/custom-orders');
      if (response.data.success) {
        setStats(prev => ({
          ...prev,
          customOrders: response.data.orders.length
        }));
      }
    } catch (error) {
      console.error('Error fetching custom order stats:', error);
    }
  };

  const fetchContactStats = async () => {
    try {
      const response = await axios.get('http://localhost:4000/contact');
      if (response.data.success) {
        const pendingMessages = response.data.contacts.filter(
          contact => contact.status === 'pending' || !contact.status
        ).length;
        
        setStats(prev => ({
          ...prev,
          contactMessages: pendingMessages
        }));
      }
    } catch (error) {
      console.error('Error fetching contact stats:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('http://localhost:4000/users');
      if (response.status === 200) {
        setStats(prev => ({
          ...prev,
          totalUsers: response.data.length
        }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const [ordersRes, contactsRes, customOrdersRes] = await Promise.all([
        axios.get('http://localhost:4000/orders?limit=3'),
        axios.get('http://localhost:4000/contact'),
        axios.get('http://localhost:4000/custom-orders')
      ]);

      const activities = [];

      // Add recent orders
      if (ordersRes.data.success) {
        const recentOrders = ordersRes.data.data.orders.slice(0, 2);
        recentOrders.forEach(order => {
          activities.push({
            id: `order-${order._id}`,
            type: 'order',
            message: `New order ${order.orderId} received from ${order.customerInfo.name}`,
            time: formatTimeAgo(order.createdAt),
            timestamp: new Date(order.createdAt)
          });
        });
      }

      // Add recent contacts
      if (contactsRes.data.success) {
        const recentContacts = contactsRes.data.contacts.slice(0, 2);
        recentContacts.forEach(contact => {
          activities.push({
            id: `contact-${contact._id}`,
            type: 'contact',
            message: `New message from ${contact.customerName}: ${contact.subject}`,
            time: formatTimeAgo(contact.createdAt),
            timestamp: new Date(contact.createdAt)
          });
        });
      }

      // Add recent custom orders
      if (customOrdersRes.data.success) {
        const recentCustomOrders = customOrdersRes.data.orders.slice(0, 2);
        recentCustomOrders.forEach(order => {
          activities.push({
            id: `custom-${order._id}`,
            type: 'custom',
            message: `Custom order ${order.orderId} for ${order.eventType} event`,
            time: formatTimeAgo(order.createdAt),
            timestamp: new Date(order.createdAt)
          });
        });
      }

      // Sort by timestamp and take the most recent 6
      activities.sort((a, b) => b.timestamp - a.timestamp);
      const sortedActivities = activities.slice(0, 6);

      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchAllStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading dashboard data...</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-gray-600">Total Orders</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-blue-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm">{stats.pendingOrders} pending orders</span>
          </div>
        </div>

        {/* Revenue - Simple Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">Rs. {stats.paidRevenue.toLocaleString()}</p>
              <p className="text-gray-600">Revenue</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm">Rs. {stats.averageOrderValue.toLocaleString()} avg order</span>
          </div>
        </div>

        {/* Custom Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.customOrders}</p>
              <p className="text-gray-600">Custom Orders</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/custom-orders"
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              View all orders →
            </Link>
          </div>
        </div>

        {/* Pending Messages */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.contactMessages}</p>
              <p className="text-gray-600">Pending Messages</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <MessageCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/contacts"
              className="text-sm text-orange-600 hover:text-orange-800"
            >
              View messages →
            </Link>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="text-gray-600">Total Products</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">{stats.activeProducts} active</span>
            <Link
              to="/admin/products"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Manage →
            </Link>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-gray-600">Total Users</p>
            </div>
            <div className="bg-teal-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/users"
              className="text-sm text-teal-600 hover:text-teal-800"
            >
              View users →
            </Link>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
              <p className="text-gray-600">Low Stock Items</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/products?filter=low-stock"
              className="text-sm text-red-600 hover:text-red-800"
            >
              Review stock →
            </Link>
          </div>
        </div>

        {/* Featured Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.featuredProducts}</p>
              <p className="text-gray-600">Featured Products</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/products?filter=featured"
              className="text-sm text-yellow-600 hover:text-yellow-800"
            >
              Manage featured →
            </Link>
          </div>
        </div>
      </div>

      {/* Revenue Analytics Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Revenue Analytics</h2>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">Financial Overview</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Revenue */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-800">Rs. {stats.paidRevenue.toLocaleString()}</p>
            <p className="text-sm text-green-600">Total Confirmed Revenue</p>
          </div>
          
          {/* Average Order Value */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-800">Rs. {stats.averageOrderValue.toLocaleString()}</p>
            <p className="text-sm text-blue-600">Average Order Value</p>
          </div>
          
          {/* Revenue per Order */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <ShoppingBag className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-800">{stats.totalOrders}</p>
            <p className="text-sm text-purple-600">Revenue Generating Orders</p>
          </div>
        </div>
        
        {/* Revenue Breakdown */}
        {stats.pendingRevenue > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="font-medium text-yellow-800">Pending Revenue</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-yellow-600">Amount Pending</p>
                <p className="text-lg font-bold text-yellow-800">Rs. {stats.pendingRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-yellow-600">Potential Total</p>
                <p className="text-lg font-bold text-yellow-800">
                  Rs. {(stats.paidRevenue + stats.pendingRevenue).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Revenue Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/admin/orders?filter=paid"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            View Paid Orders
          </Link>
          
          <Link
            to="/admin/orders?filter=pending-payment"
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Pending Payments
          </Link>
          
          <button
            onClick={() => fetchOrderStats()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh Revenue
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <button
            onClick={fetchRecentActivity}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Refresh
          </button>
        </div>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'order' ? 'bg-blue-100' :
                  activity.type === 'custom' ? 'bg-purple-100' :
                  activity.type === 'contact' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  {activity.type === 'order' && <ShoppingBag className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'custom' && <Calendar className="w-4 h-4 text-purple-600" />}
                  {activity.type === 'contact' && <MessageCircle className="w-4 h-4 text-orange-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.message}</p>
                  <p className="text-gray-500 text-sm">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity to display</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/products/new"
            className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Package className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-600 font-medium">Add Product</span>
          </Link>
          
          <Link
            to="/admin/categories"
            className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Tag className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-600 font-medium">Manage Categories</span>
          </Link>
          
          <Link
            to="/admin/orders"
            className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-purple-600 mr-2" />
            <span className="text-purple-600 font-medium">View Orders</span>
          </Link>
          
          <Link
            to="/admin/contacts"
            className="flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-orange-600 mr-2" />
            <span className="text-orange-600 font-medium">Check Messages</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
