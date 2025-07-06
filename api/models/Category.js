const mongoose = require('mongoose');
const {Schema} = mongoose;

const CategorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        minlength: [2, 'Category name must be at least 2 characters long'],
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Category description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    image: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const CategoryModel = mongoose.model('Category', CategorySchema);

module.exports = CategoryModel;
