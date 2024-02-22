import React from 'react';
import '../static/css/navbar.css';

interface NavbarProps {
  loggedIn: boolean;
  username?: string;
}

const Navbar: React.FC<NavbarProps> = ({ loggedIn, username }) => {
  return (
    <nav>
      <div className="logo">Logo</div>
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
            <a href="/login" className="pl-5">Login</a>
            <a href="/register">Register</a>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
