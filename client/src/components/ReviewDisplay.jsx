import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Star, ThumbsUp, ThumbsDown, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserContext from '../pages/UserContext';

const ReviewDisplay = ({ productId }) => {
  const { user } = useContext(UserContext);
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('-createdAt');
  const [filterRating, setFilterRating] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        sort: sortBy
      };

      if (filterRating) {
        params.rating = filterRating;
      }

      const response = await axios.get(
        `http://localhost:4000/reviews/product/${productId}`,
        { params }
      );

      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setStatistics(response.data.data.statistics);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId, page, sortBy, filterRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleVote = async (reviewId, voteType) => {
    if (!user) {
      toast.info('Please login to vote on reviews');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:4000/reviews/${reviewId}/vote`,
        { voteType },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update the review in state
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId
              ? {
                  ...review,
                  helpfulVotes: response.data.data.helpfulVotes,
                  notHelpfulVotes: response.data.data.notHelpfulVotes
                }
              : review
          )
        );
        toast.success('Thank you for your feedback!');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error.response?.data?.message || 'Failed to record vote');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating, size = 'small') => {
    const sizeClass = size === 'large' ? 'w-6 h-6' : 'w-4 h-4';
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const RatingDistribution = () => {
    if (!statistics) return null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {statistics.averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(statistics.averageRating), 'large')}
            <p className="text-gray-600 mt-2">
              Based on {statistics.totalReviews} {statistics.totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = statistics.ratingDistribution[rating] || 0;
              const percentage = statistics.totalReviews > 0
                ? (count / statistics.totalReviews) * 100
                : 0;

              return (
                <div key={rating} className="flex items-center space-x-2">
                  <button
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className="flex items-center space-x-1 hover:text-red-600 transition-colors"
                  >
                    <span className="text-sm font-medium w-6">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </button>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const SortFilterBar = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="-createdAt">Most Recent</option>
          <option value="createdAt">Oldest First</option>
          <option value="-helpfulVotes">Most Helpful</option>
          <option value="-rating">Highest Rating</option>
          <option value="rating">Lowest Rating</option>
        </select>
      </div>

      {filterRating && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filtered by:</span>
          <button
            onClick={() => setFilterRating(null)}
            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
          >
            <span>{filterRating} stars</span>
            <span>×</span>
          </button>
        </div>
      )}
    </div>
  );

  const ReviewCard = ({ review }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4 hover:shadow-md transition-shadow">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-gray-900">
              {review.user?.name || 'Anonymous'}
            </span>
            {review.isVerifiedPurchase && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified Purchase
              </span>
            )}
          </div>
          {renderStars(review.rating)}
        </div>
        <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
      </div>

      {/* Review Title */}
      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>

      {/* Review Comment */}
      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.comment}</p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {review.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Review ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => window.open(image, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Edited Badge */}
      {review.isEdited && (
        <p className="text-xs text-gray-500 mb-3">
          Edited on {formatDate(review.editedAt)}
        </p>
      )}

      {/* Helpful Voting */}
      <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">Was this review helpful?</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleVote(review._id, 'helpful')}
            disabled={!user}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              user
                ? 'hover:bg-green-50 hover:text-green-700'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{review.helpfulVotes || 0}</span>
          </button>
          <button
            onClick={() => handleVote(review._id, 'notHelpful')}
            disabled={!user}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              user
                ? 'hover:bg-red-50 hover:text-red-700'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{review.notHelpfulVotes || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Distribution */}
      {statistics && <RatingDistribution />}

      {/* Reviews Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h3>

        {statistics && statistics.totalReviews > 0 ? (
          <>
            <SortFilterBar />

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h4>
            <p className="text-gray-600">Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewDisplay;
