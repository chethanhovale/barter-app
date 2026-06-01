// pages/Listings.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import { useAI } from '../hooks/useAI';

const CATEGORIES = ['All', 'Electronics', 'Computers', 'Fitness', 'Books', 'Clothing', 'Furniture', 'Sports', 'Music', 'Other'];
const CONDITIONS  = ['All', 'Excellent', 'Good', 'Fair', 'Poor'];

export default function Listings() {
  const [listings, setListings]         = useState([]);
  const [query, setQuery]               = useState('');
  const [category, setCategory]         = useState('All');
  const [condition, setCondition]       = useState('All');
  const [sort, setSort]                 = useState('recent');
  const [loading, setLoading]           = useState(true);
  const [aiResults, setAiResults]       = useState(null);
  const [searching, setSearching]       = useState(false);
  const { hybridSearch }                = useAI();

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (category !== 'All') params.set('category', category);
      if (condition !== 'All') params.set('condition', condition);
      const res = await api.get(`/listings?${params}`);
      setListings(Array.isArray(res.data) ? res.data : res.data?.listings || []);
      setAiResults(null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [category, condition, sort]);

  useEffect(() => { if (!query) fetchListings(); }, [fetchListings, query]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) { fetchListings(); return; }
    setSearching(true);
    try {
      const results = await hybridSearch(query);
      setAiResults(results);
    } catch { fetchListings(); }
    finally { setSearching(false); }
  };

  const displayed = aiResults || listings;

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '2rem 1.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Marketplace</h1>
              <p className="t-muted t-sm">Browse listings — powered by hybrid AI search</p>
            </div>
            <Link to="/listings/create" className="btn btn-coral">+ List an Item</Link>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch}>
            <div className="search-bar">
              <svg className="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Search listings with AI — try 'gaming laptop under ₹30k' or 'vintage camera'"
                value={query} onChange={e => setQuery(e.target.value)}
              />
              {aiResults && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setAiResults(null); fetchListings(); }}>
                  Clear
                </button>
              )}
              <button type="submit" className="btn btn-primary btn-sm" disabled={searching}>
                {searching ? '…' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container" style={{ padding: '1.5rem' }}>
        {/* Filters row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`badge badge-mono ${category === c ? 'badge-dark' : 'badge-gray'}`}
                style={{ cursor: 'pointer', border: 'none', transition: 'all 0.15s' }}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.625rem' }}>
            <select className="form-select" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              value={condition} onChange={e => setCondition(e.target.value)}>
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              value={sort} onChange={e => setSort(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="value_high">Highest Value</option>
              <option value="value_low">Lowest Value</option>
            </select>
          </div>
        </div>

        {/* AI result notice */}
        {aiResults && (
          <div className="badge badge-teal" style={{ marginBottom: '1rem', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
             Showing AI semantic search results for "{query}" — {aiResults.length} matches
          </div>
        )}

        {/* Grid */}
        {loading || searching ? (
          <div className="grid-listing">
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: '#e5e7eb', borderRadius: 'var(--radius-lg)', height: '22rem', opacity: 0.5 }} />
            ))}
          </div>
        ) : displayed.length > 0 ? (
          <div className="grid-listing">
            {displayed.map((l, i) => (
              <ListingCard key={l.id || i} listing={l} matchScore={aiResults ? l.score : null} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon"></div>
            <p className="empty-state__title">No listings found</p>
            <p className="empty-state__text">Try a different search or category filter.</p>
            <button className="btn btn-outline" onClick={() => { setQuery(''); setCategory('All'); fetchListings(); }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
