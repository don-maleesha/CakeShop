import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import UserContext from '../pages/UserContext';

const ProtectedUserRoute = ({ children }) => {
  const { user, ready } = useContext(UserContext);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedUserRoute;
