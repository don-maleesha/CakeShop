const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 4000;

const bcryptSalt = bcrypt.genSaltSync(12);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// MongoDB Connection
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI loaded:', process.env.MONGO_URI ? 'Yes' : 'No');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB Connected to cake-shop database');
    console.log('Database:', mongoose.connection.db.databaseName);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Error code:', err.code);
    console.error('Please check:');
    console.error('1. MongoDB Atlas credentials');
    console.error('2. Network connectivity');
    console.error('3. IP whitelist in MongoDB Atlas');
    process.exit(1);
  });


// Schema
const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String
});

// User Registration Endpoint
app.post('/register', async(req, res) => {
  try {
    const {name, email, password} = req.body;
    
    // Basic field presence validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }
    
    // Trim and validate name
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ 
        success: false,
        error: 'Name must be at least 2 characters long' 
      });
    }
    
    if (trimmedName.length > 50) {
      return res.status(400).json({ 
        success: false,
        error: 'Name cannot exceed 50 characters' 
      });
    }
    
    // Trim and validate email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ 
        success: false,
        error: 'Please enter a valid email address' 
      });
    }
    
    // Password validation (align with User model)
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 8 characters long' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: trimmedEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'An account with this email already exists' 
      });
    }
    
    const userDoc = await User.create({
      name: trimmedName,
      email: trimmedEmail.toLowerCase(),
      password: bcrypt.hashSync(password, bcryptSalt),
    });

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully', 
      user: { 
        id: userDoc._id, 
        name: userDoc.name, 
        email: userDoc.email 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: validationErrors.join(', ') 
      });
    }
    
    // Handle duplicate key error (shouldn't happen due to our check, but just in case)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: 'An account with this email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Registration failed. Please try again later.' 
    });
  }
});

const Category = mongoose.model('Category', categorySchema);

// POST - Add New Category
app.post('/categories', async (req, res) => {
  try {
    const { name, description, image } = req.body;
    
    // Basic validation
    if (!name || !description) {
      return res.status(400).json({ 
        success: false,
        error: 'Name and description are required' 
      });
    }
    
    const category = new Category({ name, description, image });
    await category.save();
    res.status(201).json({ 
      success: true,
      message: 'Category added successfully',
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        image: category.image
      }
    });
  } catch (error) {
    console.error('Category creation error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: validationErrors.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to add category' 
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'CakeShop API Server', 
    version: '1.0.0',
    endpoints: {
      'POST /register': 'User registration',
      'POST /categories': 'Add new category',
      'GET /categories': 'Get all categories'
    }
  });
});

// Handle GET requests to /register (browser navigation)
app.get('/register', (req, res) => {
  res.status(405).json({ 
    success: false,
    error: 'Method Not Allowed', 
    message: 'Please use POST method for registration',
    expectedMethod: 'POST',
    expectedBody: {
      name: 'string',
      email: 'string', 
      password: 'string'
    }
  });
});

// GET - Fetch


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});