// pages/Profile.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ListingCard from '../components/ListingCard';

export default function Profile() {
  const { id }                        = useParams();
  const { user: me }                  = useContext(AuthContext);
  const [profile, setProfile]         = useState(null);
  const [listings, setListings]       = useState([]);
  const [reviews, setReviews]         = useState([]);
  const [tab, setTab]                 = useState('listings');
  const [loading, setLoading]         = useState(true);

  const userId = id || me?.id;

  useEffect(() => {
    Promise.all([
      api.get(`/users/${userId}`),
      api.get(`/listings?user_id=${userId}`),
      api.get(`/reviews?user_id=${userId}`).catch(() => ({ data: [] })),
    ]).then(([pRes, lRes, rRes]) => {
      setProfile(pRes.data);
      setListings(Array.isArray(lRes.data) ? lRes.data : lRes.data?.listings || []);
      setReviews(rRes.data || []);
    }).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--gray)', fontSize: '0.875rem' }}>Loading profile…</div>
  );
  if (!profile) return (
    <div className="empty-state container" style={{ paddingTop: '4rem' }}>
      <p className="empty-state__title">User not found</p>
      <Link to="/listings" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Marketplace</Link>
    </div>
  );

  const isMe = me?.id === userId;
  const ratingRounded = Math.round(profile.rating || 0);

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '2rem 1.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="avatar avatar-xl">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} />
                : profile.username?.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{profile.username}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginTop: '0.375rem' }}>
                {profile.location && (
                  <span style={{ color: 'var(--gray)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {profile.location}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < ratingRounded ? '#F59E0B' : 'none'} stroke={i < ratingRounded ? '#F59E0B' : '#D1D5DB'} strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                  <span style={{ color: 'var(--gray)', fontSize: '0.8rem', marginLeft: '0.25rem' }}>
                    {Number(profile.rating).toFixed(1)} · {reviews.length} reviews
                  </span>
                </div>
                <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>
                  Member since {new Date(profile.created_at).getFullYear()}
                </span>
              </div>
              {profile.bio && (
                <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: '0.625rem', maxWidth: '520px', lineHeight: 1.65 }}>{profile.bio}</p>
              )}
            </div>
            {isMe && <Link to="/dashboard" className="btn btn-outline">Edit Profile</Link>}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '1.5rem' }}>
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          {[
            { label: 'Listings',          value: listings.length },
            { label: 'Completed Trades',  value: profile.completed_trades || 0 },
            { label: 'Reviews',           value: reviews.length },
            { label: 'Rating',            value: `${Number(profile.rating).toFixed(1)} / 5` },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className={`tab ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>
            Listings <span style={{ marginLeft: '0.25rem', background: tab === 'listings' ? 'var(--blue-10)' : '#F3F4F6', color: tab === 'listings' ? 'var(--blue)' : 'var(--gray)', borderRadius: '9999px', padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>{listings.length}</span>
          </div>
          <div className={`tab ${tab === 'reviews'  ? 'active' : ''}`} onClick={() => setTab('reviews')}>
            Reviews <span style={{ marginLeft: '0.25rem', background: tab === 'reviews' ? 'var(--blue-10)' : '#F3F4F6', color: tab === 'reviews' ? 'var(--blue)' : 'var(--gray)', borderRadius: '9999px', padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>{reviews.length}</span>
          </div>
        </div>

        {tab === 'listings' && (
          listings.length > 0
            ? <div className="grid-listing">{listings.map(l => <ListingCard key={l.id} listing={l} />)}</div>
            : <div className="empty-state">
                <p className="empty-state__title">No active listings</p>
                {isMe && <Link to="/listings/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>List Your First Item</Link>}
              </div>
        )}

        {tab === 'reviews' && (
          reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '700px' }}>
              {reviews.map(r => (
                <div key={r.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.75rem' }}>
                    <div className="avatar">{r.reviewer?.username?.slice(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.reviewer?.username}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < r.rating ? '#F59E0B' : 'none'} stroke={i < r.rating ? '#F59E0B' : '#D1D5DB'} strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {r.comment && <p style={{ color: 'var(--gray)', fontSize: '0.875rem', lineHeight: 1.65 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No reviews yet</p>
              <p className="empty-state__text">Reviews appear after completed trades.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
