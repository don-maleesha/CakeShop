const mongoose = require('mongoose');
const {Schema} = mongoose;

const ProductSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [2, 'Product name must be at least 2 characters long'],
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price must be a positive number']
        // Price stored in LKR (Sri Lankan Rupees)
    },
    discountPrice: {
        type: Number,
        min: [0, 'Discount price must be a positive number'],
        validate: {
            validator: function(value) {
                return !value || value < this.price;
            },
            message: 'Discount price must be less than regular price'
        }
        // Discount price stored in LKR (Sri Lankan Rupees)
    },
    images: [{
        type: String,
        trim: true
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Product category is required']
    },
    type: {
        type: String,
        enum: ['regular', 'custom', 'seasonal'],
        default: 'regular',
        required: true
    },
    stockQuantity: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock quantity cannot be negative'],
        default: 0
    },
    expiryDate: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value > new Date();
            },
            message: 'Expiry date must be in the future'
        }
    },
    availabilityStatus: {
        type: String,
        enum: ['Available', 'Out of Stock', 'Archived'],
        default: 'Available'
    },
    lowStockThreshold: {
        type: Number,
        default: 5,
        min: [0, 'Low stock threshold cannot be negative']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isAvailableOnOrder: {
        type: Boolean,
        default: false // True for custom orders only
    },
    tags: [{
        type: String,
        trim: true
    }],
    ingredients: [{
        type: String,
        trim: true
    }],
    allergens: [{
        type: String,
        trim: true
    }],
    nutritionInfo: {
        calories: { type: Number, min: 0 },
        fat: { type: Number, min: 0 },
        carbs: { type: Number, min: 0 },
        protein: { type: Number, min: 0 },
        sugar: { type: Number, min: 0 }
    },
    preparationTime: {
        type: Number, // in hours
        default: 24
    },
    sizes: [{
        name: { type: String, required: true }, // e.g., "6 inch", "8 inch"
        price: { type: Number, required: true, min: 0 }, // Price in LKR
        serves: { type: String } // e.g., "6-8 people"
    }],
    weight: {
        type: Number, // in grams
        min: 0
    },
    weightUnit: {
        type: String,
        enum: ['g', 'kg'],
        default: 'g'
    },
    flavour: {
        type: String,
        trim: true
    },
    shape: {
        type: String,
        enum: ['Round', 'Square', 'Heart', 'Rectangle', 'Custom'],
        default: 'Round'
    },
    isEggless: {
        type: Boolean,
        default: false
    },
    dimensions: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 }
    },
    soldCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Reviews & Ratings
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0
    },
    ratingDistribution: {
        type: Map,
        of: Number,
        default: () => new Map([['1', 0], ['2', 0], ['3', 0], ['4', 0], ['5', 0]])
    }
}, {
    timestamps: true
});

// Virtual for checking if product is low stock
ProductSchema.virtual('isLowStock').get(function() {
    return this.stockQuantity <= this.lowStockThreshold;
});

// Virtual for computed availability status (different from stored availabilityStatus)
ProductSchema.virtual('computedAvailabilityStatus').get(function() {
    if (!this.isActive) return 'inactive';
    if (this.isAvailableOnOrder) return 'on-order';
    if (this.stockQuantity === 0) return 'out-of-stock';
    if (this.isLowStock) return 'low-stock';
    return 'in-stock';
});

// Index for better search performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ type: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ availabilityStatus: 1 });
ProductSchema.index({ createdAt: -1 });

const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel;
