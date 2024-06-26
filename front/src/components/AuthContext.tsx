import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  username: null,
  login: async () => false,
  logout: () => {},
  register: async () => false
});

const AuthContextProvider: React.FC = ({ children }: any) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedLogin = localStorage.getItem('isLoggedIn');
    if (storedLogin === 'true') {
      setIsLoggedIn(true);
      setUsername(localStorage.getItem('username'));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include' 
      });
      if (!response.ok){
        return { response: response, success: false };
      }

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUsername(data.username);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', data.username);
        Cookies.remove('guest_folder');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return { response: response, success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { response: error, success: false };

    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include' 
      });
      if (response.ok) {
        setIsLoggedIn(true);
        setUsername(username);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        Cookies.remove('guest_folder');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return { response: response, success: true };
      }
      if (!response.ok){
        return { response: response, success: false };
      }} catch (error) {
        console.error('Registration error:', error);
        return { error: error, success: false };
      }
  };

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include'
      }); 
      if (!response.ok) {
        return { response: response, success: false };
      }
      if(response.ok) {
        setIsLoggedIn(false);
        setUsername(null);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        Cookies.remove('guest_folder');
        Cookies.remove('session');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return { response: response, success: true };
        }
        } catch (error) {
          console.error('Logout error:', error);
          return { response: error, success: false };
        }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        username,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthContextProvider };
