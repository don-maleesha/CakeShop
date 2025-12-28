import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Eye, 
  Trash2, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusCounts, setStatusCounts] = useState({});
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalReview, setModalReview] = useState(null);
  const [moderationNote, setModerationNote] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:4000/reviews/admin/all',
        {
          params: {
            page,
            limit: 20,
            status: statusFilter
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setTotalPages(response.data.data.pagination.totalPages);
        setStatusCounts(response.data.data.statusCounts);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleModerate = async (reviewId, status) => {
    try {
      const response = await axios.put(
        `http://localhost:4000/reviews/admin/${reviewId}/moderate`,
        { status, moderationNote },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setModerationNote('');
        setShowModal(false);
        setModalReview(null);
        fetchReviews();
      }
    } catch (error) {
      console.error('Error moderating review:', error);
      toast.error(error.response?.data?.message || 'Failed to moderate review');
    }
  };

  const handleBulkModerate = async (status) => {
    if (selectedReviews.length === 0) {
      toast.warning('Please select reviews to moderate');
      return;
    }

    try {
      const response = await axios.put(
        'http://localhost:4000/reviews/admin/bulk-moderate',
        { 
          reviewIds: selectedReviews, 
          status,
          moderationNote 
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedReviews([]);
        setModerationNote('');
        fetchReviews();
      }
    } catch (error) {
      console.error('Error bulk moderating:', error);
      toast.error('Failed to moderate reviews');
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      const response = await axios.delete(
        `http://localhost:4000/reviews/admin/${reviewId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Review deleted successfully');
        fetchReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const toggleSelectReview = (reviewId) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(r => r._id));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' },
      flagged: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '⚠' }
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const ReviewDetailModal = () => {
    if (!modalReview) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Review Details</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalReview(null);
                  setModerationNote('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Review Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{modalReview.user?.name}</p>
                  <p className="text-sm text-gray-600">{modalReview.user?.email}</p>
                </div>
                {getStatusBadge(modalReview.status)}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Product</p>
                <p className="font-medium">{modalReview.product?.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Rating</p>
                {renderStars(modalReview.rating)}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Title</p>
                <p className="font-medium">{modalReview.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Review</p>
                <p className="text-gray-800 whitespace-pre-wrap">{modalReview.comment}</p>
              </div>

              {modalReview.images && modalReview.images.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Images</p>
                  <div className="grid grid-cols-3 gap-2">
                    {modalReview.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => window.open(image, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Helpful Votes</p>
                  <p className="font-medium">{modalReview.helpfulVotes || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Not Helpful Votes</p>
                  <p className="font-medium">{modalReview.notHelpfulVotes || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">{formatDate(modalReview.createdAt)}</p>
                </div>
                {modalReview.isVerifiedPurchase && (
                  <div>
                    <p className="text-green-600 font-medium">✓ Verified Purchase</p>
                  </div>
                )}
              </div>

              {modalReview.moderationNote && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Moderation Note</p>
                  <p className="text-sm">{modalReview.moderationNote}</p>
                </div>
              )}
            </div>

            {/* Moderation Actions */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moderation Note (Optional)
              </label>
              <textarea
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                placeholder="Add a note about your moderation decision..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />

              <div className="flex items-center space-x-3 mt-4">
                <button
                  onClick={() => handleModerate(modalReview._id, 'approved')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => handleModerate(modalReview._id, 'rejected')}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleModerate(modalReview._id, 'flagged')}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Flag
                </button>
                <button
                  onClick={() => handleDelete(modalReview._id)}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
        <p className="text-gray-600 mt-1">Moderate and manage customer reviews</p>
      </div>

      {/* Status Counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { key: 'pending', label: 'Pending', color: 'yellow' },
          { key: 'approved', label: 'Approved', color: 'green' },
          { key: 'rejected', label: 'Rejected', color: 'red' },
          { key: 'flagged', label: 'Flagged', color: 'orange' }
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => {
              setStatusFilter(statusFilter === key ? 'all' : key);
              setPage(1);
            }}
            className={`p-4 rounded-lg border-2 transition-all ${
              statusFilter === key
                ? `border-${color}-500 bg-${color}-50`
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{statusCounts[key] || 0}</p>
            <p className="text-sm text-gray-600">{label}</p>
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedReviews.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedReviews.length} review{selectedReviews.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkModerate('approved')}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Approve All
            </button>
            <button
              onClick={() => handleBulkModerate('rejected')}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Reject All
            </button>
            <button
              onClick={() => setSelectedReviews([])}
              className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReviews.length === reviews.length && reviews.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Review
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedReviews.includes(review._id)}
                      onChange={() => toggleSelectReview(review._id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {review.product?.images?.[0] && (
                        <img
                          src={review.product.images[0]}
                          alt=""
                          className="w-10 h-10 rounded object-cover mr-3"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {review.product?.name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{review.user?.name}</p>
                      <p className="text-sm text-gray-500">{review.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {renderStars(review.rating)}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-sm font-medium text-gray-900 truncate">{review.title}</p>
                    <p className="text-sm text-gray-500 truncate">{review.comment}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(review.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setModalReview(review);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {showModal && <ReviewDetailModal />}
    </div>
  );
};

export default ReviewManagement;
