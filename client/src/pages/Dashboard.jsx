import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const STATUS_META = {
  pending:   { label: 'Pending',   cls: 'pill-pending',   icon: '?' },
  accepted:  { label: 'Accepted',  cls: 'pill-accepted',  icon: '✓' },
  completed: { label: 'Completed', cls: 'pill-completed', icon: '★' },
  declined:  { label: 'Declined',  cls: 'pill-declined',  icon: '✕' },
  cancelled: { label: 'Cancelled', cls: 'pill-cancelled', icon: '–' },
};

const ITEM_ICONS = ['📦','📱','💻','🎸','📷','🚲','🏋️','📚','🛋️','🎮'];
function itemIcon(title) {
  if (!title) return '📦';
  const t = title.toLowerCase();
  if (t.includes('phone') || t.includes('mobile') || t.includes('iphone') || t.includes('samsung')) return '📱';
  if (t.includes('laptop') || t.includes('macbook') || t.includes('dell') || t.includes('computer')) return '💻';
  if (t.includes('guitar') || t.includes('piano') || t.includes('music') || t.includes('keyboard')) return '🎸';
  if (t.includes('camera') || t.includes('canon') || t.includes('sony') || t.includes('dslr')) return '📷';
  if (t.includes('cycle') || t.includes('bike') || t.includes('bicycle')) return '🚲';
  if (t.includes('book')) return '📚';
  if (t.includes('game') || t.includes('ps') || t.includes('xbox') || t.includes('nintendo')) return '🎮';
  return ITEM_ICONS[title.charCodeAt(0) % ITEM_ICONS.length];
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]           = useState({ listings: 0, trades: 0, completed: 0, rating: 0, totalReviews: 0 });
  const [myListings, setMyListings]   = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [wishlist, setWishlist]       = useState([]);
  const [activity, setActivity]       = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/listings?status=active&limit=50'),
      api.get('/trades'),
      api.get('/wishlist'),
      api.get(`/users/${user.id}`),
    ]).then(([listRes, tradeRes, wishRes, userRes]) => {
      const myL     = listRes.data.listings.filter(l => l.user_id === user.id);
      const trades  = tradeRes.data;
      const completed = trades.filter(t => t.status === 'completed').length;
      const pending   = trades.filter(t => t.status === 'pending').length;

      // Build a simple activity feed from trades
      const acts = trades.slice(0, 6).map(t => ({
        text: t.requester_id === user.id
          ? `You offered on "${t.requested_title}"`
          : `New offer on "${t.requested_title}"`,
        status: t.status,
        time: t.created_at,
      }));

      setMyListings(myL.slice(0, 4));
      setRecentTrades(trades.slice(0, 5));
      setWishlist(wishRes.data.slice(0, 4));
      setActivity(acts);
      setStats({
        listings: myL.length,
        trades: trades.length,
        completed,
        pending,
        rating: userRes.data.rating || 0,
        totalReviews: userRes.data.total_reviews || 0,
        successRate: trades.length > 0 ? Math.round((completed / trades.length) * 100) : 0,
      });
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
      <span>Loading your dashboard…</span>
    </div>
  );

  const pendingTrades = recentTrades.filter(t => t.status === 'pending').length;

  return (
    <div className="dashboard">

      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-avatar">{user.username[0].toUpperCase()}</div>
        <div className="dash-hero-text">
          <h1>Welcome back, {user.username}</h1>
          <p>{pendingTrades > 0 ? `You have ${pendingTrades} pending trade offer${pendingTrades > 1 ? 's' : ''}` : 'Everything is up to date'}</p>
        </div>
        <div className="dash-hero-actions">
          <Link to="/listings" className="btn-ghost">Browse</Link>
          <Link to="/listings/new" className="btn-primary">+ New listing</Link>
        </div>
      </div>

      {/* Activity strip */}
      {activity.length > 0 && (
        <div className="activity-strip">
          {activity.map((a, i) => (
            <div key={i} className={`activity-pill ap-${a.status}`}>
              <span className={`act-dot dot-${a.status}`} />
              {a.text}
              {a.time && <span className="act-time">{timeAgo(a.time)}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="dash-stats">
        <div className="stat-card">
          <div className="stat-label">Active listings</div>
          <div className="stat-val">{stats.listings}</div>
          <div className="stat-sub">{stats.listings === 0 ? 'Post your first item' : `${stats.listings} item${stats.listings > 1 ? 's' : ''} live`}</div>
          <div className="stat-bar"><div className="stat-fill sf-blue" style={{ width: `${Math.min(stats.listings * 20, 100)}%` }} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total trades</div>
          <div className="stat-val">{stats.trades}</div>
          <div className="stat-sub stat-up">{stats.pending > 0 ? `${stats.pending} pending` : 'None pending'}</div>
          <div className="stat-bar"><div className="stat-fill sf-green" style={{ width: `${Math.min(stats.trades * 10, 100)}%` }} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-val">{stats.completed}</div>
          <div className="stat-sub">{stats.successRate > 0 ? `${stats.successRate}% success rate` : 'No trades yet'}</div>
          <div className="stat-bar"><div className="stat-fill sf-teal" style={{ width: `${stats.successRate}%` }} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Your rating</div>
          <div className="stat-val">{stats.rating > 0 ? Number(stats.rating).toFixed(1) : '—'}</div>
          <div className="stat-sub stat-up">{stats.totalReviews > 0 ? `${stats.totalReviews} review${stats.totalReviews > 1 ? 's' : ''}` : 'No reviews yet'}</div>
          <div className="stat-bar"><div className="stat-fill sf-amber" style={{ width: `${(stats.rating / 5) * 100}%` }} /></div>
        </div>
      </div>

      {/* Main grid */}
      <div className="dash-grid">

        {/* My Listings */}
        <section className="dash-section">
          <div className="dash-section-header">
            <div className="sec-title">
              My listings
              {stats.listings > 0 && <span className="sec-badge badge-blue">{stats.listings} active</span>}
            </div>
            <Link to={`/profile/${user.id}`} className="sec-link">View all</Link>
          </div>
          {myListings.length === 0 ? (
            <div className="dash-empty">
              <div className="empty-icon">📦</div>
              <p>Nothing listed yet</p>
              <Link to="/listings/new" className="btn-primary btn-sm">Post your first item</Link>
            </div>
          ) : (
            <div className="listing-mini-grid">
              {myListings.map(l => (
                <Link to={`/listings/${l.id}`} key={l.id} className="listing-mini">
                  <div className="lm-thumb">{itemIcon(l.title)}</div>
                  <div className="lm-info">
                    <div className="lm-title">{l.title}</div>
                    <div className="lm-meta">
                      <span className="lm-condition">{l.condition?.replace('_', ' ')}</span>
                      {l.estimated_value && <span>₹{Number(l.estimated_value).toLocaleString()}</span>}
                    </div>
                  </div>
                  <span className="lm-dot" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Trades */}
        <section className="dash-section">
          <div className="dash-section-header">
            <div className="sec-title">
              Recent trades
              {stats.pending > 0 && <span className="sec-badge badge-warn">{stats.pending} pending</span>}
            </div>
            <Link to="/trades" className="sec-link">View all</Link>
          </div>
          {recentTrades.length === 0 ? (
            <div className="dash-empty">
              <div className="empty-icon">🔄</div>
              <p>No trades yet</p>
              <Link to="/listings" className="btn-primary btn-sm">Browse listings</Link>
            </div>
          ) : (
            <div className="trades-timeline">
              {recentTrades.map(t => {
                const meta = STATUS_META[t.status] || STATUS_META.pending;
                return (
                  <Link to={`/trades/${t.id}`} key={t.id} className="trade-row">
                    <div className={`trade-icon-badge ${meta.cls}`}>{meta.icon}</div>
                    <div className="trade-row-info">
                      <div className="trade-row-title">{t.requested_title}</div>
                      <div className="trade-row-meta">
                        {t.offered_title ? `↔ ${t.offered_title}` : 'No item offered'}
                        {t.created_at && <span className="trade-time">{timeAgo(t.created_at)}</span>}
                      </div>
                    </div>
                    <span className={`trade-pill ${meta.cls}`}>{meta.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Wishlist */}
        <section className="dash-section dash-section-full">
          <div className="dash-section-header">
            <div className="sec-title">
              Saved items
              {wishlist.length > 0 && <span className="sec-badge badge-blue">{wishlist.length} saved</span>}
            </div>
            <Link to="/wishlist" className="sec-link">View all</Link>
          </div>
          {wishlist.length === 0 ? (
            <div className="dash-empty dash-empty-row">
              <div className="empty-icon">❤️</div>
              <p>Save listings you're interested in</p>
              <Link to="/listings" className="btn-primary btn-sm">Browse listings</Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlist.map(l => (
                <Link to={`/listings/${l.id}`} key={l.id} className="wish-card">
                  <div className="wish-thumb">
                    {l.primary_image
                      ? <img src={l.primary_image} alt={l.title} />
                      : <span>{itemIcon(l.title)}</span>
                    }
                  </div>
                  <div className="wish-name">{l.title}</div>
                  <div className="wish-val">
                    {l.estimated_value ? `₹${Number(l.estimated_value).toLocaleString()}` : l.condition?.replace('_', ' ')}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
