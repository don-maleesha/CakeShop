import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Check if we have order data from navigation state
        const locationState = location.state;
        let orderId = null;
        
        if (locationState && locationState.orderNumber) {
          orderId = locationState.orderNumber;
        } else {
          // Check URL params for PayHere return
          orderId = searchParams.get('order_id') || searchParams.get('orderId');
        }
        
        if (!orderId) {
          console.log('No order ID found in state or URL params');
          setPaymentStatus('error');
          setLoading(false);
          return;
        }
        
        console.log('Checking payment status for order:', orderId);
        
        // Check payment status from our backend
        const response = await axios.get(`http://localhost:4000/payment/status/${orderId}`);
        
        if (response.data.success) {
          setOrderData(response.data.data);
          
          if (response.data.data.paymentStatus === 'paid') {
            setPaymentStatus('success');
          } else if (response.data.data.paymentStatus === 'pending') {
            setPaymentStatus('pending');
          } else {
            setPaymentStatus('error');
          }
        } else {
          setPaymentStatus('error');
        }
      } catch (error) {
        console.error('Payment status check error:', error);
        setPaymentStatus('error');
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          {paymentStatus === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for your payment. Your order has been confirmed and we'll start preparing it shortly.
              </p>
              {orderData && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-green-800">
                    <p><strong>Order Status:</strong> {orderData.orderStatus}</p>
                    <p><strong>Payment Status:</strong> {orderData.paymentStatus}</p>
                    {orderData.paymentDetails && (
                      <p><strong>Transaction ID:</strong> {orderData.paymentDetails.transactionId}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <button
                    onClick={() => {
                    const locationState = location.state;
                    const orderId = locationState?.orderNumber || searchParams.get('order_id');
                    if (orderId) {
                      navigate('/order-confirmation', { 
                        state: { 
                          orderNumber: orderId,
                          order: orderData || locationState?.order
                        }
                      });
                    } else {
                      navigate('/');
                    }
                  }}
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  View Order Details
                </button>
                <button
                  onClick={() => navigate('/cakes')}
                  className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </>
          )}

          {paymentStatus === 'pending' && (
            <>
              <Loader className="w-16 h-16 mx-auto text-yellow-500 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Pending</h1>
              <p className="text-gray-600 mb-6">
                Your payment is being processed. Please wait while we verify the transaction.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                Refresh Status
              </button>
            </>
          )}

          {paymentStatus === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-500 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
              <p className="text-gray-600 mb-6">
                We encountered an issue processing your payment. Please try again or contact support.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Contact Support
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
