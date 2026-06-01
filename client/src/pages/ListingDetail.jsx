// pages/ListingDetail.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useAI } from '../hooks/useAI';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [listing, setListing]       = useState(null);
  const [images, setImages]         = useState([]);
  const [activeImg, setActiveImg]   = useState(0);
  const [valuation, setValuation]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [proposing, setProposing]   = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [offered, setOffered]       = useState('');
  const [cashAdj, setCashAdj]       = useState(0);
  const { valuateItem }             = useAI();

  useEffect(() => {
    Promise.all([
      api.get(`/listings/${id}`),
      user ? api.get(`/listings?user_id=${user.id}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([listRes, myRes]) => {
      setListing(listRes.data);
      setImages(listRes.data.images || [listRes.data.primary_image].filter(Boolean));
      setMyListings(Array.isArray(myRes.data) ? myRes.data : myRes.data?.listings || []);
    }).finally(() => setLoading(false));
  }, [id, user]);

  const handleValuate = async () => {
    try {
      const v = await valuateItem({ listing_id: id });
      setValuation(v);
    } catch { /* silent */ }
  };

  const handlePropose = async () => {
    if (!offered) return;
    try {
      await api.post('/trades', {
        requested_listing_id: id,
        offered_listing_id: offered,
        cash_adjustment: cashAdj,
      });
      navigate('/my-trades');
    } catch (err) {
      alert(err.message || 'Could not send proposal');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this listing?')) return;
    await api.delete(`/listings/${id}`);
    navigate('/listings');
  };

  const conditionClass = {
    excellent: 'condition-excellent', good: 'condition-good',
    fair: 'condition-fair', poor: 'condition-poor',
  }[listing?.condition?.toLowerCase()] || 'badge-gray';

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--gray)' }}>Loading…</div>
  );
  if (!listing) return (
    <div className="empty-state container" style={{ paddingTop: '4rem' }}>
      <p className="empty-state__title">Listing not found</p>
      <Link to="/listings" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Marketplace</Link>
    </div>
  );

  const isOwner = user?.id === listing.user_id;

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <Link to="/listings" style={{ color: 'var(--gray)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
          ← Back to Marketplace
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          {/* Images */}
          <div>
            <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'white', border: '1px solid var(--teal-10)', marginBottom: '0.75rem', aspectRatio: '4/3' }}>
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)' }}>
                  No image
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{ width: '4rem', height: '4rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: `2px solid ${i === activeImg ? 'var(--teal)' : 'transparent'}`, padding: 0, cursor: 'pointer', background: 'transparent' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--blue)', background: 'var(--blue-10)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {listing.category_name}
              </span>
              <span className={`badge badge-mono ${conditionClass}`} style={{ fontSize: '0.7rem' }}>{listing.condition}</span>
              {listing.status !== 'active' && (
                <span className={`badge status-${listing.status}`} style={{ fontSize: '0.7rem' }}>{listing.status}</span>
              )}
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{listing.title}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--blue)' }}>
                ₹{Number(listing.estimated_value || 0).toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {listing.location}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{listing.views} views</span>
            </div>

            <p style={{ color: 'var(--gray)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{listing.description}</p>

            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: '0.375rem' }}>Looking For</p>
              <p style={{ fontWeight: 700, color: 'var(--dark)' }}>{listing.looking_for}</p>
            </div>

            {/* Owner: listed by */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="avatar">{listing.owner?.username?.slice(0, 2).toUpperCase()}</div>
              <div>
                <Link to={`/profile/${listing.user_id}`} style={{ fontWeight: 700, color: 'var(--dark)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  {listing.owner?.username}
                </Link>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ fontSize: '0.75rem', color: i < Math.round(listing.owner?.rating) ? '#F59E0B' : '#D1D5DB' }}></span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            {isOwner ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to={`/listings/${id}/edit`} className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>Edit Listing</Link>
                <button onClick={handleDelete} className="btn btn-danger" style={{ flex: 1 }}>Delete</button>
              </div>
            ) : listing.status === 'active' && user ? (
              <div>
                {!proposing ? (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setProposing(true)} className="btn btn-coral btn-lg" style={{ flex: 1 }}>
                      Propose a Trade
                    </button>
                    <button onClick={handleValuate} className="btn btn-outline">AI Valuate</button>
                  </div>
                ) : (
                  <div className="card animate-fadeIn">
                    <p style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Select your offering</p>
                    <div className="form-group">
                      <label className="form-label">Your Listing</label>
                      <select className="form-select" value={offered} onChange={e => setOffered(e.target.value)}>
                        <option value="">Choose a listing…</option>
                        {myListings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cash Adjustment (₹) <span className="optional">optional</span></label>
                      <input type="number" className="form-input" value={cashAdj} onChange={e => setCashAdj(e.target.value)} placeholder="0" />
                    </div>
                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                      <button onClick={handlePropose} className="btn btn-primary" style={{ flex: 1 }} disabled={!offered}>Send Proposal</button>
                      <button onClick={() => setProposing(false)} className="btn btn-outline">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ) : !user ? (
              <Link to="/login" className="btn btn-primary btn-full btn-lg">Sign In to Trade</Link>
            ) : null}
          </div>
        </div>

        {/* AI Valuation result */}
        {valuation && (
          <div className="valuation-card animate-fadeIn" style={{ marginTop: '2rem' }}>
            <span className="section-label">AI Valuation</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
              <div>
                <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Estimated Value</p>
                <div className="valuation-score">₹{Number(valuation.estimated_value || 0).toLocaleString('en-IN')}</div>
                <div className="valuation-bar"><div className="valuation-bar__fill" style={{ width: `${valuation.confidence * 100}%` }} /></div>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{Math.round((valuation.confidence || 0) * 100)}% confidence</p>
              </div>
              <div>
                <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Assessment</p>
                <p style={{ color: 'var(--gray)', fontSize: '0.9rem', lineHeight: 1.6 }}>{valuation.reasoning}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
