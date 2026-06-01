/**
 * LandingPage.jsx
 * client/src/pages/LandingPage.jsx
 *
 * Professional landing page for BarterApp
 * Theme: Urban Fresh — Ocean Blue + Teal Mint + Coral
 *
 * Update App.jsx:
 *   import LandingPage from './pages/LandingPage';
 *   // Show LandingPage to logged-out users at "/"
 *   // Show Home to logged-in users at "/"
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS — Urban Fresh
═══════════════════════════════════════════════════════════ */
const T = {
  blue:    '#0F4C75',
  teal:    '#00B4A6',
  coral:   '#FF6B35',
  light:   '#F8FFFE',
  navy:    '#1A1A2E',
  gray:    '#6B7280',
  lgray:   '#E8F4F3',
  white:   '#FFFFFF',
  shadow:  '0 4px 24px rgba(15,76,117,0.10)',
  shadowLg:'0 12px 48px rgba(15,76,117,0.14)',
};

/* ═══════════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

  .lp * { box-sizing: border-box; margin: 0; padding: 0; }
  .lp {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: ${T.light};
    color: ${T.navy};
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Scrollbar ── */
  .lp ::-webkit-scrollbar { width: 6px; }
  .lp ::-webkit-scrollbar-track { background: ${T.lgray}; }
  .lp ::-webkit-scrollbar-thumb { background: ${T.teal}; border-radius: 3px; }

  /* ── Navbar ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 5vw; height: 68px;
    background: rgba(248,255,254,0.92);
    backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(0,180,166,0.12);
    transition: box-shadow .3s;
  }
  .lp-nav.scrolled { box-shadow: 0 2px 20px rgba(15,76,117,0.08); }
  .lp-brand {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none;
  }
  .lp-brand-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, ${T.blue}, ${T.teal});
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: white; font-weight: 800;
    box-shadow: 0 4px 12px rgba(0,180,166,0.3);
  }
  .lp-brand-name {
    font-size: 1.1rem; font-weight: 800; color: ${T.navy};
    letter-spacing: -.02em;
  }
  .lp-brand-name span { color: ${T.teal}; }
  .lp-nav-links { display: flex; align-items: center; gap: 8px; }
  .lp-nav-link {
    color: ${T.gray}; text-decoration: none; font-size: .88rem;
    font-weight: 600; padding: 8px 14px; border-radius: 8px;
    transition: all .2s;
  }
  .lp-nav-link:hover { color: ${T.blue}; background: rgba(15,76,117,0.06); }
  .lp-nav-cta {
    background: ${T.coral}; color: white; text-decoration: none;
    font-size: .88rem; font-weight: 700; padding: 9px 20px;
    border-radius: 10px; transition: all .2s;
    box-shadow: 0 4px 14px rgba(255,107,53,0.3);
  }
  .lp-nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,107,53,0.4); }

  /* ── Hero ── */
  .lp-hero {
    min-height: 100vh; padding: 120px 5vw 80px;
    display: flex; align-items: center;
    background: linear-gradient(160deg, ${T.light} 0%, #E8F7F6 50%, #EEF6FF 100%);
    position: relative; overflow: hidden;
  }
  .lp-hero-blob-1 {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,180,166,0.08) 0%, transparent 70%);
    top: -100px; right: -100px; pointer-events: none;
  }
  .lp-hero-blob-2 {
    position: absolute; width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(15,76,117,0.06) 0%, transparent 70%);
    bottom: -50px; left: -50px; pointer-events: none;
  }
  .lp-hero-inner {
    max-width: 1100px; margin: 0 auto; width: 100%;
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
  }
  .lp-city-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: white; border: 1.5px solid rgba(0,180,166,0.25);
    border-radius: 50px; padding: 6px 14px;
    font-size: 12px; font-weight: 700; color: ${T.teal};
    margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,180,166,0.1);
  }
  .lp-city-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: ${T.teal}; animation: lpPulse 2s infinite;
  }
  @keyframes lpPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
  .lp-hero-h1 {
    font-size: clamp(2.4rem, 4.5vw, 3.6rem);
    font-weight: 800; line-height: 1.1; letter-spacing: -.03em;
    color: ${T.navy}; margin-bottom: 20px;
  }
  .lp-hero-h1 .teal  { color: ${T.teal}; }
  .lp-hero-h1 .coral { color: ${T.coral}; }
  .lp-hero-sub {
    font-size: 1.05rem; color: ${T.gray}; line-height: 1.75;
    margin-bottom: 32px; max-width: 460px;
  }
  .lp-hero-tag {
    display: inline-block; background: rgba(0,180,166,0.08);
    border: 1px solid rgba(0,180,166,0.2); border-radius: 6px;
    padding: 3px 10px; font-size: 11px; font-weight: 700;
    color: ${T.teal}; letter-spacing: .06em; margin-bottom: 14px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Search bar */
  .lp-search {
    display: flex; gap: 0; margin-bottom: 24px;
    background: white; border: 1.5px solid rgba(0,180,166,0.2);
    border-radius: 14px; overflow: hidden;
    box-shadow: ${T.shadow}; transition: border-color .2s, box-shadow .2s;
  }
  .lp-search:focus-within {
    border-color: ${T.teal};
    box-shadow: 0 0 0 3px rgba(0,180,166,0.12), ${T.shadow};
  }
  .lp-search-input {
    flex: 1; border: none; outline: none; padding: 14px 18px;
    font-size: .95rem; color: ${T.navy}; font-family: 'Plus Jakarta Sans', sans-serif;
    background: transparent;
  }
  .lp-search-input::placeholder { color: #9CA3AF; }
  .lp-search-btn {
    background: linear-gradient(135deg, ${T.blue}, ${T.teal});
    border: none; color: white; font-weight: 700;
    font-size: .88rem; padding: 0 24px; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: opacity .2s;
  }
  .lp-search-btn:hover { opacity: .9; }

  /* CTAs */
  .lp-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px; }
  .lp-btn-primary {
    background: linear-gradient(135deg, ${T.coral}, #FF8C5A);
    color: white; text-decoration: none; font-weight: 700;
    font-size: 1rem; padding: 14px 28px; border-radius: 12px;
    display: inline-flex; align-items: center; gap: 8px;
    box-shadow: 0 6px 20px rgba(255,107,53,0.35);
    transition: all .2s;
  }
  .lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,53,0.45); }
  .lp-btn-secondary {
    background: white; color: ${T.blue}; text-decoration: none;
    font-weight: 700; font-size: 1rem; padding: 13px 28px;
    border-radius: 12px; border: 1.5px solid rgba(15,76,117,0.2);
    display: inline-flex; align-items: center; gap: 8px;
    transition: all .2s;
  }
  .lp-btn-secondary:hover { border-color: ${T.teal}; color: ${T.teal}; background: rgba(0,180,166,0.04); }

  /* Trust row */
  .lp-trust { display: flex; gap: 20px; flex-wrap: wrap; }
  .lp-trust-item {
    display: flex; align-items: center; gap: 6px;
    font-size: .8rem; color: ${T.gray}; font-weight: 600;
  }
  .lp-trust-icon { font-size: 14px; }

  /* Hero visual */
  .lp-hero-visual { position: relative; }
  .lp-phone-mockup {
    background: white; border-radius: 24px; padding: 20px;
    box-shadow: ${T.shadowLg}; position: relative; overflow: hidden;
    border: 1px solid rgba(0,180,166,0.1);
  }
  .lp-phone-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
    padding-bottom: 12px; border-bottom: 1px solid ${T.lgray};
  }
  .lp-phone-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, ${T.teal}, ${T.blue});
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 14px; font-weight: 800; flex-shrink: 0;
  }
  .lp-phone-title { font-size: .85rem; font-weight: 700; color: ${T.navy}; }
  .lp-phone-sub   { font-size: .72rem; color: ${T.gray}; }
  .lp-mini-card {
    background: ${T.lgray}; border-radius: 12px; padding: 12px;
    margin-bottom: 10px; display: flex; gap: 10px; align-items: center;
    transition: transform .2s;
  }
  .lp-mini-card:hover { transform: translateX(3px); }
  .lp-mini-card-icon {
    width: 44px; height: 44px; border-radius: 10px;
    background: white; display: flex; align-items: center;
    justify-content: center; font-size: 22px; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(15,76,117,0.08);
  }
  .lp-mini-card-title { font-size: .82rem; font-weight: 700; color: ${T.navy}; }
  .lp-mini-card-meta  { font-size: .72rem; color: ${T.gray}; }
  .lp-mini-card-price {
    margin-left: auto; font-size: .82rem; font-weight: 800;
    color: ${T.teal}; font-family: 'JetBrains Mono', monospace;
    white-space: nowrap;
  }
  .lp-ai-badge {
    position: absolute; top: -12px; right: 16px;
    background: linear-gradient(135deg, ${T.blue}, ${T.teal});
    color: white; font-size: 11px; font-weight: 700;
    padding: 5px 12px; border-radius: 50px;
    box-shadow: 0 4px 12px rgba(0,180,166,0.3);
    font-family: 'JetBrains Mono', monospace;
  }
  .lp-float-badge {
    position: absolute; background: white; border-radius: 12px;
    padding: 8px 14px; box-shadow: ${T.shadowLg};
    font-size: 12px; font-weight: 700; white-space: nowrap;
    border: 1px solid rgba(0,180,166,0.12);
    animation: lpFloat 3s ease-in-out infinite;
  }
  @keyframes lpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .lp-float-1 { bottom: 20px; left: -20px; color: ${T.teal}; animation-delay: 0s; }
  .lp-float-2 { top: 30px;  left: -30px; color: ${T.coral}; animation-delay: 1s; }

  /* ── Stats bar ── */
  .lp-stats {
    background: ${T.blue}; color: white; padding: 28px 5vw;
    display: flex; justify-content: center; gap: 60px; flex-wrap: wrap;
  }
  .lp-stat { text-align: center; }
  .lp-stat-val {
    font-size: 2rem; font-weight: 800; display: block;
    font-family: 'JetBrains Mono', monospace;
    color: ${T.teal};
  }
  .lp-stat-label { font-size: .78rem; opacity: .7; font-weight: 600; margin-top: 2px; }

  /* ── How it works ── */
  .lp-how {
    padding: 100px 5vw; max-width: 1100px; margin: 0 auto;
  }
  .lp-section-tag {
    display: inline-block; background: rgba(0,180,166,0.08);
    border: 1px solid rgba(0,180,166,0.2); border-radius: 6px;
    padding: 4px 12px; font-size: 11px; font-weight: 700;
    color: ${T.teal}; letter-spacing: .08em; text-transform: uppercase;
    margin-bottom: 14px; font-family: 'JetBrains Mono', monospace;
  }
  .lp-section-h2 {
    font-size: clamp(1.8rem,3.5vw,2.6rem); font-weight: 800;
    color: ${T.navy}; letter-spacing: -.03em; margin-bottom: 8px;
    line-height: 1.15;
  }
  .lp-section-sub { color: ${T.gray}; font-size: 1rem; margin-bottom: 56px; line-height: 1.7; }

  .lp-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
  .lp-step {
    background: white; border-radius: 20px; padding: 32px;
    border: 1.5px solid transparent;
    box-shadow: ${T.shadow};
    transition: all .25s; position: relative; overflow: hidden;
  }
  .lp-step::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, ${T.teal}, ${T.blue});
    transform: scaleX(0); transform-origin: left;
    transition: transform .3s;
  }
  .lp-step:hover { transform: translateY(-4px); box-shadow: ${T.shadowLg}; border-color: rgba(0,180,166,0.15); }
  .lp-step:hover::before { transform: scaleX(1); }
  .lp-step-num {
    width: 40px; height: 40px; border-radius: 12px;
    background: linear-gradient(135deg, ${T.teal}, ${T.blue});
    color: white; font-weight: 800; font-size: 1rem;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px; font-family: 'JetBrains Mono', monospace;
  }
  .lp-step-icon { font-size: 2rem; margin-bottom: 14px; display: block; }
  .lp-step-h { font-size: 1.05rem; font-weight: 800; color: ${T.navy}; margin-bottom: 8px; }
  .lp-step-p { font-size: .85rem; color: ${T.gray}; line-height: 1.7; }
  .lp-steps-connector {
    display: flex; align-items: center; justify-content: center;
    color: ${T.teal}; font-size: 1.5rem; margin-top: 16px;
  }

  /* ── Preview section ── */
  .lp-preview {
    background: linear-gradient(160deg, #EEF6FF 0%, #E8F7F6 100%);
    padding: 100px 5vw; position: relative; overflow: hidden;
  }
  .lp-preview-inner { max-width: 1100px; margin: 0 auto; }
  .lp-preview-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 16px;
    margin-bottom: 32px; position: relative;
  }
  .lp-preview-card {
    background: white; border-radius: 16px; padding: 20px;
    box-shadow: ${T.shadow}; border: 1px solid rgba(0,180,166,0.08);
    filter: blur(3px); user-select: none; pointer-events: none;
    transition: filter .3s;
  }
  .lp-preview-overlay {
    position: absolute; inset: -20px; display: flex;
    align-items: center; justify-content: center;
    background: linear-gradient(180deg, transparent 0%, rgba(238,246,255,0.95) 50%);
    z-index: 2; flex-direction: column; gap: 16px; text-align: center; padding: 20px;
  }
  .lp-preview-lock { font-size: 48px; margin-bottom: 8px; }
  .lp-preview-msg { font-size: 1.1rem; font-weight: 800; color: ${T.navy}; margin-bottom: 4px; }
  .lp-preview-sub { font-size: .85rem; color: ${T.gray}; margin-bottom: 16px; }

  /* ── Why section ── */
  .lp-why { padding: 100px 5vw; max-width: 1100px; margin: 0 auto; }
  .lp-why-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .lp-why-card {
    background: white; border-radius: 20px; padding: 32px;
    box-shadow: ${T.shadow}; border: 1.5px solid transparent;
    transition: all .25s; text-align: center;
  }
  .lp-why-card:hover { border-color: rgba(0,180,166,0.2); transform: translateY(-4px); box-shadow: ${T.shadowLg}; }
  .lp-why-icon {
    width: 64px; height: 64px; border-radius: 18px; margin: 0 auto 18px;
    display: flex; align-items: center; justify-content: center; font-size: 28px;
  }
  .lp-why-h { font-size: 1rem; font-weight: 800; color: ${T.navy}; margin-bottom: 8px; }
  .lp-why-p { font-size: .83rem; color: ${T.gray}; line-height: 1.7; }

  /* ── City section ── */
  .lp-city {
    background: ${T.navy}; padding: 80px 5vw; text-align: center;
    position: relative; overflow: hidden;
  }
  .lp-city-bg {
    position: absolute; inset: 0; opacity: .04;
    background-image: radial-gradient(circle, ${T.teal} 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .lp-city h2 {
    font-size: clamp(1.8rem,3vw,2.4rem); font-weight: 800; color: white;
    margin-bottom: 10px; letter-spacing: -.02em;
  }
  .lp-city p { color: rgba(255,255,255,.6); font-size: .95rem; margin-bottom: 32px; }
  .lp-city-tags { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 40px; }
  .lp-city-tag {
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
    border-radius: 50px; padding: 6px 16px; font-size: 12px;
    color: rgba(255,255,255,.7); font-weight: 600;
  }

  /* ── Final CTA ── */
  .lp-final {
    padding: 100px 5vw; text-align: center;
    background: linear-gradient(160deg, ${T.light} 0%, #E8F7F6 100%);
  }
  .lp-final h2 {
    font-size: clamp(2rem,4vw,3rem); font-weight: 800; color: ${T.navy};
    letter-spacing: -.03em; margin-bottom: 14px; line-height: 1.15;
  }
  .lp-final p { color: ${T.gray}; font-size: 1rem; margin-bottom: 36px; max-width: 480px; margin-left: auto; margin-right: auto; }
  .lp-final-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .lp-final-primary {
    background: linear-gradient(135deg, ${T.coral}, #FF8C5A);
    color: white; text-decoration: none; font-weight: 800;
    font-size: 1.05rem; padding: 16px 36px; border-radius: 14px;
    box-shadow: 0 8px 24px rgba(255,107,53,0.35); transition: all .2s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .lp-final-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,107,53,0.45); }
  .lp-final-secondary {
    background: white; color: ${T.blue}; text-decoration: none;
    font-weight: 700; font-size: 1.05rem; padding: 15px 36px;
    border-radius: 14px; border: 1.5px solid rgba(15,76,117,0.2);
    transition: all .2s; display: inline-flex; align-items: center; gap: 8px;
  }
  .lp-final-secondary:hover { border-color: ${T.teal}; color: ${T.teal}; }

  /* ── Footer ── */
  .lp-footer {
    background: ${T.navy}; padding: 40px 5vw;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 16px;
  }
  .lp-footer-brand { display: flex; align-items: center; gap: 8px; }
  .lp-footer-name { font-size: .95rem; font-weight: 800; color: white; }
  .lp-footer-name span { color: ${T.teal}; }
  .lp-footer-copy { font-size: .78rem; color: rgba(255,255,255,.35); }
  .lp-footer-links { display: flex; gap: 20px; }
  .lp-footer-link { color: rgba(255,255,255,.4); text-decoration: none; font-size: .82rem; transition: color .2s; }
  .lp-footer-link:hover { color: ${T.teal}; }

  /* ── Responsive ── */
  @media(max-width:768px) {
    .lp-hero-inner { grid-template-columns: 1fr; gap: 40px; }
    .lp-hero-visual { display: none; }
    .lp-steps { grid-template-columns: 1fr; }
    .lp-preview-grid { grid-template-columns: 1fr; }
    .lp-preview-card:nth-child(n+2) { display: none; }
    .lp-why-grid { grid-template-columns: 1fr; }
    .lp-stats { gap: 28px; }
    .lp-nav-links .lp-nav-link { display: none; }
  }
`;

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════════════════════════════ */
function Counter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1800;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start = Math.min(start + step, end);
          setCount(Math.round(start));
          if (start >= end) clearInterval(timer);
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════
   PREVIEW CARDS (blurred teaser)
═══════════════════════════════════════════════════════════ */
const PREVIEW_ITEMS = [
  { icon: '📱', title: 'iPhone 12 Pro', cat: 'Electronics', val: '₹28,000', want: 'Looking for a laptop' },
  { icon: '🎸', title: 'Yamaha Guitar', cat: 'Music',        val: '₹12,500', want: 'Open to camera gear' },
  { icon: '📚', title: 'UPSC Books Set', cat: 'Books',       val: '₹3,200',  want: 'Coding books' },
  { icon: '🚲', title: 'Trek Bicycle',  cat: 'Sports',       val: '₹8,800',  want: 'Gym equipment' },
  { icon: '💻', title: 'Dell Laptop',   cat: 'Electronics',  val: '₹35,000', want: 'Photography gear' },
  { icon: '🎮', title: 'PS4 + 5 Games', cat: 'Gaming',      val: '₹18,000', want: 'Tablet or iPad' },
];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate  = useNavigate();
  const [query,   setQuery]   = useState('');
  const [scrolled,setScrolled]= useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/login?redirect=/listings${query ? `?search=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* ════ NAVBAR ════ */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <a href="/" className="lp-brand">
          <div className="lp-brand-icon">B</div>
          <span className="lp-brand-name">Barter<span>App</span></span>
        </a>
        <div className="lp-nav-links">
          <a href="#how-it-works" className="lp-nav-link">How it works</a>
          <a href="#why"          className="lp-nav-link">Why BarterApp</a>
          <Link to="/about"       className="lp-nav-link">About</Link>
          <Link to="/login"       className="lp-nav-link">Login</Link>
          <Link to="/register"    className="lp-nav-cta">Get Started Free</Link>
        </div>
      </nav>

      {/* ════ HERO ════ */}
      <section className="lp-hero">
        <div className="lp-hero-blob-1"/><div className="lp-hero-blob-2"/>
        <div className="lp-hero-inner">
          {/* Left */}
          <div>
            <div className="lp-city-badge">
              <span className="lp-city-dot"/>
              📍 Now live in Bangalore
            </div>
            <div className="lp-hero-tag">AI-POWERED BARTER PLATFORM</div>
            <h1 className="lp-hero-h1">
              Trade Smart.<br/>
              Live Better.<br/>
              <span className="teal">No Cash</span> <span className="coral">Needed.</span>
            </h1>
            <p className="lp-hero-sub">
              Exchange what you own for what you need. Our AI finds the perfect match, estimates fair value, and connects you with trusted traders in Bangalore.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch}>
              <div className="lp-search">
                <input className="lp-search-input"
                  placeholder="What are you looking for? (e.g. laptop, guitar, books...)"
                  value={query} onChange={e => setQuery(e.target.value)}
                />
                <button type="submit" className="lp-search-btn">Search →</button>
              </div>
            </form>

            <div className="lp-ctas">
              <Link to="/register" className="lp-btn-primary">
                Start Trading Free →
              </Link>
              <a href="#how-it-works" className="lp-btn-secondary">
                See How It Works
              </a>
            </div>

            <div className="lp-trust">
              <div className="lp-trust-item"><span className="lp-trust-icon">🔒</span> Secure & verified</div>
              <div className="lp-trust-item"><span className="lp-trust-icon">🔍</span> Smart matching</div>
              <div className="lp-trust-item"><span className="lp-trust-icon">💰</span> Always free to join</div>
            </div>
          </div>

          {/* Right — App mockup */}
          <div className="lp-hero-visual">
            <div style={{ position: 'relative' }}>
              <div className="lp-phone-mockup">
                <div className="lp-phone-header">
                  <div className="lp-phone-avatar">B</div>
                  <div>
                    <div className="lp-phone-title">BarterApp · Bangalore</div>
                    <div className="lp-phone-sub">3 new matches for you</div>
                  </div>
                </div>
                {PREVIEW_ITEMS.slice(0,4).map((item,i) => (
                  <div key={i} className="lp-mini-card">
                    <div className="lp-mini-card-icon">{item.icon}</div>
                    <div>
                      <div className="lp-mini-card-title">{item.title}</div>
                      <div className="lp-mini-card-meta">{item.want}</div>
                    </div>
                    <div className="lp-mini-card-price">{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ STATS ════ */}
      <div className="lp-stats">
        {[
          { val: 500,  suffix: '+',  label: 'Active Traders' },
          { val: 1200, suffix: '+',  label: 'Items Listed' },
          { val: 450,  suffix: '+',  label: 'Successful Trades' },
          { val: 0,    suffix: ' ₹', label: 'Cash Required' },
        ].map((s,i) => (
          <div key={i} className="lp-stat">
            <span className="lp-stat-val"><Counter end={s.val} suffix={s.suffix}/></span>
            <span className="lp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ════ HOW IT WORKS ════ */}
      <section id="how-it-works">
        <div className="lp-how">
          <span className="lp-section-tag">HOW IT WORKS</span>
          <h2 className="lp-section-h2">Trading made<br/>ridiculously simple</h2>
          <p className="lp-section-sub">Three steps between you and your next great trade.</p>
          <div className="lp-steps">
            {[
              { n:'01', icon:'📸', title:'List Your Item',
                desc:'Take a photo, describe your item. Get a fair price estimate and a better description automatically.' },
              { n:'02', icon:'🔍', title:'Find Your Match',
                desc:'Search by meaning, not just words. Find what you need across all categories — electronics, books, clothes, furniture and more.' },
              { n:'03', icon:'🤝', title:'Trade & Complete',
                desc:'Chat directly, agree on the terms, meet safely. Both parties review after — building a trusted community one trade at a time.' },
            ].map((s,i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num">{s.n}</div>
                <span className="lp-step-icon">{s.icon}</span>
                <div className="lp-step-h">{s.title}</div>
                <p className="lp-step-p">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ PREVIEW (blurred — login to see) ════ */}
      <section className="lp-preview">
        <div className="lp-preview-inner">
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <span className="lp-section-tag">LIVE LISTINGS</span>
            <h2 className="lp-section-h2" style={{ textAlign:'center', marginTop:10 }}>
              What's trading in<br/>Bangalore right now
            </h2>
          </div>
          <div className="lp-preview-grid" style={{ position:'relative' }}>
            {PREVIEW_ITEMS.map((item,i) => (
              <div key={i} className="lp-preview-card">
                <div style={{ fontSize:36, marginBottom:10 }}>{item.icon}</div>
                <div style={{ fontWeight:700, fontSize:'.9rem', marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:'.75rem', color:T.gray, marginBottom:8 }}>{item.want}</div>
                <div style={{ fontWeight:800, color:T.teal }}>{item.val}</div>
              </div>
            ))}
            <div className="lp-preview-overlay">
              <div className="lp-preview-lock">🔓</div>
              <div className="lp-preview-msg">Join to see all listings</div>
              <div className="lp-preview-sub">500+ items available for trade in Bangalore</div>
              <Link to="/register" className="lp-btn-primary" style={{ fontSize:'.9rem', padding:'12px 24px' }}>
                Create Free Account →
              </Link>
              <div style={{ fontSize:'.78rem', color:T.gray, marginTop:8 }}>
                Already have an account? <Link to="/login" style={{ color:T.teal, fontWeight:700 }}>Login</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ WHY BARTERAPP ════ */}
      <section id="why">
        <div className="lp-why">
          <span className="lp-section-tag">WHY BARTERAPP</span>
          <h2 className="lp-section-h2">Not just another<br/>marketplace</h2>
          <p className="lp-section-sub">Built with AI from the ground up — not bolted on as an afterthought.</p>
          <div className="lp-why-grid">
            {[
              { icon:'🔍', bg:'rgba(0,180,166,0.08)', color:T.teal,
                title:'Smart Matching',
                desc:'Search by meaning, not just keywords. Looking for "camping gear" finds tents, sleeping bags, and trail shoes across all categories.' },
              { icon:'⚖️', bg:'rgba(15,76,117,0.08)', color:T.blue,
                title:'Fair Value Guarantee',
                desc:'Every item is assessed using market data. Both parties know the fair value before negotiating — no more guesswork or disputes.' },
              { icon:'🔒', bg:'rgba(255,107,53,0.08)', color:T.coral,
                title:'Safe & Trusted',
                desc:'Verified profiles, review system, and secure messaging. Trade with confidence knowing every user is accountable.' },
            ].map((w,i) => (
              <div key={i} className="lp-why-card">
                <div className="lp-why-icon" style={{ background:w.bg }}>
                  <span style={{ fontSize:28 }}>{w.icon}</span>
                </div>
                <div className="lp-why-h">{w.title}</div>
                <p className="lp-why-p">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ BANGALORE COMMUNITY ════ */}
      <section className="lp-city">
        <div className="lp-city-bg"/>
        <div style={{ position:'relative', zIndex:1, maxWidth:600, margin:'0 auto' }}>
          <span className="lp-section-tag" style={{ background:'rgba(0,180,166,.15)', color:T.teal }}>
            📍 BANGALORE COMMUNITY
          </span>
          <h2 style={{ marginTop:12 }}>Swap across the city</h2>
          <p>From Koramangala to Whitefield, BarterApp connects Bangaloreans who want to trade smart.</p>
          <div className="lp-city-tags">
            {['Koramangala','Indiranagar','HSR Layout','Whitefield',
              'JP Nagar','Marathahalli','Electronic City','Jayanagar'].map(area => (
              <span key={area} className="lp-city-tag">📍 {area}</span>
            ))}
          </div>
          <Link to="/register" className="lp-btn-primary" style={{ margin:'0 auto', display:'inline-flex' }}>
            Join Bangalore's Barter Community →
          </Link>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="lp-final">
        <h2>Ready to trade<br/>your first item?</h2>
        <p>Join hundreds of Bangaloreans already trading smart. It's free, always.</p>
        <div className="lp-final-btns">
          <Link to="/register" className="lp-final-primary">
            Create Free Account →
          </Link>
          <Link to="/login" className="lp-final-secondary">
            I already have an account
          </Link>
        </div>
        <div style={{ marginTop:20, fontSize:'.78rem', color:T.gray }}>
          No credit card required · Free forever · Cancel anytime
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <div style={{ width:28,height:28,borderRadius:8,
            background:`linear-gradient(135deg,${T.blue},${T.teal})`,
            display:'flex',alignItems:'center',justifyContent:'center',
            color:'white',fontWeight:800,fontSize:14 }}>B</div>
          <span className="lp-footer-name">Barter<span>App</span></span>
          <span className="lp-footer-copy">· Bangalore, India · 2026</span>
        </div>
        <div className="lp-footer-links">
          <a href="#how-it-works" className="lp-footer-link">How it works</a>
          <Link to="/login"    className="lp-footer-link">Login</Link>
          <Link to="/register" className="lp-footer-link">Sign Up</Link>
          <Link to="/about"    className="lp-footer-link">About</Link>
        </div>
      </footer>
    </div>
  );
}
