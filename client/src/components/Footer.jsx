// components/Footer.jsx
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div>
            <div className="footer__logo-text">Barter<span>App</span></div>
            <p className="footer__tagline">AI-Powered Collaborative Economy · Bangalore, India</p>
          </div>
          <div style={{ display: 'flex', gap: '3rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--gray)', alignItems: 'center' }}>
            <div><span style={{ color: 'white', fontWeight: 700, fontSize: '1rem', display: 'block' }}>React 18</span> Frontend</div>
            <div><span style={{ color: 'white', fontWeight: 700, fontSize: '1rem', display: 'block' }}>FastAPI</span> AI Engine</div>
            <div><span style={{ color: 'white', fontWeight: 700, fontSize: '1rem', display: 'block' }}>PostgreSQL</span> Data Layer</div>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2026 BarterApp. Engineered locally in Bangalore, India. All Rights Reserved.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Secure Platform
          </p>
        </div>
      </div>
    </footer>
  );
}
