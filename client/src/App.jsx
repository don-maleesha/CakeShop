
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';

import IndexPage from './pages/IndexPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { UserContextProvider } from './pages/UserContext.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import Layout from './Layout.jsx';
import Users from './admin/Users';


import Category_management from './admin/Category_management.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';

function App() {
  return (
    <>
      <UserContextProvider>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} /> 
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="categories" element={<Category_management />} />
            <Route path="users" element={<Users />} /> 
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="home" element={<HomePage />} />
          </Route>
        </Routes>
      </UserContextProvider>
    </>

  );
}

export default App;
