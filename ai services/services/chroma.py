"""
Vector store — pure Python replacement for ChromaDB.
Uses NumPy for cosine similarity + JSON file for persistence.
No C++ compiler needed, works on all platforms.

Same public API as the original chroma.py — no other files need changing.
"""

import os
import json
import math
from pathlib import Path
from functools import lru_cache

from sentence_transformers import SentenceTransformer

STORE_PATH = Path(os.getenv("CHROMA_PATH", "./chroma_data")) / "listings.json"
EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")


# ── Embedding model ────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_embedder() -> SentenceTransformer:
    print(f"⏳ Loading embedding model: {EMBED_MODEL}")
    model = SentenceTransformer(EMBED_MODEL)
    print("✅ Embedding model ready")
    return model


def embed_text(text: str) -> list[float]:
    vec = get_embedder().encode(text, normalize_embeddings=True).tolist()
    return vec


def embed_listing(title: str, description: str, looking_for: str = "", category: str = "") -> list[float]:
    combined = f"{title}. {title}. {description}. Looking for: {looking_for}. Category: {category}"
    return embed_text(combined.strip())


# ── JSON-backed vector store ───────────────────────────────────

def _load_store() -> dict:
    """Load the store from disk. Returns { id: { embedding, metadata, document } }"""
    if STORE_PATH.exists():
        with open(STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_store(store: dict) -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(store, f)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two normalised vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    # Vectors are already L2-normalised by sentence-transformers
    # so dot product == cosine similarity directly
    return max(-1.0, min(1.0, dot))


# ── Public API (mirrors chroma.py) ────────────────────────────

def get_chroma_client():
    """Stub — kept so main.py lifespan import doesn't break."""
    class _FakeClient:
        def get_or_create_collection(self, *a, **kw):
            return None
    return _FakeClient()


def get_collection():
    """Not used directly — store ops go through upsert/query."""
    return None


def upsert_listing(listing: dict) -> None:
    """Insert or update a listing in the JSON vector store."""
    store = _load_store()

    doc_text = (
        f"{listing['title']}. "
        f"{listing.get('description', '')}. "
        f"Looking for: {listing.get('looking_for', 'anything')}. "
        f"Category: {listing.get('category_name', '')}. "
        f"Condition: {listing.get('condition', '')}."
    )
    embedding = embed_text(doc_text)

    store[str(listing["id"])] = {
        "embedding": embedding,
        "document":  doc_text,
        "metadata": {
            "title":           listing.get("title", ""),
            "description":     (listing.get("description") or "")[:500],
            "category":        listing.get("category_name") or "",
            "condition":       listing.get("condition") or "",
            "estimated_value": float(listing.get("estimated_value") or 0),
            "looking_for":     (listing.get("looking_for") or "")[:200],
            "location":        listing.get("location") or "",
            "username":        listing.get("username") or "",
        },
    }
    _save_store(store)


def query_collection(
    query_embedding: list[float],
    top_k: int = 8,
    where: dict | None = None,
) -> dict:
    """
    Find the top_k most similar listings to query_embedding.
    Returns a dict shaped like ChromaDB's response so the router
    code doesn't need to change.
    """
    store = _load_store()

    if not store:
        return {"ids": [[]], "metadatas": [[]], "distances": [[]], "documents": [[]]}

    # Score every entry
    scored = []
    for lid, entry in store.items():
        meta = entry["metadata"]

        # Apply category filter if requested
        if where and "category" in where:
            wanted = where["category"].get("$eq", "")
            if meta.get("category", "").lower() != wanted.lower():
                continue

        sim  = _cosine_similarity(query_embedding, entry["embedding"])
        dist = 1.0 - sim          # convert to distance (0 = identical)
        scored.append((lid, meta, entry["document"], dist))

    # Sort by distance ascending (most similar first)
    scored.sort(key=lambda x: x[3])
    top = scored[:top_k]

    return {
        "ids":       [[r[0] for r in top]],
        "metadatas": [[r[1] for r in top]],
        "documents": [[r[2] for r in top]],
        "distances": [[r[3] for r in top]],
    }


def delete_listing(listing_id: str) -> None:
    """Remove a listing from the store."""
    store = _load_store()
    store.pop(str(listing_id), None)
    _save_store(store)


def count() -> int:
    return len(_load_store())
