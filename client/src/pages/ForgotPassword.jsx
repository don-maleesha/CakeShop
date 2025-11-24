import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.post('/api/auth/forgot-password', { email });
      setMessage('If an account exists, a verification code has been emailed.');
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email)}`), 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-80 flex flex-col justify-center py-08 sm:px-6 lg:px-8">
      <div className="mb-1 sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-1 text-center text-3xl font-extrabold text-gray-900">Forgot Password</h2>
        <p className="text-center text-gray-600">Enter your email to receive a verification code.</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {message && <div className="mb-4 p-2 bg-green-50 border border-green-200 text-green-700 rounded">{message}</div>}
        {error && <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
        <div className="mb-20 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
