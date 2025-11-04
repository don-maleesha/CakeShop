import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package,
  Users, Calendar, Activity, AlertCircle, RefreshCw
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  // State for different analytics data
  const [salesData, setSalesData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [customOrderData, setCustomOrderData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSalesAnalytics(),
        fetchOrderAnalytics(),
        fetchProductAnalytics(),
        fetchCustomerAnalytics(),
        fetchCustomOrderAnalytics(),
        fetchComparisonAnalytics()
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/analytics/sales?period=${period}`);
      if (response.data.success) {
        setSalesData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
    }
  };

  const fetchOrderAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/analytics/orders?period=${period}`);
      if (response.data.success) {
        setOrderData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order analytics:', error);
    }
  };

  const fetchProductAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/analytics/products?period=${period}`);
      if (response.data.success) {
        setProductData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching product analytics:', error);
    }
  };

  const fetchCustomerAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/analytics/customers?period=${period}`);
      if (response.data.success) {
        setCustomerData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
    }
  };

  const fetchCustomOrderAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/analytics/custom-orders?period=${period}`);
      if (response.data.success) {
        setCustomOrderData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching custom order analytics:', error);
    }
  };

  const fetchComparisonAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/analytics/comparison?period=${period}`);
      if (response.data.success) {
        setComparisonData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching comparison analytics:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${Math.round(amount).toLocaleString()}`;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Comprehensive business insights and metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Comparison Cards */}
      {comparisonData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(comparisonData.current.revenue)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
            <div className={`mt-4 flex items-center ${comparisonData.growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {comparisonData.growth.revenue >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span className="text-sm font-medium">{Math.abs(comparisonData.growth.revenue).toFixed(1)}% vs previous period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{comparisonData.current.orders}</p>
              </div>
              <ShoppingBag className="w-10 h-10 text-blue-500" />
            </div>
            <div className={`mt-4 flex items-center ${comparisonData.growth.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {comparisonData.growth.orders >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span className="text-sm font-medium">{Math.abs(comparisonData.growth.orders).toFixed(1)}% vs previous period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(comparisonData.current.averageOrder)}</p>
              </div>
              <Activity className="w-10 h-10 text-purple-500" />
            </div>
            <div className={`mt-4 flex items-center ${comparisonData.growth.averageOrder >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {comparisonData.growth.averageOrder >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span className="text-sm font-medium">{Math.abs(comparisonData.growth.averageOrder).toFixed(1)}% vs previous period</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['overview', 'sales', 'orders', 'products', 'customers', 'custom-orders'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Business Overview</h2>
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {salesData && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <p className="text-sm text-green-700">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(salesData.summary.totalRevenue)}</p>
                  </div>
                )}
                {orderData && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-900">{orderData.summary.totalOrders}</p>
                  </div>
                )}
                {customerData && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <p className="text-sm text-purple-700">Total Customers</p>
                    <p className="text-2xl font-bold text-purple-900">{customerData.summary.totalUsers}</p>
                  </div>
                )}
                {productData && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                    <p className="text-sm text-orange-700">Active Products</p>
                    <p className="text-2xl font-bold text-orange-900">{productData.summary.activeProducts}</p>
                  </div>
                )}
              </div>

              {/* Order Status Distribution */}
              {orderData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.keys(orderData.statusDistribution).map((key) => ({
                          name: key.charAt(0).toUpperCase() + key.slice(1),
                          value: orderData.statusDistribution[key]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(orderData.statusDistribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && salesData && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Sales Analytics</h2>
              
              {/* Sales Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(salesData.summary.totalRevenue)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Average Order Value</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(salesData.summary.averageOrderValue)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-700">Custom Orders Revenue</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(salesData.summary.customOrderRevenue)}</p>
                </div>
              </div>

              {/* Revenue Trends */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData.revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="orderCount" stroke="#3B82F6" strokeWidth={2} name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue by Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Revenue by Payment Method</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.keys(salesData.revenueByPaymentMethod).map((key) => ({
                          name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          value: salesData.revenueByPaymentMethod[key]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(salesData.revenueByPaymentMethod).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Order Value Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.keys(salesData.orderValueDistribution).map((key) => ({
                      range: key,
                      count: salesData.orderValueDistribution[key]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && orderData && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Order Analytics</h2>
              
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-900">{orderData.summary.totalOrders}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{orderData.summary.completedOrders}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700">Completion Rate</p>
                  <p className="text-2xl font-bold text-yellow-900">{orderData.summary.completionRate}%</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-700">Cancellation Rate</p>
                  <p className="text-2xl font-bold text-red-900">{orderData.summary.cancellationRate}%</p>
                </div>
              </div>

              {/* Orders by Day of Week */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Orders by Day of Week</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.keys(orderData.ordersByDayOfWeek).map((key) => ({
                    day: key,
                    orders: orderData.ordersByDayOfWeek[key]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Delivery Zones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Delivery Zones</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.keys(orderData.deliveryZones).map((key) => ({
                          name: key,
                          value: orderData.deliveryZones[key]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(orderData.deliveryZones).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Delivery Types</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.keys(orderData.deliveryTypes).map((key) => ({
                      type: key.charAt(0).toUpperCase() + key.slice(1),
                      count: orderData.deliveryTypes[key]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && productData && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Product Analytics</h2>
              
              {/* Product Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">{productData.summary.totalProducts}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">Active Products</p>
                  <p className="text-2xl font-bold text-green-900">{productData.summary.activeProducts}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-700">Low Stock</p>
                  <p className="text-2xl font-bold text-red-900">{productData.summary.lowStockCount}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700">Featured</p>
                  <p className="text-2xl font-bold text-yellow-900">{productData.summary.featuredCount}</p>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Top 10 Selling Products (by Quantity)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sold Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productData.topSellingByQuantity.map((product) => (
                        <tr key={product._id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.soldCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Revenue Products */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Top 10 Products by Revenue</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productData.topByRevenue.map((product) => (
                        <tr key={product._id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.revenue)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category Revenue */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.keys(productData.categoryRevenue).map((key) => ({
                    category: key,
                    revenue: productData.categoryRevenue[key]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Low Stock Alert */}
              {productData.lowStockProducts.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-semibold text-red-900">Low Stock Alert</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-red-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Category</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Current Stock</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Threshold</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-200">
                        {productData.lowStockProducts.map((product) => (
                          <tr key={product._id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-red-900">{product.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-red-700">{product.category}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-red-900">{product.stockQuantity}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-red-700">{product.lowStockThreshold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && customerData && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Customer Analytics</h2>
              
              {/* Customer Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900">{customerData.summary.totalUsers}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">New Users</p>
                  <p className="text-2xl font-bold text-green-900">{customerData.summary.newUsers}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-700">Returning Customers</p>
                  <p className="text-2xl font-bold text-purple-900">{customerData.summary.returningCustomers}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700">Retention Rate</p>
                  <p className="text-2xl font-bold text-yellow-900">{customerData.summary.retentionRate}%</p>
                </div>
              </div>

              {/* Top Customers */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Top 10 Customers by Revenue</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customerData.topCustomers.map((customer) => (
                        <tr key={customer._id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(customer.totalRevenue)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{customer.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Location Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Orders by Location</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.keys(customerData.locationDistribution).slice(0, 8).map((key) => ({
                          name: key,
                          value: customerData.locationDistribution[key]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(customerData.locationDistribution).slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Order Frequency</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.keys(customerData.orderFrequency).map((key) => ({
                      orders: key,
                      customers: customerData.orderFrequency[key]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="orders" label={{ value: 'Number of Orders', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Number of Customers', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="customers" fill="#EC4899" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Guest vs Registered */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Guest vs Registered Orders</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-100 rounded-lg">
                    <p className="text-3xl font-bold text-blue-900">{customerData.summary.registeredOrders}</p>
                    <p className="text-sm text-blue-700">Registered User Orders</p>
                  </div>
                  <div className="text-center p-4 bg-gray-200 rounded-lg">
                    <p className="text-3xl font-bold text-gray-900">{customerData.summary.guestOrders}</p>
                    <p className="text-sm text-gray-700">Guest Orders</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Orders Tab */}
          {activeTab === 'custom-orders' && customOrderData && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Custom Order Analytics</h2>
              
              {/* Custom Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-700">Total Custom Orders</p>
                  <p className="text-2xl font-bold text-purple-900">{customOrderData.summary.totalCustomOrders}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{customOrderData.summary.completedOrders}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Conversion Rate</p>
                  <p className="text-2xl font-bold text-blue-900">{customOrderData.summary.conversionRate}%</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700">Avg Lead Time</p>
                  <p className="text-2xl font-bold text-yellow-900">{customOrderData.summary.averageLeadTime} days</p>
                </div>
              </div>

              {/* Revenue Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">Advance Payment Revenue</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(customOrderData.summary.advanceRevenue)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Average Order Price</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(customOrderData.summary.averagePrice)}</p>
                </div>
              </div>

              {/* Event Type Distribution */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Orders by Event Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.keys(customOrderData.eventTypeDistribution).map((key) => ({
                    event: key,
                    count: customOrderData.eventTypeDistribution[key]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="event" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Size and Flavor Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Popular Cake Sizes</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.keys(customOrderData.sizeDistribution).map((key) => ({
                          name: key,
                          value: customOrderData.sizeDistribution[key]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(customOrderData.sizeDistribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Popular Flavors</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.keys(customOrderData.flavorDistribution).map((key) => ({
                      flavor: key,
                      count: customOrderData.flavorDistribution[key]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="flavor" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Custom Order Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.keys(customOrderData.statusDistribution).map((key) => ({
                        name: key.charAt(0).toUpperCase() + key.slice(1),
                        value: customOrderData.statusDistribution[key]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(customOrderData.statusDistribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
