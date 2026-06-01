import React, { useState } from 'react';
import api from '../services/api';
import './ImageUploader.css';

export default function ImageUploader({ listingId, onUploaded }) {
  const [files, setFiles]       = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
    setError('');
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const res = await api.post(`/images/${listingId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded?.(res.data);
      setFiles([]);
      setPreviews([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="uploader">
      <label className="uploader-label">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        <span>📷 Choose Photos (up to 5)</span>
      </label>

      {previews.length > 0 && (
        <div className="uploader-previews">
          {previews.map((src, i) => (
            <img key={i} src={src} alt={`preview-${i}`} className="preview-thumb" />
          ))}
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      {files.length > 0 && (
        <button
          className="btn-upload"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : `Upload ${files.length} Photo${files.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
