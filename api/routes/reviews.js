const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
};

// GET /reviews/product/:productId - Get all approved reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sort = '-createdAt', // -createdAt (newest), -helpfulVotes (most helpful), rating
      rating 
    } = req.query;

    const query = { 
      product: productId, 
      status: 'approved' 
    };

    // Filter by rating if specified
    if (rating) {
      query.rating = parseInt(rating);
    }

    const reviews = await Review.find(query)
      .populate('user', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalReviews = await Review.countDocuments(query);

    // Get rating statistics
    const stats = await Review.calculateProductRating(productId);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          limit: parseInt(limit)
        },
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reviews',
      error: error.message 
    });
  }
});

// POST /reviews - Create a new review (authenticated users only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      productId, 
      orderId, 
      rating, 
      title, 
      comment, 
      images 
    } = req.body;

    // Validate required fields
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating, title, and comment are required'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product. You can edit your existing review.'
      });
    }

    // Check if verified purchase (optional)
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        customer: req.user.id,
        'items.product': productId,
        status: 'delivered'
      });
      isVerifiedPurchase = !!order;
    }

    // Create review
    const review = new Review({
      product: productId,
      user: req.user.id,
      order: orderId || undefined,
      rating,
      title,
      comment,
      images: images || [],
      isVerifiedPurchase,
      status: 'pending' // Reviews need admin approval
    });

    await review.save();

    // Populate user info before sending response
    await review.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be visible after admin approval.',
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create review',
      error: error.message 
    });
  }
});

// PUT /reviews/:reviewId - Update own review (authenticated users only)
router.put('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;

    const review = await Review.findOne({
      _id: reviewId,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to edit it'
      });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (images) review.images = images;
    
    review.isEdited = true;
    review.editedAt = new Date();
    review.status = 'pending'; // Reset to pending after edit

    await review.save();
    await review.populate('user', 'name');

    res.json({
      success: true,
      message: 'Review updated successfully. Changes will be visible after admin approval.',
      data: review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update review',
      error: error.message 
    });
  }
});

// DELETE /reviews/:reviewId - Delete own review (authenticated users only)
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({
      _id: reviewId,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    await review.remove();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete review',
      error: error.message 
    });
  }
});

// POST /reviews/:reviewId/vote - Vote on review helpfulness (authenticated users only)
router.post('/:reviewId/vote', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { voteType } = req.body; // 'helpful' or 'notHelpful'

    if (!['helpful', 'notHelpful'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be "helpful" or "notHelpful"'
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already voted
    const existingVoteIndex = review.votedBy.findIndex(
      vote => vote.user.toString() === req.user.id
    );

    if (existingVoteIndex !== -1) {
      const existingVote = review.votedBy[existingVoteIndex];
      
      // If same vote type, remove vote (toggle off)
      if (existingVote.voteType === voteType) {
        if (voteType === 'helpful') {
          review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
        } else {
          review.notHelpfulVotes = Math.max(0, review.notHelpfulVotes - 1);
        }
        review.votedBy.splice(existingVoteIndex, 1);
      } else {
        // Change vote type
        if (existingVote.voteType === 'helpful') {
          review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
          review.notHelpfulVotes += 1;
        } else {
          review.notHelpfulVotes = Math.max(0, review.notHelpfulVotes - 1);
          review.helpfulVotes += 1;
        }
        review.votedBy[existingVoteIndex].voteType = voteType;
      }
    } else {
      // New vote
      if (voteType === 'helpful') {
        review.helpfulVotes += 1;
      } else {
        review.notHelpfulVotes += 1;
      }
      review.votedBy.push({ user: req.user.id, voteType });
    }

    await review.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpfulVotes: review.helpfulVotes,
        notHelpfulVotes: review.notHelpfulVotes
      }
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record vote',
      error: error.message 
    });
  }
});

// GET /reviews/user/my-reviews - Get current user's reviews
router.get('/user/my-reviews', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name images price')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalReviews = await Review.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reviews',
      error: error.message 
    });
  }
});

// ==================== ADMIN ROUTES ====================

// GET /reviews/admin/all - Get all reviews (admin only)
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'all', 
      sort = '-createdAt' 
    } = req.query;

    const query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name images')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalReviews = await Review.countDocuments(query);

    // Get counts by status
    const statusCounts = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          limit: parseInt(limit)
        },
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reviews',
      error: error.message 
    });
  }
});

// PUT /reviews/admin/:reviewId/moderate - Moderate review (admin only)
router.put('/admin/:reviewId/moderate', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, moderationNote } = req.body;

    if (!['approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved", "rejected", or "flagged"'
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = status;
    review.moderatedBy = req.user.id;
    review.moderatedAt = new Date();
    if (moderationNote) {
      review.moderationNote = moderationNote;
    }

    await review.save();
    await review.populate(['user', 'product', 'moderatedBy']);

    res.json({
      success: true,
      message: `Review ${status} successfully`,
      data: review
    });
  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to moderate review',
      error: error.message 
    });
  }
});

// DELETE /reviews/admin/:reviewId - Delete any review (admin only)
router.delete('/admin/:reviewId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.remove();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete review',
      error: error.message 
    });
  }
});

// PUT /reviews/admin/:reviewId/bulk-moderate - Bulk moderate reviews (admin only)
router.put('/admin/bulk-moderate', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { reviewIds, status, moderationNote } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Review IDs array is required'
      });
    }

    if (!['approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = {
      status,
      moderatedBy: req.user.id,
      moderatedAt: new Date()
    };

    if (moderationNote) {
      updateData.moderationNote = moderationNote;
    }

    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      updateData
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} reviews ${status} successfully`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error bulk moderating reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to bulk moderate reviews',
      error: error.message 
    });
  }
});

module.exports = router;
