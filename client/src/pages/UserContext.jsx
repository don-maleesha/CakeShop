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
      // Only fetch profile if no stored user exists
      axios.get('/profile').then(({ data }) => {
        setUser(data);
        setReady(true);
      }).catch(() => {
        setReady(true); // Mark as ready even if profile fetch fails
      });
    }
  }, []);

  const logout = () => {
    axios.post('/logout');
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ user, setUser, ready, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;