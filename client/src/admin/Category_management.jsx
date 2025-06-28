import React, { useState } from 'react'

function Category_management() {
  const [showModal, setShowModal] = useState(false)

  const handleAddCategory = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  return (
    <>
      <div className="mt-5">
        <span className="text-3xl font-bold">Category Management</span>
        <button onClick={handleAddCategory} className="bg-red-500 text-white px-4 py-2 rounded float-right mr-2">
          + Add Category
        </button>
      </div>

      <div className="flex border border-red-100 rounded-full p-2 shadow-md shadow-gray-300 w-1/3 mt-10">
        <input type="text" placeholder="Search by category name"className="flex-1 outline-none"/>

        <button className='bg-primary text-white p-2 rounded-full'><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        </button>

      </div>

      
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add New Category</h2>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Category Name</label>
                <input type="text"placeholder="e.g., Chocolate Cakes"className="w-full border border-gray-300 p-2 rounded"/>
              </div>

              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea placeholder="Brief description of this category" className="w-full border border-gray-300 p-2 rounded"/>
              </div>

              <div>
                <label className="block text-sm font-medium">Image URL</label>
                <input type="text" placeholder="https://example.com/image.jpg"className="w-full border border-gray-300 p-2 rounded"/>
              </div>

              <div className="flex justify-end space-x-2">
                <button type="button" className="bg-red-500 text-white px-4 py-2 rounded">
                  Add Category
                </button>
                <button type="button" onClick={handleCloseModal} className="bg-gray-300 text-black px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Category_management
