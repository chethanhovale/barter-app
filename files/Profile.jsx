import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile]   = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/listings?status=active`),
    ]).then(([userRes, listRes]) => {
      setProfile(userRes.data);
      setListings(listRes.data.listings.filter(l => l.user_id === id));
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading profile…</div>;
  if (!profile) return <div className="loading">User not found.</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.username} />
            : <span>{profile.username[0].toUpperCase()}</span>
          }
        </div>
        <div className="profile-meta">
          <h1>{profile.username}</h1>
          {profile.location && <p className="profile-location">📍 {profile.location}</p>}
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            <div className="stat">
              <strong>{profile.total_reviews}</strong>
              <span>Reviews</span>
            </div>
            <div className="stat">
              <strong>{profile.rating > 0 ? `⭐ ${Number(profile.rating).toFixed(1)}` : '—'}</strong>
              <span>Rating</span>
            </div>
            <div className="stat">
              <strong>{listings.length}</strong>
              <span>Active Listings</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="section-title">Active Listings</h2>
      {listings.length === 0 ? (
        <p className="empty">No active listings.</p>
      ) : (
        <div className="listings-grid">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
