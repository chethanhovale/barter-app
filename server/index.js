const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const jwt        = require('jsonwebtoken');
require('dotenv').config();

const authRoutes         = require('./routes/auth');
const listingRoutes      = require('./routes/listings');
const tradeRoutes        = require('./routes/trades');
const messageRoutes      = require('./routes/messages');
const reviewRoutes       = require('./routes/reviews');
const userRoutes         = require('./routes/users');
const imageRoutes        = require('./routes/images');
const notificationRoutes = require('./routes/notifications');
const wishlistRoutes     = require('./routes/wishlist');
const aiRoutes           = require('./routes/ai');           // ← AI service proxy
const errorHandler       = require('./middleware/errorHandler');
const { apiLimiter }     = require('./middleware/rateLimiter');
const db                 = require('./config/db');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// ── HTTP Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10kb' })); // prevent oversized JSON payloads
app.use(morgan('dev'));
app.use('/api', apiLimiter); // global rate limit on all /api routes

// ── REST Routes ─────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/listings',      listingRoutes);
app.use('/api/trades',        tradeRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/images',        imageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist',      wishlistRoutes);
app.use('/api/ai',           aiRoutes);                     // ← AI service proxy
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use(errorHandler);

// ── Socket.io Auth Middleware ───────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

// ── Socket.io Events ────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.user.username}`);

  socket.on('join_trade',  (tradeId) => socket.join(`trade:${tradeId}`));
  socket.on('leave_trade', (tradeId) => socket.leave(`trade:${tradeId}`));

  socket.on('send_message', async ({ trade_id, content }) => {
    if (!content?.trim()) return;
    try {
      const result = await db.query(
        `INSERT INTO messages (trade_id, sender_id, content)
         VALUES ($1, $2, $3) RETURNING *`,
        [trade_id, socket.user.id, content.trim()]
      );
      io.to(`trade:${trade_id}`).emit('new_message', {
        ...result.rows[0],
        username: socket.user.username,
      });
    } catch {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', ({ trade_id, isTyping }) => {
    socket.to(`trade:${trade_id}`).emit('user_typing', {
      username: socket.user.username,
      isTyping,
    });
  });

  socket.on('disconnect', () => console.log(`❌ Disconnected: ${socket.user.username}`));
});

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.io on http://localhost:${PORT}`);
});
