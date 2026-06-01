"""
POST /ingest           — Sync all active listings from Postgres → ChromaDB
POST /ingest/listing   — Sync a single listing (call this from Express after create/update)
DELETE /ingest/{id}    — Remove a listing from ChromaDB (call on delete)

This is your ETL pipeline. Run it:
  - Once manually to seed ChromaDB
  - Via cron nightly: POST /ingest
  - In real-time: Express calls /ingest/listing on every create/update
"""

import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from models.schemas import IngestRequest, IngestResponse
from services.chroma import upsert_listing, delete_listing
from services.database import fetch_all, fetch_one

router = APIRouter()

LISTINGS_QUERY = """
    SELECT
        l.id::text,
        l.title,
        l.description,
        l.condition::text,
        l.estimated_value,
        l.looking_for,
        l.location,
        c.name AS category_name,
        u.username
    FROM listings l
    LEFT JOIN categories c ON c.id = l.category_id
    LEFT JOIN users u ON u.id = l.user_id
    WHERE l.status = 'active'
    ORDER BY l.created_at DESC
"""

SINGLE_LISTING_QUERY = LISTINGS_QUERY.replace(
    "WHERE l.status = 'active'",
    "WHERE l.id = $1::uuid",
)


class SingleIngestRequest(BaseModel):
    listing_id: str


async def _ingest_batch(listings: list[dict]) -> tuple[int, int, int]:
    """Upsert a batch of listings into ChromaDB. Returns (ingested, skipped, errors)."""
    ingested = skipped = errors = 0
    for listing in listings:
        if not listing.get("title") or not listing.get("description"):
            skipped += 1
            continue
        try:
            # Run sync upsert in thread pool to avoid blocking the event loop
            await asyncio.get_event_loop().run_in_executor(None, upsert_listing, listing)
            ingested += 1
        except Exception as e:
            print(f"⚠️  Failed to ingest listing {listing.get('id')}: {e}")
            errors += 1
    return ingested, skipped, errors


@router.post("", response_model=IngestResponse)
async def ingest_all(body: IngestRequest, background_tasks: BackgroundTasks):
    """
    Sync all active listings (or a subset by IDs) from Postgres into ChromaDB.
    Safe to run multiple times — upsert is idempotent.
    """
    try:
        listings = await fetch_all(LISTINGS_QUERY)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"DB fetch failed: {e}")

    if body.listing_ids:
        id_set = set(body.listing_ids)
        listings = [l for l in listings if l["id"] in id_set]

    if not listings:
        return IngestResponse(ingested=0, skipped=0, errors=0, message="No listings to ingest")

    ingested, skipped, errors = await _ingest_batch(listings)

    return IngestResponse(
        ingested=ingested,
        skipped=skipped,
        errors=errors,
        message=f"Ingested {ingested} listings into ChromaDB ({skipped} skipped, {errors} errors)",
    )


@router.post("/listing", response_model=IngestResponse)
async def ingest_single(body: SingleIngestRequest):
    """
    Ingest or update a single listing.
    Call this from Express after POST /api/listings or PUT /api/listings/:id
    """
    try:
        listing = await fetch_one(SINGLE_LISTING_QUERY, body.listing_id)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"DB fetch failed: {e}")

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    try:
        await asyncio.get_event_loop().run_in_executor(None, upsert_listing, listing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingest failed: {e}")

    return IngestResponse(ingested=1, skipped=0, errors=0, message="Listing ingested successfully")


@router.delete("/{listing_id}", response_model=IngestResponse)
async def remove_listing(listing_id: str):
    """
    Remove a listing from ChromaDB.
    Call this from Express on DELETE /api/listings/:id
    """
    try:
        delete_listing(listing_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ChromaDB delete failed: {e}")

    return IngestResponse(ingested=0, skipped=0, errors=0, message="Listing removed from index")
