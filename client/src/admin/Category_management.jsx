import React, { useState } from 'react';
import axios from 'axios';

function Category_management() {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState({
    name: '',
    description: '',
    image: ''
  });

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

  const submitCategory = async () => {
    try {
      await axios.post('http://localhost:4000/categories', category);
      alert('Category added successfully');
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert('Error adding category');
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Category Management</h1>
        <button
          onClick={handleAddCategory}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          + Add Category
        </button>
      </div>

      <div className="relative w-1/3 rounded-full mb-6">
        <input
          type="text"
          placeholder="Search by category name"
          className="w-full border border-gray-100 rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-0 focus:border-gray-300"
        />
        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>


      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Add New Category</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <input
                  name="name"
                  value={category.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-0 focus:border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={category.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-0 focus:border-gray-300"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Upload Image</label>
                <input
                  onChange={handleImageChange}
                  type="file"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-0 focus:border-gray-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={submitCategory}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Category_management;
