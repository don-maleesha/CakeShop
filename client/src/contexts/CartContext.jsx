import React, { createContext, useContext, useReducer, useEffect } from 'react';
import UserContext from '../pages/UserContext';

const CartContext = createContext();

// Helper function to get user-specific cart key
const getCartKey = (user) => {
  if (user && user.id) {
    return `cakeshop_cart_user_${user.id}`;
  }
  return 'cakeshop_cart_guest';
};

// Cart reducer to manage cart state
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity = 1, selectedSize = null } = action.payload;
      console.log('🔄 Reducer ADD_TO_CART called for:', product.name);
      
      // Create a unique item key based on product ID and size
      const itemKey = selectedSize ? `${product._id}_${selectedSize.name}` : product._id;
      const existingItemIndex = state.items.findIndex(item => item.key === itemKey);
      
      if (existingItemIndex > -1) {
        // Item exists, update quantity (with stock validation)
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        // Check stock availability
        if (product.stockQuantity && newQuantity > product.stockQuantity) {
          // Don't add more than available stock
          console.warn(`Cannot add ${quantity} more items. Stock available: ${product.stockQuantity}, current in cart: ${existingItem.quantity}`);
          return state; // Return unchanged state
        }
        
        updatedItems[existingItemIndex].quantity = newQuantity;
        updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].price * newQuantity;
        return {
          ...state,
          items: updatedItems
        };
      } else {
        // New item, add to cart (with stock validation)
        if (product.stockQuantity && quantity > product.stockQuantity) {
          console.warn(`Cannot add ${quantity} items. Stock available: ${product.stockQuantity}`);
          return state; // Return unchanged state
        }
        
        const newItem = {
          key: itemKey,
          product,
          quantity,
          selectedSize,
          price: selectedSize ? selectedSize.price : (product.discountPrice || product.price),
          subtotal: (selectedSize ? selectedSize.price : (product.discountPrice || product.price)) * quantity
        };
        
        const newState = {
          ...state,
          items: [...state.items, newItem]
        };
        console.log('✅ Reducer returning new state, total items:', newState.items.length, 'total quantity:', newState.items.reduce((total, item) => total + item.quantity, 0));
        return newState;
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
        items: state.items.map(item => {
          if (item.key === itemKey) {
            // Check stock availability when updating quantity
            const maxQuantity = item.product.stockQuantity || 999;
            const newQuantity = Math.min(quantity, maxQuantity);
            
            if (newQuantity < quantity) {
              console.warn(`Maximum available quantity is ${maxQuantity}`);
            }
            
            return { 
              ...item, 
              quantity: newQuantity, 
              subtotal: item.price * newQuantity 
            };
          }
          return item;
        })
      };
    }
    
    case 'CLEAR_CART': {
      console.log('🗑️ CLEAR_CART reducer called');
      return {
        ...state,
        items: []
      };
    }
    
    case 'LOAD_CART': {
      console.log('📦 LOAD_CART reducer called with', action.payload?.length || 0, 'items');
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
  const [showRegistrationModal, setShowRegistrationModal] = React.useState(false);
  const [registrationTrigger, setRegistrationTrigger] = React.useState('first-add');
  const [lastAddedProduct, setLastAddedProduct] = React.useState(null);
  
  // Get user from UserContext instead of managing our own state
  const { user } = useContext(UserContext);
  const [previousUser, setPreviousUser] = React.useState(null);
  
  // Flags for initialization and user switching
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isSwitchingUser, setIsSwitchingUser] = React.useState(false);
  
  // Use ref to always have access to the latest cart items
  const cartItemsRef = React.useRef(state.items);
  const skipNextSaveRef = React.useRef(false);
  
  // Update ref whenever items change
  React.useEffect(() => {
    cartItemsRef.current = state.items;
  }, [state.items]);

  // Function to load cart from localStorage based on current user
  const loadUserCart = React.useCallback((user) => {
    skipNextSaveRef.current = true; // Skip save when loading
    const cartKey = getCartKey(user);
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
        console.log(`Loaded cart for ${user ? `user ${user.id}` : 'guest'}:`, cartData.length, 'items');
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        dispatch({ type: 'LOAD_CART', payload: [] });
      }
    } else {
      dispatch({ type: 'LOAD_CART', payload: [] });
    }
  }, []);

  // Function to save cart to localStorage based on current user
  const saveUserCart = React.useCallback((user, items) => {
    const cartKey = getCartKey(user);
    localStorage.setItem(cartKey, JSON.stringify(items));
    console.log(`Saved cart for ${user ? `user ${user.id}` : 'guest'}:`, items.length, 'items');
  }, []);

  // Watch for user changes from UserContext
  useEffect(() => {
    if (user?.id !== previousUser?.id && isInitialized) {
      console.log('👤 UserContext changed from', previousUser?.email || 'guest', 'to', user?.email || 'guest');
      
      // Set flag to prevent auto-saving during switch
      setIsSwitchingUser(true);
      
      // Save the current cart for the previous user BEFORE switching
      // Use ref to get the latest cart items
      const currentItems = cartItemsRef.current;
      
      // Only save if previous user was logged in (not guest)
      if (previousUser && previousUser.id && currentItems.length > 0) {
        console.log('💾 Saving cart for previous user:', previousUser?.email, 'with', currentItems.length, 'items');
        saveUserCart(previousUser, currentItems);
      } else {
        console.log('⏭️ Skipping save - previous user was guest or no items');
      }
      
      // If logging out (going from logged-in user to guest), clear the guest cart
      if (previousUser && previousUser.id && !user) {
        console.log('🚪 User logging out - clearing guest cart');
        localStorage.removeItem('cakeshop_cart_guest');
      }
      
      // Clear current state first to prevent mixing carts
      console.log('🧹 Clearing cart state to prevent data mixing');
      dispatch({ type: 'CLEAR_CART' });
      
      // Load cart for new user immediately after clearing
      console.log('📥 Loading cart for new user:', user?.email || 'guest');
      loadUserCart(user);
      setPreviousUser(user);
      
      // Re-enable auto-save after switch is complete
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        setIsSwitchingUser(false);
      }, 100);
    }
  }, [user, previousUser, saveUserCart, loadUserCart, isInitialized]);

  // Load initial cart on component mount
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 CartProvider mounting, loading initial cart for user:', user?.email || 'guest');
      loadUserCart(user);
      setPreviousUser(user);
      setIsInitialized(true);
    }
  }, [isInitialized, user, loadUserCart]); // Removed setIsInitialized from deps

  // Function to migrate guest cart to user cart (when user registers/logs in)
  const migrateGuestCartToUser = React.useCallback((user) => {
    const guestCartKey = getCartKey(null); // Guest cart key
    const userCartKey = getCartKey(user);   // New user cart key
    
    const guestCart = localStorage.getItem(guestCartKey);
    const userCart = localStorage.getItem(userCartKey);
    
    if (guestCart && (!userCart || JSON.parse(userCart).length === 0)) {
      // Migrate guest cart to user cart
      localStorage.setItem(userCartKey, guestCart);
      localStorage.removeItem(guestCartKey);
      console.log('Migrated guest cart to user cart');
      
      // Reload the cart
      loadUserCart(user);
    }
  }, [loadUserCart]);

  // Save cart to localStorage whenever cart changes (with smart skip logic)
  useEffect(() => {
    // Skip if flagged (during load operations)
    if (skipNextSaveRef.current) {
      console.log('⏭️ Skipping save (loading operation)');
      skipNextSaveRef.current = false;
      return;
    }
    
    // Only save if initialized and not switching users
    if (isInitialized && !isSwitchingUser) {
      console.log('💾 Auto-saving cart for', user?.email || 'guest');
      saveUserCart(user, state.items);
    }
  }, [state.items, user, saveUserCart, isInitialized, isSwitchingUser]);

  // Check if user should see registration incentive
  const shouldShowRegistrationIncentive = (currentItems, product) => {
    // Don't show if user is already registered
    const user = localStorage.getItem('user');
    if (user) {
      return false;
    }

    // Don't show if user has already dismissed
    const hasDismissed = localStorage.getItem('hasSeenRegistrationIncentive');
    if (hasDismissed) {
      return false;
    }

    // Show on first item
    if (currentItems.length === 0) {
      return { show: true, trigger: 'first-add', product };
    }

    // Show after 3 items
    if (currentItems.length === 2) {
      return { show: true, trigger: 'multiple-items', product };
    }

    // Show for high-value carts (over LKR 10,000)
    const cartValue = currentItems.reduce((sum, item) => sum + item.subtotal, 0);
    if (cartValue > 10000 && currentItems.length >= 2) {
      return { show: true, trigger: 'high-value', product };
    }

    return { show: false };
  };

  // Cart actions
  const addToCart = (product, quantity = 1, selectedSize = null) => {
    console.log('🛒 Adding to cart:', product.name, 'quantity:', quantity);
    console.log('📊 Current cart items count before adding:', state.items.reduce((total, item) => total + item.quantity, 0));
    
    // Pre-validate stock before dispatching
    if (!product.isActive) {
      throw new Error('This product is currently unavailable');
    }
    
    if (product.stockQuantity <= 0) {
      throw new Error(`${product.name} is currently out of stock`);
    }
    
    // Check if adding this quantity would exceed stock
    const itemKey = selectedSize ? `${product._id}_${selectedSize.name}` : product._id;
    const existingItem = state.items.find(item => item.key === itemKey);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    
    if (product.stockQuantity < (currentCartQuantity + quantity)) {
      const availableToAdd = product.stockQuantity - currentCartQuantity;
      throw new Error(`Cannot add ${quantity} items. Only ${availableToAdd} more available (${currentCartQuantity} already in cart)`);
    }
    
    // Check if we should show registration incentive
    const incentiveCheck = shouldShowRegistrationIncentive(state.items, product);
    
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { product, quantity, selectedSize } 
    });

    // Show registration incentive if needed
    if (incentiveCheck.show) {
      setLastAddedProduct(product);
      setRegistrationTrigger(incentiveCheck.trigger);
      // Small delay to let the cart update first
      setTimeout(() => {
        setShowRegistrationModal(true);
      }, 300);
    }
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

  // Computed values - use useMemo to ensure re-renders when state changes
  const cartItemsCount = React.useMemo(() => {
    const count = state.items.reduce((total, item) => total + item.quantity, 0);
    console.log('🧮 Computed cartItemsCount:', count, 'from', state.items.length, 'items');
    return count;
  }, [state.items]);
  const cartTotal = React.useMemo(() => 
    state.items.reduce((total, item) => total + item.subtotal, 0), 
    [state.items]
  );

  const dismissRegistrationModal = () => {
    setShowRegistrationModal(false);
    // Mark as seen so it doesn't show again
    localStorage.setItem('hasSeenRegistrationIncentive', 'true');
  };

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
    setIsCartOpen,
    showRegistrationModal,
    registrationTrigger,
    lastAddedProduct,
    dismissRegistrationModal,
    migrateGuestCartToUser
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
