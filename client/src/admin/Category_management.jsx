import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Custom Popup Component
const CustomPopup = ({ isOpen, onClose, onConfirm, type, title, message, showCancel = false }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'confirm':
        return (
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.598 0L3.218 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return { button: 'bg-green-500 hover:bg-green-600', title: 'text-green-700' };
      case 'error':
        return { button: 'bg-red-500 hover:bg-red-600', title: 'text-red-700' };
      case 'confirm':
        return { button: 'bg-yellow-500 hover:bg-yellow-600', title: 'text-yellow-700' };
      default:
        return { button: 'bg-gray-500 hover:bg-gray-600', title: 'text-gray-700' };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform animate-scaleIn">
        {getIcon()}
        
        <h3 className={`text-xl font-bold text-center mb-3 ${colors.title}`}>
          {title}
        </h3>
        
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex justify-center gap-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm || onClose}
            className={`px-6 py-2 text-white rounded-lg transition-colors duration-200 font-medium ${colors.button}`}
          >
            {showCancel ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

function Category_management() {
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState({
    name: '',
    description: '',
    image: ''
  });
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    showCancel: false,
    onConfirm: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      await fetchCategories();
      setIsLoading(false);
      
      setTimeout(() => {
        setIsPageLoaded(true);
      }, 100);
    };

    initializePage();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:4000/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddCategory = () => setShowModal(true);

  const handleCloseModal = () => {
    setShowModal(false);
    setCategory({ name: '', description: '', image: '' });
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setCategory(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setCategory(prev => ({ ...prev, image: reader.result }));
    };
    if (file) reader.readAsDataURL(file);
  };

  const showPopup = (type, title, message, showCancel = false, onConfirm = null) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      showCancel,
      onConfirm
    });
  };

  const closePopup = () => {
    setPopup({ ...popup, isOpen: false });
  };

  const submitCategory = async () => {
    try {
      await axios.post('http://localhost:4000/categories', category);
      showPopup('success', 'Success!', 'Category added successfully');
      handleCloseModal();
      fetchCategories();
    } catch (err) {
      console.error(err);
      showPopup('error', 'Error!', 'Failed to add category. Please try again.');
    }
  };

  const handleDeleteCategory = async (id) => {
    showPopup(
      'confirm',
      'Delete Category',
      'Are you sure you want to delete this category? This action cannot be undone.',
      true,
      async () => {
        try {
          await axios.delete(`http://localhost:4000/categories/${id}`);
          showPopup('success', 'Deleted!', 'Category deleted successfully');
          fetchCategories();
        } catch (err) {
          console.error('Error deleting category:', err);
          showPopup('error', 'Error!', 'Failed to delete category. Please try again.');
        }
      }
    );
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Please Wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-gray-50 min-h-screen transition-all duration-1000 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`flex justify-between items-center mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
        <button
          onClick={handleAddCategory}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2 transform hover:scale-105 transition-all duration-200 hover:shadow-lg"
        >
          <span>+</span> Add Category
        </button>
      </div>

      <div className={`relative w-1/3 mb-6 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 focus:shadow-lg"
        />
        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200 hover:scale-110">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {filteredCategories.map((cat, index) => (
          <div 
            key={cat._id} 
            className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{
              animationDelay: `${index * 100}ms`,
              animation: isPageLoaded ? 'slideInUp 0.6s ease-out forwards' : 'none'
            }}
          >
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-all duration-300 hover:bg-opacity-60">
                <h3 className="text-white text-xl font-bold transform transition-transform duration-300 hover:scale-110">{cat.name}</h3>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-gray-600 mb-4 transition-colors duration-200 hover:text-gray-800">{cat.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Category
                </span>
                
                <div className="flex gap-2">
                  <button className="text-blue-500 hover:text-blue-700 p-1 transform hover:scale-110 transition-all duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat._id)}
                    className="text-red-500 hover:text-red-700 p-1 transform hover:scale-110 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className={`text-center py-12 transition-all duration-700 delay-400 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 text-lg">No categories found</p>
          <p className="text-gray-400">Add your first category to get started</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md mx-4 transform animate-scaleIn">
            <h2 className="text-xl font-bold mb-4">Add New Category</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <input
                  name="name"
                  value={category.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={category.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter category description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Upload Image</label>
                <input
                  onChange={handleImageChange}
                  type="file"
                  accept="image/*"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitCategory}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomPopup
        isOpen={popup.isOpen}
        onClose={closePopup}
        onConfirm={popup.onConfirm}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        showCancel={popup.showCancel}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

export default Category_management;