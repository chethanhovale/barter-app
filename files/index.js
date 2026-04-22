const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes     = require('./routes/auth');
const listingRoutes  = require('./routes/listings');
const tradeRoutes    = require('./routes/trades');
const messageRoutes  = require('./routes/messages');
const reviewRoutes   = require('./routes/reviews');
const userRoutes     = require('./routes/users');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/trades',   tradeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/users',    userRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Error handler ───────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
