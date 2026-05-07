import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Chat from '../components/Chat';
import './TradeDetail.css';

const STATUS_COLORS = {
  pending:   '#fbbf24',
  accepted:  '#34d399',
  declined:  '#f87171',
  completed: '#60a5fa',
  cancelled: '#94a3b8',
};

export default function TradeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trade, setTrade]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrade = () => {
    api.get(`/trades/${id}`)
      .then(r => setTrade(r.data))
      .catch(() => navigate('/trades'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrade(); }, [id]);

  const updateStatus = async (status) => {
    await api.put(`/trades/${id}/status`, { status });
    fetchTrade();
  };

  if (loading) return <div className="td-loading">Loading trade…</div>;
  if (!trade)  return null;

  const isOwner    = trade.owner_id === user?.id;
  const isRequester = trade.requester_id === user?.id;

  return (
    <div className="td-page">
      {/* Trade summary */}
      <div className="td-summary">
        <div className="td-header">
          <h1>Trade #{id.slice(0, 8)}</h1>
          <span
            className="td-status"
            style={{ background: STATUS_COLORS[trade.status] }}
          >
            {trade.status}
          </span>
        </div>

        <div className="td-parties">
          <div className="td-party">
            <span className="party-label">Requester</span>
            <strong>{trade.requester_name}</strong>
          </div>
          <div className="td-arrow">⇄</div>
          <div className="td-party">
            <span className="party-label">Owner</span>
            <strong>{trade.owner_name}</strong>
          </div>
        </div>

        <div className="td-items">
          <div className="td-item">
            <span className="item-label">Requested Item</span>
            <p>{trade.requested_title}</p>
          </div>
          {trade.offered_title && (
            <div className="td-item">
              <span className="item-label">Offered in Return</span>
              <p>{trade.offered_title}</p>
            </div>
          )}
          {trade.cash_adjustment > 0 && (
            <div className="td-item">
              <span className="item-label">Cash Top-up</span>
              <p>₹{Number(trade.cash_adjustment).toLocaleString()}</p>
            </div>
          )}
          {trade.message && (
            <div className="td-item">
              <span className="item-label">Initial Message</span>
              <p className="td-message">"{trade.message}"</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="td-actions">
          {trade.status === 'pending' && isOwner && (
            <>
              <button className="btn-accept"   onClick={() => updateStatus('accepted')}>✅ Accept Trade</button>
              <button className="btn-decline"  onClick={() => updateStatus('declined')}>❌ Decline</button>
            </>
          )}
          {trade.status === 'pending' && isRequester && (
            <button className="btn-cancel" onClick={() => updateStatus('cancelled')}>Cancel Offer</button>
          )}
          {trade.status === 'accepted' && (
            <button className="btn-complete" onClick={() => updateStatus('completed')}>🎉 Mark as Completed</button>
          )}
        </div>
      </div>

      {/* Real-time chat */}
      <Chat tradeId={id} />
    </div>
  );
}
