import React, { useState, useRef, useEffect, useContext } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import './navbar.css';
import logoSvg from './logo.svg';
import Login from './login.tsx';
import Registration from './registration.tsx';
import { AuthContext } from './AuthContext.tsx';
import { Link } from 'react-router-dom';

interface NavbarProps {
  loggedIn: boolean;
  username: string;
  onLogout: () => void;
}

const Navbar: React.FC = () => {
  const [modalState, setModalState] = useState<'login' | 'register' | null>(null);
  const { isLoggedIn, username, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setShowLock(true);
      setTimeout(() => {
        setShowLock(false);
        logout();
      }, 2000);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <nav>
      <div className="logo h-100 w-100">
        <a href="/">
          <img width='50px' height='50px' src={logoSvg} alt="Logo" />
        </a>
      </div>
      <div className="convershion">
        <a href="#">convershion</a>
      </div>
      <div className="login-register">
        {isLoggedIn && !showLock ? (
          <>
            <div
              className="user-icon"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <FaUserCircle size={24} color="#888" />
              {showDropdown && !modalState && (
              <div className="dropdown-window" ref={dropdownRef}>
                <ul>
                  <li>
                    <Link to="/profile">Profile</Link>
                  </li>
                  <li>
                    <Link to="/files">Files</Link>
                  </li>
                  <li>
                    <button onClick={handleLogout}>Logout</button>
                  </li>
                </ul>
              </div>
            )}
            </div>
          </>
        ) : (
          !showLock &&
          <>
            <button className='pr-4' onClick={() => setModalState('login')}>login </button>
            <button onClick={() => setModalState('register')}>register</button>
          </>
          
        )}
      </div>      
      {showLock && <div className="logout" role="img" aria-label="lock">🔓</div>}
      {modalState === 'login' && <Login onClose={() => setModalState(null)} />}
      {modalState === 'register' && <Registration onClose={() => setModalState(null)} />}
    </nav>
  );
}

export default Navbar;