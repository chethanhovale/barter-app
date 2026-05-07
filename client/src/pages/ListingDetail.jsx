import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TradeValueEstimator from '../components/TradeValueEstimator';
import './ListingDetail.css';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing]       = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [offer, setOffer]           = useState({ offered_listing_id: '', message: '', cash_adjustment: 0 });
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    api.get(`/listings/${id}`).then(r => setListing(r.data)).catch(() => navigate('/listings'));
    if (user) {
      api.get('/listings?status=active').then(r => {
        setMyListings(r.data.listings.filter(l => l.user_id === user.id));
      }).catch(() => {});
    }
  }, [id, user]);

  const handleTrade = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/trades', {
        requested_listing_id: id,
        offered_listing_id: offer.offered_listing_id || null,
        message: offer.message,
        cash_adjustment: offer.cash_adjustment,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit trade offer.');
    }
  };

  if (!listing) return <div className="loading">Loading…</div>;

  const isOwner = user && user.id === listing.user_id;

  // Find the selected offer listing details for the estimator
  const selectedOfferListing = myListings.find(l => l.id === offer.offered_listing_id);

  return (
    <div className="detail-page">
      <div className="detail-main">
        {/* Images */}
        <div className="detail-images">
          {listing.images && listing.images.length > 0
            ? <img src={listing.images[0]} alt={listing.title} />
            : <div className="img-placeholder">📦</div>
          }
        </div>

        {/* Info */}
        <div className="detail-info">
          <span className="detail-category">{listing.category_name}</span>
          <h1 className="detail-title">{listing.title}</h1>
          <div className="detail-badges">
            <span className="badge condition">{listing.condition.replace('_', ' ')}</span>
            {listing.location && <span className="badge location">📍 {listing.location}</span>}
            {listing.estimated_value && (
              <span className="badge value">Est. ₹{Number(listing.estimated_value).toLocaleString()}</span>
            )}
          </div>
          <p className="detail-desc">{listing.description}</p>
          {listing.looking_for && (
            <div className="looking-for">
              <strong>Looking for:</strong> {listing.looking_for}
            </div>
          )}

          <div className="detail-owner">
            <div className="owner-info">
              <span className="owner-name">{listing.username}</span>
              {listing.owner_rating > 0 && (
                <span className="owner-rating">⭐ {Number(listing.owner_rating).toFixed(1)}</span>
              )}
            </div>
          </div>

          {/* AI Trade Value Estimator — shown to non-owners who are logged in */}
          {!isOwner && user && (
            <TradeValueEstimator
              compact={true}
              prefillItem1={{
                title: listing.title,
                condition: listing.condition,
                value: listing.estimated_value || '',
              }}
              prefillItem2={selectedOfferListing ? {
                title: selectedOfferListing.title,
                condition: selectedOfferListing.condition,
                value: selectedOfferListing.estimated_value || '',
              } : undefined}
            />
          )}

          {/* Trade form */}
          {!isOwner && user && (
            <div className="trade-box">
              <h3>Propose a Trade</h3>
              {submitted ? (
                <p className="success-msg">✅ Trade offer sent! Check your trades.</p>
              ) : (
                <form onSubmit={handleTrade}>
                  <label>Offer one of your listings (optional)</label>
                  <select
                    value={offer.offered_listing_id}
                    onChange={e => setOffer({ ...offer, offered_listing_id: e.target.value })}
                  >
                    <option value="">-- I'll offer something else --</option>
                    {myListings.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>

                  <label>Message</label>
                  <textarea
                    placeholder="Describe your offer or ask a question…"
                    rows={3}
                    value={offer.message}
                    onChange={e => setOffer({ ...offer, message: e.target.value })}
                  />

                  <label>Cash top-up (₹) — optional</label>
                  <input
                    type="number"
                    min="0"
                    value={offer.cash_adjustment}
                    onChange={e => setOffer({ ...offer, cash_adjustment: e.target.value })}
                  />

                  {error && <p className="error-msg">{error}</p>}
                  <button type="submit" className="btn-trade">Send Trade Offer</button>
                </form>
              )}
            </div>
          )}

          {!user && (
            <p className="login-prompt">
              <a href="/login">Login</a> to propose a trade.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
