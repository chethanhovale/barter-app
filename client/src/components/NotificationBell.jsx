import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './NotificationBell.css';

const TYPE_ICONS = {
  trade_received:  '🤝',
  trade_accepted:  '✅',
  trade_declined:  '❌',
  trade_completed: '🎉',
  new_message:     '💬',
  review_received: '⭐',
  wishlist_traded: '❤️',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen]                   = useState(false);
  const ref                               = useRef(null);
  const navigate                          = useNavigate();

  const unread = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = () => {
    api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClick = async (n) => {
    if (!n.is_read) {
      await api.put(`/notifications/${n.id}/read`);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    setOpen(false);
    if (n.link_id) navigate(`/trades/${n.link_id}`);
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="notif-bell" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen(o => !o)}>
        🔔
        {unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {unread > 0 && (
              <button className="mark-all-read" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">You're all caught up! 🎉</div>
          ) : (
            <ul className="notif-list">
              {notifications.map(n => (
                <li
                  key={n.id}
                  className={`notif-item ${n.is_read ? '' : 'unread'}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="notif-icon">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="notif-content">
                    <p>{n.message}</p>
                    <span className="notif-time">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.is_read && <span className="unread-dot" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
