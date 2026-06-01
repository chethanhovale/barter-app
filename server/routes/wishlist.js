const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// GET /api/wishlist — get my saved listings
router.get('/', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT l.*, u.username, u.rating AS owner_rating,
              c.name AS category_name, c.slug AS category_slug,
              (SELECT url FROM listing_images WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) AS primary_image
       FROM wishlists w
       JOIN listings l ON w.listing_id = l.id
       JOIN users u ON l.user_id = u.id
       LEFT JOIN categories c ON l.category_id = c.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/wishlist/:listingId — save a listing
router.post('/:listingId', auth, async (req, res, next) => {
  try {
    await db.query(
      'INSERT INTO wishlists (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.listingId]
    );
    res.status(201).json({ message: 'Saved to wishlist' });
  } catch (err) { next(err); }
});

// DELETE /api/wishlist/:listingId — remove a listing
router.delete('/:listingId', auth, async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM wishlists WHERE user_id = $1 AND listing_id = $2',
      [req.user.id, req.params.listingId]
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (err) { next(err); }
});

// GET /api/wishlist/check/:listingId — check if saved
router.get('/check/:listingId', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT 1 FROM wishlists WHERE user_id = $1 AND listing_id = $2',
      [req.user.id, req.params.listingId]
    );
    res.json({ saved: result.rows.length > 0 });
  } catch (err) { next(err); }
});

module.exports = router;
