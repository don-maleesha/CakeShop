import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Award, Clock, Plus, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const HomePage = () => {
  const { addToCart } = useCart();

  const handleAddToCart = (cake) => {
    // Create a mock product object for featured cakes
    const product = {
      _id: cake.name.toLowerCase().replace(/\s+/g, '-'),
      name: cake.name,
      description: cake.description,
      price: parseFloat(cake.price.replace('LKR ', '').replace(',', '')),
      images: [cake.image],
      category: { name: 'Featured' },
      type: 'regular',
      stockQuantity: 10,
      isActive: true
    };
    
    try {
      addToCart(product, 1);
      alert(`${cake.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-pink-50 to-red-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Delicious Cakes
                <br />
                <span className="text-red-500">Made Fresh Daily</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 mb-8 leading-relaxed">
                Indulge in our handcrafted cakes made with the finest ingredients. 
                From classic flavors to unique creations, we have something for every occasion.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/cakes"
                  className="inline-flex items-center justify-center px-8 py-4 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/custom-order"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
                >
                  Custom Orders
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg"
                alt="Delicious layered cake"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">4.9/5</span>
                  <span className="text-gray-600 text-sm">(500+ reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Cakes?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're committed to delivering exceptional quality and taste in every cake we create.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Made with the finest ingredients and crafted by experienced bakers.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fresh Daily</h3>
              <p className="text-gray-600">
                All cakes are baked fresh daily to ensure maximum flavor and quality.
              </p>
            </div>
            
            <Link to="/custom-order" className="text-center p-6 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Designs</h3>
              <p className="text-gray-600">
                Create personalized cakes for birthdays, weddings, and special occasions.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Cakes</h2>
            <p className="text-gray-600">
              Discover our most popular and delicious cake creations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Chocolate Indulgence',
                price: 'LKR 7,850.00',
                image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg',
                description: 'Rich chocolate layers with premium cocoa'
              },
              {
                name: 'Vanilla Bean Elegant',
                price: 'LKR 6,750.00',
                image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg',
                description: 'Classic vanilla with elegant decoration'
              },
              {
                name: 'Berry Fresh Delight',
                price: 'LKR 7,300.00',
                image: 'https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg',
                description: 'Light sponge with fresh seasonal berries'
              }
            ].map((cake, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <img
                  src={cake.image}
                  alt={cake.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{cake.name}</h3>
                  <p className="text-gray-600 mb-4">{cake.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-red-500">{cake.price}</span>
                    <button 
                      onClick={() => handleAddToCart(cake)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/cakes"
              className="inline-flex items-center justify-center px-8 py-4 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              View All Cakes
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
