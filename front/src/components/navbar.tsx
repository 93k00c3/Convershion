import React, { useState } from 'react';
import './navbar.css';
import logoSvg from './logo.svg';
import Login from './login.tsx';


interface NavbarProps {
  loggedIn: boolean;
  username?: string;
}

const Navbar: React.FC<NavbarProps> = ({ loggedIn, username }) => {
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginClick = () => {
    setShowLogin(true);
};

const handleLoginClose = () => {
    setShowLogin(false);
};
  return (
    <nav>
      <div className="logo h-100 w-100">
        <img src={logoSvg} alt="Logo" style={{ width: '50px', height: 'auto' }} />
      </div>
      <ul className="nav-links">
        <li><a href="#">Convershion</a></li>
      </ul>
      <div className="login-register">
        {loggedIn ? (
          <>
            <a href="#">Welcome, {username}</a>
            <a href="/logout">Logout</a>
          </>
        ) : (
          <>
            <button onClick={handleLoginClick}>Login</button>
                    
            <a href="/register">Register</a>
          </>
        )}
      </div>
      {showLogin && <Login onClose={handleLoginClose} />}     
    </nav>
  );
}

export default Navbar;
