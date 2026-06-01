const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const db       = require('../config/db');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema, refreshSchema } = require('../middleware/schemas');

// ── Helpers ──────────────────────────────────────────────────
const REFRESH_EXPIRES_DAYS = 30;

const signAccess = (user) =>
  jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

const createRefreshToken = async (userId) => {
  const raw   = crypto.randomBytes(64).toString('hex');
  const hash  = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hash, expiresAt]
  );
  return raw;
};

// ── POST /api/auth/register ──────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length)
      return res.status(409).json({ message: 'Email or username already taken' });

    const password_hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, username, email, created_at`,
      [username, email, password_hash]
    );
    const user = result.rows[0];

    const accessToken  = signAccess(user);
    const refreshToken = await createRefreshToken(user.id);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user   = result.rows[0];

    const dummyHash = '$2a$12$invalidhashpaddingtomatchbcryptlength00000000000000000000';
    const valid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !valid)
      return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken  = signAccess(user);
    const refreshToken = await createRefreshToken(user.id);

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ───────────────────────────────────
router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const tokenRes = await db.query(
      `SELECT rt.*, u.id AS uid, u.username
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1`,
      [hash]
    );
    const stored = tokenRes.rows[0];

    if (!stored || stored.revoked || new Date(stored.expires_at) < new Date())
      return res.status(401).json({ message: 'Invalid or expired refresh token' });

    await db.query('UPDATE refresh_tokens SET revoked=TRUE WHERE id=$1', [stored.id]);

    const user = { id: stored.uid, username: stored.username };
    const newAccessToken  = signAccess(user);
    const newRefreshToken = await createRefreshToken(user.id);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await db.query('UPDATE refresh_tokens SET revoked=TRUE WHERE token_hash=$1', [hash]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
