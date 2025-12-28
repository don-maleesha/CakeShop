import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Award, Clock, Plus, Loader2, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/useWishlist';
import UserContext from './UserContext';

const HomePage = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useContext(UserContext);
  const [featuredCakes, setFeaturedCakes] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Fetch featured products (most sold) from API
  useEffect(() => {
    const fetchFeaturedCakes = async () => {
      try {
        setLoadingFeatured(true);
        
        console.log('Fetching featured products from API...');
        const response = await fetch('http://localhost:4000/products/featured?limit=3', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        const products = data.data || [];
        
        console.log('Fetched featured products:', products);
        
        if (products.length === 0) {
          console.warn('No featured products returned from API, using fallback data');
          throw new Error('No products returned from API');
        }
        
        setFeaturedCakes(products);
      } catch (error) {
        console.error('Error fetching featured cakes:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        // Fallback to hardcoded data if API fails
        setFeaturedCakes([
          {
            _id: 'fallback-1',
            name: 'Chocolate Indulgence',
            price: 7850,
            images: ['https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg'],
            description: 'Rich chocolate layers with premium cocoa',
            category: { name: 'Featured' },
            type: 'regular',
            stockQuantity: 8,
            isActive: true,
            soldCount: 45,
            lowStockThreshold: 10
          },
          {
            _id: 'fallback-2',
            name: 'Vanilla Bean Elegant',
            price: 6750,
            images: ['https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg'],
            description: 'Classic vanilla with elegant decoration',
            category: { name: 'Featured' },
            type: 'regular',
            stockQuantity: 15,
            isActive: true,
            soldCount: 38,
            lowStockThreshold: 10
          },
          {
            _id: 'fallback-3',
            name: 'Berry Fresh Delight',
            price: 7300,
            images: ['https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg'],
            description: 'Light sponge with fresh seasonal berries',
            category: { name: 'Featured' },
            type: 'regular',
            stockQuantity: 3,
            isActive: true,
            soldCount: 29,
            lowStockThreshold: 5
          }
        ]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFeaturedCakes();
  }, []);

  const handleAddToCart = (product, selectedSize = null) => {
    try {
      // Check stock availability
      if (!product.isActive) {
        alert('This product is currently unavailable.');
        return;
      }
      
      if (product.stockQuantity <= 0) {
        alert(`Sorry, ${product.name} is currently out of stock.`);
        return;
      }
      
      if (product.stockQuantity <= (product.lowStockThreshold || 5)) {
        const confirmed = window.confirm(
          `${product.name} is running low in stock (${product.stockQuantity} left). Would you like to add it to cart?`
        );
        if (!confirmed) return;
      }
      
      addToCart(product, 1, selectedSize);
      alert(`${product.name}${selectedSize ? ` (${selectedSize.name})` : ''} added to cart!`);
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Most Popular Cakes</h2>
            <p className="text-gray-600">
              Discover our most loved and best-selling cake creations, ordered by popularity.
            </p>
          </div>
          
          {loadingFeatured ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <span className="ml-2 text-gray-600">Loading featured cakes...</span>
            </div>
          ) : null}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCakes.map((product) => (
              <div key={product._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative">
                  <img
                    src={product.images?.[0] || 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg';
                    }}
                  />
                  {product.stockQuantity <= (product.lowStockThreshold || 5) && product.stockQuantity > 0 && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Only {product.stockQuantity} left!
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  
                  {/* Stock Status */}
                  <div className="mb-3">
                    {!product.isActive ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        Unavailable
                      </span>
                    ) : product.stockQuantity === 0 ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    ) : product.stockQuantity <= (product.lowStockThreshold || 5) ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        In Stock
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xl font-bold text-red-500">
                      LKR {(product.discountPrice || product.price).toLocaleString()}
                      {product.discountPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          LKR {product.price.toLocaleString()}
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2">
                      {user && (
                        <button
                          onClick={() => toggleWishlist(product._id)}
                          className={`p-2 rounded-lg border transition-colors ${
                            isInWishlist(product._id)
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500'
                          }`}
                          title={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <Heart 
                            className="w-4 h-4" 
                            fill={isInWishlist(product._id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      )}
                      <button 
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.isActive || product.stockQuantity === 0}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                          !product.isActive || product.stockQuantity === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
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
