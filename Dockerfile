# ── Build stage ──────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev

# ── Runtime stage ─────────────────────────────────────────────
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY server/ .

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "index.js"]
