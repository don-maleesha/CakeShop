import { useEffect, useState, createContext } from "react";
import axios from "axios";

const UserContext = createContext();

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check both localStorage and sessionStorage for user data
    const localStorageUser = localStorage.getItem('user');
    const sessionStorageUser = sessionStorage.getItem('user');
    
    if (localStorageUser) {
      setUser(JSON.parse(localStorageUser));
      setReady(true);
    } else if (sessionStorageUser) {
      setUser(JSON.parse(sessionStorageUser));
      setReady(true);
    } else {
      // Don't make API call on initial load - just set user as null
      // Profile will be fetched when user actually logs in
      setUser(null);
      setReady(true);
    }
  }, []);

  // Keep storage in sync when user changes
  useEffect(() => {
    if (user) {
      // Update whichever storage was being used
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(user));
      } else if (sessionStorage.getItem('user')) {
        sessionStorage.setItem('user', JSON.stringify(user));
      }
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data } = await axios.get('/api/profile', { withCredentials: true });
      if (data.success && data.user) {
        setUser(data.user);
        return data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setUser(null);
      return null;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear user state and storage regardless of API call result
      setUser(null);
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, ready, logout, fetchUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;