// pages/TradeDetail.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAI } from '../hooks/useAI';

export default function TradeDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [trade, setTrade]         = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);
  const [estimate, setEstimate]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const messagesEnd                = useRef(null);
  const { socket }                = useSocket();
  const { estimateTrade }         = useAI();

  useEffect(() => {
    Promise.all([
      api.get(`/trades/${id}`),
      api.get(`/messages/${id}`),
    ]).then(([tradeRes, msgRes]) => {
      setTrade(tradeRes.data);
      setMessages(msgRes.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_trade', { trade_id: id });
    socket.on('new_message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('typing', ({ user_id }) => { if (user_id !== user?.id) setTyping(true); });
    socket.on('stop_typing', () => setTyping(false));
    return () => { socket.off('new_message'); socket.off('typing'); socket.off('stop_typing'); };
  }, [socket, id, user]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket?.emit('send_message', { trade_id: id, content: input });
    setInput('');
    socket?.emit('stop_typing', { trade_id: id });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socket?.emit('typing', { trade_id: id });
  };

  const handleEstimate = async () => {
    try {
      const result = await estimateTrade({
        offered_listing_id: trade.offered_listing_id,
        requested_listing_id: trade.requested_listing_id,
        cash_adjustment: trade.cash_adjustment,
      });
      setEstimate(result);
    } catch { /* silent */ }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--gray)' }}>Loading…</div>;
  if (!trade)  return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--gray)' }}>Trade not found</div>;

  const isRequester = trade.requester_id === user?.id;
  const statusClass = { pending: 'status-pending', accepted: 'status-active', completed: 'status-completed', cancelled: 'status-cancelled' };

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      <div className="container" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Chat panel */}
        <div className="chat-container" style={{ height: '75vh' }}>
          <div className="chat-header">
            <Link to="/my-trades" style={{ color: 'var(--gray)', textDecoration: 'none', fontSize: '0.875rem' }}>←</Link>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Trade #{id.slice(0, 8)}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                {trade.offered_listing?.title} ⇄ {trade.requested_listing?.title}
              </p>
            </div>
            <span className={`badge ${statusClass[trade.status] || 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
              {trade.status}
            </span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--gray)', fontSize: '0.875rem', padding: '2rem 0' }}>
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender_id === user?.id ? 'flex-end' : 'flex-start' }}>
                <div className={`chat-bubble ${msg.sender_id === user?.id ? 'chat-bubble-out' : 'chat-bubble-in'}`}>
                  {msg.content}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--gray)', marginTop: '2px', padding: '0 0.25rem' }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {typing && <p className="chat-typing">typing…</p>}
            <div ref={messagesEnd} />
          </div>

          {trade.status !== 'cancelled' && trade.status !== 'completed' && (
            <div className="chat-input-row">
              <input
                className="form-input" style={{ flex: 1 }}
                placeholder="Type a message…"
                value={input} onChange={handleTyping}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button className="btn btn-primary" onClick={sendMessage} disabled={!input.trim()}>Send</button>
            </div>
          )}
        </div>

        {/* Trade info sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Items */}
          <div className="card">
            <p style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Trade Items</p>
            {[
              { listing: trade.offered_listing,   label: isRequester ? 'You offer' : 'They offer',   id: trade.offered_listing_id },
              { listing: trade.requested_listing, label: isRequester ? 'You want'  : 'They want',    id: trade.requested_listing_id },
            ].map(({ listing, label, id: lid }, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: i === 0 ? '0.875rem' : 0, paddingBottom: i === 0 ? '0.875rem' : 0, borderBottom: i === 0 ? '1px solid var(--teal-5)' : 'none' }}>
                {listing?.primary_image && <img src={listing.primary_image} alt="" style={{ width: '3.5rem', height: '3.5rem', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />}
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <Link to={`/listings/${lid}`} style={{ fontWeight: 700, color: 'var(--dark)', textDecoration: 'none', fontSize: '0.875rem' }}>
                    {listing?.title}
                  </Link>
                  {listing?.estimated_value && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--blue)', fontWeight: 600 }}>₹{Number(listing.estimated_value).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>
            ))}
            {trade.cash_adjustment !== 0 && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--teal-5)', fontSize: '0.875rem', color: 'var(--gray)' }}>
                + ₹{Number(trade.cash_adjustment).toLocaleString('en-IN')} cash adjustment
              </div>
            )}
          </div>

          {/* AI estimate */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI Fairness Check</p>
              <button className="btn btn-ghost btn-sm" onClick={handleEstimate}> Analyse</button>
            </div>
            {estimate ? (
              <div className="animate-fadeIn">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: estimate.fair ? 'var(--teal)' : 'var(--coral)' }}>
                    {Math.round((estimate.confidence || 0) * 100)}%
                  </div>
                  <span className={`badge ${estimate.fair ? 'badge-success' : 'badge-coral'}`}>
                    {estimate.fair ? ' Fair Trade' : ' Review Value'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6 }}>{estimate.reasoning}</p>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Check if this trade is fair based on AI market analysis.</p>
            )}
          </div>

          {/* Other party */}
          {trade.other_user && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div className="avatar">{trade.other_user.username?.slice(0, 2).toUpperCase()}</div>
              <div>
                <Link to={`/profile/${trade.other_user.id}`} style={{ fontWeight: 700, color: 'var(--dark)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  {trade.other_user.username}
                </Link>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                   {Number(trade.other_user.rating).toFixed(1)} · {trade.other_user.location}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
