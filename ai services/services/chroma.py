"""
Vector store — pure Python, no C++ needed.
Uses NumPy cosine similarity + JSON persistence.

Hybrid Search:
  - BM25  keyword scoring  (exact/partial word match)
  - Vector semantic scoring (meaning-based match)
  - RRF   Reciprocal Rank Fusion combines both
  Same technique used by Elasticsearch & production RAG systems.
"""

import os
import re
import json
import math
from pathlib import Path
from functools import lru_cache
from collections import Counter

from sentence_transformers import SentenceTransformer

STORE_PATH  = Path(os.getenv("CHROMA_PATH", "./chroma_data")) / "listings.json"
EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")

# Hybrid weights — tune these to shift balance
VECTOR_WEIGHT = 0.7   # 70% semantic
BM25_WEIGHT   = 0.3   # 30% keyword
RRF_K         = 60    # RRF constant (higher = smoother blend)


# ══════════════════════════════════════════════════════════════
#  EMBEDDING MODEL
# ══════════════════════════════════════════════════════════════

@lru_cache(maxsize=1)
def get_embedder() -> SentenceTransformer:
    print(f"⏳ Loading embedding model: {EMBED_MODEL}")
    model = SentenceTransformer(EMBED_MODEL)
    print("✅ Embedding model ready")
    return model


def embed_text(text: str) -> list[float]:
    return get_embedder().encode(text, normalize_embeddings=True).tolist()


def embed_listing(title: str, description: str, looking_for: str = "", category: str = "") -> list[float]:
    combined = f"{title}. {title}. {description}. Looking for: {looking_for}. Category: {category}"
    return embed_text(combined.strip())


# ══════════════════════════════════════════════════════════════
#  BM25 IMPLEMENTATION
#  BM25 is the gold standard keyword ranking algorithm.
#  Used by Elasticsearch, Solr, and most search engines.
# ══════════════════════════════════════════════════════════════

def _tokenise(text: str) -> list[str]:
    """Lowercase, remove punctuation, split into words."""
    return re.findall(r'\b\w+\b', text.lower())


def _build_bm25_index(store: dict) -> dict:
    """
    Build BM25 index from the store.
    Returns: { doc_id: term_frequencies, ... }
    Also computes IDF (inverse document frequency) for all terms.
    """
    doc_tokens  = {}
    doc_lengths = {}
    df          = Counter()   # document frequency per term

    for lid, entry in store.items():
        tokens = _tokenise(entry["document"])
        tf     = Counter(tokens)
        doc_tokens[lid]  = tf
        doc_lengths[lid] = len(tokens)
        for term in set(tokens):
            df[term] += 1

    avg_len = sum(doc_lengths.values()) / max(len(doc_lengths), 1)

    return {
        "doc_tokens":  doc_tokens,
        "doc_lengths": doc_lengths,
        "avg_len":     avg_len,
        "df":          df,
        "n_docs":      len(store),
    }


def _bm25_score(query_tokens: list[str], doc_id: str, index: dict,
                k1: float = 1.5, b: float = 0.75) -> float:
    """
    BM25 score for one document.
    k1 = term frequency saturation (1.2–2.0 typical)
    b  = length normalisation (0=none, 1=full)
    """
    score      = 0.0
    doc_tf     = index["doc_tokens"].get(doc_id, {})
    doc_len    = index["doc_lengths"].get(doc_id, 0)
    avg_len    = index["avg_len"]
    n_docs     = index["n_docs"]
    df         = index["df"]

    for term in query_tokens:
        tf  = doc_tf.get(term, 0)
        if tf == 0:
            continue
        idf = math.log((n_docs - df.get(term, 0) + 0.5) / (df.get(term, 0) + 0.5) + 1)
        tf_norm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * doc_len / max(avg_len, 1)))
        score += idf * tf_norm

    return score


# ══════════════════════════════════════════════════════════════
#  RECIPROCAL RANK FUSION
#  Merges two ranked lists into one without needing
#  normalised scores — robust and simple.
#  Formula: RRF(d) = Σ 1 / (k + rank_i(d))
# ══════════════════════════════════════════════════════════════

def _rrf_combine(
    vector_ranking: list[tuple],   # [(id, score), ...]
    bm25_ranking:   list[tuple],   # [(id, score), ...]
    k: int = RRF_K,
) -> list[tuple]:
    """
    Combine two rankings using Reciprocal Rank Fusion.
    Returns merged list sorted by RRF score descending.
    """
    rrf_scores = {}

    for rank, (lid, _) in enumerate(vector_ranking):
        rrf_scores[lid] = rrf_scores.get(lid, 0) + VECTOR_WEIGHT * (1 / (k + rank + 1))

    for rank, (lid, _) in enumerate(bm25_ranking):
        rrf_scores[lid] = rrf_scores.get(lid, 0) + BM25_WEIGHT * (1 / (k + rank + 1))

    return sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)


# ══════════════════════════════════════════════════════════════
#  STORE OPERATIONS
# ══════════════════════════════════════════════════════════════

def _load_store() -> dict:
    if STORE_PATH.exists():
        with open(STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_store(store: dict) -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(store, f)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    return max(-1.0, min(1.0, dot))


# ══════════════════════════════════════════════════════════════
#  PUBLIC API
# ══════════════════════════════════════════════════════════════

def get_chroma_client():
    class _FakeClient:
        def get_or_create_collection(self, *a, **kw):
            return None
    return _FakeClient()


def get_collection():
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
    query_text: str = "",           # ← NEW: pass raw query for BM25
    use_hybrid: bool = True,        # ← NEW: toggle hybrid on/off
) -> dict:
    """
    Hybrid search: BM25 + Vector via Reciprocal Rank Fusion.

    If query_text is empty or use_hybrid=False → pure vector search (original behaviour).
    If query_text is provided → hybrid search (better results).
    """
    store = _load_store()

    if not store:
        return {"ids": [[]], "metadatas": [[]], "distances": [[]], "documents": [[]]}

    # ── Apply category filter ──────────────────────────────────
    if where and "category" in where:
        wanted = where["category"].get("$eq", "").lower()
        store  = {lid: e for lid, e in store.items()
                  if e["metadata"].get("category", "").lower() == wanted}

    if not store:
        return {"ids": [[]], "metadatas": [[]], "distances": [[]], "documents": [[]]}

    # ── Vector ranking ─────────────────────────────────────────
    vector_scored = []
    for lid, entry in store.items():
        sim  = _cosine_similarity(query_embedding, entry["embedding"])
        dist = 1.0 - sim
        vector_scored.append((lid, sim, entry["metadata"], entry["document"], dist))
    vector_scored.sort(key=lambda x: x[1], reverse=True)
    vector_ranking = [(r[0], r[1]) for r in vector_scored]

    # ── Hybrid: add BM25 ranking ───────────────────────────────
    if use_hybrid and query_text.strip():
        query_tokens = _tokenise(query_text)
        index        = _build_bm25_index(store)

        bm25_scored = []
        for lid in store:
            score = _bm25_score(query_tokens, lid, index)
            bm25_scored.append((lid, score))
        bm25_scored.sort(key=lambda x: x[1], reverse=True)

        # Combine via RRF
        merged    = _rrf_combine(vector_ranking, bm25_scored)
        final_ids = [lid for lid, _ in merged[:top_k]]
    else:
        # Pure vector fallback
        final_ids = [r[0] for r in vector_scored[:top_k]]

    # ── Build response in ChromaDB shape ──────────────────────
    id_to_entry = {r[0]: r for r in vector_scored}
    top = [id_to_entry[lid] for lid in final_ids if lid in id_to_entry]

    return {
        "ids":       [[r[0] for r in top]],
        "metadatas": [[r[2] for r in top]],
        "documents": [[r[3] for r in top]],
        "distances": [[r[4] for r in top]],
    }


def delete_listing(listing_id: str) -> None:
    store = _load_store()
    store.pop(str(listing_id), None)
    _save_store(store)


def count() -> int:
    return len(_load_store())
