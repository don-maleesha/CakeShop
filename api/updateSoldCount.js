const mongoose = require('mongoose');
require('dotenv').config();

// Import the Product model
const Product = require('./models/Product');

// Sample data to update soldCount for testing
const sampleSoldCounts = [
  { name: 'Chocolate Indulgence', soldCount: 45 },
  { name: 'Vanilla Bean Elegant', soldCount: 38 },
  { name: 'Berry Fresh Delight', soldCount: 29 },
  { name: 'Red Velvet Classic', soldCount: 34 },
  { name: 'Carrot Cake Supreme', soldCount: 22 },
  { name: 'Lemon Drizzle Cake', soldCount: 18 },
  { name: 'Black Forest', soldCount: 41 },
  { name: 'Strawberry Shortcake', soldCount: 26 },
  { name: 'Tiramisu Cake', soldCount: 19 },
  { name: 'Cheesecake Special', soldCount: 33 }
];

const updateSoldCounts = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      family: 4,
      maxPoolSize: 10,
      bufferCommands: false,
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
      ssl: true,
      tlsAllowInvalidCertificates: true
    });
    
    console.log('Connected to MongoDB');
    
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);
    
    // Update soldCount for products
    for (const product of products) {
      const sampleData = sampleSoldCounts.find(item => 
        product.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(product.name.toLowerCase())
      );
      
      let soldCount = 0;
      if (sampleData) {
        soldCount = sampleData.soldCount;
      } else {
        // Assign random soldCount between 5-50 for other products
        soldCount = Math.floor(Math.random() * 46) + 5;
      }
      
      await Product.findByIdAndUpdate(product._id, { soldCount });
      console.log(`Updated ${product.name}: soldCount = ${soldCount}`);
    }
    
    console.log('✅ Successfully updated soldCount for all products');
    
    // Show top 5 most sold products
    const topProducts = await Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(5)
      .select('name soldCount price');
    
    console.log('\n🔥 Top 5 Most Sold Products:');
    topProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.soldCount} sold - LKR ${product.price}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating soldCount:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the update
updateSoldCounts();
