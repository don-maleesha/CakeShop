import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ContactManagement() {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch contacts when component mounts
  useEffect(() => {
    fetchContacts();
  }, []);

  // Auto-hide notification after 4 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:4000/contact');
      if (response.data.success) {
        setContacts(response.data.contacts);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      showNotification('Failed to load contacts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateContactStatus = async (contactId, newStatus, notes = '') => {
    try {
      const response = await axios.put(`http://localhost:4000/contact/${contactId}`, {
        status: newStatus,
        notes: notes
      });
      
      if (response.data.success) {
        showNotification(`Contact marked as ${newStatus}`, 'success');
        fetchContacts(); // Refresh the list
        setShowModal(false);
        setSelectedContact(null);
      }
    } catch (err) {
      console.error('Error updating contact:', err);
      showNotification('Failed to update contact status', 'error');
    }
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContact(null);
  };

  const handleReplyClick = (contact) => {
    setSelectedContact(contact);
    setShowReplyModal(true);
    setReplyMessage('');
  };

  const handleCloseReplyModal = () => {
    setShowReplyModal(false);
    setSelectedContact(null);
    setReplyMessage('');
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) {
      showNotification('Please enter a reply message', 'error');
      return;
    }

    try {
      setIsSendingReply(true);
      const response = await axios.post(`http://localhost:4000/contact/${selectedContact._id}/reply`, {
        message: replyMessage.trim(),
        adminName: 'Admin' // You can make this dynamic based on logged-in admin
      });
      
      if (response.data.success) {
        // Check if it was a mock email or real email
        const isMockEmail = response.data.emailMessageId && response.data.emailMessageId.startsWith('mock-');
        
        if (isMockEmail) {
          showNotification('📧 Reply processed! (Using mock email service - check server console for email content)', 'success');
        } else {
          showNotification('✅ Email sent successfully to ' + selectedContact.customerEmail + '!', 'success');
        }
        
        fetchContacts(); // Refresh the list
        handleCloseReplyModal();
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      
      // Show more detailed error messages based on response
      if (err.response?.data?.error) {
        const errorMsg = err.response.data.error;
        if (errorMsg.includes('verification failed')) {
          showNotification('❌ Email setup required. Check server console for configuration steps.', 'error');
        } else if (errorMsg.includes('Authentication')) {
          showNotification('❌ Email authentication failed. Please check Gmail credentials in server .env file.', 'error');
        } else {
          showNotification('❌ Failed to send reply: ' + errorMsg, 'error');
        }
      } else {
        showNotification('❌ Failed to send reply. Please try again.', 'error');
      }
    } finally {
      setIsSendingReply(false);
    }
  };

  // Filter contacts based on search term and status
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'in-progress':
        return '🔄';
      case 'resolved':
        return '✅';
      default:
        return '📩';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-500 transform ${
          notification.type === 'success' 
            ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
            : 'bg-red-100 border-l-4 border-red-500 text-red-700'
        }`}>
          <div className="flex items-center">
            <div className="mr-3">
              {notification.type === 'success' ? (
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <p className="font-medium">{notification.message}</p>
            <button 
              onClick={() => setNotification(prev => ({...prev, show: false}))}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Page Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 z-40 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading contacts...</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contact Messages</h1>
        <button
          onClick={fetchContacts}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {isLoading ? 'Loading...' : 'No contacts found'}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contact.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {contact.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                          <span className="mr-1">{getStatusIcon(contact.status)}</span>
                          {contact.status || 'pending'}
                        </span>
                        {contact.repliedAt && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                            ✉️ Replied
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleContactClick(contact)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="View Details"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleReplyClick(contact)}
                        className={`${
                          contact.repliedAt 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={contact.repliedAt ? 'Already replied' : 'Send Reply Email'}
                        disabled={contact.repliedAt}
                      >
                        {contact.repliedAt ? 'Already Replied' : 'Send Reply'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Details Modal */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-screen overflow-y-auto transform transition-all duration-500 scale-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Contact Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <p className="text-gray-900">{selectedContact.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedContact.customerEmail}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <p className="text-gray-900">{selectedContact.subject}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedContact.status)}`}>
                    <span className="mr-1">{getStatusIcon(selectedContact.status)}</span>
                    {selectedContact.status || 'pending'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Submitted</label>
                  <p className="text-gray-900">{new Date(selectedContact.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedContact.ticketId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket ID</label>
                  <p className="text-gray-900">#{selectedContact.ticketId}</p>
                </div>
              )}

              {selectedContact.repliedAt && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <h4 className="font-medium text-blue-900 mb-2">📧 Reply Sent</h4>
                  <div className="text-sm text-blue-800">
                    <p><strong>Replied by:</strong> {selectedContact.repliedBy || 'Admin'}</p>
                    <p><strong>Reply date:</strong> {new Date(selectedContact.repliedAt).toLocaleString()}</p>
                    {selectedContact.notes && (
                      <div className="mt-2">
                        <strong>Admin notes:</strong>
                        <p className="mt-1 text-blue-700">{selectedContact.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t mt-6">
              <div className="flex gap-2">
                <button
                  onClick={() => updateContactStatus(selectedContact._id, 'pending')}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                >
                  Mark Pending
                </button>
                <button
                  onClick={() => updateContactStatus(selectedContact._id, 'in-progress')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  In Progress
                </button>
                <button
                  onClick={() => updateContactStatus(selectedContact._id, 'resolved')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Mark Resolved
                </button>
              </div>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-screen overflow-y-auto transform transition-all duration-500 scale-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">✉️ Send Reply Email</h2>
              <button
                onClick={handleCloseReplyModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contact Info Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Customer:</span>
                  <p className="text-gray-900">{selectedContact.customerName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{selectedContact.customerEmail}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Subject:</span>
                  <p className="text-gray-900">{selectedContact.subject}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Original Message:</span>
                  <div className="bg-white p-3 rounded border mt-1">
                    <p className="text-gray-900 text-sm">{selectedContact.message}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reply Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reply Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Type your reply message here..."
                  disabled={isSendingReply}
                />
                <p className="text-sm text-gray-500 mt-1">
                  This message will be sent to {selectedContact.customerEmail} as a professional email reply.
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t mt-6">
              <div className="text-sm text-gray-600">
                📧 Email will be sent to: <strong>{selectedContact.customerEmail}</strong>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseReplyModal}
                  disabled={isSendingReply}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={sendReply}
                  disabled={isSendingReply || !replyMessage.trim()}
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSendingReply && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isSendingReply ? 'Sending...' : '📤 Send Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactManagement;
