// components/ListingCard.jsx
import { Link } from 'react-router-dom';
import WishlistButton from './WishlistButton';

export default function ListingCard({ listing, matchScore }) {
  const conditionClass = {
    excellent: 'condition-excellent',
    good:      'condition-good',
    fair:      'condition-fair',
    poor:      'condition-poor',
  }[listing.condition?.toLowerCase()] || 'badge-gray';

  return (
    <div className="listing-card">
      {/* Badges */}
      {matchScore && (
        <div className="listing-card__badge" style={{ background: 'var(--teal)' }}>
           {matchScore}% Match
        </div>
      )}
      {listing.ai_recommended && !matchScore && (
        <div className="listing-card__badge">
           Recommended
        </div>
      )}

      {/* Image */}
      <Link to={`/listings/${listing.id}`} style={{ display: 'block' }}>
        {listing.primary_image ? (
          <img src={listing.primary_image} alt={listing.title} className="listing-card__img" />
        ) : (
          <div className="listing-card__img-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="listing-card__body">
        <div className="listing-card__meta">
          <span className="listing-card__category">{listing.category_name || listing.category}</span>
          <span className="listing-card__location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {listing.location}
          </span>
        </div>

        <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="listing-card__title">{listing.title}</h3>
        </Link>
        <p className="listing-card__desc">{listing.description}</p>

        <div style={{ marginBottom: '0.75rem' }}>
          <span className={`badge badge-mono ${conditionClass}`} style={{ fontSize: '0.7rem' }}>
            {listing.condition}
          </span>
          {listing.estimated_value && (
            <span className="badge badge-blue badge-mono" style={{ marginLeft: '0.375rem', fontSize: '0.7rem' }}>
              ₹{Number(listing.estimated_value).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="listing-card__footer">
          <div>
            <span className="listing-card__looking-label">Looking For</span>
            <span className="listing-card__looking">{listing.looking_for}</span>
          </div>
          <WishlistButton listingId={listing.id} />
        </div>
      </div>
    </div>
  );
}
