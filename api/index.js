const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected to cake-shop database'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema
const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String
});

const Category = mongoose.model('Category', categorySchema);

// POST - Add New Category
app.post('/categories', async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const category = new Category({ name, description, image });
    await category.save();
    res.status(201).json({ message: 'Category added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

// GET - Fetch All Categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});
// DELETE - Remove Category
app.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});