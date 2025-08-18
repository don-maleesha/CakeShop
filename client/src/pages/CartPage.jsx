import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const CartPage = () => {
  const { 
    items, 
    cartTotal, 
    cartItemsCount, 
    updateQuantity, 
    removeFromCart,
    clearCart 
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any delicious cakes to your cart yet.
            </p>
            <Link
              to="/cakes"
              className="inline-flex items-center bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-2">
              {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Link
            to="/cakes"
            className="inline-flex items-center text-red-500 hover:text-red-600 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Items in your cart</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.key} className="p-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src={item.product.images?.[0] || '/placeholder-cake.jpg'}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.product.name}
                        </h3>
                        {item.selectedSize && (
                          <p className="text-sm text-gray-500 mt-1">
                            Size: {item.selectedSize.name}
                          </p>
                        )}
                        {item.selectedSize?.serves && (
                          <p className="text-sm text-gray-500">
                            Serves: {item.selectedSize.serves}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {item.product.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-4">
                        <button
                          onClick={() => removeFromCart(item.key)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            LKR {item.subtotal.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            LKR {item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700">Quantity:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 text-gray-600"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 text-center font-medium min-w-[3rem]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 text-gray-600"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Clear Cart Button */}
              <div className="px-6 py-4 border-t border-gray-200">
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cartItemsCount} items)</span>
                  <span className="text-gray-900">LKR {cartTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">
                    {cartTotal >= 9000 ? 'Free' : 'LKR 500.00'}
                  </span>
                </div>
                
                {cartTotal < 9000 && (
                  <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                    Add LKR {(9000 - cartTotal).toFixed(2)} more for free delivery!
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-red-600">
                      LKR {(cartTotal + (cartTotal >= 9000 ? 0 : 500)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <Link
                  to="/checkout"
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors text-center block"
                >
                  Proceed to Checkout
                </Link>
                
                <Link
                  to="/cakes"
                  className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block"
                >
                  Continue Shopping
                </Link>
              </div>
              
              {/* Security & Trust */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
