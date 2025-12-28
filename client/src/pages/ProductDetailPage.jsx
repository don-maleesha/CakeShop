import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, ArrowLeft, Loader2, Heart } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/useWishlist';
import UserContext from '../pages/UserContext';
import StarRating from '../components/StarRating';
import ReviewDisplay from '../components/ReviewDisplay';
import ReviewForm from '../components/ReviewForm';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useContext(UserContext);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userHasPurchased, setUserHasPurchased] = useState(false);
  const [userReview, setUserReview] = useState(null);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/products/${productId}`);
      if (response.data.success) {
        const productData = response.data.data;
        setProduct(productData);
        
        // Set default size if available
        if (productData.sizes && productData.sizes.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }
        
        // Set first image as default
        setSelectedImage(0);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const checkUserPurchaseHistory = useCallback(async () => {
    try {
      const response = await axios.get(
        'http://localhost:4000/my-orders',
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const orders = response.data.data?.orders || response.data.data || [];
        console.log('🔍 Checking purchase history for product:', productId);
        console.log('📦 Total orders:', orders.length);
        
        // Check if user has purchased this product in any completed order
        // Normalize status check to be case-insensitive (backend may use 'delivered' lowercase)
        const hasPurchased = orders.some(order => {
          const isDelivered = (order.status || '').toString().toLowerCase() === 'delivered';
          const hasProduct = order.items?.some(item => {
            const itemProductId = item.product?._id || item.product;
            return itemProductId === productId;
          });
          
          console.log(`Order ${order.orderId}: status="${order.status}", isDelivered=${isDelivered}, hasProduct=${hasProduct}`);
          
          return isDelivered && hasProduct;
        });
        
        console.log('✅ User has purchased?', hasPurchased);
        setUserHasPurchased(hasPurchased);
      }
    } catch (error) {
      console.error('Error checking purchase history:', error);
    }
  }, [productId]);

  const fetchUserReview = useCallback(async () => {
    try {
      const response = await axios.get(
        'http://localhost:4000/reviews/user/my-reviews',
        { 
          params: { productId },
          withCredentials: true 
        }
      );
      
      if (response.data.success && response.data.data?.reviews) {
        const existingReview = response.data.data.reviews.find(
          review => review.product?._id === productId || review.product === productId
        );
        setUserReview(existingReview);
      }
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
    if (user) {
      checkUserPurchaseHistory();
      fetchUserReview();
    }
  }, [productId, user, fetchProduct, checkUserPurchaseHistory, fetchUserReview]);

  const handleAddToCart = () => {
    if (!product.isActive) {
      toast.error('This product is currently unavailable');
      return;
    }
    
    if (product.stockQuantity <= 0) {
      toast.error(`Sorry, ${product.name} is currently out of stock`);
      return;
    }
    
    if (quantity > product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} items available in stock`);
      return;
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.warning('Please select a size');
      return;
    }
    
    addToCart(product, quantity, selectedSize);
    toast.success(`${product.name} added to cart!`);
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product.stockQuantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  const getPrice = () => {
    if (selectedSize && selectedSize.price) {
      return selectedSize.price;
    }
    return product.discountPrice || product.price;
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    fetchProduct(); // Refresh product to get updated ratings
    fetchUserReview(); // Refresh user's review
    toast.success('Thank you for your review! It will be visible after admin approval.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Product not found</p>
          <button 
            onClick={() => navigate('/cakes')} 
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Back to Cakes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Product Details Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div>
              <div className="mb-4 rounded-xl overflow-hidden">
                <img
                  src={product.images?.[selectedImage] || '/src/assets/react.svg'}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.src = '/src/assets/react.svg';
                  }}
                />
              </div>
              
              {/* Thumbnail Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-red-500 scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {/* Rating */}
              {product.averageRating > 0 && (
                <div className="mb-4">
                  <StarRating 
                    rating={product.averageRating} 
                    totalReviews={product.totalReviews}
                    size="medium"
                    showCount={true}
                  />
                </div>
              )}

              {/* Category */}
              <p className="text-gray-600 mb-4">
                Category: <span className="font-medium">{product.category?.name || 'N/A'}</span>
              </p>

              {/* Description */}
              <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

              {/* Stock Status */}
              <div className="mb-6">
                {!product.isActive ? (
                  <span className="inline-block px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800 font-medium">
                    Unavailable
                  </span>
                ) : product.stockQuantity === 0 ? (
                  <span className="inline-block px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 font-medium">
                    Out of Stock
                  </span>
                ) : product.stockQuantity <= product.lowStockThreshold ? (
                  <span className="inline-block px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 font-medium">
                    Low Stock ({product.stockQuantity} left)
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 font-medium">
                    In Stock ({product.stockQuantity} available)
                  </span>
                )}
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedSize?.name === size.name
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className="font-medium">{size.name}</span>
                        {size.price && (
                          <span className="block text-sm text-gray-600">LKR {size.price}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-red-500">
                    LKR {getPrice()}
                  </span>
                  {product.discountPrice && !selectedSize?.price && (
                    <span className="text-xl text-gray-500 line-through ml-3">
                      LKR {product.price}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stockQuantity}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.isActive || product.stockQuantity === 0}
                  className={`flex-1 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center space-x-2 ${
                    !product.isActive || product.stockQuantity === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>Add to Cart</span>
                </button>

                {/* Wishlist Button */}
                {user && (
                  <button
                    onClick={() => toggleWishlist(productId)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isInWishlist(productId)
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500'
                    }`}
                    title={isInWishlist(productId) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart 
                      className="w-6 h-6" 
                      fill={isInWishlist(productId) ? 'currentColor' : 'none'}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            
            {/* Write Review Button */}
            {user && !userReview && userHasPurchased && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            )}
            
            {user && userReview && (
              <div className="text-sm text-gray-600">
                You've already reviewed this product
              </div>
            )}
            
            {user && !userHasPurchased && (
              <div className="text-sm text-gray-600">
                Purchase this product to write a review
              </div>
            )}
            
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Login to Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && user && !userReview && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <ReviewForm 
                productId={productId}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          )}

          {/* Reviews Display */}
          <ReviewDisplay productId={productId} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
