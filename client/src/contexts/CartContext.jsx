import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Cart reducer to manage cart state
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity = 1, selectedSize = null } = action.payload;
      
      // Create a unique item key based on product ID and size
      const itemKey = selectedSize ? `${product._id}_${selectedSize.name}` : product._id;
      const existingItemIndex = state.items.findIndex(item => item.key === itemKey);
      
      if (existingItemIndex > -1) {
        // Item exists, update quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += quantity;
        return {
          ...state,
          items: updatedItems
        };
      } else {
        // New item, add to cart
        const newItem = {
          key: itemKey,
          product,
          quantity,
          selectedSize,
          price: selectedSize ? selectedSize.price : (product.discountPrice || product.price),
          subtotal: (selectedSize ? selectedSize.price : (product.discountPrice || product.price)) * quantity
        };
        
        return {
          ...state,
          items: [...state.items, newItem]
        };
      }
    }
    
    case 'REMOVE_FROM_CART': {
      return {
        ...state,
        items: state.items.filter(item => item.key !== action.payload.itemKey)
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { itemKey, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.key !== itemKey)
        };
      }
      
      return {
        ...state,
        items: state.items.map(item => 
          item.key === itemKey 
            ? { 
                ...item, 
                quantity, 
                subtotal: item.price * quantity 
              }
            : item
        )
      };
    }
    
    case 'CLEAR_CART': {
      return {
        ...state,
        items: []
      };
    }
    
    case 'LOAD_CART': {
      return {
        ...state,
        items: action.payload || []
      };
    }
    
    default:
      return state;
  }
};

// Initial cart state
const initialState = {
  items: [],
  isOpen: false
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cakeshop_cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cakeshop_cart', JSON.stringify(state.items));
  }, [state.items]);

  // Cart actions
  const addToCart = (product, quantity = 1, selectedSize = null) => {
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { product, quantity, selectedSize } 
    });
  };

  const removeFromCart = (itemKey) => {
    dispatch({ 
      type: 'REMOVE_FROM_CART', 
      payload: { itemKey } 
    });
  };

  const updateQuantity = (itemKey, quantity) => {
    dispatch({ 
      type: 'UPDATE_QUANTITY', 
      payload: { itemKey, quantity } 
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    setIsCartOpen(prev => !prev);
  };

  const [isCartOpen, setIsCartOpen] = React.useState(false);

  // Computed values
  const cartItemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = state.items.reduce((total, item) => total + item.subtotal, 0);

  const value = {
    items: state.items,
    cartItemsCount,
    cartTotal,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    setIsCartOpen
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
