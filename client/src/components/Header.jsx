import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import UserContext from '../pages/UserContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/useWishlist';

export default function Header() {
  const { user, logout } = useContext(UserContext);
  const { cartItemsCount, toggleCart } = useCart();
  const { wishlistCount } = useWishlist();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    // Cart will automatically switch to guest mode in CartContext
    navigate('/');
  };

  return (
    <header className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">🧁</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CakeShop</h1>
              <p className="text-sm text-gray-600">Your Local Artisan Cake Boutique</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-900 hover:text-red-600 transition-colors font-medium">
              Home
            </Link>
            <Link to="/cakes" className="text-gray-900 hover:text-red-600 transition-colors font-medium">
              Cakes
            </Link>
            {/* Only show Custom Orders link for logged-in users */}
            {user && (
              <Link to="/custom-order" className="text-gray-900 hover:text-red-600 transition-colors font-medium">
                Custom Orders
              </Link>
            )}
            <Link to="/about" className="text-gray-900 hover:text-red-600 transition-colors font-medium">
              About
            </Link>
            <Link to="/contact" className="text-gray-900 hover:text-red-600 transition-colors font-medium">
              Contact
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Wishlist Button */}
            {user && (
              <Link
                to="/wishlist"
                className="relative text-gray-900 hover:text-red-500 transition-colors p-2"
              >
                <Heart className="w-6 h-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Button */}
            <button 
              onClick={toggleCart}
              className="relative text-gray-900 hover:text-red-500 transition-colors p-2"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-900 hover:text-red-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <span className="text-gray-900">{user.name || 'User'}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {user.role === 'admin' && (
                      <>
                        <Link 
                          to="/admin/dashboard" 
                          className="block px-4 py-2 text-purple-600 hover:bg-gray-100 transition-colors font-medium"
                          onClick={() => setShowDropdown(false)}
                        >
                          🔧 Admin Panel
                        </Link>
                        <hr className="my-2 border-gray-200" />
                      </>
                    )}
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/wishlist" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      ❤️ Wishlist
                    </Link>
                    <Link 
                      to="/my-orders" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Orders
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className="text-white bg-red-500 border-2 border-red-500 px-4 py-2 rounded-lg hover:bg-white hover:text-red-600 transition-colors font-medium"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-text hover:text-red-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
