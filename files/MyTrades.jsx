// ── MyTrades.jsx ─────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './MyTrades.css';

const STATUS_COLORS = {
  pending:   '#fbbf24',
  accepted:  '#34d399',
  declined:  '#f87171',
  completed: '#60a5fa',
  cancelled: '#94a3b8',
};

export default function MyTrades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = () => {
    api.get('/trades').then(r => setTrades(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrades(); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/trades/${id}/status`, { status });
    fetchTrades();
  };

  if (loading) return <div className="loading">Loading trades…</div>;

  return (
    <div className="trades-page">
      <h1>My Trades</h1>
      {trades.length === 0 ? (
        <div className="empty">No trades yet. <Link to="/listings">Browse listings</Link> to get started.</div>
      ) : (
        <div className="trades-list">
          {trades.map(t => {
            const isOwner = t.owner_id === user.id;
            return (
              <div key={t.id} className="trade-card">
                <div className="trade-header">
                  <span className="trade-badge" style={{ background: STATUS_COLORS[t.status] }}>
                    {t.status}
                  </span>
                  <span className="trade-date">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <div className="trade-body">
                  <div className="trade-item">
                    <span className="trade-label">Requested</span>
                    <strong>{t.requested_title}</strong>
                  </div>
                  {t.offered_title && (
                    <div className="trade-item">
                      <span className="trade-label">Offered</span>
                      <strong>{t.offered_title}</strong>
                    </div>
                  )}
                  {t.message && <p className="trade-message">"{t.message}"</p>}
                </div>
                {t.status === 'pending' && (
                  <div className="trade-actions">
                    {isOwner && (
                      <>
                        <button className="btn-accept" onClick={() => updateStatus(t.id, 'accepted')}>Accept</button>
                        <button className="btn-decline" onClick={() => updateStatus(t.id, 'declined')}>Decline</button>
                      </>
                    )}
                    <button className="btn-cancel" onClick={() => updateStatus(t.id, 'cancelled')}>Cancel</button>
                  </div>
                )}
                {t.status === 'accepted' && (
                  <div className="trade-actions">
                    <button className="btn-complete" onClick={() => updateStatus(t.id, 'completed')}>Mark as Completed</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
