import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto text-yellow-500 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. Your order has not been processed and no charges were made.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            You can try placing your order again or continue shopping for more delicious cakes.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Checkout
            </button>
            <button
              onClick={() => navigate('/cakes')}
              className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Need help?</strong> If you experienced any issues during checkout, 
              please contact our support team and we'll be happy to assist you.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Contact Support →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
