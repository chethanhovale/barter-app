"""
GET /recommendations/{user_id}           — "For You" personalised feed
GET /recommendations/{user_id}/similar/{listing_id} — "Similar to this"
GET /recommendations/{user_id}/mutual    — "Complete your trade" matches

All three use the existing RAG vector store — no API key needed.
"""

import asyncio
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel

from services.chroma import embed_text, query_collection, _load_store
from services.database import fetch_all, fetch_one

router = APIRouter()


# ══════════════════════════════════════════════════════════════
#  RESPONSE MODELS
# ══════════════════════════════════════════════════════════════

class RecommendedListing(BaseModel):
    id:               str
    title:            str
    description:      str
    category:         Optional[str] = None
    condition:        Optional[str] = None
    estimated_value:  Optional[float] = None
    looking_for:      Optional[str] = None
    location:         Optional[str] = None
    username:         Optional[str] = None
    relevance_score:  float
    reason:           str           # why this was recommended


class RecommendationResponse(BaseModel):
    user_id:         str
    type:            str            # "for_you" | "similar" | "mutual"
    recommendations: list[RecommendedListing]
    total:           int
    profile_summary: str            # explains what signals were used


# ══════════════════════════════════════════════════════════════
#  HELPER: Build user preference profile
# ══════════════════════════════════════════════════════════════

async def _build_user_profile(user_id: str) -> dict:
    """
    Pull all activity signals for a user from Postgres.
    Returns a preference dict with category weights + text profile.
    """

    # 1. Wishlisted categories (strongest signal — user explicitly saved)
    wishlisted = await fetch_all("""
        SELECT c.name AS category, l.title, l.description, l.looking_for
        FROM wishlists w
        JOIN listings l ON w.listing_id = l.id
        LEFT JOIN categories c ON l.category_id = c.id
        WHERE w.user_id = $1
        ORDER BY w.created_at DESC
        LIMIT 20
    """, user_id)

    # 2. Categories they've traded in (completed trades)
    traded = await fetch_all("""
        SELECT c.name AS category, l.title, l.looking_for
        FROM trades t
        JOIN listings l ON l.id = t.offered_listing_id OR l.id = t.requested_listing_id
        LEFT JOIN categories c ON l.category_id = c.id
        WHERE (t.requester_id = $1 OR t.owner_id = $1)
          AND t.status IN ('completed', 'accepted')
        LIMIT 20
    """, user_id)

    # 3. Their own listings (what they have / what they want)
    own_listings = await fetch_all("""
        SELECT c.name AS category, l.title, l.looking_for, l.description
        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        WHERE l.user_id = $1 AND l.status = 'active'
        LIMIT 10
    """, user_id)

    # 4. Their own listing IDs (to exclude from recommendations)
    own_ids = await fetch_all("""
        SELECT id::text FROM listings WHERE user_id = $1
    """, user_id)

    # 5. Already wishlisted IDs (to exclude duplicates)
    wishlisted_ids = await fetch_all("""
        SELECT listing_id::text AS id FROM wishlists WHERE user_id = $1
    """, user_id)

    # Build category weight map
    weights = {}
    for item in wishlisted:
        cat = item.get("category") or "Other"
        weights[cat] = weights.get(cat, 0) + 3.0    # wishlist = strongest signal

    for item in traded:
        cat = item.get("category") or "Other"
        weights[cat] = weights.get(cat, 0) + 2.0    # completed trade = strong signal

    for item in own_listings:
        cat = item.get("category") or "Other"
        weights[cat] = weights.get(cat, 0) + 1.0    # own listing = weak signal

    # Build text profile for embedding
    texts = []
    for item in wishlisted[:5]:
        if item.get("title"):        texts.append(item["title"])
        if item.get("looking_for"):  texts.append(item["looking_for"])
    for item in own_listings[:3]:
        if item.get("looking_for"):  texts.append(item["looking_for"])
        if item.get("description"):  texts.append(item["description"][:100])

    profile_text = ". ".join(texts) if texts else "general items for trade"

    exclude_ids = set(
        [r["id"] for r in own_ids] +
        [r["id"] for r in wishlisted_ids]
    )

    return {
        "weights":      weights,
        "profile_text": profile_text,
        "exclude_ids":  exclude_ids,
        "wishlisted":   wishlisted,
        "traded":       traded,
        "own_listings": own_listings,
    }


def _filter_and_rank(
    raw_results: dict,
    exclude_ids: set,
    base_reason: str,
    category_weights: dict = None,
    top_k: int = 10,
) -> list[RecommendedListing]:
    """Convert raw vector results to ranked recommendations, excluding known IDs."""
    results = []
    ids       = raw_results["ids"][0]
    metadatas = raw_results["metadatas"][0]
    distances = raw_results["distances"][0]

    for lid, meta, dist in zip(ids, metadatas, distances):
        if lid in exclude_ids:
            continue

        base_score = max(0.0, 1.0 - (dist / 2.0))

        # Boost score if category matches user's preference weights
        cat    = meta.get("category", "")
        weight = (category_weights or {}).get(cat, 0)
        boosted_score = min(1.0, base_score + (weight * 0.05))

        if boosted_score < 0.1:
            continue

        # Build reason string
        if weight >= 3:
            reason = f"Matches your wishlisted {cat} items"
        elif weight >= 2:
            reason = f"Based on your {cat} trades"
        elif weight >= 1:
            reason = f"Similar to your {cat} listings"
        else:
            reason = base_reason

        results.append(RecommendedListing(
            id=lid,
            title=meta.get("title", ""),
            description=meta.get("description", ""),
            category=cat or None,
            condition=meta.get("condition") or None,
            estimated_value=meta.get("estimated_value") or None,
            looking_for=meta.get("looking_for") or None,
            location=meta.get("location") or None,
            username=meta.get("username") or None,
            relevance_score=round(boosted_score, 4),
            reason=reason,
        ))

    results.sort(key=lambda r: r.relevance_score, reverse=True)
    return results[:top_k]


# ══════════════════════════════════════════════════════════════
#  1. "FOR YOU" — Personalised feed
# ══════════════════════════════════════════════════════════════

@router.get("/{user_id}", response_model=RecommendationResponse)
async def for_you(
    user_id: str,
    top_k:   int = Query(default=10, ge=1, le=20),
):
    """
    Personalised recommendations based on:
    - Wishlisted items (weight 3x)
    - Completed/accepted trades (weight 2x)
    - Own listings + looking_for (weight 1x)

    All combined into a preference profile vector,
    then queried against the vector store.
    """
    try:
        profile = await _build_user_profile(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile build failed: {e}")

    if not profile["profile_text"] or profile["profile_text"] == "general items for trade":
        # New user with no activity — return popular categories
        fallback_text = "electronics books clothing sports furniture tools"
        embedding = embed_text(fallback_text)
        summary   = "New user — showing popular categories"
    else:
        embedding = embed_text(profile["profile_text"])
        top_cats  = sorted(profile["weights"].items(), key=lambda x: x[1], reverse=True)[:3]
        summary   = f"Based on your interest in: {', '.join(c for c, _ in top_cats)}"

    raw = query_collection(
        embedding,
        top_k=top_k + len(profile["exclude_ids"]) + 5,
        query_text=profile["profile_text"],
        use_hybrid=True,
    )

    if not raw["ids"] or not raw["ids"][0]:
        return RecommendationResponse(
            user_id=user_id, type="for_you",
            recommendations=[], total=0,
            profile_summary="No listings available yet",
        )

    recs = _filter_and_rank(
        raw, profile["exclude_ids"],
        base_reason="Matches your interests",
        category_weights=profile["weights"],
        top_k=top_k,
    )

    return RecommendationResponse(
        user_id=user_id, type="for_you",
        recommendations=recs, total=len(recs),
        profile_summary=summary,
    )


# ══════════════════════════════════════════════════════════════
#  2. "SIMILAR TO THIS" — Item-based recommendations
# ══════════════════════════════════════════════════════════════

@router.get("/{user_id}/similar/{listing_id}", response_model=RecommendationResponse)
async def similar_to_this(
    user_id:    str,
    listing_id: str,
    top_k:      int = Query(default=6, ge=1, le=12),
):
    """
    Find listings similar to a specific item.
    Used on listing detail page: "People also looked at..."
    """
    # Fetch the listing's details
    listing = await fetch_one("""
        SELECT l.title, l.description, l.looking_for, c.name AS category
        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        WHERE l.id = $1
    """, listing_id)

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Embed the listing's content
    query_text = f"{listing['title']}. {listing.get('description','')}"
    embedding  = embed_text(query_text)

    # Exclude: the listing itself + user's own listings
    own_ids = await fetch_all(
        "SELECT id::text FROM listings WHERE user_id = $1", user_id
    )
    exclude = set([listing_id] + [r["id"] for r in own_ids])

    raw = query_collection(
        embedding, top_k=top_k + len(exclude) + 5,
        query_text=query_text, use_hybrid=True,
    )

    if not raw["ids"] or not raw["ids"][0]:
        return RecommendationResponse(
            user_id=user_id, type="similar",
            recommendations=[], total=0,
            profile_summary=f"Similar to: {listing['title']}",
        )

    recs = _filter_and_rank(
        raw, exclude,
        base_reason=f"Similar to {listing['title']}",
        top_k=top_k,
    )

    return RecommendationResponse(
        user_id=user_id, type="similar",
        recommendations=recs, total=len(recs),
        profile_summary=f"Items similar to: {listing['title']}",
    )


# ══════════════════════════════════════════════════════════════
#  3. "COMPLETE YOUR TRADE" — Mutual match
# ══════════════════════════════════════════════════════════════

@router.get("/{user_id}/mutual", response_model=RecommendationResponse)
async def mutual_matches(
    user_id: str,
    top_k:   int = Query(default=8, ge=1, le=20),
):
    """
    Find listings whose owners WANT what you have.
    Uses the user's active listings + looking_for fields.

    Example:
      You have: "Vintage Camera"
      Other listing's looking_for: "camera OR photography gear"
      → Mutual match!
    """
    # Get user's active listings
    own_listings = await fetch_all("""
        SELECT id::text, title, description, looking_for, estimated_value,
               c.name AS category
        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        WHERE l.user_id = $1 AND l.status = 'active'
        LIMIT 5
    """, user_id)

    if not own_listings:
        return RecommendationResponse(
            user_id=user_id, type="mutual",
            recommendations=[], total=0,
            profile_summary="Post a listing first to see mutual matches",
        )

    # Build search from what others are looking for that matches you
    my_items_text = " ".join([
        f"{l['title']} {l.get('description','')[:80]}"
        for l in own_listings
    ])
    embedding = embed_text(my_items_text)

    # Exclude own listings
    own_ids = set(r["id"] for r in own_listings)

    raw = query_collection(
        embedding,
        top_k=top_k + len(own_ids) + 10,
        query_text=my_items_text,
        use_hybrid=True,
    )

    if not raw["ids"] or not raw["ids"][0]:
        return RecommendationResponse(
            user_id=user_id, type="mutual",
            recommendations=[], total=0,
            profile_summary="No mutual matches found yet",
        )

    # Extra filter: only show if their looking_for text overlaps with your items
    my_titles_lower = [l["title"].lower() for l in own_listings]
    my_categories   = [l.get("category","").lower() for l in own_listings]

    recs = []
    ids       = raw["ids"][0]
    metadatas = raw["metadatas"][0]
    distances = raw["distances"][0]

    for lid, meta, dist in zip(ids, metadatas, distances):
        if lid in own_ids:
            continue

        score = max(0.0, 1.0 - (dist / 2.0))
        if score < 0.15:
            continue

        looking_for = (meta.get("looking_for") or "").lower()
        category    = (meta.get("category") or "").lower()

        # Check if there's a meaningful overlap
        is_mutual = (
            any(title in looking_for for title in my_titles_lower if title) or
            any(cat in looking_for for cat in my_categories if cat) or
            any(cat == category for cat in my_categories if cat)
        )

        reason = "Wants what you have" if is_mutual else "Potential match"
        if is_mutual:
            score = min(1.0, score + 0.15)   # boost mutual matches

        recs.append(RecommendedListing(
            id=lid,
            title=meta.get("title",""),
            description=meta.get("description",""),
            category=meta.get("category") or None,
            condition=meta.get("condition") or None,
            estimated_value=meta.get("estimated_value") or None,
            looking_for=meta.get("looking_for") or None,
            location=meta.get("location") or None,
            username=meta.get("username") or None,
            relevance_score=round(score, 4),
            reason=reason,
        ))

    recs.sort(key=lambda r: r.relevance_score, reverse=True)
    recs = recs[:top_k]

    my_titles = [l["title"] for l in own_listings[:2]]
    summary   = f"People who want: {', '.join(my_titles)}"

    return RecommendationResponse(
        user_id=user_id, type="mutual",
        recommendations=recs, total=len(recs),
        profile_summary=summary,
    )
