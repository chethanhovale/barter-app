const express         = require('express');
const router          = express.Router();
const db              = require('../config/db');
const authMiddleware  = require('../middleware/auth');
const validate        = require('../middleware/validate');
const { createListingSchema, updateListingSchema } = require('../middleware/schemas');
const fetch           = require('node-fetch');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Fire-and-forget: sync a listing into the AI vector store
function ingestListing(id) {
  fetch(`${AI_URL}/ingest/listing`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ listing_id: id }),
  }).catch(err => console.warn('AI ingest failed (non-critical):', err.message));
}

// ── GET /api/listings ──────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { category, search, status = 'active', page = 1, limit = 12, ids } = req.query;

    // ── IDs mode: fetch specific listings by ID (used by AI search) ──
    if (ids) {
      const idList = ids.split(',').filter(Boolean).slice(0, 50);
      if (!idList.length) return res.json({ listings: [] });
      const placeholders = idList.map((_, i) => `$${i + 1}`).join(',');
      const result = await db.query(
        `SELECT l.*, u.username, u.avatar_url, u.rating AS owner_rating,
                c.name AS category_name, c.slug AS category_slug,
                (SELECT url FROM listing_images WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) AS primary_image
         FROM listings l
         JOIN users u ON l.user_id = u.id
         LEFT JOIN categories c ON l.category_id = c.id
         WHERE l.id = ANY(ARRAY[${placeholders}]::uuid[])
         AND l.status = 'active'`,
        idList
      );
      return res.json({ listings: result.rows });
    }

    // ── Normal mode: filter + paginate ───────────────────────
    const safeLimit = Math.min(Math.max(parseInt(limit) || 12, 1), 50);
    const safePage  = Math.max(parseInt(page) || 1, 1);
    const offset    = (safePage - 1) * safeLimit;

    const params = [status, safeLimit, offset];
    let where = 'l.status = $1';
    let idx = 4;

    if (category) { where += ` AND c.slug = $${idx++}`; params.push(category); }
    if (search) {
      where += ` AND (l.title ILIKE $${idx} OR l.description ILIKE $${idx + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      idx += 2;
    }

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
    res.json({ listings: result.rows, page: safePage, limit: safeLimit });
  } catch (err) { next(err); }
});

// ── GET /api/listings/:id ──────────────────────────────────────
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
    await db.query('UPDATE listings SET views = views + 1 WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /api/listings ─────────────────────────────────────────
router.post('/', authMiddleware, validate(createListingSchema), async (req, res, next) => {
  try {
    const { title, description, condition, category_id, estimated_value, looking_for, location } = req.body;
    const result = await db.query(
      `INSERT INTO listings (user_id, title, description, condition, category_id, estimated_value, looking_for, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, title, description, condition, category_id, estimated_value, looking_for, location]
    );
    const listing = result.rows[0];
    ingestListing(listing.id);   // ← auto-sync to AI vector store
    res.status(201).json(listing);
  } catch (err) { next(err); }
});

// ── PUT /api/listings/:id ──────────────────────────────────────
router.put('/:id', authMiddleware, validate(updateListingSchema), async (req, res, next) => {
  try {
    const { title, description, condition, category_id, estimated_value, looking_for, location, status } = req.body;
    const result = await db.query(
      `UPDATE listings SET title=$1, description=$2, condition=$3, category_id=$4,
       estimated_value=$5, looking_for=$6, location=$7, status=$8
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [title, description, condition, category_id, estimated_value, looking_for, location, status, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Listing not found or not authorised' });
    ingestListing(req.params.id);   // ← auto-sync to AI vector store
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /api/listings/:id ───────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM listings WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Listing not found or not authorised' });

    // Remove from AI vector store
    fetch(`${AI_URL}/ingest/${req.params.id}`, { method: 'DELETE' })
      .catch(err => console.warn('AI delete failed (non-critical):', err.message));

    res.json({ message: 'Listing deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
