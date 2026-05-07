import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './WishlistButton.css';

export default function WishlistButton({ listingId }) {
  const { user }          = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get(`/wishlist/check/${listingId}`)
      .then(r => setSaved(r.data.saved))
      .catch(() => {});
  }, [listingId, user]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || loading) return;
    setLoading(true);
    try {
      if (saved) {
        await api.delete(`/wishlist/${listingId}`);
        setSaved(false);
      } else {
        await api.post(`/wishlist/${listingId}`);
        setSaved(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      className={`wishlist-btn ${saved ? 'saved' : ''}`}
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
    >
      {saved ? '❤️' : '🤍'}
    </button>
  );
}
