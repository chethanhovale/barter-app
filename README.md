# 🔄 Barter App — AI-Powered Trade Marketplace

> Full-stack barter platform with semantic search, AI valuation, and real-time trading.

[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20FastAPI-blue)]()
[![LLM](https://img.shields.io/badge/LLM-Claude%20Sonnet-purple)]()
[![Deploy](https://img.shields.io/badge/deploy-Render-green)]()

---

## Architecture

```
React :3000  →  Express :5000  →  FastAPI :8000
                    ↓                   ↓
               PostgreSQL          VectorStore
                                (sentence-transformers)
```

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router v6, Socket.io-client |
| Backend | Node.js, Express, Socket.io, Zod validation |
| AI Service | FastAPI, Python 3.12, Uvicorn |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) |
| LLM | Anthropic Claude (claude-sonnet-4) |
| Database | PostgreSQL, asyncpg |
| Auth | JWT — 15m access token + refresh token |
| Images | Cloudinary |
| Deploy | Docker, Render |

---

## Features

- **Semantic RAG Search** — find listings by meaning via sentence-transformers + JSON vector store
- **AI Asset Valuation** — category-aware depreciation engine cross-referenced with market data
- **Trade Fairness Estimator** — RAG + Claude assesses whether a proposed barter is fair
- **Listing Enhancer** — Claude auto-improves listing titles and descriptions
- **Real-Time ETL Sync** — listings auto-sync to vector store on create/update/delete
- **Real-Time Chat** — Socket.io messaging between traders
- **JWT Auth** — access + refresh token flow with server-side logout invalidation

---

## AI Service Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/search?q=...` | Semantic listing search |
| POST | `/trades/valuate` | Asset valuation |
| POST | `/listings/enhance` | AI listing improver |
| POST | `/trades/estimate` | Trade fairness check |
| POST | `/ingest` | Bulk ETL sync to vector store |
| GET | `/health` | Health check |

---

## Quick Start

### Prerequisites
- Node.js 18+, Python 3.12+, PostgreSQL

### 1. Clone & setup database
```bash
git clone https://github.com/chethanhovale/barter-app.git
cd barter-app
psql -U postgres -c "CREATE DATABASE barter_app;"
psql -U postgres -d barter_app -f database/schema.sql
```

### 2. Express server
```bash
cd server && npm install
cp .env.example .env   # fill in values
npm run dev
```

### 3. React client
```bash
cd client && npm install && npm start
```

### 4. AI service
```bash
cd "ai services"
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
uvicorn main:app --reload --port 8000
```

### 5. Seed vector store
```bash
curl -X POST http://localhost:8000/ingest -H "Content-Type: application/json" -d '{}'
```

---

## Environment Variables

**`server/.env`**
```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/barter_app
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=15m
CLIENT_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**`ai services/.env`**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/barter_app
PORT=8000
ANTHROPIC_API_KEY=sk-ant-...   # optional — omit for mock mode
```

---

## Deploy

Docker and Render config are included at the repo root.

```bash
docker build -t barter-app .
docker run -p 5000:5000 barter-app
```

For Render: push to `master` — `render.yaml` handles service definitions automatically.

---

## Developer

**Chethan Hovale** — Full-Stack AI Engineer, Bangalore

- GitHub: [github.com/chethanhovale](https://github.com/chethanhovale)
- LinkedIn: [linkedin.com/in/chethan5241](https://linkedin.com/in/chethan5241)
