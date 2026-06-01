// pages/About.jsx
import { Link } from 'react-router-dom';

const TEAM = [
  { name: 'Chethan Hovale', role: 'Full-Stack Developer', bio: 'Designed and built every layer of BarterApp — React frontend, Node.js/Express backend, FastAPI AI microservice, PostgreSQL schema, real-time chat, and all AI integrations.' },
];

const TECH = [
  { label: 'React 18',            desc: 'Frontend — component architecture, hooks, JWT context' },
  { label: 'Node.js / Express',   desc: 'REST API — auth, listings, trades, WebSocket gateway' },
  { label: 'FastAPI / Python',    desc: 'AI microservice — search, valuation, condition analysis' },
  { label: 'PostgreSQL',          desc: '10-table normalised schema with UUID keys and ENUM flows' },
  { label: 'Claude AI',           desc: 'Vision analysis, listing enhancement, trade valuation' },
  { label: 'Socket.io',           desc: 'Real-time bidirectional chat with typing indicators' },
  { label: 'Cloudinary',          desc: 'Scalable image CDN with Multer stream processing' },
  { label: 'sentence-transformers', desc: 'all-MiniLM-L6-v2 — 384-dim vector embeddings for semantic search' },
];

const VALUES = [
  {
    title: 'Zero Cash Required',
    desc: 'Trade goods directly without money changing hands. BarterApp facilitates pure value exchange between people.',
  },
  {
    title: 'AI-Backed Fairness',
    desc: 'Every trade can be assessed for fairness by AI. No more guessing if you\'re getting a good deal.',
  },
  {
    title: 'Community First',
    desc: 'Built for Bangalore, designed to scale. Hyperlocal trust through verified profiles and post-trade reviews.',
  },
  {
    title: 'Transparent Technology',
    desc: 'Open about how our AI works. Confidence scores, reasoning, and match percentages are always shown.',
  },
];

export default function About() {
  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <section style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '4rem 1.5rem 3.5rem' }}>
        <div className="container" style={{ maxWidth: '720px', textAlign: 'center' }}>
          <span className="section-label">About BarterApp</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '0.75rem', marginBottom: '1rem', lineHeight: 1.1 }}>
            Trade what you have.<br />Get what you need.
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: '1.0625rem', lineHeight: 1.75, maxWidth: '560px', margin: '0 auto 2rem' }}>
            BarterApp is an AI-powered barter marketplace built in Bangalore. We leverage semantic search, Claude Vision, and real-time communication to make peer-to-peer trading frictionless and fair.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Start Trading</Link>
            <Link to="/listings" className="btn btn-outline btn-lg">Browse Marketplace</Link>
          </div>
        </div>
      </section>

      {/* Mission numbers */}
      <section style={{ padding: '3.5rem 1.5rem', background: 'var(--bg)' }}>
        <div className="container">
          <div className="grid-4">
            {[
              { value: '10+',   label: 'API Endpoints' },
              { value: '8',     label: 'AI Microservices' },
              { value: '384',   label: 'Vector Dimensions' },
              { value: '100%',  label: 'Offline-capable mock mode' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-card__value">{s.value}</div>
                <div className="stat-card__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '3.5rem 1.5rem', background: 'white', borderTop: '1px solid var(--teal-10)', borderBottom: '1px solid var(--teal-10)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-label">Core Values</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem' }}>What we stand for</h2>
          </div>
          <div className="grid-2" style={{ maxWidth: '860px', margin: '0 auto' }}>
            {VALUES.map(v => (
              <div key={v.title} className="card-bg" style={{ padding: '1.75rem' }}>
                <div style={{ width: '2.5rem', height: '3px', background: 'var(--teal)', borderRadius: '2px', marginBottom: '1rem' }} />
                <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.5rem' }}>{v.title}</h3>
                <p style={{ color: 'var(--gray)', fontSize: '0.9rem', lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section style={{ padding: '3.5rem 1.5rem', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-label">Technology</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem' }}>Built with production-grade tools</h2>
            <p style={{ color: 'var(--gray)', fontSize: '0.9375rem', maxWidth: '480px', margin: '0.625rem auto 0', lineHeight: 1.6 }}>
              Every layer of the stack was chosen for reliability, developer experience, and AI capability.
            </p>
          </div>
          <div className="grid-2" style={{ maxWidth: '860px', margin: '0 auto', gap: '0.875rem' }}>
            {TECH.map(t => (
              <div key={t.label} style={{ background: 'white', border: '1px solid var(--teal-10)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal)', flexShrink: 0, marginTop: '0.4rem' }} />
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--blue)', marginBottom: '0.25rem' }}>{t.label}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.5 }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section style={{ padding: '3.5rem 1.5rem', background: 'white', borderTop: '1px solid var(--teal-10)', borderBottom: '1px solid var(--teal-10)' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-label">Architecture</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem' }}>How it works</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', flexWrap: 'wrap' }}>
            {[
              { label: 'React 18', sub: ':3000', color: 'var(--blue)' },
              { label: 'Express', sub: ':5000', color: 'var(--teal)' },
              { label: 'FastAPI', sub: ':8000', color: 'var(--coral)' },
            ].map((node, i) => (
              <div key={node.label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ background: node.color, color: 'white', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '120px' }}>
                  <p style={{ fontWeight: 800, fontSize: '1rem' }}>{node.label}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', opacity: 0.8 }}>{node.sub}</p>
                </div>
                {i < 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem' }}>
                    <div style={{ width: '2rem', height: '2px', background: '#D1D5DB' }} />
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="#9CA3AF"><path d="M0 4h6M4 1l3 3-3 3"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            {['PostgreSQL · Primary DB', 'Cloudinary · Image CDN', 'JSON Vector Store · Semantic Search', 'Socket.io · Real-time Chat'].map(s => (
              <span key={s} className="badge badge-gray badge-mono" style={{ fontSize: '0.75rem' }}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '3.5rem 1.5rem', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-label">Team</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem' }}>Built in Bangalore</h2>
          </div>
          <div className="grid-3" style={{ maxWidth: '860px', margin: '0 auto' }}>
            {TEAM.map(member => (
              <div key={member.name} className="card" style={{ textAlign: 'center' }}>
                <div className="avatar avatar-lg" style={{ margin: '0 auto 1rem' }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{member.name}</h3>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
                  {member.role}
                </p>
                <p style={{ color: 'var(--gray)', fontSize: '0.85rem', lineHeight: 1.6 }}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--dark)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '540px' }}>
          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
            Ready to start trading?
          </h2>
          <p style={{ color: 'var(--gray)', marginBottom: '2rem', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Join Bangalore's AI-powered barter marketplace. List your first item in under two minutes.
          </p>
          <Link to="/register" className="btn btn-coral btn-lg">Create Free Account</Link>
        </div>
      </section>
    </div>
  );
}
