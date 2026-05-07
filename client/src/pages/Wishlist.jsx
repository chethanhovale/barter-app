import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import './Listings.css';

export default function Wishlist() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/wishlist')
      .then(r => setListings(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="listings-page">
      <div className="listings-header">
        <h1>❤️ Saved Items</h1>
      </div>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : listings.length === 0 ? (
        <div className="empty">
          No saved items yet. <Link to="/listings">Browse listings</Link> and tap 🤍 to save them here.
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
