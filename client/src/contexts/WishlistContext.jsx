import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import UserContext from '../pages/UserContext';
import { WishlistContext } from './wishlistContextDefinition';
import { showSuccess, showError, showWarning } from '../utils/toast';

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);

  // Fetch wishlist when user logs in
  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/wishlist', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setWishlistItems(response.data.data.products);
      }
    } catch (error) {
      console.error('Fetch wishlist error:', error);
      if (error.response?.status !== 401) {
        console.error('Failed to fetch wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!user) {
      showWarning('Please login to add items to wishlist');
      return false;
    }

    try {
      const response = await axios.post(
        `http://localhost:4000/wishlist/add/${productId}`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        setWishlistItems(response.data.data.products);
        showSuccess('Added to wishlist!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Add to wishlist error:', error);
      
      if (error.response?.data?.error) {
        showError(error.response.data.error);
      } else if (error.response?.status === 401) {
        showError('Authentication failed. Please login again.');
      } else {
        showError('Failed to add to wishlist. Please try again.');
      }
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return false;

    try {
      const response = await axios.delete(
        `http://localhost:4000/wishlist/remove/${productId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setWishlistItems(response.data.data.products);
        showSuccess('Removed from wishlist');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      showError('Failed to remove from wishlist');
      return false;
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(
      item => item.product?._id === productId || item.product === productId
    );
  };

  const clearWishlist = async () => {
    if (!user) return false;

    try {
      const response = await axios.delete(
        'http://localhost:4000/wishlist/clear',
        { withCredentials: true }
      );

      if (response.data.success) {
        setWishlistItems([]);
        showSuccess('Wishlist cleared successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Clear wishlist error:', error);
      showError('Failed to clear wishlist');
      return false;
    }
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    toggleWishlist,
    wishlistCount: wishlistItems.length,
    fetchWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
