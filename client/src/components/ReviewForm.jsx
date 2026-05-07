import React, { useState } from 'react';
import api from '../services/api';
import './ReviewForm.css';

export default function ReviewForm({ tradeId, revieweeId, revieweeName, onSubmitted }) {
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { setError('Please select a star rating.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/reviews', { trade_id: tradeId, reviewee_id: revieweeId, rating, comment });
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="review-form review-done">
      <span>⭐</span>
      <p>Review submitted! Thanks for your feedback.</p>
    </div>
  );

  return (
    <div className="review-form">
      <h3>Rate {revieweeName}</h3>
      <form onSubmit={handleSubmit}>
        <div className="star-row">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= (hovered || rating) ? 'active' : ''}`}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <span className="rating-label">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
            </span>
          )}
        </div>

        <textarea
          placeholder={`How was your experience trading with ${revieweeName}?`}
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn-review-submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
