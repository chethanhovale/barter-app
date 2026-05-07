import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import './Listings.css';

const CATEGORIES = [
  { name: 'All',           slug: '' },
  { name: 'Electronics',   slug: 'Electronics' },
  { name: 'Clothing',      slug: 'Clothing' },
  { name: 'Books & Media', slug: 'Books & Media' },
  { name: 'Furniture',     slug: 'Furniture' },
  { name: 'Sports',        slug: 'Sports & Fitness' },
  { name: 'Tools',         slug: 'Tools' },
  { name: 'Services',      slug: 'Services' },
  { name: 'Food',          slug: 'Food & Produce' },
  { name: 'Art & Crafts',  slug: 'Art & Crafts' },
  { name: 'Other',         slug: 'Other' },
];

// ── tiny hook ────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings,   setListings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState(searchParams.get('search') || '');
  const [aiMode,     setAiMode]     = useState(false);   // semantic vs keyword
  const [aiScores,   setAiScores]   = useState({});      // id → relevance_score
  const [aiError,    setAiError]    = useState('');
  const category = searchParams.get('category') || '';
  const debouncedSearch = useDebounce(search, 400);

  // ── Keyword search (existing Express route) ────────────────
  const fetchKeyword = useCallback((cat, q) => {
    setLoading(true);
    setAiMode(false);
    setAiScores({});
    setAiError('');
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (q)   params.set('search', q);
    api.get(`/listings?${params.toString()}`)
      .then(r => setListings(r.data.listings || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Semantic search (FastAPI AI service) ──────────────────
  const fetchSemantic = useCallback(async (q, cat) => {
    if (!q || q.trim().length < 2) return fetchKeyword(cat, q);
    setLoading(true);
    setAiMode(true);
    setAiError('');
    try {
      const { data } = await api.post('/ai/search', {
        query:    q.trim(),
        top_k:    12,
        category: cat || null,
      });

      // Build score map for badge display
      const scores = {};
      (data.results || []).forEach(r => { scores[r.id] = r.relevance_score; });
      setAiScores(scores);

      if (data.results.length === 0) {
        // Fall back to keyword if AI returns nothing
        setAiMode(false);
        return fetchKeyword(cat, q);
      }

      // Fetch full listing details for the matched IDs (for images, ratings etc)
      const ids = data.results.map(r => r.id);
      const full = await api.get(`/listings?ids=${ids.join(',')}`).catch(() => null);
      if (full?.data?.listings?.length) {
        // Sort by AI relevance order
        const order = Object.fromEntries(ids.map((id, i) => [id, i]));
        const sorted = [...full.data.listings].sort(
          (a, b) => (order[a.id] ?? 99) - (order[b.id] ?? 99)
        );
        setListings(sorted);
      } else {
        // Use AI results directly if full fetch fails
        setListings(data.results);
      }
    } catch (err) {
      setAiError('AI search unavailable — showing keyword results');
      fetchKeyword(cat, q);
    } finally {
      setLoading(false);
    }
  }, [fetchKeyword]);

  // ── Auto-search as user types (debounced) ─────────────────
  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      fetchSemantic(debouncedSearch, category);
    } else {
      fetchKeyword(category, debouncedSearch);
    }
  }, [debouncedSearch, category]);

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => { fetchKeyword(category, search); }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams(searchParams);
    search ? p.set('search', search) : p.delete('search');
    setSearchParams(p);
    fetchSemantic(search, category);
  };

  const setCategory = (slug) => {
    const p = new URLSearchParams(searchParams);
    slug ? p.set('category', slug) : p.delete('category');
    p.delete('search');
    setSearch('');
    setSearchParams(p);
  };

  // ── Relevance badge colour ─────────────────────────────────
  const badgeColor = (score) => {
    if (score >= 0.75) return '#22c55e';
    if (score >= 0.50) return '#3b82f6';
    if (score >= 0.30) return '#f59e0b';
    return '#94a3b8';
  };

  return (
    <div className="listings-page">
      <div className="listings-header">
        <h1>Browse Listings</h1>
        <form className="search-form" onSubmit={handleSearch}>
          <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
            <input
              type="text"
              placeholder="Search anything… (AI-powered)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingRight: aiMode ? '110px' : '12px' }}
            />
            {aiMode && search && (
              <span style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px', fontWeight: 600,
                background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                color: '#fff', padding: '2px 8px', borderRadius: '20px',
                pointerEvents: 'none',
              }}>
                ✨ AI Search
              </span>
            )}
          </div>
          <button type="submit">Search</button>
        </form>

        {aiError && (
          <p style={{ color: '#f59e0b', fontSize: '13px', margin: '4px 0 0' }}>
            ⚠️ {aiError}
          </p>
        )}
      </div>

      <div className="cat-filters">
        {CATEGORIES.map(c => (
          <button
            key={c.slug}
            className={`cat-btn ${category === c.slug ? 'active' : ''}`}
            onClick={() => setCategory(c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {aiMode && search && !loading && (
        <p style={{ fontSize: '13px', color: '#6366f1', margin: '0 0 12px', fontWeight: 500 }}>
          ✨ Showing AI-ranked results for "{search}" — sorted by relevance
        </p>
      )}

      {loading ? (
        <div className="loading">
          {aiMode ? '✨ Finding best matches…' : 'Loading listings…'}
        </div>
      ) : listings.length === 0 ? (
        <div className="empty">No listings found. Be the first to post one!</div>
      ) : (
        <div className="listings-grid">
          {listings.map(l => (
            <div key={l.id} style={{ position: 'relative' }}>
              {aiMode && aiScores[l.id] && (
                <div style={{
                  position: 'absolute', top: 8, left: 8, zIndex: 10,
                  background: badgeColor(aiScores[l.id]),
                  color: '#fff', fontSize: '11px', fontWeight: 700,
                  padding: '2px 7px', borderRadius: '12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}>
                  {Math.round(aiScores[l.id] * 100)}% match
                </div>
              )}
              <ListingCard listing={l} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
