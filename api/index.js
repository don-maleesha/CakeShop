const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Category = require('./models/Category');
const Contact = require('./models/Contact');
const CustomOrder = require('./models/CustomOrder');
const Product = require('./models/Product');
const Order = require('./models/Order');
const { sendEmail, createContactReplyTemplate } = require('./services/emailService');
const paymentRoutes = require('./routes/payment');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 4000;

const bcryptSalt = bcrypt.genSaltSync(12);
const jwtSecret = process.env.JWT_SECRET || 'defaultsecretkey';
// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Payment routes
app.use('/payment', paymentRoutes);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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
          name: userDoc.name,
          role: userDoc.role
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
              email: userDoc.email,
              role: userDoc.role
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
          email: userDoc.email,
          role: userDoc.role
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

// PUT - Update Category
app.put('/categories/:id', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid category ID format' 
      });
    }
    
    // Basic validation
    if (!name || !description) {
      return res.status(400).json({ 
        success: false,
        error: 'Name and description are required' 
      });
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description, image },
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Category updated successfully',
      category: {
        id: updatedCategory._id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        image: updatedCategory.image
      }
    });
  } catch (error) {
    console.error('Update category error:', error);
    
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
      error: 'Failed to update category' 
    });
  }
});

// POST - Submit Contact Form (Fix syntax error)
app.post('/contact', checkDBConnection, async (req, res) => {
  try {
    const { customerName, customerEmail, subject, message } = req.body;
    
    // Basic validation
    if (!customerName || !customerEmail || !subject || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }
    
    // Validate name length
    const trimmedName = customerName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ 
        success: false,
        error: 'Name must be between 2 and 50 characters' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      return res.status(400).json({ 
        success: false,
        error: 'Please enter a valid email address' 
      });
    }
    
    // Validate message length
    if (message.trim().length < 10 || message.trim().length > 1000) {
      return res.status(400).json({ 
        success: false,
        error: 'Message must be between 10 and 1000 characters' 
      });
    }
    
    const contact = new Contact({
      customerName: trimmedName,
      customerEmail: customerEmail.trim().toLowerCase(),
      subject,
      message: message.trim()
    });
    
    await contact.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Your message has been sent successfully',
      ticketId: contact.ticketId,
      contact: {
        id: contact._id,
        ticketId: contact.ticketId,
        customerName: contact.customerName,
        customerEmail: contact.customerEmail,
        subject: contact.subject,
        status: contact.status,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: validationErrors.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit contact form. Please try again.' 
    });
  }
});

// POST - Submit Custom Order
app.post('/custom-orders', checkDBConnection, async (req, res) => {
  try {
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      eventType, 
      cakeSize, 
      flavor, 
      specialRequirements, 
      deliveryDate 
    } = req.body;
    
    // Basic validation
    if (!customerName || !customerEmail || !customerPhone || !eventType || !cakeSize || !flavor || !deliveryDate) {
      return res.status(400).json({ 
        success: false,
        error: 'All required fields must be filled' 
      });
    }
    
    // Validate name length
    const trimmedName = customerName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ 
        success: false,
        error: 'Name must be between 2 and 50 characters' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      return res.status(400).json({ 
        success: false,
        error: 'Please enter a valid email address' 
      });
    }
    
    // Validate delivery date (must be at least 7 days from now)
    const orderDate = new Date(deliveryDate);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    if (orderDate < sevenDaysFromNow) {
      return res.status(400).json({ 
        success: false,
        error: 'Delivery date must be at least 7 days from today' 
      });
    }
    
    const customOrder = new CustomOrder({
      customerName: trimmedName,
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      eventType,
      cakeSize,
      flavor,
      specialRequirements: specialRequirements ? specialRequirements.trim() : '',
      deliveryDate: orderDate
    });
    
    await customOrder.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Custom order submitted successfully',
      orderId: customOrder.orderId,
      customOrder: {
        id: customOrder._id,
        orderId: customOrder.orderId,
        customerName: customOrder.customerName,
        customerEmail: customOrder.customerEmail,
        eventType: customOrder.eventType,
        cakeSize: customOrder.cakeSize,
        flavor: customOrder.flavor,
        deliveryDate: customOrder.deliveryDate,
        status: customOrder.status,
        createdAt: customOrder.createdAt
      }
    });
  } catch (error) {
    console.error('Custom order submission error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: validationErrors.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit custom order. Please try again.' 
    });
  }
});

// GET - Fetch All Contact Messages (Admin)
app.get('/contact', checkDBConnection, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contact messages' 
    });
  }
});

// GET - Fetch All Custom Orders (Admin)
app.get('/custom-orders', checkDBConnection, async (req, res) => {
  try {
    const customOrders = await CustomOrder.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      customOrders
    });
  } catch (error) {
    console.error('Fetch custom orders error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch custom orders' 
    });
  }
});

// PUT - Update Contact Status (Admin)
app.put('/contact/:id', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid contact ID format' 
      });
    }
    
    const contact = await Contact.findByIdAndUpdate(
      id, 
      { status, ...(notes && { notes }) }, 
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({ 
        success: false,
        error: 'Contact message not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Contact status updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update contact status' 
    });
  }
});

// POST - Send Reply Email to Contact (Admin)
app.post('/contact/:id/reply', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, adminName = 'CakeShop Support Team' } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid contact ID format' 
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Reply message is required' 
      });
    }

    // Find the contact
    const contact = await Contact.findById(id);
    
    if (!contact) {
      return res.status(404).json({ 
        success: false,
        error: 'Contact message not found' 
      });
    }

    // Create email templates
    const { html, text } = createContactReplyTemplate(
      contact.customerName,
      message.trim(),
      contact.subject,
      contact.ticketId
    );

    // Send email
    const emailResult = await sendEmail(
      contact.customerEmail,
      `Re: ${contact.subject} - Ticket #${contact.ticketId}`,
      html,
      text
    );

    if (emailResult.success) {
      // Update contact with reply information
      await Contact.findByIdAndUpdate(id, {
        status: 'resolved',
        notes: `Admin reply sent by ${adminName}: ${message.trim()}`,
        repliedAt: new Date(),
        repliedBy: adminName
      });

      res.status(200).json({ 
        success: true,
        message: 'Reply sent successfully',
        emailMessageId: emailResult.messageId
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to send email reply',
        details: emailResult.error
      });
    }
  } catch (error) {
    console.error('Send reply error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send reply' 
    });
  }
});

// PUT - Update Custom Order Status (Admin)
app.put('/custom-orders/:id', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedPrice, notes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order ID format' 
      });
    }
    
    const updateData = { status };
    if (estimatedPrice !== undefined) updateData.estimatedPrice = estimatedPrice;
    if (notes !== undefined) updateData.notes = notes;
    
    const customOrder = await CustomOrder.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    if (!customOrder) {
      return res.status(404).json({ 
        success: false,
        error: 'Custom order not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Custom order updated successfully',
      customOrder
    });
  } catch (error) {
    console.error('Update custom order error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update custom order' 
    });
  }
});

// GET - Fetch All Users
app.get('/users', checkDBConnection, async (req, res) => {
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
app.get('/users/:id', checkDBConnection, async (req, res) => {
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
app.delete('/users/:id', checkDBConnection, async (req, res) => {
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

// PRODUCT MANAGEMENT API ENDPOINTS

// GET - Fetch All Products with filtering and pagination
app.get('/products', checkDBConnection, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      type = '',
      availability = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {};
    
    // By default, exclude inactive products unless specifically requested
    if (availability !== 'inactive' && availability !== 'all') {
      filter.isActive = true;
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Type filter
    if (type) {
      filter.type = type;
    }

    // Availability filter
    if (availability) {
      switch (availability) {
        case 'in-stock':
          filter.stockQuantity = { $gt: 0 };
          filter.isActive = true;
          break;
        case 'out-of-stock':
          filter.stockQuantity = 0;
          break;
        case 'low-stock':
          filter.$expr = { $lte: ['$stockQuantity', '$lowStockThreshold'] };
          break;
        case 'inactive':
          filter.isActive = false;
          break;
        case 'all':
          // Remove the default isActive filter to show all products
          delete filter.isActive;
          break;
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// GET - Fetch Single Product by ID
app.get('/products/:id', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id).populate('category', 'name description');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Fetch product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// POST - Create New Product
app.post('/products', checkDBConnection, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      images,
      category,
      type,
      stockQuantity,
      lowStockThreshold,
      isActive,
      isFeatured,
      isAvailableOnOrder,
      tags,
      ingredients,
      allergens,
      nutritionInfo,
      preparationTime,
      sizes,
      weight,
      dimensions
    } = req.body;

    // Basic validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, price, and category are required'
      });
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      images: images || [],
      category,
      type: type || 'regular',
      stockQuantity: parseInt(stockQuantity) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      isAvailableOnOrder: isAvailableOnOrder || false,
      tags: tags || [],
      ingredients: ingredients || [],
      allergens: allergens || [],
      nutritionInfo: nutritionInfo || {},
      preparationTime: parseInt(preparationTime) || 24,
      sizes: sizes || [],
      weight: parseFloat(weight) || 0,
      dimensions: dimensions || {}
    });

    await product.save();

    // Return the created product with populated category
    const createdProduct = await Product.findById(product._id).populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: createdProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

// PUT - Update Product
app.put('/products/:id', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const {
      name,
      description,
      price,
      images,
      category,
      type,
      stockQuantity,
      lowStockThreshold,
      isActive,
      isFeatured,
      isAvailableOnOrder,
      tags,
      ingredients,
      allergens,
      nutritionInfo,
      preparationTime,
      sizes,
      weight,
      dimensions
    } = req.body;

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (images !== undefined) updateData.images = images;
    if (category !== undefined) updateData.category = category;
    if (type !== undefined) updateData.type = type;
    if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity);
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isAvailableOnOrder !== undefined) updateData.isAvailableOnOrder = isAvailableOnOrder;
    if (tags !== undefined) updateData.tags = tags;
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (allergens !== undefined) updateData.allergens = allergens;
    if (nutritionInfo !== undefined) updateData.nutritionInfo = nutritionInfo;
    if (preparationTime !== undefined) updateData.preparationTime = parseInt(preparationTime);
    if (sizes !== undefined) updateData.sizes = sizes;
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (dimensions !== undefined) updateData.dimensions = dimensions;

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// DELETE - Remove Product (Soft Delete)
app.delete('/products/:id', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    if (permanent === 'true') {
      // Permanent delete
      const deletedProduct = await Product.findByIdAndDelete(id);
      
      if (!deletedProduct) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Product permanently deleted'
      });
    } else {
      // Soft delete (mark as inactive)
      const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Product deactivated successfully',
        data: product
      });
    }
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

// POST - Bulk Actions on Products
app.post('/products/bulk-action', checkDBConnection, async (req, res) => {
  try {
    const { action, productIds } = req.body;

    if (!action || !productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        error: 'Action and productIds array are required'
      });
    }

    // Validate all product IDs
    const invalidIds = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid product IDs: ${invalidIds.join(', ')}`
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        message = 'Products activated successfully';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        message = 'Products deactivated successfully';
        break;
      case 'feature':
        updateData = { isFeatured: true };
        message = 'Products marked as featured successfully';
        break;
      case 'unfeature':
        updateData = { isFeatured: false };
        message = 'Products unmarked as featured successfully';
        break;
      case 'delete':
        // Soft delete
        updateData = { isActive: false };
        message = 'Products deleted successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Allowed actions: activate, deactivate, feature, unfeature, delete'
        });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      message,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk action'
    });
  }
});

// GET - Low Stock Alert
app.get('/products/alerts/low-stock', checkDBConnection, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      isActive: true
    }).populate('category', 'name');

    res.status(200).json({
      success: true,
      data: {
        count: lowStockProducts.length,
        products: lowStockProducts
      }
    });
  } catch (error) {
    console.error('Low stock alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock products'
    });
  }
});

// GET - Featured Products (Most Sold)
app.get('/products/featured', checkDBConnection, async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const featuredProducts = await Product.find({
      isActive: true,
      stockQuantity: { $gt: 0 }
    })
    .populate('category', 'name')
    .sort({ soldCount: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: featuredProducts
    });
  } catch (error) {
    console.error('Fetch featured products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured products'
    });
  }
});

// ORDER MANAGEMENT ENDPOINTS

// POST - Create New Order
app.post('/orders', checkDBConnection, async (req, res) => {
  try {
    console.log('=== ORDER CREATION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      customerInfo,
      items,
      deliveryDate,
      deliveryTime,
      specialInstructions,
      paymentMethod = 'cash_on_delivery'
    } = req.body;

    // Basic validation
    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      console.log('Validation failed: Missing customer info or items');
      return res.status(400).json({
        success: false,
        error: 'Customer info and items are required'
      });
    }

    // Validate customer info
    const { name, email, phone, address } = customerInfo;
    console.log('Customer info validation:', { name, email, phone, address });
    
    if (!name || !email || !phone || !address) {
      console.log('Validation failed: Incomplete customer information');
      return res.status(400).json({
        success: false,
        error: 'Complete customer information is required'
      });
    }

    // Validate delivery date
    if (!deliveryDate || !deliveryTime) {
      return res.status(400).json({
        success: false,
        error: 'Delivery date and time are required'
      });
    }

    const orderDate = new Date(deliveryDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (orderDate < tomorrow) {
      return res.status(400).json({
        success: false,
        error: 'Delivery date must be at least 1 day from today'
      });
    }

    // Validate and process items
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Valid product ID and quantity are required for all items'
        });
      }

      // Check if product exists and is available
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          error: `Product ${productId} not found or unavailable`
        });
      }

      // Check stock availability
      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${quantity}`
        });
      }

      const subtotal = product.price * quantity;
      totalAmount += subtotal;

      processedItems.push({
        product: productId,
        name: product.name,
        price: product.price,
        quantity: parseInt(quantity),
        subtotal
      });
    }

    // Calculate delivery fee (same logic as frontend)
    const deliveryFee = totalAmount >= 9000 ? 0 : 500;
    const finalTotalAmount = totalAmount + deliveryFee;

    console.log('Order calculation:', {
      subtotal: totalAmount,
      deliveryFee: deliveryFee,
      finalTotal: finalTotalAmount
    });

    // Create the order
    const order = new Order({
      orderId: 'ORD' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase(),
      customerInfo: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address
      },
      items: processedItems,
      totalAmount: finalTotalAmount,
      deliveryDate: orderDate,
      deliveryTime,
      specialInstructions: specialInstructions ? specialInstructions.trim() : '',
      paymentMethod
    });

    await order.save();

    // Update product stock and sold count
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stockQuantity: -item.quantity,
          soldCount: item.quantity
        }
      });
    }

    // Populate the order before sending response
    const populatedOrder = await Order.findById(order._id).populate('items.product', 'name images category');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// GET - Fetch All Orders (Admin)
app.get('/orders', checkDBConnection, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      paymentStatus = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(filter)
      .populate('items.product', 'name images')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// GET - Fetch Single Order
app.get('/orders/:id', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(id).populate('items.product', 'name images category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// PUT - Update Order Status
app.put('/orders/:id', checkDBConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, notes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes;

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
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
      'POST /login': 'User login',
      'GET /profile': 'Get user profile',
      'POST /logout': 'User logout',
      'POST /categories': 'Add new category',
      'GET /categories': 'Get all categories',
      'PUT /categories/:id': 'Update category',
      'DELETE /categories/:id': 'Remove category',
      'GET /users': 'Get all users',
      'GET /users/:id': 'Get user by ID',
      'DELETE /users/:id': 'Remove user',
      'POST /contact': 'Submit contact form',
      'GET /contact': 'Get all contact messages',
      'PUT /contact/:id': 'Update contact status',
      'POST /contact/:id/reply': 'Send reply email to contact',
      'POST /custom-orders': 'Submit custom order',
      'GET /custom-orders': 'Get all custom orders',
      'PUT /custom-orders/:id': 'Update custom order',
      'GET /products': 'Get all products with filtering',
      'GET /products/:id': 'Get single product',
      'GET /products/featured': 'Get featured products (most sold)',
      'POST /products': 'Create new product',
      'PUT /products/:id': 'Update product',
      'DELETE /products/:id': 'Delete product',
      'POST /products/bulk-action': 'Bulk actions on products',
      'GET /products/alerts/low-stock': 'Get low stock products',
      'POST /orders': 'Create new order',
      'GET /orders': 'Get all orders',
      'GET /orders/:id': 'Get single order',
      'PUT /orders/:id': 'Update order status'
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