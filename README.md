# 🔄 Barter App — AI-Powered Trade Marketplace

> The first barter platform powered by semantic vector search, AI asset valuation, and real-time ETL sync.

---

## ✨ Features

- Semantic RAG Search — Find listings by meaning, not just keywords. Built with `sentence-transformers` + JSON vector store
- AI Asset Valuation — Category-aware depreciation engine cross-referenced against live market data
- Real-Time ETL Sync — Every listing auto-syncs to the vector store on create/update/delete
- Trade Fairness Estimator — RAG + Claude AI assesses whether a proposed barter is fair
- Listing Enhancer — Claude improves listing titles and descriptions automatically
- Real-Time Chat — Socket.io powered messaging between traders
- JWT Auth — Secure access token + refresh token flow

---

## 🏗️ Architecture

```
React :3000  →  Express :5000  →  FastAPI :8000
                    ↓                  ↓
               PostgreSQL         VectorStore
                                 (sentence-transformers)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Socket.io-client |
| Backend | Node.js, Express, Socket.io |
| AI Service | FastAPI, Python 3.12, Uvicorn |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector Store | JSON-based (no C++ required) |
| LLM | Anthropic Claude (claude-sonnet-4) |
| Database | PostgreSQL, asyncpg |
| Auth | JWT (access + refresh tokens) |
| Images | Cloudinary |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- PostgreSQL

### 1. Clone the repo
```bash
git clone https://github.com/chethanhovale/barter-app.git
cd barter-app
```

### 2. Setup the database
```bash
psql -U postgres -c "CREATE DATABASE barter_app;"
psql -U postgres -d barter_app -f database/schema.sql
```

### 3. Setup Express server
```bash
cd server
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### 4. Setup React client
```bash
cd client
npm install
npm start
```

### 5. Setup AI service
```bash
cd ai_service
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp env.example .env        # fill in DATABASE_URL
uvicorn main:app --reload --port 8000
```

### 6. Seed the vector store
```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🔑 Environment Variables

### `server/.env`
```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/barter_app
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=15m
CLIENT_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### `ai_service/.env`
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/barter_app
CHROMA_PATH=./chroma_data
PORT=8000
# Optional — works without (mock mode)
# ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📡 AI Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search?q=...` | Semantic listing search |
| POST | `/trades/valuate` | Asset valuation engine |
| POST | `/listings/enhance` | AI listing improver |
| POST | `/trades/estimate` | Trade fairness check |
| POST | `/ingest` | Bulk ETL sync |
| GET | `/health` | Service health check |

---

## 👨‍💻 Developer

**Chethan Hovale** — Full-Stack AI Engineer, Bangalore, India

- GitHub: [github.com/your-username](https://github.com/chethanhovale)
- LinkedIn: [linkedin.com/in/your-profile](https://linkedin.com/in/chethan5241)

---

## 📄 License

This project is for portfolio and educational purposes.
