import React from 'react';
import { Link } from 'react-router-dom';
import { X, Gift, ShoppingBag, Star, Clock } from 'lucide-react';

const RegistrationIncentiveModal = ({ 
  show, 
  onDismiss, 
  trigger = 'first-add',
  productName = null 
}) => {
  if (!show) {
    return null;
  }

  const handleCreateAccount = () => {
    // Store the current cart before redirecting to registration
    localStorage.setItem('redirectAfterRegistration', window.location.pathname);
    onDismiss();
  };

  const benefits = [
    { icon: Gift, text: '5% discount on all orders', highlight: true },
    { icon: Clock, text: 'Faster checkout next time' },
    { icon: Star, text: 'Exclusive member-only offers' },
    { icon: ShoppingBag, text: 'Save your cart across devices' }
  ];

  const getTriggerContent = () => {
    switch (trigger) {
      case 'first-add':
        return {
          title: '🎉 Great choice!',
          subtitle: productName ? `${productName} added to cart` : 'Item added to cart',
          description: 'Create an account now and get 5% off this order plus exclusive member benefits!'
        };
      case 'multiple-items':
        return {
          title: '🛒 Building a nice order!',
          subtitle: 'Save your cart and unlock rewards',
          description: 'Create an account to save your cart and get 5% off plus member-only perks!'
        };
      case 'high-value':
        return {
          title: '💰 Big savings opportunity!',
          subtitle: 'Your cart qualifies for member benefits',
          description: 'Create an account now and save 5% on this order - that\'s real money!'
        };
      default:
        return {
          title: '✨ Join our community!',
          subtitle: 'Unlock exclusive benefits',
          description: 'Create an account to get 5% off and access member-only features!'
        };
    }
  };

  const content = getTriggerContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 relative overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 relative">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="text-xl font-bold mb-1">{content.title}</h3>
          <p className="text-red-100 text-sm">{content.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">{content.description}</p>
          
          {/* Benefits list */}
          <div className="space-y-3 mb-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className={`flex items-center space-x-3 p-2 rounded-lg ${
                  benefit.highlight ? 'bg-red-50 border border-red-200' : ''
                }`}
              >
                <div className={`p-1 rounded-full ${
                  benefit.highlight ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <benefit.icon className="w-4 h-4" />
                </div>
                <span className={`text-sm ${
                  benefit.highlight ? 'font-semibold text-red-800' : 'text-gray-700'
                }`}>
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Link
              to="/register"
              onClick={handleCreateAccount}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors text-center block"
            >
              Create Account & Get 5% Off
            </Link>
            
            <button
              onClick={onDismiss}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Continue as Guest
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            Free to join • No spam • Unsubscribe anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationIncentiveModal;
