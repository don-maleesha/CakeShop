import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiUsers } from "react-icons/hi";

// Custom Popup Component
const CustomPopup = ({ isOpen, onClose, onConfirm, type, title, message, showCancel = false }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'confirm':
        return (
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.598 0L3.218 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return { button: 'bg-green-500 hover:bg-green-600', title: 'text-green-700' };
      case 'error':
        return { button: 'bg-red-500 hover:bg-red-600', title: 'text-red-700' };
      case 'confirm':
        return { button: 'bg-yellow-500 hover:bg-yellow-600', title: 'text-yellow-700' };
      default:
        return { button: 'bg-gray-500 hover:bg-gray-600', title: 'text-gray-700' };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform animate-scaleIn">
        {getIcon()}
        
        <h3 className={`text-xl font-bold text-center mb-3 ${colors.title}`}>
          {title}
        </h3>
        
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex justify-center gap-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm || onClose}
            className={`px-6 py-2 text-white rounded-lg transition-colors duration-200 font-medium ${colors.button}`}
          >
            {showCancel ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

function Users() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    showCancel: false,
    onConfirm: null
  });
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const initializePage = async () => {
      await fetchUsers();
      setIsLoading(false);
      
      setTimeout(() => {
        setIsPageLoaded(true);
      }, 100);
    };

    initializePage();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:4000/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const showPopup = (type, title, message, showCancel = false, onConfirm = null) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      showCancel,
      onConfirm
    });
  };

  const closePopup = () => {
    setPopup({ ...popup, isOpen: false });
  };

  const handleDeleteUser = async (id, userName) => {
    showPopup(
      'confirm',
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      true,
      async () => {
        try {
          await axios.delete(`http://localhost:4000/users/${id}`);
          setUsers(users.filter(user => user._id !== id));
          showPopup('success', 'Deleted!', 'User deleted successfully');
        } catch (err) {
          console.error('Error deleting user:', err);
          showPopup('error', 'Error!', 'Failed to delete user. Please try again.');
        }
      }
    );
  };

  const handleAddUser = () => setShowModal(true);

  const handleCloseModal = () => {
    setShowModal(false);
    setUser({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const validateUserForm = () => {
    if (!user.name.trim()) {
      showPopup('error', 'Validation Error', 'Name is required');
      return false;
    }
    if (user.name.trim().length < 2) {
      showPopup('error', 'Validation Error', 'Name must be at least 2 characters long');
      return false;
    }
    if (!user.email.trim()) {
      showPopup('error', 'Validation Error', 'Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email.trim())) {
      showPopup('error', 'Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (!user.password) {
      showPopup('error', 'Validation Error', 'Password is required');
      return false;
    }
    if (user.password.length < 8) {
      showPopup('error', 'Validation Error', 'Password must be at least 8 characters long');
      return false;
    }
    if (user.password !== user.confirmPassword) {
      showPopup('error', 'Validation Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const submitUser = async () => {
    if (!validateUserForm()) {
      return;
    }

    try {
      await axios.post('http://localhost:4000/register', {
        name: user.name.trim(),
        email: user.email.trim().toLowerCase(),
        password: user.password
      });
      showPopup('success', 'Success!', 'User added successfully');
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || 'Failed to add user. Please try again.';
      showPopup('error', 'Error!', errorMessage);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserStats = () => {
    const totalUsers = users.length;
    const recentUsers = users.filter(user => {
      const userDate = new Date(user.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return userDate > weekAgo;
    }).length;

    return { totalUsers, recentUsers };
  };

  const stats = getUserStats();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-gray-50 min-h-screen transition-all duration-1000 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className={`flex justify-between items-center mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button 
          onClick={handleAddUser}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2 transform hover:scale-105 transition-all duration-200 hover:shadow-lg"
        >
          <span className="text-lg"><HiUsers /></span>
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={`flex flex-col md:flex-row gap-4 mb-6 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 focus:shadow-lg"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200 hover:scale-110">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-700 delay-400 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">{getInitials(user.name)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">ID: {user._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:text-blue-700 p-1 transform hover:scale-110 transition-all duration-200" title="Edit User">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        className="text-red-500 hover:text-red-700 p-1 transform hover:scale-110 transition-all duration-200"
                        title="Delete User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-gray-500 text-lg">No users found</p>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md mx-4 transform animate-scaleIn">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={user.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  name="password"
                  type="password"
                  value={user.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter password (min 8 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={user.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Confirm password"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitUser}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors duration-200"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Popup */}
      <CustomPopup
        isOpen={popup.isOpen}
        onClose={closePopup}
        onConfirm={popup.onConfirm}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        showCancel={popup.showCancel}
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Users;
