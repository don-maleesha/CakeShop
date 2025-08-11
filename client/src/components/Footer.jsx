import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-red-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-red-500 text-xl">🧁</span>
              </div>
              <span className="text-xl font-bold">CakeShop</span>
            </div>
            <p className="text-white text-sm leading-relaxed">
              Delicious handcrafted cakes made with the finest ingredients. 
              From classic flavors to unique creations, we have something for every occasion.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-white">
              <li><a href="/cakes" className="hover:text-red-200 transition-colors">Our Cakes</a></li>
              <li><a href="/custom-order" className="hover:text-red-200 transition-colors">Custom Orders</a></li>
              <li><a href="/contact" className="hover:text-red-200 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-red-200 transition-colors">About Us</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm text-white">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-white" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-white" />
                <span>info@cakeshop.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-white" />
                <span>123 Baker Street, Sweet City</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-red-400 mt-8 pt-8 text-center text-sm text-red-100">
          <p>&copy; 2025 CakeShop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
