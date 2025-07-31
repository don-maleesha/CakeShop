import { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserContext from '../pages/UserContext';

const RoleBasedRedirect = () => {
  const { user, ready } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if user is logged in, context is ready, and we're on the root path
    if (ready && user && location.pathname === '/') {
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [user, ready, navigate, location.pathname]);

  return null; // This component doesn't render anything
};

export default RoleBasedRedirect;
