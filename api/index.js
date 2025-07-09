const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Category = require('./models/Category');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 4000;

const bcryptSalt = bcrypt.genSaltSync(12);
const jwtSecret = process.env.JWT_SECRET || 'defaultsecretkey';
// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Database connection check middleware
const checkDBConnection = (req, res, next) => {
  const connectionState = mongoose.connection.readyState;
  console.log(`DB Connection Check - State: ${connectionState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
  
  if (connectionState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database connection unavailable',
      message: 'Please try again later',
      connectionState
    });
  }
  next();
};

// MongoDB Connection with retry logic
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI loaded:', process.env.MONGO_URI ? 'Yes' : 'No');

const connectDB = async (retryCount = 0) => {
  const maxRetries = 3;
  try {
    // Set mongoose connection options globally
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 75000, // 75 seconds timeout
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10, // Maintain up to 10 socket connections
      bufferCommands: false, // Disable mongoose buffering
      // Additional connection options for reliability
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
      ssl: true,
      tlsAllowInvalidCertificates: true
    });
    
    console.log('✅ MongoDB Connected to cake-shop database');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', conn.connection.host);
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

    return conn; // Return the connection object

  } catch (err) {
    console.error(`❌ MongoDB connection error (attempt ${retryCount + 1}/${maxRetries + 1}):`, err.message);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying connection in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount + 1);
    }
    
    console.error('Error code:', err.code);
    console.error('Please check:');
    console.error('1. MongoDB Atlas credentials');
    console.error('2. Network connectivity');
    console.error('3. IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for testing)');
    console.error('4. MongoDB Atlas cluster is running');
    
    // Don't throw error, continue without database
    console.log('🚀 Starting server without database connection...');
    return null;
  }
};


// Schema
const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String
});

// User Registration Endpoint
app.post('/register', checkDBConnection, async(req, res) => {
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

// User Login Endpoint
app.post('/login', checkDBConnection, async (req, res) => {
  try {
    const {email, password} = req.body;
    
    // Basic field presence validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }
    
    // Trim and validate email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }
    
    const userDoc = await User.findOne({ email: trimmedEmail.toLowerCase() });

    if(userDoc) {
      const isPasswordValid = bcrypt.compareSync(password, userDoc.password);
      if (isPasswordValid) {
        jwt.sign({
          email: userDoc.email,
          id: userDoc._id,
          name: userDoc.name
        }, jwtSecret, {}, (err, token) => {
          if (err) {
            console.error('JWT signing error:', err);
            return res.status(500).json({ 
              success: false,
              message: 'Token generation failed' 
            });
          }
          res.cookie('token', token).json({
            success: true,
            message: 'Login successful',
            user: {
              id: userDoc._id,
              name: userDoc.name,
              email: userDoc.email
            }
          });
        });
      } else {
        res.status(422).json({ 
          success: false,
          message: 'Invalid password' 
        });
      }
    } else {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed. Please try again later.' 
    });
  }
});

// User Profile Endpoint
app.get('/profile', checkDBConnection, async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }
    
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token' 
        });
      }
      
      const userDoc = await User.findById(userData.id);
      if (!userDoc) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      
      res.json({
        success: true,
        user: {
          id: userDoc._id,
          name: userDoc.name,
          email: userDoc.email
        }
      });
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch profile' 
    });
  }
});

// User Logout Endpoint
app.post('/logout', (req, res) => {
  res.cookie('token', '').json({ 
    success: true,
    message: 'Logged out successfully' 
  });
});

// POST - Add New Category
app.post('/categories', checkDBConnection, async (req, res) => {
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

// GET - Fetch All Categories
app.get('/categories', checkDBConnection, async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories' 
    });
  }
});

// DELETE - Remove Category
app.delete('/categories/:id', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid category ID format' 
      });
    }
    
    const deletedCategory = await Category.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete category' 
    });
  }
});

// GET - Fetch All Users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password from response
    res.status(200).json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users' 
    });
  }
});

// GET - Fetch User by ID
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID format' 
      });
    }
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user' 
    });
  }
});

// DELETE - Remove User
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID format' 
      });
    }
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete user' 
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
      'GET /categories': 'Get all categories',
      'DELETE /categories/:id': 'Remove category',
      'GET /users': 'Get all users',
      'GET /users/:id': 'Get user by ID',
      'DELETE /users/:id': 'Remove user'
    }
  });
});

// Handle GET requests to /api/register (browser navigation)
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

// Start server after database connection
const startServer = async () => {
  const dbConnection = await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    if (dbConnection) {
      console.log('✅ Database connected and ready');
    } else {
      console.log('⚠️  Server running without database connection');
      console.log('Database operations will fail until connection is established');
    }
  });
};

startServer();