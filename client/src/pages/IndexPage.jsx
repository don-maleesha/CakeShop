import Header from "../Header";

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Welcome to CakeShop
        </h1>
        <p className="text-lg text-center text-gray-600 mb-12">
          Discover our delicious selection of artisan cakes made with love
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fresh Daily</h2>
            <p className="text-gray-600">All our cakes are baked fresh daily using the finest ingredients.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Orders</h2>
            <p className="text-gray-600">We create custom cakes for your special occasions and celebrations.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Local Delivery</h2>
            <p className="text-gray-600">Free delivery within the city for orders over $50.</p>
          </div>
        </div>
      </main>
    </div>
  );
}