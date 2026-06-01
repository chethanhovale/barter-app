// pages/MyTrades.jsx
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const TAB_STATUSES = ['all', 'pending', 'accepted', 'completed', 'cancelled'];

export default function MyTrades() {
  const { user }                    = useContext(AuthContext);
  const [trades, setTrades]         = useState([]);
  const [tab, setTab]               = useState('all');
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionL] = useState(null);

  useEffect(() => {
    api.get('/trades').then(res => setTrades(res.data || [])).finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? trades : trades.filter(t => t.status === tab);

  const handleAction = async (tradeId, action) => {
    setActionL(tradeId + action);
    const statusMap = { accept: 'accepted', reject: 'cancelled', cancel: 'cancelled', complete: 'completed' };
    try {
      await api.patch(`/trades/${tradeId}/${action}`);
      setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: statusMap[action] } : t));
    } catch (err) { alert(err.message); }
    finally { setActionL(null); }
  };

  const statusClass = {
    pending: 'status-pending', accepted: 'status-active',
    completed: 'status-completed', cancelled: 'status-cancelled',
  };

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      <div style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '1.75rem 1.5rem' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Trades</h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Track proposals, negotiations, and completed trades</p>
        </div>
      </div>

      <div className="container" style={{ padding: '1.5rem' }}>
        <div className="tabs">
          {TAB_STATUSES.map(s => {
            const count = s === 'all' ? trades.length : trades.filter(t => t.status === s).length;
            return (
              <div key={s} className={`tab ${tab === s ? 'active' : ''}`} onClick={() => setTab(s)}
                style={{ textTransform: 'capitalize' }}>
                {s === 'all' ? 'All' : s}{' '}
                <span style={{ marginLeft: '0.25rem', background: tab === s ? 'var(--blue-10)' : '#F3F4F6', color: tab === s ? 'var(--blue)' : 'var(--gray)', borderRadius: '9999px', padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...Array(3)].map((_, i) => <div key={i} style={{ height: '7rem', background: '#e5e7eb', borderRadius: 'var(--radius-lg)', opacity: 0.4 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
              <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            <p className="empty-state__title">No trades found</p>
            <p className="empty-state__text">Browse the marketplace and propose a trade to get started.</p>
            <Link to="/listings" className="btn btn-primary">Browse Listings</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {filtered.map(trade => {
              const isRequester = trade.requester_id === user?.id;
              return (
                <div key={trade.id} className="trade-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
                    {/* Items */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
                      {/* Offered item */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)', marginBottom: '0.375rem' }}>
                          {isRequester ? 'You offered' : 'They offered'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          {trade.offered_listing?.primary_image
                            ? <img src={trade.offered_listing.primary_image} alt="" style={{ width: '2.75rem', height: '2.75rem', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                            : <div style={{ width: '2.75rem', height: '2.75rem', background: '#e5e7eb', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                          }
                          <Link to={`/listings/${trade.offered_listing_id}`} style={{ fontWeight: 700, color: 'var(--dark)', textDecoration: 'none', fontSize: '0.875rem' }} className="truncate">
                            {trade.offered_listing?.title || 'Listing'}
                          </Link>
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                      </svg>

                      {/* Requested item */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)', marginBottom: '0.375rem' }}>
                          {isRequester ? 'For their' : 'For your'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          {trade.requested_listing?.primary_image
                            ? <img src={trade.requested_listing.primary_image} alt="" style={{ width: '2.75rem', height: '2.75rem', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                            : <div style={{ width: '2.75rem', height: '2.75rem', background: '#e5e7eb', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                          }
                          <Link to={`/listings/${trade.requested_listing_id}`} style={{ fontWeight: 700, color: 'var(--dark)', textDecoration: 'none', fontSize: '0.875rem' }} className="truncate">
                            {trade.requested_listing?.title || 'Listing'}
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={`badge ${statusClass[trade.status] || 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                        {trade.status}
                      </span>
                      {trade.cash_adjustment > 0 && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
                          + ₹{Number(trade.cash_adjustment).toLocaleString('en-IN')} cash
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="trade-card__actions">
                    <Link to={`/trades/${trade.id}`} className="btn btn-ghost btn-sm">Open Chat</Link>
                    {!isRequester && trade.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(trade.id, 'accept')} className="btn btn-teal btn-sm" disabled={actionLoading}>Accept</button>
                        <button onClick={() => handleAction(trade.id, 'reject')} className="btn btn-danger btn-sm" disabled={actionLoading}>Decline</button>
                      </>
                    )}
                    {isRequester && trade.status === 'pending' && (
                      <button onClick={() => handleAction(trade.id, 'cancel')} className="btn btn-outline btn-sm" disabled={actionLoading}>Cancel</button>
                    )}
                    {trade.status === 'accepted' && (
                      <button onClick={() => handleAction(trade.id, 'complete')} className="btn btn-primary btn-sm" disabled={actionLoading}>Mark Complete</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
