"""
Barter App — AI Service
FastAPI microservice providing:
  - /search            Semantic RAG search over listings (pure Python vector store)
  - /listings/enhance  AI-powered listing title/description improver
  - /trades/estimate   RAG-based trade fairness estimator
  - /ingest            Sync listings from Postgres → vector store (ETL)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import search, listings, trades, ingest


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ Barter AI service starting up")
    yield
    print("👋 AI service shutting down")


app = FastAPI(
    title="Barter App AI Service",
    description="RAG search, listing enhancer, trade estimator",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router,   prefix="/search",   tags=["Search"])
app.include_router(listings.router, prefix="/listings", tags=["Listings"])
app.include_router(trades.router,   prefix="/trades",   tags=["Trades"])
app.include_router(ingest.router,   prefix="/ingest",   tags=["ETL"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "barter-ai"}
