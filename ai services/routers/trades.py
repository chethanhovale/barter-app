"""
POST /trades/estimate    — RAG-powered trade fairness estimator
POST /trades/valuate     — Asset valuation engine (RAG + depreciation + Claude)
"""

from fastapi import APIRouter, HTTPException
from models.schemas import (
    TradeEstimateRequest, TradeEstimateResponse,
    ValuationRequest, ValuationResponse,
)
from services.chroma import embed_text, query_collection
from services.database import fetch_all
from services.llm import estimate_trade_fairness, valuate_asset

router = APIRouter()


@router.post("/estimate", response_model=TradeEstimateResponse)
async def estimate_trade(body: TradeEstimateRequest):
    offered_embedding   = embed_text(f"{body.offered_title}. {body.offered_description}")
    similar_offered     = query_collection(offered_embedding, top_k=5)

    try:
        past_trades = await fetch_all("""
            SELECT l_offered.title AS offered, l_requested.title AS requested,
                   t.cash_adjustment, t.status AS outcome
            FROM trades t
            JOIN listings l_offered   ON l_offered.id  = t.offered_listing_id
            JOIN listings l_requested ON l_requested.id = t.requested_listing_id
            WHERE t.status = 'completed'
            ORDER BY t.updated_at DESC LIMIT 20
        """)
    except Exception:
        past_trades = []

    similar_context = [
        {"offered": t.get("offered",""), "requested": t.get("requested",""), "outcome": "completed"}
        for t in past_trades[:5]
    ]
    if similar_offered["ids"] and similar_offered["ids"][0]:
        for meta in similar_offered["metadatas"][0][:3]:
            similar_context.append({
                "offered":   meta.get("title",""),
                "requested": meta.get("looking_for","something"),
                "outcome":   "historical listing",
            })

    try:
        result = estimate_trade_fairness(
            body.offered_title, body.offered_description, body.offered_value,
            body.requested_title, body.requested_description, body.requested_value,
            similar_context,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Estimation failed: {e}")

    return TradeEstimateResponse(
        verdict=result.get("verdict","unknown"),
        confidence=result.get("confidence","low"),
        explanation=result.get("explanation",""),
        similar_trades=similar_context[:5],
        suggested_adjustment=result.get("suggested_adjustment"),
    )


@router.post("/valuate", response_model=ValuationResponse)
async def valuate_item(body: ValuationRequest):
    """
    Asset valuation engine.
    1. Embed the item name + description
    2. Pull top 3 similar listings from vector store (RAG context)
    3. Pass to Claude with depreciation formula → returns valuation JSON
    """

    # ── Step 1: RAG — find similar listings for market context ──
    query_text = f"{body.item_name}. {body.description or ''}. Category: {body.category or ''}"
    embedding  = embed_text(query_text)
    similar    = query_collection(embedding, top_k=3)

    rag_results = []
    if similar["ids"] and similar["ids"][0]:
        for meta in similar["metadatas"][0]:
            rag_results.append({
                "title":           meta.get("title",""),
                "estimated_value": meta.get("estimated_value"),
                "condition":       meta.get("condition",""),
                "looking_for":     meta.get("looking_for",""),
            })

    # ── Step 2: Valuate with Claude ────────────────────────────
    try:
        result = valuate_asset(
            item_name=      body.item_name,
            original_price= body.original_price,
            purchase_date=  body.purchase_date,
            condition=      body.condition,
            category=       body.category or "Other",
            rag_results=    rag_results,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Valuation failed: {e}")

    return ValuationResponse(
        item_name=        body.item_name,
        original_price=   body.original_price,
        estimated_value=  result["estimated_value"],
        depreciation_rate=result["depreciation_rate"],
        confidence_score= result["confidence_score"],
        valuation_summary=result["valuation_summary"],
        market_context=   rag_results,
    )
