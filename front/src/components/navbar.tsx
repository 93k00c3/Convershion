import React, { useState, useEffect, useContext } from 'react';
import './navbar.css';
import logoSvg from './logo.svg';
import Login from './login.tsx';
import Registration from './registration.tsx';
import { AuthContext } from './AuthContext.tsx';



interface NavbarProps {
  loggedIn: boolean;
  username: string;
  onLogout: () => void;
}

 const Navbar: React.FC = () => {
  const [modalState, setModalState] = useState<'login' | 'register' | null>(null);
  const { isLoggedIn, username, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  
  return (
    <nav>
      <div className="logo h-100 w-100">
      <svg width="50px" height="50px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" filter="url(#blurMe)">
        <defs>

          <radialGradient id="gradient" className='animated-gradient' cx="0.1" cy="0.5" r="1.12" fx="0.15" fy="0.45">
            <stop offset="45%" stop-color="#0fbfda">
              <animate attributeName="stop-opacity" values="1;0.7;1" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stop-color="#107d8e" />
          </radialGradient>
        </defs>
        <path className="animated-gradient" d="M20.84,16.35a1,1,0,0,1-1-.75l-1.39-5.54a.49.49,0,0,0-1,0l-1.09,4.36a2.5,2.5,0,0,1-4.86,0l-1.09-4.36a.49.49,0,0,0-1,0L8.43,14.42a2.5,2.5,0,0,1-4.86,0L2.15,8.74A1,1,0,0,1,4.1,8.26l1.42,5.68a.49.49,0,0,0,1,0L7.57,9.58a2.5,2.5,0,0,1,4.86,0l1.09,4.36a.49.49,0,0,0,1,0l1.09-4.36a2.5,2.5,0,0,1,4.86,0l1.38,5.53a1,1,0,0,1-1,1.24Z" fill="url(#gradient)" />
      </svg>
      </div>
      <ul className="nav-links">
        <li><a href="#">Convershion</a></li>
      </ul>
      <div className="login-register">
        {isLoggedIn ? (
          <>
            <span className="welcome-message">Welcome, {username}</span> 
            <button onClick={handleLogout}>Logout</button> 
          </>
        ) : (
          <>
            <button onClick={() => setModalState('login')}>Login</button>
            <button onClick={() => setModalState('register')}>Register</button>
          </>
        )}
      </div>

      {modalState === 'login' && <Login onClose={() => setModalState(null)} />}
      {modalState === 'register' && <Registration onClose={() => setModalState(null)} />}
    </nav>
  );
}

export default Navbar;
