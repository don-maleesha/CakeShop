
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Category_management from './admin/category_management.jsx'
import React from 'react'
import IndexPage from './pages/IndexPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import Layout from './Layout.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

function App() {
  

  return (
    <Routes>
      { <Route path="/admin" element={<Category_management />} /> }
      
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
    
    )
}

export default App
