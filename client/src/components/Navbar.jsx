import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🔄 BarterApp</Link>
      <div className="navbar-links">
        <Link to="/listings">Browse</Link>
        {user ? (
          <>
            <Link to="/listings/new">+ List Item</Link>
            <Link to="/trades">Trades</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/wishlist">❤️</Link>
            <NotificationBell />
            <Link to={`/profile/${user.id}`}>{user.username}</Link>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-register">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
