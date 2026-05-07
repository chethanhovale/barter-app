"""
GET  /search?q=vintage camera&top_k=8&category=electronics
POST /search   { "query": "...", "top_k": 8, "category": "..." }

Embeds the query → queries ChromaDB → returns ranked listings.
"""

from fastapi import APIRouter, Query, HTTPException
from models.schemas import SearchRequest, SearchResponse, ListingSearchResult
from services.chroma import embed_text, query_collection

router = APIRouter()


def _chroma_to_results(chroma_response: dict, query: str) -> list[ListingSearchResult]:
    """Convert raw ChromaDB response into clean result objects."""
    results = []
    ids       = chroma_response["ids"][0]
    metadatas = chroma_response["metadatas"][0]
    distances = chroma_response["distances"][0]

    for lid, meta, dist in zip(ids, metadatas, distances):
        # ChromaDB cosine distance: 0 = identical, 2 = opposite
        # Convert to 0–1 relevance score
        score = round(max(0.0, 1.0 - (dist / 2.0)), 4)

        # Skip very low relevance (< 10%)
        if score < 0.1:
            continue

        results.append(ListingSearchResult(
            id=lid,
            title=meta.get("title", ""),
            description=meta.get("description", ""),
            category=meta.get("category"),
            condition=meta.get("condition"),
            estimated_value=meta.get("estimated_value") or None,
            looking_for=meta.get("looking_for"),
            location=meta.get("location"),
            username=meta.get("username"),
            relevance_score=score,
            match_reason=_match_reason(score),
        ))

    return sorted(results, key=lambda r: r.relevance_score, reverse=True)


def _match_reason(score: float) -> str:
    if score >= 0.80:
        return "Very strong match"
    if score >= 0.60:
        return "Strong match"
    if score >= 0.40:
        return "Good match"
    if score >= 0.25:
        return "Partial match"
    return "Weak match"


@router.get("", response_model=SearchResponse)
async def semantic_search_get(
    q: str = Query(..., min_length=2, description="Search query"),
    top_k: int = Query(default=8, ge=1, le=20),
    category: str | None = Query(default=None),
):
    return await _run_search(q, top_k, category)


@router.post("", response_model=SearchResponse)
async def semantic_search_post(body: SearchRequest):
    return await _run_search(body.query, body.top_k, body.category)


async def _run_search(query: str, top_k: int, category: str | None) -> SearchResponse:
    try:
        query_embedding = embed_text(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    where_filter = {"category": {"$eq": category}} if category else None

    try:
        raw = query_collection(query_embedding, top_k=top_k, where=where_filter)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ChromaDB query failed: {e}")

    if not raw["ids"] or not raw["ids"][0]:
        return SearchResponse(query=query, results=[], total=0)

    results = _chroma_to_results(raw, query)

    return SearchResponse(query=query, results=results, total=len(results))
