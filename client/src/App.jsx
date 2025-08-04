import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';

import IndexPage from './pages/IndexPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { UserContextProvider } from './pages/UserContext.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';

import CustomOrder from './pages/CustomOrder.jsx';
import Contact from './pages/Contact.jsx';

import Layout from './Layout.jsx';
import Users from './admin/Users';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';
import RoleBasedRedirect from './components/RoleBasedRedirect.jsx';

import Category_management from './admin/Category_management.jsx';
import ProductManagement from './admin/ProductManagement.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';

function App() {
  return (
    <>
      <UserContextProvider>
        <Routes>
          {/* Admin Routes - Protected */}
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }>
            <Route index element={<Dashboard />} /> 
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="categories" element={<Category_management />} />
            <Route path="users" element={<Users />} /> 
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<>
              <RoleBasedRedirect />
              <HomePage />
            </>} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="home" element={<HomePage />} />
            
            <Route path="custom-order" element={<CustomOrder />} />
            <Route path="contact" element={<Contact />} />
          </Route>
        </Routes>
      </UserContextProvider>
    </>
  );
}

export default App;
