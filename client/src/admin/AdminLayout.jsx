import React, { useContext } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IoAccessibility, IoBarChartSharp, IoBagCheck, IoFastFood, IoCubeOutline } from "react-icons/io5";
import { AiFillDashboard, AiFillHdd } from "react-icons/ai";
import { HiUsers } from "react-icons/hi";
import { HiLogout } from "react-icons/hi";
import UserContext from '../pages/UserContext';

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(UserContext);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <AiFillDashboard /> },
    { name: 'Products', path: '/admin/products', icon: <IoBagCheck /> },
    { name: 'Orders', path: '/admin/orders', icon: <IoFastFood /> },
    { name: 'Custom Orders', path: '/admin/custom-orders', icon: <IoCubeOutline /> },
    { name: 'Categories', path: '/admin/categories', icon: <AiFillHdd /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <IoBarChartSharp /> },
    { name: 'Users', path: '/admin/users', icon: <HiUsers /> },
    { name: 'Contact Messages', path: '/admin/contacts', icon: <IoAccessibility /> },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-10">Admin Panel</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-2 rounded hover:bg-red-100 ${
                location.pathname === item.path ? 'bg-red-100 text-red-500' : 'text-gray-700'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
          
          {/* Modern Logout Button - positioned after navigation items */}
          <div className="pt-4">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center px-4 py-3 text-white bg-red-500 hover:bg-red-600 rounded-lg w-full transition-colors duration-200 font-medium shadow-sm"
            >
              <HiLogout className="mr-2 text-lg" />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">Hi Admin 👋</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome back!</span>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
