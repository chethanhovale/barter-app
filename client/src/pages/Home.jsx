// pages/Home.jsx — logged-in dashboard
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import RecommendationSection from '../components/RecommendationSection';

const StatCard = ({ value, label, icon }) => (
  <div className="stat-card">
    <div style={{ width: '2rem', height: '2rem', background: 'var(--teal-10)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.625rem', color: 'var(--teal)' }}>
      {icon}
    </div>
    <div className="stat-card__value">{value}</div>
    <div className="stat-card__label">{label}</div>
  </div>
);

const IconBox = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function Home() {
  const { user } = useContext(AuthContext);
  const [stats, setStats]           = useState({});
  const [recentListings, setRecent] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/me/stats').catch(() => ({ data: {} })),
      api.get('/listings?limit=6&sort=recent').catch(() => ({ data: [] })),
    ]).then(([sRes, lRes]) => {
      setStats(sRes.data || {});
      setRecent(Array.isArray(lRes.data) ? lRes.data : lRes.data?.listings || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      {/* Greeting strip */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '1.75rem 1.5rem' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="avatar avatar-lg">
              {user?.avatar_url ? <img src={user.avatar_url} alt={user.username} /> : user?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, lineHeight: 1.2 }}>
                Welcome back, <span style={{ color: 'var(--blue)' }}>{user?.username}</span>
              </h1>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginTop: '0.125rem' }}>
                {user?.location && <>{user.location} · </>}
                {stats.rating > 0 && <>{Number(stats.rating).toFixed(1)} avg rating · </>}
                Ready to trade?
              </p>
            </div>
          </div>
          <Link to="/listings/create" className="btn btn-coral">New Listing</Link>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
          <StatCard value={stats.active_listings ?? 0} label="Active Listings"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>} />
          <StatCard value={stats.active_trades ?? 0} label="Active Trades"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>} />
          <StatCard value={stats.wishlist_count ?? 0} label="Saved Items"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>} />
          <StatCard value={stats.completed_trades ?? 0} label="Completed Trades"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>} />
        </div>

        {/* Quick links */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem' }}>Quick Actions</h2>
          <div className="grid-4">
            {[
              { label: 'Browse Marketplace', to: '/listings',         color: 'var(--blue)',  d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' },
              { label: 'My Trades',          to: '/my-trades',        color: 'var(--teal)',  d: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15' },
              { label: 'Valuate an Item',    to: '/valuate',          color: 'var(--coral)', d: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z' },
              { label: 'What Can I Get?',    to: '/what-can-i-get',   color: 'var(--blue)',  d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' },
            ].map(a => (
              <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: a.color }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={a.d} />
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--dark)' }}>{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <RecommendationSection />

        {/* Recent listings */}
        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Recently Listed</h2>
            <Link to="/listings" style={{ fontSize: '0.875rem', color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>
          {loading ? (
            <div className="grid-listing">
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: '#e5e7eb', borderRadius: 'var(--radius-lg)', height: '22rem', opacity: 0.4 }} />
              ))}
            </div>
          ) : recentListings.length > 0 ? (
            <div className="grid-listing">
              {recentListings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              <p className="empty-state__title">No listings yet</p>
              <p className="empty-state__text">Be the first to list an item.</p>
              <Link to="/listings/create" className="btn btn-primary">List an Item</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
