const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const auth     = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// POST /api/images/:listingId  — upload up to 5 images for a listing
router.post('/:listingId', auth, upload.array('images', 5), async (req, res, next) => {
  try {
    const { listingId } = req.params;

    // Verify ownership
    const listing = await db.query(
      'SELECT id, user_id FROM listings WHERE id = $1',
      [listingId]
    );
    if (!listing.rows.length)
      return res.status(404).json({ message: 'Listing not found' });
    if (listing.rows[0].user_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorised' });

    // Check how many images already exist
    const existing = await db.query(
      'SELECT COUNT(*) FROM listing_images WHERE listing_id = $1',
      [listingId]
    );
    const existingCount = parseInt(existing.rows[0].count, 10);

    const inserted = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Upload buffer to Cloudinary
      const cloudResult = await uploadToCloudinary(file.buffer);

      const isPrimary = existingCount === 0 && i === 0;
      const result = await db.query(
        `INSERT INTO listing_images (listing_id, url, is_primary, sort_order)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [listingId, cloudResult.secure_url, isPrimary, existingCount + i]
      );
      inserted.push(result.rows[0]);
    }

    res.status(201).json(inserted);
  } catch (err) { next(err); }
});

// DELETE /api/images/:imageId
router.delete('/:imageId', auth, async (req, res, next) => {
  try {
    const imgRes = await db.query(
      `SELECT li.*, l.user_id FROM listing_images li
       JOIN listings l ON li.listing_id = l.id
       WHERE li.id = $1`,
      [req.params.imageId]
    );
    if (!imgRes.rows.length) return res.status(404).json({ message: 'Image not found' });
    if (imgRes.rows[0].user_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorised' });

    await db.query('DELETE FROM listing_images WHERE id = $1', [req.params.imageId]);
    res.json({ message: 'Image deleted' });
  } catch (err) { next(err); }
});

// PUT /api/images/:imageId/primary — set as primary image
router.put('/:imageId/primary', auth, async (req, res, next) => {
  try {
    const imgRes = await db.query(
      `SELECT li.*, l.user_id FROM listing_images li
       JOIN listings l ON li.listing_id = l.id
       WHERE li.id = $1`,
      [req.params.imageId]
    );
    if (!imgRes.rows.length) return res.status(404).json({ message: 'Image not found' });
    if (imgRes.rows[0].user_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorised' });

    const { listing_id } = imgRes.rows[0];
    await db.query('UPDATE listing_images SET is_primary = FALSE WHERE listing_id = $1', [listing_id]);
    await db.query('UPDATE listing_images SET is_primary = TRUE WHERE id = $1', [req.params.imageId]);
    res.json({ message: 'Primary image updated' });
  } catch (err) { next(err); }
});

module.exports = router;
