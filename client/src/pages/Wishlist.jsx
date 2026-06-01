// pages/Wishlist.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';

export default function Wishlist() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/wishlist').then(res => setListings(res.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      <div style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '1.75rem 1.5rem' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Wishlist</h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Items you have saved for later</p>
        </div>
      </div>

      <div className="container" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="grid-listing">
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: '22rem', background: '#e5e7eb', borderRadius: 'var(--radius-lg)', opacity: 0.4 }} />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid-listing">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <p className="empty-state__title">Your wishlist is empty</p>
            <p className="empty-state__text">Save listings you like by tapping the heart icon.</p>
            <Link to="/listings" className="btn btn-primary">Browse Listings</Link>
          </div>
        )}
      </div>
    </div>
  );
}
