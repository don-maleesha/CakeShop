import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Filter, Plus, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import StarRating from '../components/StarRating';

// Pagination component
const Pagination = ({ totalPages, currentPage, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const showPages = 5; // Show 5 page numbers at a time
  
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  let endPage = Math.min(totalPages, startPage + showPages - 1);
  
  if (endPage - startPage < showPages - 1) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
        </>
      )}
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 rounded-lg border ${
            page === currentPage
              ? 'bg-red-500 text-white border-red-500'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};

Pagination.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

const CakesPage = () => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [categoryPage, setCategoryPage] = useState(1);
  const categoriesPerPage = 8;
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [categorySort, setCategorySort] = useState("name-asc");
  const [sortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 products per page
  const [state, setState] = useState({
    categories: [],
    products: [],
    categorizedProducts: {}
  });

  // Fetch categories and products from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories
        const categoriesResponse = await fetch('http://localhost:4000/categories');
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        const categories = await categoriesResponse.json();

        // Fetch products
        const productsResponse = await fetch('http://localhost:4000/products?availability=in-stock&limit=100');
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        const products = productsData.data?.products || productsData || [];

        console.log('Fetched products with stock info:', products.slice(0, 2).map(p => ({
          name: p.name,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
          isActive: p.isActive
        })));

        // Group products by category
        const categorizedProducts = {};
        
        for (const category of categories) {
          const categoryProducts = [];
          for (const product of products) {
            if (product.category && product.category._id === category._id) {
              categoryProducts.push(product);
            }
          }
          categorizedProducts[category._id] = {
            category: category,
            products: categoryProducts
          };
        }

        setState({
          categories,
          products,
          categorizedProducts
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product, selectedSize = null) => {
    try {
      // Check stock availability before adding to cart
      if (!product.isActive) {
        alert('This product is currently unavailable.');
        return;
      }
      
      if (product.stockQuantity <= 0) {
        alert(`Sorry, ${product.name} is currently out of stock.`);
        return;
      }
      
      if (product.stockQuantity <= product.lowStockThreshold) {
        const confirmed = window.confirm(
          `${product.name} is running low in stock (${product.stockQuantity} left). Would you like to add it to cart?`
        );
        if (!confirmed) return;
      }
      
      addToCart(product, 1, selectedSize);
      // Show a success message
      alert(`${product.name}${selectedSize ? ` (${selectedSize.name})` : ''} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const handleProductAddToCart = (product) => {
    // Check if product has sizes
    if (product.sizes && product.sizes.length > 0) {
      // For products with sizes, use default size or prompt user
      const defaultSize = product.sizes[0];
      handleAddToCart(product, defaultSize);
    } else {
      // For products without sizes
      handleAddToCart(product);
    }
  };

  // Reset current page when category or sort changes
  // Reset current page when category or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy]);
  // (Removed unused getCategoryPage and setCategoryPage functions)

  // Pagination helper function
  const getPaginatedProducts = (products, page = currentPage) => {
    const sorted = products.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      products: sorted.slice(startIndex, endIndex),
      totalProducts: sorted.length,
      totalPages: Math.ceil(sorted.length / itemsPerPage)
    };
  };

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">Loading delicious cakes...</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Cakes</h1>
          <p className="text-xl text-gray-600">
            Discover our delicious collection of handcrafted cakes
          </p>
        </div>

        {/* Show categories only if no category is selected */}
        {!selectedCategory ? (
          <>
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-1/3 mb-6">
                <form onSubmit={e => e.preventDefault()}>
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={e => {
                      setCategorySearch(e.target.value);
                      setCategoryPage(1);
                    }}
                    placeholder="Search categories..."
                    className="w-full border border-gray-300 rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={categorySort}
                  onChange={e => {
                    setCategorySort(e.target.value);
                    setCategoryPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>
            </div>
            {/* Category Pagination Logic */}
            {(() => {
              const filteredCategories = state.categories
                .filter(category => category.name.toLowerCase().includes(categorySearch.toLowerCase()))
                .sort((a, b) => {
                  if (categorySort === "name-asc") return a.name.localeCompare(b.name);
                  if (categorySort === "name-desc") return b.name.localeCompare(a.name);
                  return 0;
                });
              const totalCategoryPages = Math.ceil(filteredCategories.length / categoriesPerPage);
              const paginatedCategories = filteredCategories.slice(
                (categoryPage - 1) * categoriesPerPage,
                categoryPage * categoriesPerPage
              );
              return (
                <>
                  <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {paginatedCategories.map((category) => {
                      // Try to get a category image from the first product in this category
                      const categoryProducts = state.categorizedProducts[category._id]?.products || [];
                      const imageUrl = categoryProducts.length > 0 && categoryProducts[0].images && categoryProducts[0].images[0]
                        ? categoryProducts[0].images[0]
                        : null;
                      return (
                        <div key={category._id} className="bg-white rounded-2xl shadow-lg flex flex-col cursor-pointer hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                          <div className="relative h-48 w-full flex items-center justify-center bg-gray-100">
                            {imageUrl ? (
                              <img src={imageUrl} alt={category.name} className="object-cover w-full h-full" />
                            ) : (
                              <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6" /></svg>
                                <span className="text-sm">No image</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent px-4 py-2">
                              <h2 className="text-lg font-bold text-white mb-1">{category.name}</h2>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <p className="text-gray-600 mb-2">{category.description}</p>
                            <div className="flex items-center justify-end mt-2">
                              <button
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                                onClick={() => setSelectedCategory(category._id)}
                              >
                                View Cakes
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {totalCategoryPages > 1 && (
                    <Pagination
                      totalPages={totalCategoryPages}
                      currentPage={categoryPage}
                      onPageChange={setCategoryPage}
                    />
                  )}
                </>
              );
            })()}
          </>
        ) : (
          // Display products from selected category only
          <div>
            <button className="mb-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300" onClick={() => setSelectedCategory(null)}>
              ← Back to Categories
            </button>
            {state.categorizedProducts[selectedCategory] && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {state.categorizedProducts[selectedCategory].category.name}
                </h2>
                <p className="text-gray-600">
                  {state.categorizedProducts[selectedCategory].category.description}
                </p>
              </div>
            )}
            {(() => {
              const categoryProducts = state.categorizedProducts[selectedCategory]?.products || [];
              const paginatedData = getPaginatedProducts(categoryProducts, currentPage);
              if (categoryProducts.length === 0) {
                return (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">No cakes found in this category.</p>
                  </div>
                );
              }
              return (
                <>
                  <div className="mb-4 text-right">
                    <p className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, paginatedData.totalProducts)} of {paginatedData.totalProducts} cakes
                    </p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                    {paginatedData.products.map((product) => (
                      <div key={product._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div 
                          className="cursor-pointer"
                          onClick={() => navigate(`/product/${product._id}`)}
                        >
                          <img
                            src={product.images?.[0] || '/src/assets/react.svg'}
                            alt={product.name}
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.target.src = '/src/assets/react.svg'; // Fallback image
                            }}
                          />
                          <div className="p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                            
                            {/* Product Rating */}
                            {product.averageRating > 0 && (
                              <div className="mb-2">
                                <StarRating 
                                  rating={product.averageRating} 
                                  totalReviews={product.totalReviews}
                                  size="small"
                                  showCount={true}
                                />
                              </div>
                            )}
                            
                            <p className="text-gray-600 mb-2">{product.description}</p>
                            {product.sizes && product.sizes.length > 0 && (
                              <p className="text-sm text-gray-500 mb-2">
                                Available sizes: {product.sizes.map(size => size.name).join(', ')}
                              </p>
                            )}
                            
                            {/* Stock Status Display */}
                            <div className="mb-3">
                              {!product.isActive ? (
                                <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                  Unavailable
                                </span>
                              ) : product.stockQuantity === 0 ? (
                                <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                  Out of Stock
                                </span>
                              ) : product.stockQuantity <= product.lowStockThreshold ? (
                                <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                  Low Stock ({product.stockQuantity} left)
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  In Stock ({product.stockQuantity} available)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6 pt-0">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-red-500">
                              LKR {product.discountPrice || product.price}
                              {product.discountPrice && (
                                <span className="text-sm text-gray-500 line-through ml-2">
                                  LKR {product.price}
                                </span>
                              )}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductAddToCart(product);
                              }}
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
                    ))}
                  </div>
                  {paginatedData.totalPages > 1 && (
                    <Pagination 
                      totalPages={paginatedData.totalPages} 
                      currentPage={currentPage} 
                      onPageChange={setCurrentPage} 
                    />
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CakesPage;
