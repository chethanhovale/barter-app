// components/WishlistButton.jsx
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function WishlistButton({ listingId, initialState = false }) {
  const { user }           = useContext(AuthContext);
  const [saved, setSaved]  = useState(initialState);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const toggle = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      if (saved) {
        await api.delete(`/wishlist/${listingId}`);
      } else {
        await api.post('/wishlist', { listing_id: listingId });
      }
      setSaved(!saved);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={toggle}
      className={`wishlist-btn ${saved ? 'active' : ''}`}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      disabled={loading}
    >
      <svg width="18" height="18" viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
