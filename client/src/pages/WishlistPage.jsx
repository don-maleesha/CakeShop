import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../contexts/useWishlist';
import { useCart } from '../contexts/CartContext';
import UserContext from './UserContext';
import { showSuccess } from '../utils/toast';

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const handleRemove = async (productId) => {
    const success = await removeFromWishlist(productId);
    if (success) {
      console.log('Product removed from wishlist');
    }
  };

  const handleClearAll = async () => {
    await clearWishlist();
  };

  const handleMoveToCart = async (product) => {
    addToCart(product.product, 1);
    await removeFromWishlist(product.product._id);
    showSuccess(`${product.product.name} moved to cart!`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to view your wishlist</p>
          <Link
            to="/login"
            className="inline-block bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Heart className="w-8 h-8 mr-3 text-red-500" fill="currentColor" />
                My Wishlist
              </h1>
              <p className="text-gray-600 mt-1">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            
            {wishlistItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center text-red-600 hover:text-red-700 font-medium"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Wishlist Content */}
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Heart className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Save your favorite cakes to easily find them later
            </p>
            <Link
              to="/cakes"
              className="inline-block bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition-colors"
            >
              Browse Cakes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <div
                  key={item._id || product._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Product Image */}
                  <Link to={`/product/${product._id}`} className="block relative">
                    <img
                      src={product.images?.[0] || '/placeholder-cake.jpg'}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    {product.stockQuantity <= 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">Out of Stock</span>
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link to={`/product/${product._id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-red-600 mb-1">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xl font-bold text-red-600">
                        Rs. {product.price?.toLocaleString()}
                      </p>
                      {product.rating > 0 && (
                        <div className="flex items-center">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm text-gray-600 ml-1">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {product.category && (
                      <p className="text-sm text-gray-500 mb-3">
                        Category: {product.category.name || product.category}
                      </p>
                    )}

                    {/* Stock Status */}
                    {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                      <p className="text-sm text-orange-600 mb-3">
                        Only {product.stockQuantity} left in stock!
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        disabled={product.stockQuantity <= 0}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded text-sm font-medium transition-colors ${
                          product.stockQuantity <= 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Move to Cart
                      </button>
                      
                      <button
                        onClick={() => handleRemove(product._id)}
                        className="p-2 border border-red-300 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Added date */}
                    <p className="text-xs text-gray-400 mt-2">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continue Shopping */}
        {wishlistItems.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/cakes"
              className="inline-block bg-white text-red-600 border border-red-500 px-6 py-3 rounded hover:bg-red-500 hover:text-white transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
