import { Link } from 'react-router-dom';

export default function Header() {
    return (
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">🧁</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CakeShop</h1>
                <p className="text-sm text-gray-600">Your Local Artisan Cake Boutique</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-900 hover:text-primary transition-colors font-medium">
                Home
              </Link>
              <a href="#" className="text-gray-900 hover:text-primary transition-colors font-medium">
                Cakes
              </a>
              <Link to="/custom-order" className="text-gray-900 hover:text-primary transition-colors font-medium">
                Custom Orders
              </Link>
              <a href="#" className="text-gray-900 hover:text-primary transition-colors font-medium">
                About
              </a>
              <Link to="/contact" className="text-gray-900 hover:text-primary transition-colors font-medium">
                Contact
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-900 hover:text-primary transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 5.5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                </svg>
              </button>
              <Link 
                to="/login" 
                className="text-white bg-primary border-2 border-primary px-4 py-2 rounded-lg hover:bg-white hover:text-primary transition-colors font-medium"
              >
                Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="text-text hover:text-primary transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    )
}