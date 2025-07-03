import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Products', path: '/admin/products', icon: '📦' },
    { name: 'Orders', path: '/admin/orders', icon: '🧾' },
    { name: 'Categories', path: '/admin/categories', icon: '🏷️' },
    { name: 'Analytics', path: '/admin/analytics', icon: '📈' },
    { name: 'Users', path: '/admin/users', icon: '👥' },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-6">
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
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
