"""
Barter App — AI Service v3.0
Endpoints:
  /search                        Hybrid BM25 + vector search
  /listings/enhance              AI listing improver
  /listings/analyse-condition    Vision: detect damage from photo
  /trades/estimate               Trade fairness estimator
  /trades/valuate                Asset valuation engine
  /recommendations/{user_id}     For You feed
  /recommendations/{user_id}/similar/{listing_id}  Similar items
  /recommendations/{user_id}/mutual  Mutual trade matches
  /ingest                        ETL sync
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import search, listings, trades, ingest
from routers.condition import router as condition_router
from routers.recommendations import router as rec_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ Barter AI service v3.0 starting up")
    yield
    print("👋 AI service shutting down")


app = FastAPI(
    title="Barter App AI Service",
    description="RAG search · vision · valuation · recommendations",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router,     prefix="/search",          tags=["Search"])
app.include_router(listings.router,   prefix="/listings",        tags=["Listings"])
app.include_router(condition_router,  prefix="/listings",        tags=["Vision"])
app.include_router(trades.router,     prefix="/trades",          tags=["Trades"])
app.include_router(rec_router,        prefix="/recommendations", tags=["Recommendations"])
app.include_router(ingest.router,     prefix="/ingest",          tags=["ETL"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "barter-ai", "version": "3.0.0"}
