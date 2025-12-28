const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const jwtSecret = process.env.JWT_SECRET || 'defaultsecretkey';

// Middleware to verify user authentication
const requireAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      const user = await User.findById(userData.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Get user's wishlist
router.get('/', requireAuth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products.product',
        select: 'name price images category sizes rating stockQuantity'
      });

    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: []
      });
    }

    // Filter out any null products (in case product was deleted)
    const validProducts = wishlist.products.filter(item => item.product !== null);

    res.json({
      success: true,
      data: {
        products: validProducts,
        count: validProducts.length
      }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wishlist'
    });
  }
});

// Add product to wishlist
router.post('/add/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [{ product: productId }]
      });
    } else {
      // Check if product already in wishlist
      const exists = wishlist.products.some(
        item => item.product.toString() === productId
      );

      if (exists) {
        return res.status(400).json({
          success: false,
          error: 'Product already in wishlist'
        });
      }

      // Add product to wishlist
      wishlist.products.push({ product: productId });
      await wishlist.save();
    }

    // Populate and return updated wishlist
    await wishlist.populate({
      path: 'products.product',
      select: 'name price images category sizes rating stockQuantity'
    });

    res.json({
      success: true,
      message: 'Product added to wishlist',
      data: {
        products: wishlist.products,
        count: wishlist.products.length
      }
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add product to wishlist'
    });
  }
});

// Remove product from wishlist
router.delete('/remove/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist not found'
      });
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      item => item.product.toString() !== productId
    );

    await wishlist.save();

    // Populate and return updated wishlist
    await wishlist.populate({
      path: 'products.product',
      select: 'name price images category sizes rating stockQuantity'
    });

    res.json({
      success: true,
      message: 'Product removed from wishlist',
      data: {
        products: wishlist.products,
        count: wishlist.products.length
      }
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove product from wishlist'
    });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.json({
        success: true,
        data: { inWishlist: false }
      });
    }

    const inWishlist = wishlist.products.some(
      item => item.product.toString() === productId
    );

    res.json({
      success: true,
      data: { inWishlist }
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check wishlist'
    });
  }
});

// Clear entire wishlist
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.json({
        success: true,
        message: 'Wishlist already empty'
      });
    }

    wishlist.products = [];
    await wishlist.save();

    res.json({
      success: true,
      message: 'Wishlist cleared',
      data: {
        products: [],
        count: 0
      }
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear wishlist'
    });
  }
});

module.exports = router;
