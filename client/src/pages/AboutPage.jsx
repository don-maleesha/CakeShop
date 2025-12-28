import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">About CakeShop</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Crafting sweet moments and unforgettable memories since our beginning
          </p>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Our Story</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Welcome to CakeShop, where every cake tells a story and every bite brings joy. 
              Our journey began with a simple passion: creating beautiful, delicious cakes that 
              make life's special moments even sweeter.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              From humble beginnings in a small kitchen to serving thousands of happy customers, 
              we've stayed true to our commitment of quality, creativity, and customer satisfaction.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today, we're proud to be your go-to destination for custom cakes, celebration treats, 
              and sweet surprises that make every occasion memorable.
            </p>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-lg p-8 shadow-2xl">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🧁</div>
                <h3 className="text-2xl font-bold mb-2">Sweet Moments</h3>
                <p className="text-red-100">Delivered with Love</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Quality */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4 text-center">✨</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Quality First</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                We use only the finest ingredients and time-tested recipes to ensure every cake 
                is a masterpiece of flavor and texture.
              </p>
            </div>

            {/* Creativity */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4 text-center">🎨</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Creative Design</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                From classic elegance to modern artistry, our talented bakers bring your dream 
                cakes to life with stunning designs.
              </p>
            </div>

            {/* Customer Care */}
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4 text-center">💖</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Customer Love</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Your satisfaction is our priority. We work closely with you to create exactly 
                what you envision for your special day.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What We Offer Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">What We Offer</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Wedding Cakes */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">💒</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Wedding Cakes</h3>
            <p className="text-gray-600 text-sm">Elegant designs for your special day</p>
          </div>

          {/* Birthday Cakes */}
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">🎂</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Birthday Cakes</h3>
            <p className="text-gray-600 text-sm">Celebrate another year in style</p>
          </div>

          {/* Custom Orders */}
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Custom Orders</h3>
            <p className="text-gray-600 text-sm">Your vision, our creation</p>
          </div>

          {/* Corporate Events */}
          <div className="bg-gradient-to-br from-green-100 to-teal-100 rounded-lg p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">🏢</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Corporate Events</h3>
            <p className="text-gray-600 text-sm">Professional catering services</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">1000+</div>
              <p className="text-red-100">Happy Customers</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <p className="text-red-100">Custom Cakes</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50+</div>
              <p className="text-red-100">Unique Flavors</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100%</div>
              <p className="text-red-100">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Meet Our Team</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Our talented team of bakers, decorators, and customer service specialists work together 
          to bring you the best cake experience possible.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Team Member 1 */}
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-5xl">
              👨‍🍳
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Master Bakers</h3>
            <p className="text-gray-600">Crafting perfection with every recipe</p>
          </div>

          {/* Team Member 2 */}
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-5xl">
              🎨
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Cake Decorators</h3>
            <p className="text-gray-600">Bringing your visions to life</p>
          </div>

          {/* Team Member 3 */}
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-5xl">
              💁
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Customer Care</h3>
            <p className="text-gray-600">Here to help every step of the way</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">Ready to Order?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Let's create something amazing together. Browse our collection or create a custom order today!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/cakes"
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
            >
              Browse Cakes
            </Link>
            <Link
              to="/custom-order"
              className="bg-white text-red-600 border-2 border-red-500 px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition-all shadow-lg hover:shadow-xl"
            >
              Custom Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
