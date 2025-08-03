import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Filter, 
  Download,
  Upload,
  AlertTriangle,
  Package,
  DollarSign,
  Calendar,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  RefreshCw
} from 'lucide-react';

// Add custom CSS for toast animations
const toastStyle = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .toast-enter {
    animation: slideInRight 0.3s ease-out forwards;
  }
  
  .toast-exit {
    animation: slideOutRight 0.3s ease-in forwards;
  }
`;

function ProductManagement() {
  // Inject custom CSS for animations
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = toastStyle;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    availability: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 10
  });

  // Form state for add/edit
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    images: [],
    category: '',
    type: 'regular',
    stockQuantity: 0,
    expiryDate: '',
    availabilityStatus: 'Available',
    lowStockThreshold: 5,
    isActive: true,
    isFeatured: false,
    isAvailableOnOrder: false,
    tags: [],
    ingredients: [],
    allergens: [],
    preparationTime: 24,
    weight: 0,
    weightUnit: 'g',
    flavour: '',
    shape: 'Round',
    isEggless: false
  });

  // Alerts
  const [alerts, setAlerts] = useState([]);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  // Custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    type: 'warning' // 'warning', 'danger', 'info'
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLowStockAlerts();
  }, [filters, pagination.currentPage, searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      });

      const response = await axios.get(`http://localhost:4000/products?${params}`);
      setProducts(response.data.data.products);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      showAlert('error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:4000/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:4000/products/alerts/low-stock');
      setAlerts(response.data.data.products);
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
    }
  };

  const showAlert = (type, message) => {
    const id = Date.now();
    const toast = { id, type, message };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Custom confirmation dialog
  const showConfirmDialog = (title, message, onConfirm, type = 'warning') => {
    return new Promise((resolve) => {
      setConfirmConfig({
        title,
        message,
        onConfirm: () => {
          setShowConfirmModal(false);
          onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setShowConfirmModal(false);
          resolve(false);
        },
        type
      });
      setShowConfirmModal(true);
    });
  };

  const handleAddProduct = () => {
    setModalMode('add');
    setProductForm({
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      images: [],
      category: '',
      type: 'regular',
      stockQuantity: 0,
      expiryDate: '',
      availabilityStatus: 'Available',
      lowStockThreshold: 5,
      isActive: true,
      isFeatured: false,
      isAvailableOnOrder: false,
      tags: [],
      ingredients: [],
      allergens: [],
      preparationTime: 24,
      weight: 0,
      weightUnit: 'g',
      flavour: '',
      shape: 'Round',
      isEggless: false
    });
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || '',
      images: product.images || [],
      category: product.category._id,
      type: product.type,
      stockQuantity: product.stockQuantity,
      expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
      availabilityStatus: product.availabilityStatus || 'Available',
      lowStockThreshold: product.lowStockThreshold,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isAvailableOnOrder: product.isAvailableOnOrder,
      tags: product.tags || [],
      ingredients: product.ingredients || [],
      allergens: product.allergens || [],
      preparationTime: product.preparationTime,
      weight: product.weight,
      weightUnit: product.weightUnit || 'g',
      flavour: product.flavour || '',
      shape: product.shape || 'Round',
      isEggless: product.isEggless || false
    });
    setShowModal(true);
  };

  const handleViewProduct = (product) => {
    setModalMode('view');
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    // Find the product to get its name for the confirmation
    const product = products.find(p => p._id === productId);
    const productName = product ? product.name : 'this product';
    
    showConfirmDialog(
      '⚠️ Permanent Deletion Warning',
      `You are about to permanently delete "${productName}".

This action cannot be undone and will remove all product data including:
• Product information
• Images  
• Sales history

Are you sure you want to continue?`,
      async () => {
        try {
          await axios.delete(`http://localhost:4000/products/${productId}?permanent=true`);
          showAlert('success', `${productName} has been deleted successfully!`);
          fetchProducts();
          fetchLowStockAlerts(); // Refresh alerts in case deleted product was in low stock
        } catch (error) {
          console.error('Error deleting product:', error);
          const errorMessage = error.response?.data?.message || error.response?.data?.error || 'An unexpected error occurred';
          showAlert('error', `Failed to delete "${productName}": ${errorMessage}`);
        }
      },
      'danger'
    );
  };

  const handleRestoreProduct = async (productId) => {
    const product = products.find(p => p._id === productId);
    const productName = product ? product.name : 'this product';
    
    showConfirmDialog(
      '🔄 Restore Product',
      `Are you sure you want to restore "${productName}"?

This will:
• Make the product active and visible to customers
• Include it in inventory counts
• Enable sales and orders

Continue with restoration?`,
      async () => {
        try {
          await axios.put(`http://localhost:4000/products/${productId}`, { isActive: true });
          showAlert('success', `${productName} has been restored successfully!`);
          fetchProducts();
          fetchLowStockAlerts();
        } catch (error) {
          console.error('Error restoring product:', error);
          const errorMessage = error.response?.data?.message || error.response?.data?.error || 'An unexpected error occurred';
          showAlert('error', `Failed to restore "${productName}": ${errorMessage}`);
        }
      },
      'info'
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const productName = productForm.name || 'Product';
    
    try {
      if (modalMode === 'add') {
        await axios.post('http://localhost:4000/products', productForm);
        showAlert('success', `${productName} has been successfully added to the product list!`);
      } else if (modalMode === 'edit') {
        await axios.put(`http://localhost:4000/products/${selectedProduct._id}`, productForm);
        showAlert('success', `${productName} has been updated successfully!`);
      }
      
      setShowModal(false);
      fetchProducts();
      fetchLowStockAlerts();
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'An unexpected error occurred';
      const action = modalMode === 'add' ? 'add' : 'update';
      showAlert('error', `Failed to ${action} "${productName}": ${errorMessage}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      setProductForm(prev => ({
        ...prev,
        images: [...prev.images, ...images]
      }));
    });
  };

  const removeImage = (index) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setProductForm(prev => ({ ...prev, tags }));
  };

  const handleIngredientsChange = (e) => {
    const ingredients = e.target.value.split(',').map(ing => ing.trim()).filter(ing => ing);
    setProductForm(prev => ({ ...prev, ingredients }));
  };

  const handleAllergensChange = (e) => {
    const allergens = e.target.value.split(',').map(all => all.trim()).filter(all => all);
    setProductForm(prev => ({ ...prev, allergens }));
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      setSelectedProducts(products.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      showAlert('error', 'Please select at least one product to perform this action');
      return;
    }

    // Create more specific confirmation messages
    let title = '';
    let message = '';
    let successMessage = '';
    let type = 'warning';
    
    switch (action) {
      case 'delete':
        title = '⚠️ Bulk Deletion Warning';
        message = `You are about to permanently delete ${selectedProducts.length} product(s).

This will:
• Remove all product data
• Delete associated images
• Clear sales history
• Cannot be undone

This is a permanent action. Continue?`;
        successMessage = `${selectedProducts.length} products deleted successfully!`;
        type = 'danger';
        break;
      case 'activate':
        title = '✅ Activate Products';
        message = `Activate ${selectedProducts.length} product(s)?

This will make them visible to customers and available for purchase.`;
        successMessage = `${selectedProducts.length} products activated successfully!`;
        type = 'info';
        break;
      case 'deactivate':
        title = '🔒 Deactivate Products';
        message = `Deactivate ${selectedProducts.length} product(s)?

This will hide them from customers but keep their data intact.`;
        successMessage = `${selectedProducts.length} products deactivated successfully!`;
        type = 'warning';
        break;
      case 'feature':
        title = '⭐ Feature Products';
        message = `Mark ${selectedProducts.length} product(s) as featured?

Featured products will be highlighted on the homepage.`;
        successMessage = `${selectedProducts.length} products marked as featured successfully!`;
        type = 'info';
        break;
      default:
        title = 'Confirm Action';
        message = `Are you sure you want to ${action} ${selectedProducts.length} product(s)?`;
        successMessage = `Bulk ${action} completed successfully!`;
    }

    showConfirmDialog(
      title,
      message,
      async () => {
        try {
          await axios.post('http://localhost:4000/products/bulk-action', {
            action,
            productIds: selectedProducts
          });
          showAlert('success', successMessage);
          setSelectedProducts([]);
          setShowBulkActions(false);
          fetchProducts();
          fetchLowStockAlerts();
        } catch (error) {
          console.error('Error performing bulk action:', error);
          const errorMessage = error.response?.data?.message || error.response?.data?.error || 'An unexpected error occurred';
          showAlert('error', `Failed to ${action} products: ${errorMessage}`);
        }
      },
      type
    );
  };

  const getAvailabilityBadge = (product) => {
    if (!product.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>;
    }
    if (product.isAvailableOnOrder) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">On Order</span>;
    }
    if (product.stockQuantity === 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Out of Stock</span>;
    }
    if (product.stockQuantity <= product.lowStockThreshold) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">In Stock</span>;
  };

  const getTypeBadge = (type) => {
    const colors = {
      regular: 'bg-blue-100 text-blue-800',
      custom: 'bg-purple-100 text-purple-800',
      seasonal: 'bg-orange-100 text-orange-800'
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[type] || colors.regular}`}>{type}</span>;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your cake inventory and product catalog</p>
        </div>
        <div className="flex gap-3">
          {selectedProducts.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Bulk Actions ({selectedProducts.length})
              </button>
              {showBulkActions && (
                <div className="absolute top-full right-0 mt-2 bg-white border rounded-lg shadow-lg z-10 min-w-48">
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                  >
                    Activate Products
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                  >
                    Deactivate Products
                  </button>
                  <button
                    onClick={() => handleBulkAction('feature')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                  >
                    Mark as Featured
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600"
                  >
                    Delete Products
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleAddProduct}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">Low Stock Alert</h3>
          </div>
          <p className="text-yellow-700 mb-2">
            {alerts.length} product{alerts.length !== 1 ? 's' : ''} running low on stock:
          </p>
          <div className="flex flex-wrap gap-2">
            {alerts.slice(0, 5).map(product => (
              <span key={product._id} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                {product.name} ({product.stockQuantity} left)
              </span>
            ))}
            {alerts.length > 5 && (
              <span className="text-yellow-700">and {alerts.length - 5} more...</span>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="regular">Regular</option>
            <option value="custom">Custom</option>
            <option value="seasonal">Seasonal</option>
          </select>

          {/* Availability Filter */}
          <select
            value={filters.availability}
            onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Active Products</option>
            <option value="all">All Products</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="inactive">Deleted/Inactive</option>
          </select>

          {/* Sort */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(prev => ({ ...prev, sortBy, sortOrder }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAllProducts}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                      <span className="ml-2">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center">
                    <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No products found</p>
                    <button
                      onClick={handleAddProduct}
                      className="mt-2 text-red-600 hover:text-red-800"
                    >
                      Add your first product
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {product.name}
                            {product.isFeatured && <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      LKR {product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{product.stockQuantity}</span>
                        {product.stockQuantity <= product.lowStockThreshold && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getTypeBadge(product.type)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {product.category?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      {getAvailabilityBadge(product)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {product.isActive ? (
                          <>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestoreProduct(product._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Restore"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalProducts)} of{' '}
              {pagination.totalProducts} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={!pagination.hasPrevPage}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={!pagination.hasNextPage}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit/View Product */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalMode === 'add' ? 'Add New Product' : 
                 modalMode === 'edit' ? 'Edit Product' : 'Product Details'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {modalMode === 'view' ? (
              // View Mode
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Product Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{selectedProduct?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="text-gray-900">{selectedProduct?.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Price</label>
                          <p className="text-gray-900">LKR {selectedProduct?.price?.toFixed(2)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Category</label>
                          <p className="text-gray-900">{selectedProduct?.category?.name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Type</label>
                          <p className="text-gray-900">{selectedProduct?.type}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Stock</label>
                          <p className="text-gray-900">{selectedProduct?.stockQuantity}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Weight</label>
                          <p className="text-gray-900">{selectedProduct?.weight}g</p>
                        </div>
                      </div>
                      {selectedProduct?.tags?.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Tags</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedProduct.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Product Images</h3>
                    {selectedProduct?.images?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No images uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Add/Edit Mode
              <form onSubmit={handleFormSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Basic Information Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cake Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={productForm.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter cake name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          name="category"
                          value={productForm.category}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={productForm.description}
                          onChange={handleInputChange}
                          required
                          rows={3}
                          placeholder="Product description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (Rs.) *
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={productForm.price}
                            onChange={handleInputChange}
                            required
                            min="0"
                            step="0.01"
                            placeholder="1500"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Discount Price (Rs.)
                          </label>
                          <input
                            type="number"
                            name="discountPrice"
                            value={productForm.discountPrice}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            placeholder="1300"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inventory & Status Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Inventory & Status</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock Quantity *
                        </label>
                        <input
                          type="number"
                          name="stockQuantity"
                          value={productForm.stockQuantity}
                          onChange={handleInputChange}
                          required
                          min="0"
                          placeholder="15"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          name="expiryDate"
                          value={productForm.expiryDate}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Availability Status
                        </label>
                        <select
                          name="availabilityStatus"
                          value={productForm.availabilityStatus}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="Available">Available</option>
                          <option value="Out of Stock">Out of Stock</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Low Stock Threshold
                        </label>
                        <input
                          type="number"
                          name="lowStockThreshold"
                          value={productForm.lowStockThreshold}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Cake Details Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Cake Details</h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weight
                          </label>
                          <input
                            type="number"
                            name="weight"
                            value={productForm.weight}
                            onChange={handleInputChange}
                            min="0"
                            placeholder="75"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weight Unit
                          </label>
                          <select
                            name="weightUnit"
                            value={productForm.weightUnit}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="g">Grams (g)</option>
                            <option value="kg">Kilograms (kg)</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Flavour
                        </label>
                        <input
                          type="text"
                          name="flavour"
                          value={productForm.flavour}
                          onChange={handleInputChange}
                          placeholder="Red Velvet"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shape
                        </label>
                        <select
                          name="shape"
                          value={productForm.shape}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="Round">Round</option>
                          <option value="Square">Square</option>
                          <option value="Heart">Heart</option>
                          <option value="Rectangle">Rectangle</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>

                      <div className="mt-3 flex items-center">
                        <input
                          type="checkbox"
                          name="isEggless"
                          checked={productForm.isEggless}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Eggless
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Image Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Image</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Images
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        {productForm.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {productForm.images.map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={image}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                {index === 0 && (
                                  <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                                    Main
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags & Metadata Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Tags & Metadata</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={productForm.tags.join(', ')}
                          onChange={handleTagsChange}
                          placeholder="red velvet, cupcake, cream cheese, party box"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Type
                        </label>
                        <select
                          name="type"
                          value={productForm.type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="regular">Regular</option>
                          <option value="custom">Custom</option>
                          <option value="seasonal">Seasonal</option>
                        </select>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preparation Time (hours)
                        </label>
                        <input
                          type="number"
                          name="preparationTime"
                          value={productForm.preparationTime}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="24"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Status
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="isActive"
                              value="true"
                              checked={productForm.isActive === true}
                              onChange={() => setProductForm(prev => ({...prev, isActive: true}))}
                              className="text-red-600 focus:ring-red-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Active</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="isActive"
                              value="false"
                              checked={productForm.isActive === false}
                              onChange={() => setProductForm(prev => ({...prev, isActive: false}))}
                              className="text-red-600 focus:ring-red-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Inactive</span>
                          </label>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <strong className="text-blue-800">Date Added:</strong>
                        </div>
                        <span className="text-blue-700">
                          {modalMode === 'edit' && selectedProduct 
                            ? new Date(selectedProduct.createdAt).toLocaleDateString('en-LK', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })
                            : 'Will be auto-generated on save'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Additional Details Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Details</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ingredients (comma-separated)
                        </label>
                        <textarea
                          value={productForm.ingredients.join(', ')}
                          onChange={handleIngredientsChange}
                          rows={2}
                          placeholder="flour, sugar, eggs, butter, cream cheese, food coloring"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Allergens (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={productForm.allergens.join(', ')}
                          onChange={handleAllergensChange}
                          placeholder="dairy, eggs, gluten, nuts"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-3 mt-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="isFeatured"
                            checked={productForm.isFeatured}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            Featured Product
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="isAvailableOnOrder"
                            checked={productForm.isAvailableOnOrder}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            Available on Order Only
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    {modalMode === 'add' ? 'Add Product' : 'Update Product'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                  confirmConfig.type === 'danger' 
                    ? 'bg-red-100' 
                    : confirmConfig.type === 'info' 
                    ? 'bg-blue-100' 
                    : 'bg-yellow-100'
                }`}>
                  {confirmConfig.type === 'danger' ? (
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : confirmConfig.type === 'info' ? (
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {confirmConfig.title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 whitespace-pre-line">
                      {confirmConfig.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    confirmConfig.type === 'danger' 
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                      : confirmConfig.type === 'info' 
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                      : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                  }`}
                  onClick={confirmConfig.onConfirm}
                >
                  {confirmConfig.type === 'danger' ? 'Delete' : 'Confirm'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={confirmConfig.onCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-full bg-white shadow-xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-10 overflow-hidden toast-enter ${
              toast.type === 'success' 
                ? 'border-l-4 border-green-500' 
                : 'border-l-4 border-red-500'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {toast.type === 'success' ? (
                    <div className="bg-green-100 rounded-full p-1">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="bg-red-100 rounded-full p-1">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${
                    toast.type === 'success' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {toast.type === 'success' ? '✅ Success!' : '❌ Error'}
                  </p>
                  <p className={`mt-1 text-sm leading-relaxed break-words ${
                    toast.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {toast.message}
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <button
                    className={`bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                      toast.type === 'success' ? 'focus:ring-green-500' : 'focus:ring-red-500'
                    }`}
                    onClick={() => removeToast(toast.id)}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductManagement;
