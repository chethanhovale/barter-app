import React from 'react';
import { Link } from 'react-router-dom';
import './ListingCard.css';

export default function ListingCard({ listing }) {
  const {
    id, title, condition, location, primary_image,
    category_name, estimated_value, owner_rating, username,
  } = listing;

  return (
    <Link to={`/listings/${id}`} className="listing-card">
      <div className="card-image">
        {primary_image
          ? <img src={primary_image} alt={title} />
          : <div className="card-image-placeholder">📦</div>
        }
        <span className="card-condition">{condition.replace('_', ' ')}</span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <div className="card-meta">
          {category_name && <span className="card-category">{category_name}</span>}
          {location && <span className="card-location">📍 {location}</span>}
        </div>
        {estimated_value && (
          <p className="card-value">Est. value: ₹{Number(estimated_value).toLocaleString()}</p>
        )}
        <div className="card-owner">
          <span>by {username}</span>
          {owner_rating > 0 && <span>⭐ {Number(owner_rating).toFixed(1)}</span>}
        </div>
      </div>
    </Link>
  );
}
