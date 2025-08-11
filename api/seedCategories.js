const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// Comprehensive cake categories for the cake shop
const cakeCategories = [
  // 🎉 By Occasion
  {
    name: "Birthday Cakes",
    description: "Colorful and festive cakes perfect for birthday celebrations of all ages",
    image: ""
  },
  {
    name: "Wedding Cakes",
    description: "Elegant multi-tiered cakes designed for your special wedding day",
    image: ""
  },
  {
    name: "Anniversary Cakes",
    description: "Romantic cakes to celebrate love and milestone anniversaries",
    image: ""
  },
  {
    name: "Engagement Cakes",
    description: "Beautiful cakes to mark the beginning of your journey together",
    image: ""
  },
  {
    name: "Graduation Cakes",
    description: "Celebratory cakes to honor educational achievements and new beginnings",
    image: ""
  },
  {
    name: "Valentine's Day Cakes",
    description: "Heart-shaped and romantic cakes perfect for expressing love",
    image: ""
  },
  {
    name: "Mother's/Father's Day Cakes",
    description: "Special cakes to show appreciation for the most important people in your life",
    image: ""
  },
  {
    name: "New Year / Avurudu Cakes",
    description: "Traditional and festive cakes for New Year and Sinhala Tamil New Year celebrations",
    image: ""
  },
  {
    name: "Christmas Cakes",
    description: "Rich fruit cakes and festive designs perfect for Christmas celebrations",
    image: ""
  },

  // 👶 By Theme / Audience
  {
    name: "Kids' Cakes",
    description: "Fun, colorful cakes designed specifically for children with playful themes",
    image: ""
  },
  {
    name: "Adult Cakes",
    description: "Sophisticated and elegant cakes designed for mature celebrations",
    image: ""
  },
  {
    name: "Cartoon / Character Cakes",
    description: "Themed cakes featuring popular cartoon characters and movie heroes",
    image: ""
  },
  {
    name: "Themed Cakes",
    description: "Custom cakes based on sports, hobbies, and personal interests",
    image: ""
  },
  {
    name: "Corporate / Office Cakes",
    description: "Professional cakes for business events, meetings, and office celebrations",
    image: ""
  },

  // 🍰 By Type / Style
  {
    name: "Layer Cakes",
    description: "Multi-layered cakes with delicious fillings and beautiful decorations",
    image: ""
  },
  {
    name: "Cupcakes",
    description: "Individual portion cakes perfect for parties and personal treats",
    image: ""
  },
  {
    name: "Mini Cakes",
    description: "Small individual cakes that are perfect for intimate celebrations",
    image: ""
  },
  {
    name: "Sheet Cakes",
    description: "Large rectangular cakes ideal for feeding big groups and events",
    image: ""
  },
  {
    name: "Jar Cakes",
    description: "Trendy cakes served in mason jars - portable and Instagram-worthy",
    image: ""
  },
  {
    name: "Tiered Cakes",
    description: "Multi-tier cakes perfect for grand celebrations and large gatherings",
    image: ""
  },

  // 🍫 By Flavor
  {
    name: "Chocolate Cakes",
    description: "Rich, decadent chocolate cakes for all the chocolate lovers",
    image: ""
  },
  {
    name: "Vanilla Cakes",
    description: "Classic vanilla cakes with smooth, creamy flavor that everyone loves",
    image: ""
  },
  {
    name: "Red Velvet Cakes",
    description: "Luxurious red velvet cakes with cream cheese frosting",
    image: ""
  },
  {
    name: "Fruit Cakes",
    description: "Fresh and seasonal fruit-flavored cakes bursting with natural goodness",
    image: ""
  },
  {
    name: "Butter Cakes",
    description: "Rich, moist butter cakes with a tender crumb and classic taste",
    image: ""
  },
  {
    name: "Cheesecakes",
    description: "Creamy, smooth cheesecakes in various flavors and styles",
    image: ""
  },
  {
    name: "Coffee Cakes",
    description: "Perfect morning treats and coffee-flavored dessert cakes",
    image: ""
  },
  {
    name: "Marble Cakes",
    description: "Beautiful swirled cakes combining vanilla and chocolate flavors",
    image: ""
  },

  // ✨ By Customization
  {
    name: "Regular Cakes",
    description: "Our standard menu cakes available for immediate purchase",
    image: ""
  },
  {
    name: "Custom Cakes",
    description: "Fully customized cakes designed according to your specific requirements",
    image: ""
  },
  {
    name: "Photo Cakes",
    description: "Personalized cakes featuring edible photo prints of your choice",
    image: ""
  },
  {
    name: "Name Cakes",
    description: "Personalized cakes featuring custom name writing and decorations",
    image: ""
  },
  {
    name: "Message Cakes",
    description: "Cakes with custom messages and special dedications",
    image: ""
  },

  // 🛒 By Availability
  {
    name: "Ready-Made Cakes",
    description: "Fresh cakes available for immediate pickup or delivery",
    image: ""
  },
  {
    name: "Pre-Order Cakes",
    description: "Special cakes that require advance ordering for preparation",
    image: ""
  },
  {
    name: "Seasonal Cakes",
    description: "Limited-time cakes featuring seasonal flavors and ingredients",
    image: ""
  },
  {
    name: "Limited Edition Cakes",
    description: "Exclusive cake designs available for a limited time only",
    image: ""
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB using the same connection string as the main app
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    // Check which categories already exist
    const existingCategories = await Category.find({}, 'name');
    const existingNames = existingCategories.map(cat => cat.name);

    // Filter out categories that already exist
    const newCategories = cakeCategories.filter(cat => !existingNames.includes(cat.name));

    if (newCategories.length === 0) {
      console.log('All categories already exist in the database');
      return;
    }

    // Insert new categories
    const insertedCategories = await Category.insertMany(newCategories);
    console.log(`Successfully added ${insertedCategories.length} new categories:`);
    
    insertedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
    });

    console.log('\n✅ Categories seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedCategories();
