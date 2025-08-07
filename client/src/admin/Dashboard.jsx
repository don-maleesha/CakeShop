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
  TrendingUp 
} from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 125,
    totalRevenue: 8750,
    customOrders: 23,
    contactMessages: 0,
    totalProducts: 45,
    activeCoupons: 8
  });

  useEffect(() => {
    fetchContactStats();
  }, []);

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

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'order',
      message: 'New order #1234 received from John Doe',
      time: '2 minutes ago'
    },
    {
      id: 2,
      type: 'custom',
      message: 'Custom cake order for wedding celebration',
      time: '15 minutes ago'
    },
    {
      id: 3,
      type: 'contact',
      message: 'New contact message: Payment issue',
      time: '1 hour ago'
    },
    {
      id: 4,
      type: 'order',
      message: 'Order #1233 completed and shipped',
      time: '2 hours ago'
    }
  ]);

  useEffect(() => {
    fetchContactStats();
    fetchRecentContacts();
  }, []);

  const fetchRecentContacts = async () => {
    try {
      const response = await axios.get('http://localhost:4000/contact');
      if (response.data.success) {
        const recentContacts = response.data.contacts
          .slice(0, 2)
          .map(contact => ({
            id: contact._id,
            type: 'contact',
            message: `New message from ${contact.customerName}: ${contact.subject}`,
            time: new Date(contact.createdAt).toLocaleString()
          }));
        
        setRecentActivity(prev => [
          ...recentContacts,
          ...prev.filter(activity => activity.type !== 'contact').slice(0, 2)
        ]);
      }
    } catch (error) {
      console.error('Error fetching recent contacts:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="mt-4 flex items-center text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm">+12% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
              <p className="text-gray-600">Total Revenue</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm">+8% from last month</span>
          </div>
        </div>

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
          <div className="mt-4">
            <Link
              to="/admin/products"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Manage products →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCoupons}</p>
              <p className="text-gray-600">Active Coupons</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Tag className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/coupons"
              className="text-sm text-red-600 hover:text-red-800"
            >
              Manage coupons →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
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
                {activity.type === 'support' && <MessageCircle className="w-4 h-4 text-orange-600" />}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{activity.message}</p>
                <p className="text-gray-500 text-sm">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div> 
    </div>
  );
}

export default Dashboard;
