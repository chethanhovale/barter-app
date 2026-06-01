// components/Navbar.jsx
// Urban Fresh theme — matches reference HTML exactly
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} className="navbar__logo">
          <div className="navbar__logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </div>
          <span className="navbar__logo-text">Barter<span>App</span></span>
        </Link>

        {/* Centre links */}
        {user ? (
          <div className="navbar__links">
            <Link to="/listings">Marketplace</Link>
            <Link to="/what-can-i-get">What Can I Get?</Link>
            <Link to="/my-trades">My Trades</Link>
            <span style={{ color: 'var(--teal-30)' }}>|</span>
            <span className="navbar__badge">
              <span className="navbar__badge-dot" />
              Bangalore 2026
            </span>
          </div>
        ) : (
          <div className="navbar__links">
            <a href="#features">AI Features</a>
            <a href="#search">Explore</a>
            <a href="#how-it-works">How it Works</a>
            <span style={{ color: 'var(--teal-30)' }}>|</span>
            <span className="navbar__badge">
              <span className="navbar__badge-dot" />
              Bangalore 2026
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="navbar__actions">
          {user ? (
            <>
              <NotificationBell />
              <Link to="/wishlist" style={{ color: 'var(--gray)', display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </Link>
              <Link to="/profile" className="avatar" style={{ textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.username} />
                  : user.username?.slice(0, 2).toUpperCase()}
              </Link>
              <Link to="/listings/create" className="btn btn-primary btn-sm">+ List Item</Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'var(--dark)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">Start Trading</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
