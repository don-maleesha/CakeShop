import { Route, Routes } from 'react-router-dom';
import './App.css';
import React from 'react';

import Category_management from './admin/Category_management.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';

import Layout from './Layout.jsx';
import IndexPage from './pages/IndexPage.jsx';
import LoginPage from './pages/LoginPage.jsx';

function App() {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} /> 
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="categories" element={<Category_management />} />
        
      </Route>

      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexPage />} />
        <Route path="login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}

export default App;
