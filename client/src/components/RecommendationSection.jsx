/**
 * client/src/components/RecommendationSection.jsx
 *
 * Drop this into Dashboard.jsx or Home.jsx:
 *
 *   import RecommendationSection from '../components/RecommendationSection';
 *   <RecommendationSection userId={user.id} />
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecommendations } from '../hooks/useRecommendations';

const REASON_COLORS = {
  'Wants what you have':      { bg: 'rgba(16,185,129,.1)',  color: '#10b981', icon: '🤝' },
  'Potential match':           { bg: 'rgba(59,130,246,.1)',  color: '#3b82f6', icon: '✦' },
  'Matches your wishlisted':   { bg: 'rgba(139,92,246,.1)', color: '#8b5cf6', icon: '❤️' },
  'Based on your':             { bg: 'rgba(245,158,11,.1)', color: '#f59e0b', icon: '📊' },
  'Similar to your':           { bg: 'rgba(99,102,241,.1)', color: '#6366f1', icon: '🔍' },
  'New user':                  { bg: 'rgba(100,116,139,.1)',color: '#64748b', icon: '👋' },
};

function getReasonStyle(reason) {
  for (const [key, style] of Object.entries(REASON_COLORS)) {
    if (reason.startsWith(key)) return style;
  }
  return { bg: 'rgba(255,255,255,.05)', color: '#64748b', icon: '📦' };
}

function RecommendationCard({ listing }) {
  const style = getReasonStyle(listing.reason);
  return (
    <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 14, padding: 16,
        transition: 'all .2s', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)';
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ flex: 1, marginRight: 8 }}>
            <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 3, lineHeight: 1.3 }}>
              {listing.title}
            </div>
            <div style={{ fontSize: '.75rem', color: '#64748b' }}>
              {listing.username} · {listing.location || 'Location unknown'}
            </div>
          </div>
          {listing.estimated_value > 0 && (
            <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
              ₹{listing.estimated_value.toLocaleString()}
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ fontSize: '.78rem', color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>
          {listing.description?.slice(0, 80)}{listing.description?.length > 80 ? '...' : ''}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            background: style.bg, color: style.color,
            fontSize: 10, fontWeight: 700, padding: '3px 8px',
            borderRadius: 50, border: `1px solid ${style.color}30`,
            fontFamily: 'monospace',
          }}>
            {style.icon} {listing.reason}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: listing.relevance_score >= 0.6 ? '#10b981' : '#64748b',
          }}>
            {Math.round(listing.relevance_score * 100)}% match
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function RecommendationSection({ userId }) {
  const { forYou, mutual, summary, loading } = useRecommendations(userId);
  const [tab, setTab] = useState('for_you');

  const tabs = [
    { id: 'for_you', label: '✦ For You',       count: forYou.length },
    { id: 'mutual',  label: '🤝 Mutual Matches', count: mutual.length },
  ];

  const items = tab === 'for_you' ? forYou : mutual;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 2 }}>
            Recommended for You
          </div>
          {summary && (
            <div style={{ fontSize: '.75rem', color: '#475569', fontFamily: 'monospace' }}>
              {summary}
            </div>
          )}
        </div>
        <Link to="/listings" style={{ fontSize: '.82rem', color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
          Browse all →
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${tab === t.id ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.08)'}`,
            borderRadius: 50, padding: '6px 14px',
            fontSize: '.8rem', fontWeight: 600,
            color: tab === t.id ? '#a5b4fc' : '#64748b',
            cursor: 'pointer', transition: 'all .2s',
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{
                marginLeft: 6, background: 'rgba(99,102,241,.3)',
                borderRadius: 50, padding: '1px 6px', fontSize: 10,
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569', fontSize: '.88rem' }}>
          ⏳ Finding best matches...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 0',
          color: '#475569', fontSize: '.88rem',
          border: '1px dashed rgba(255,255,255,.08)',
          borderRadius: 14,
        }}>
          {tab === 'mutual'
            ? '🤝 Post a listing to see who wants what you have'
            : '✦ Wishlist some items to get personalised recommendations'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}>
          {items.map(listing => (
            <RecommendationCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
