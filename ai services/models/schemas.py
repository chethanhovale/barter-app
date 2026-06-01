"""Shared Pydantic models used across routers."""

from typing import Optional
from pydantic import BaseModel, Field


# ── Listing models ──────────────────────────────────────────────

class ListingDocument(BaseModel):
    """A listing as stored/retrieved from ChromaDB."""
    id: str
    title: str
    description: str
    category: Optional[str] = None
    condition: Optional[str] = None
    estimated_value: Optional[float] = None
    looking_for: Optional[str] = None
    location: Optional[str] = None
    username: Optional[str] = None


class ListingSearchResult(ListingDocument):
    """A listing with a relevance score from semantic search."""
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    match_reason: str = ""


# ── Request models ──────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=300)
    top_k: int = Field(default=8, ge=1, le=20)
    category: Optional[str] = None


class EnhanceRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5, max_length=2000)
    category: Optional[str] = None
    condition: Optional[str] = None


class TradeEstimateRequest(BaseModel):
    offered_title: str
    offered_description: str
    offered_value: Optional[float] = None
    requested_title: str
    requested_description: str
    requested_value: Optional[float] = None


class IngestRequest(BaseModel):
    listing_ids: Optional[list[str]] = None  # None = ingest all active


# ── Response models ─────────────────────────────────────────────

class SearchResponse(BaseModel):
    query: str
    results: list[ListingSearchResult]
    total: int


class EnhanceResponse(BaseModel):
    original_title: str
    enhanced_title: str
    enhanced_description: str
    suggested_tags: list[str]
    suggested_category: Optional[str]


class TradeEstimateResponse(BaseModel):
    verdict: str           # "fair" | "slightly_uneven" | "uneven"
    confidence: str        # "high" | "medium" | "low"
    explanation: str
    similar_trades: list[dict]
    suggested_adjustment: Optional[float]


class IngestResponse(BaseModel):
    ingested: int
    skipped: int
    errors: int
    message: str


# ── Asset Valuation ─────────────────────────────────────────────

class ValuationRequest(BaseModel):
    item_name:      str   = Field(..., min_length=2, max_length=150)
    original_price: float = Field(..., gt=0)
    purchase_date:  str   = Field(..., description="ISO date: YYYY-MM-DD")
    condition:      str   = Field(..., description="new | like_new | good | fair | poor")
    category:       Optional[str] = None
    description:    Optional[str] = None


class ValuationResponse(BaseModel):
    item_name:         str
    original_price:    float
    estimated_value:   float
    depreciation_rate: float
    confidence_score:  float
    valuation_summary: str
    market_context:    list[dict]
