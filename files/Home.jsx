import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import './Home.css';

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', icon: '💻' },
  { name: 'Clothing',    slug: 'clothing',    icon: '👕' },
  { name: 'Books',       slug: 'books-media', icon: '📚' },
  { name: 'Furniture',   slug: 'furniture',   icon: '🪑' },
  { name: 'Tools',       slug: 'tools',       icon: '🔧' },
  { name: 'Services',    slug: 'services',    icon: '🛠️' },
];

export default function Home() {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/listings?limit=6').then(r => setRecent(r.data.listings)).catch(() => {});
  }, []);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Trade What You Have.<br />Get What You Need.</h1>
          <p>Barter goods and services with people in your community — no cash required.</p>
          <div className="hero-actions">
            <Link to="/listings" className="btn-primary">Browse Listings</Link>
            <Link to="/listings/new" className="btn-secondary">Post an Item</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <h2 className="section-title">Browse by Category</h2>
        <div className="categories-grid">
          {CATEGORIES.map(c => (
            <Link key={c.slug} to={`/listings?category=${c.slug}`} className="category-chip">
              <span className="chip-icon">{c.icon}</span>
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent listings */}
      {recent.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Listings</h2>
            <Link to="/listings" className="see-all">See all →</Link>
          </div>
          <div className="listings-grid">
            {recent.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="section how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          {[
            { icon: '📝', title: 'List an Item', desc: 'Post what you have and what you\'re looking for in return.' },
            { icon: '🔍', title: 'Browse & Discover', desc: 'Explore listings from your community.' },
            { icon: '🤝', title: 'Propose a Trade', desc: 'Send an offer with one of your own listings.' },
            { icon: '✅', title: 'Complete the Barter', desc: 'Meet up or ship — seal the deal and leave a review.' },
          ].map((s, i) => (
            <div key={i} className="step">
              <span className="step-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
