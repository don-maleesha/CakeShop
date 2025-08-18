import React from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

const CartSidebar = () => {
  const { 
    items, 
    cartTotal, 
    cartItemsCount, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart 
  } = useCart();

  if (!isCartOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Cart ({cartItemsCount})
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <Link
                  to="/cakes"
                  onClick={() => setIsCartOpen(false)}
                  className="inline-block bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.key} className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg">
                    <img
                      src={item.product.images?.[0] || '/placeholder-cake.jpg'}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </h3>
                      {item.selectedSize && (
                        <p className="text-xs text-gray-500">{item.selectedSize.name}</p>
                      )}
                      <p className="text-sm text-red-600 font-medium">
                        LKR {item.price.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="p-1 hover:bg-red-100 text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-red-600">
                  LKR {cartTotal.toFixed(2)}
                </span>
              </div>
              
              <div className="space-y-2">
                <Link
                  to="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg text-center font-medium hover:bg-gray-200 transition-colors block"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-red-500 text-white py-3 rounded-lg text-center font-medium hover:bg-red-600 transition-colors block"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
