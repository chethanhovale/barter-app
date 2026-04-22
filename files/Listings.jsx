import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import './Listings.css';

const CATEGORIES = [
  { name: 'All',           slug: '' },
  { name: 'Electronics',   slug: 'electronics' },
  { name: 'Clothing',      slug: 'clothing' },
  { name: 'Books & Media', slug: 'books-media' },
  { name: 'Furniture',     slug: 'furniture' },
  { name: 'Sports',        slug: 'sports-fitness' },
  { name: 'Tools',         slug: 'tools' },
  { name: 'Services',      slug: 'services' },
  { name: 'Food',          slug: 'food-produce' },
  { name: 'Art & Crafts',  slug: 'art-crafts' },
  { name: 'Other',         slug: 'other' },
];

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || '';

  const fetchListings = (cat, q) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (q)   params.set('search', q);
    api.get(`/listings?${params.toString()}`)
      .then(r => setListings(r.data.listings))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(category, search); }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams(searchParams);
    search ? p.set('search', search) : p.delete('search');
    setSearchParams(p);
    fetchListings(category, search);
  };

  const setCategory = (slug) => {
    const p = new URLSearchParams(searchParams);
    slug ? p.set('category', slug) : p.delete('category');
    setSearchParams(p);
  };

  return (
    <div className="listings-page">
      <div className="listings-header">
        <h1>Browse Listings</h1>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
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

      {loading ? (
        <div className="loading">Loading listings…</div>
      ) : listings.length === 0 ? (
        <div className="empty">No listings found. Be the first to post one!</div>
      ) : (
        <div className="listings-grid">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
