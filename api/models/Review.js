const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false // Optional: link review to specific order for verified purchase badge
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: [{
    type: String,
    trim: true
  }],
  // Helpful voting system
  helpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  notHelpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  votedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    voteType: {
      type: String,
      enum: ['helpful', 'notHelpful']
    }
  }],
  // Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending',
    index: true
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  moderatedAt: {
    type: Date,
    required: false
  },
  moderationNote: {
    type: String,
    trim: true,
    maxlength: [500, 'Moderation note cannot exceed 500 characters']
  },
  // Metadata
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate reviews from same user for same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Index for filtering and sorting
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

// Virtual for net helpful votes
reviewSchema.virtual('netHelpfulVotes').get(function() {
  return this.helpfulVotes - this.notHelpfulVotes;
});

// Method to check if user has voted
reviewSchema.methods.hasUserVoted = function(userId) {
  return this.votedBy.some(vote => vote.user.toString() === userId.toString());
};

// Method to get user's vote type
reviewSchema.methods.getUserVoteType = function(userId) {
  const vote = this.votedBy.find(vote => vote.user.toString() === userId.toString());
  return vote ? vote.voteType : null;
};

// Static method to calculate product rating statistics
reviewSchema.statics.calculateProductRating = async function(productId) {
  const stats = await this.aggregate([
    { 
      $match: { 
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved'
      } 
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length > 0) {
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats[0].ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    return {
      averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: stats[0].totalReviews,
      ratingDistribution: distribution
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};

// Post-save hook to update product rating
reviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    const Review = this.constructor;
    const Product = mongoose.model('Product');
    
    const stats = await Review.calculateProductRating(this.product);
    
    await Product.findByIdAndUpdate(this.product, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingDistribution: stats.ratingDistribution
    });
  }
});

// Post-remove hook to update product rating
reviewSchema.post('remove', async function() {
  const Review = this.constructor;
  const Product = mongoose.model('Product');
  
  const stats = await Review.calculateProductRating(this.product);
  
  await Product.findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
    ratingDistribution: stats.ratingDistribution
  });
});

const ReviewModel = mongoose.model('Review', reviewSchema);

module.exports = ReviewModel;
