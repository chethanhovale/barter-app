// components/NotificationBell.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function NotificationBell() {
  const [notifs, setNotifs]   = useState([]);
  const [open, setOpen]       = useState(false);
  const ref                   = useRef(null);

  useEffect(() => {
    api.get('/notifications?limit=8').then(res => setNotifs(res.data || [])).catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.is_read).length;

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="navbar__icon-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="navbar__unread">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
          width: '320px', background: 'white', border: '1px solid var(--teal-10)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 16px 48px rgba(0,0,0,0.10)',
          zIndex: 100, overflow: 'hidden',
        }} className="animate-fadeIn">
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--teal-10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</p>
            {unread > 0 && (
              <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>{unread} new</span>
            )}
          </div>

          {notifs.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--gray)', fontSize: '0.875rem' }}>
              No notifications yet
            </div>
          ) : (
            notifs.map(n => (
              <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                <div className={`notif-dot ${n.is_read ? 'read' : ''}`} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.5, fontWeight: n.is_read ? 400 : 600 }}>{n.content}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--gray)', marginTop: '0.125rem' }}>
                    {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}

          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--teal-5)', textAlign: 'center' }}>
            <Link to="/notifications" style={{ fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }} onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
