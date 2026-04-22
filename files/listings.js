const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// GET /api/listings  — browse with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { category, search, status = 'active', page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const params = [status, limit, offset];
    let where = 'l.status = $1';
    let idx = 4;

    if (category) { where += ` AND c.slug = $${idx++}`; params.push(category); }
    if (search)   { where += ` AND (l.title ILIKE $${idx++} OR l.description ILIKE $${idx++})`; params.push(`%${search}%`, `%${search}%`); idx++; }

    const result = await db.query(
      `SELECT l.*, u.username, u.avatar_url, u.rating AS owner_rating,
              c.name AS category_name, c.slug AS category_slug,
              (SELECT url FROM listing_images WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) AS primary_image
       FROM listings l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN categories c ON l.category_id = c.id
       WHERE ${where}
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
      params
    );
    res.json({ listings: result.rows, page: +page, limit: +limit });
  } catch (err) { next(err); }
});

// GET /api/listings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT l.*, u.username, u.avatar_url, u.rating AS owner_rating,
              c.name AS category_name,
              json_agg(li.url ORDER BY li.sort_order) FILTER (WHERE li.id IS NOT NULL) AS images
       FROM listings l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN categories c ON l.category_id = c.id
       LEFT JOIN listing_images li ON li.listing_id = l.id
       WHERE l.id = $1
       GROUP BY l.id, u.username, u.avatar_url, u.rating, c.name`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Listing not found' });
    // increment view count
    await db.query('UPDATE listings SET views = views + 1 WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/listings  (auth required)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, condition, category_id, estimated_value, looking_for, location } = req.body;
    const result = await db.query(
      `INSERT INTO listings (user_id, title, description, condition, category_id, estimated_value, looking_for, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, title, description, condition, category_id, estimated_value, looking_for, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/listings/:id  (auth required, owner only)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, condition, category_id, estimated_value, looking_for, location, status } = req.body;
    const result = await db.query(
      `UPDATE listings SET title=$1, description=$2, condition=$3, category_id=$4,
       estimated_value=$5, looking_for=$6, location=$7, status=$8
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [title, description, condition, category_id, estimated_value, looking_for, location, status, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Listing not found or not authorised' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/listings/:id  (auth required, owner only)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM listings WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Listing not found or not authorised' });
    res.json({ message: 'Listing deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
