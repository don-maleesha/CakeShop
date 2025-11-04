import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';

import IndexPage from './pages/IndexPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { UserContextProvider } from './pages/UserContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { DeliveryProvider } from './contexts/DeliveryContext.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import CakesPage from './pages/CakesPage.jsx';
import CustomOrder from './pages/CustomOrder.jsx';
import Contact from './pages/Contact.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx';
import PaymentCancelPage from './pages/PaymentCancelPage.jsx';
import UserProfile from './pages/UserProfile.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';

import Layout from './Layout.jsx';
import Users from './admin/Users';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';
import ProtectedUserRoute from './components/ProtectedUserRoute.jsx';
import RoleBasedRedirect from './components/RoleBasedRedirect.jsx';

import Category_management from './admin/Category_management.jsx';
import ProductManagement from './admin/ProductManagement.jsx';
import ContactManagement from './admin/ContactManagement.jsx';
import CustomOrderManagement from './admin/CustomOrderManagement.jsx';
import OrderManagement from './admin/OrderManagement.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import Analytics from './admin/Analytics.jsx';

function App() {
  return (
    <>
      <UserContextProvider>
        <CartProvider>
          <DeliveryProvider>
          <Routes>
            {/* Admin Routes - Protected */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="categories" element={<Category_management />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="custom-orders" element={<CustomOrderManagement />} />
              <Route path="users" element={<Users />} />
              <Route path="contacts" element={<ContactManagement />} />
            </Route>

            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route
                index
                element={
                  <>
                    <RoleBasedRedirect />
                    <HomePage />
                  </>
                }
              />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="home" element={<HomePage />} />
              <Route path="cakes" element={<CakesPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="payment/success" element={<PaymentSuccessPage />} />
              <Route path="payment/cancel" element={<PaymentCancelPage />} />
              
              {/* Protected User Route */}
              <Route
                path="custom-order"
                element={
                  <ProtectedUserRoute>
                    <CustomOrder />
                  </ProtectedUserRoute>
                }
              />
              
              {/* User Profile Route */}
              <Route
                path="profile"
                element={
                  <ProtectedUserRoute>
                    <UserProfile />
                  </ProtectedUserRoute>
                }
              />
              
              {/* My Orders Route */}
              <Route
                path="my-orders"
                element={
                  <ProtectedUserRoute>
                    <MyOrdersPage />
                  </ProtectedUserRoute>
                }
              />
              
              <Route path="contact" element={<Contact />} />
            </Route>
          </Routes>
          </DeliveryProvider>
        </CartProvider>
      </UserContextProvider>
    </>
  );
}

export default App;
