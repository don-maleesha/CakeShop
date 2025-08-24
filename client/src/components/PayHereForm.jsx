import React, { useEffect, useState } from 'react';

const PayHereForm = ({ paymentData, onSuccess, onError, onCancel }) => {
  const [isPayHereReady, setIsPayHereReady] = useState(false);
  
  useEffect(() => {
    let checkCount = 0;
    const maxChecks = 10;

    const checkPayHereAvailability = () => {
      checkCount++;
      console.log(`Checking PayHere availability (attempt ${checkCount}/${maxChecks})`);
      
      if (window.payhere) {
        console.log('PayHere SDK is available!');
        setIsPayHereReady(true);
        setupPayHereHandlers();
        return true;
      } else if (checkCount >= maxChecks) {
        console.error('PayHere SDK failed to load after multiple attempts');
        if (onError) {
          onError('PayHere SDK failed to load. Please refresh the page and try again.');
        }
        return true; // Stop checking
      } else {
        console.log('PayHere SDK not yet available, retrying...');
        setTimeout(checkPayHereAvailability, 500);
        return false;
      }
    };

    // Start checking immediately
    checkPayHereAvailability();

    function setupPayHereHandlers() {
      console.log('Setting up PayHere event handlers');
      
      // Setup PayHere event handlers exactly as per documentation
      window.payhere.onCompleted = function onCompleted(orderId) {
        console.log("Payment completed. OrderID:" + orderId);
        // Note: validate the payment and show success or failure page to the customer
        if (onSuccess) {
          onSuccess(orderId);
        }
      };

      // Payment window closed
      window.payhere.onDismissed = function onDismissed() {
        // Note: Prompt user to pay again or show an error page
        console.log("Payment dismissed");
        if (onCancel) {
          onCancel();
        }
      };

      // Error occurred
      window.payhere.onError = function onError(error) {
        // Note: show an error page
        console.log("Error:" + error);
        if (onError) {
          onError(error);
        }
      };
    }
  }, [onSuccess, onError, onCancel]);

  const handlePayment = () => {
    console.log('PayHere Pay button clicked');
    
    // Check if PayHere SDK is loaded
    if (!window.payhere) {
      console.error('PayHere SDK not loaded');
      alert('PayHere payment system is not loaded. Please refresh the page and try again.');
      if (onError) {
        onError('PayHere SDK not loaded');
      }
      return;
    }

    if (!paymentData) {
      console.error('Payment data not provided');
      if (onError) {
        onError('Payment data not provided');
      }
      return;
    }

    console.log('PayHere SDK available:', typeof window.payhere);
    console.log('Payment data received:', paymentData);

    // Put the payment variables here - exactly as per PayHere documentation
    var payment = {
      "sandbox": true,
      "merchant_id": paymentData.merchant_id,
      "return_url": undefined,     // Important
      "cancel_url": undefined,     // Important
      "notify_url": paymentData.notify_url,
      "order_id": paymentData.order_id,
      "items": paymentData.items,
      "amount": paymentData.amount,
      "currency": paymentData.currency,
      "hash": paymentData.hash, // *Replace with generated hash retrieved from backend
      "first_name": paymentData.first_name,
      "last_name": paymentData.last_name,
      "email": paymentData.email,
      "phone": paymentData.phone,
      "address": paymentData.address,
      "city": paymentData.city,
      "country": paymentData.country,
      "delivery_address": paymentData.delivery_address,
      "delivery_city": paymentData.delivery_city,
      "delivery_country": paymentData.delivery_country,
      "custom_1": paymentData.custom_1,
      "custom_2": paymentData.custom_2
    };

    console.log('Starting PayHere payment with data:', payment);
    
    try {
      // Show the payhere.js popup, when "PayHere Pay" is clicked
      window.payhere.startPayment(payment);
    } catch (error) {
      console.error('Error starting PayHere payment:', error);
      if (onError) {
        onError('Failed to start payment: ' + error.message);
      }
    }
  };

  if (!paymentData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Ready to Pay</h3>
        <p className="text-gray-600 mb-4">
          Click "PayHere Pay" to open PayHere secure payment gateway.
        </p>
        
        {!isPayHereReady && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4 text-sm text-yellow-800">
            ⏳ Loading PayHere payment system...
          </div>
        )}
        
        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
          <p><strong>Order ID:</strong> {paymentData.order_id}</p>
          <p><strong>Amount:</strong> {paymentData.currency} {paymentData.amount}</p>
          <p><strong>Items:</strong> {paymentData.items}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handlePayment}
            id="payhere-payment"
            disabled={!isPayHereReady}
            className={`flex-1 py-2 px-4 rounded transition-colors ${
              isPayHereReady 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPayHereReady ? 'PayHere Pay' : 'Loading...'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayHereForm;
