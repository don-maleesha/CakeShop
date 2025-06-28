
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Category_management from './admin/category_management.jsx'
import React from 'react'

function App() {
  

  return (
    <Routes>
      <Route index element={<Category_management />} />

      
    </Routes>
    
    )
}

export default App
