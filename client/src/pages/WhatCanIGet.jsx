// pages/WhatCanIGet.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const CATEGORIES = ['Electronics','Computers','Fitness','Books','Clothing','Furniture','Sports','Music','Other'];

export default function WhatCanIGet() {
  const [value, setValue]         = useState('');
  const [category, setCategory]   = useState('');
  const [condition, setCondition] = useState('Good');
  const [results, setResults]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!value) return;
    setLoading(true); setError(''); setResults(null);
    try {
      const params = new URLSearchParams({ value, condition });
      if (category) params.set('category', category);
      const res = await api.get(`/ai/what-can-i-get?${params}`);
      setResults(res.data);
    } catch (err) {
      setError('Could not fetch matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      {/* Page header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '2rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <span className="section-label">AI Cross-Category Matching</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '0.375rem', marginTop: '0.5rem' }}>
            What Can I Get?
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Enter the estimated value of your item and see what categories and listings you can realistically trade for — powered by live platform data.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '760px' }}>
        {/* Input card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSearch}>
            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Your item's estimated value (INR)</label>
                <input
                  type="number" className="form-input"
                  placeholder="e.g. 18000"
                  value={value} onChange={e => setValue(e.target.value)}
                  min="100" required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Your item's condition</label>
                <select className="form-select" value={condition} onChange={e => setCondition(e.target.value)}>
                  {['Excellent','Good','Fair','Poor'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Filter by category <span style={{ fontWeight: 400, color: 'var(--gray)' }}>optional</span>
              </label>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                <button type="button"
                  onClick={() => setCategory('')}
                  className={`badge badge-mono ${!category ? 'badge-dark' : 'badge-gray'}`}
                  style={{ cursor: 'pointer', border: 'none' }}>
                  Any Category
                </button>
                {CATEGORIES.map(c => (
                  <button type="button" key={c}
                    onClick={() => setCategory(c === category ? '' : c)}
                    className={`badge badge-mono ${category === c ? 'badge-dark' : 'badge-gray'}`}
                    style={{ cursor: 'pointer', border: 'none' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-coral btn-lg" disabled={loading || !value}>
              {loading ? 'Analysing market data…' : 'Find Matching Trades'}
            </button>
          </form>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: '5rem', background: '#e5e7eb', borderRadius: 'var(--radius-lg)', opacity: 0.5 }} />
            ))}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="animate-fadeIn">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>
                {results.matches?.length || 0} potential matches
                <span style={{ fontWeight: 400, color: 'var(--gray)', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                  for {condition.toLowerCase()} item valued at ₹{Number(value).toLocaleString('en-IN')}
                </span>
              </p>
              {results.value_range && (
                <span className="badge badge-teal badge-mono" style={{ fontSize: '0.75rem' }}>
                  ₹{Number(results.value_range.min).toLocaleString('en-IN')} – ₹{Number(results.value_range.max).toLocaleString('en-IN')} range
                </span>
              )}
            </div>

            {/* Category summary bands */}
            {results.category_breakdown && (
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>By Category</p>
                <div className="grid-3" style={{ gap: '0.75rem' }}>
                  {Object.entries(results.category_breakdown).map(([cat, count]) => (
                    <div key={cat} style={{ background: 'white', border: '1px solid var(--teal-10)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat}</span>
                      <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Listing matches */}
            {results.matches?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {results.matches.map((item, i) => (
                  <Link key={item.id || i} to={`/listings/${item.id}`}
                    style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem 1.25rem', transition: 'all 0.2s' }}>
                      {item.primary_image ? (
                        <img src={item.primary_image} alt={item.title}
                          style={{ width: '4.5rem', height: '4.5rem', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '4.5rem', height: '4.5rem', background: '#e5e7eb', borderRadius: 'var(--radius-sm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {item.category_name || item.category}
                          </span>
                          <span className={`badge badge-mono condition-${item.condition?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{item.condition}</span>
                        </div>
                        <p style={{ fontWeight: 700, color: 'var(--dark)', fontSize: '0.9375rem', marginBottom: '0.125rem' }} className="truncate">{item.title}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                          {item.location} · Looking for: <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{item.looking_for}</span>
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontWeight: 800, color: 'var(--blue)', fontSize: '1.125rem' }}>
                          ₹{Number(item.estimated_value || 0).toLocaleString('en-IN')}
                        </p>
                        {item.value_match_pct && (
                          <span className="badge badge-teal badge-mono" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                            {item.value_match_pct}% match
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p className="empty-state__title">No matches found</p>
                <p className="empty-state__text">Try adjusting the value range or removing the category filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
