"""
Anthropic API wrapper.
All prompts to Claude live here — easy to tune in one place.
"""

import os
import json
import anthropic
from datetime import date

_client: anthropic.Anthropic | None = None
MODEL     = "claude-sonnet-4-20250514"
MOCK_MODE = not os.getenv("ANTHROPIC_API_KEY")

if MOCK_MODE:
    print("⚠️  No ANTHROPIC_API_KEY — running in mock mode. Semantic search works fully.")


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


# ── Depreciation rates by category ────────────────────────────
DEPRECIATION_RATES = {
    "Electronics":      0.25,   # 25% per year — fast depreciation
    "Books & Media":    0.10,
    "Clothing":         0.20,
    "Furniture":        0.10,
    "Sports & Fitness": 0.15,
    "Tools":            0.08,
    "Services":         0.00,
    "Food & Produce":   0.80,
    "Art & Crafts":     0.05,   # can appreciate
    "Other":            0.15,
}


def _mock_valuation(original_price: float, purchase_date: str,
                    condition: str, category: str) -> dict:
    """Simple math-based valuation for mock mode (no API key needed)."""
    try:
        purchased = date.fromisoformat(purchase_date)
    except Exception:
        purchased = date.today()

    age_years = (date.today() - purchased).days / 365.0
    rate      = DEPRECIATION_RATES.get(category, 0.15)

    # Condition multiplier
    condition_mult = {
        "new": 1.0, "like_new": 0.90, "good": 0.75, "fair": 0.55, "poor": 0.35
    }.get(condition.lower().replace(" ", "_"), 0.70)

    # Straight-line depreciation capped at 85%
    depreciation   = min(rate * age_years, 0.85)
    estimated      = round(original_price * (1 - depreciation) * condition_mult, 2)
    confidence     = 0.55   # lower confidence without market data

    return {
        "estimated_value":   estimated,
        "depreciation_rate": round(depreciation, 4),
        "confidence_score":  confidence,
        "valuation_summary": (
            f"(Mock mode — add ANTHROPIC_API_KEY for AI valuation.) "
            f"Item is {age_years:.1f} years old in {condition} condition. "
            f"Applied {rate*100:.0f}%/yr depreciation → estimated ₹{estimated:,.0f}."
        ),
    }


def valuate_asset(
    item_name:      str,
    original_price: float,
    purchase_date:  str,        # ISO format: YYYY-MM-DD
    condition:      str,
    category:       str,
    rag_results:    list[dict], # top 3 similar listings from ChromaDB
) -> dict:
    """
    Asset valuation engine.
    Uses age-based depreciation + RAG market context + Claude reasoning.

    Returns: { estimated_value, depreciation_rate, confidence_score, valuation_summary }
    """
    if MOCK_MODE:
        return _mock_valuation(original_price, purchase_date, condition, category)

    # Build RAG market context string
    market_context = "\n".join([
        f"{i+1}. {r.get('title','?')} — "
        f"Est. value: ₹{r.get('estimated_value') or 'unknown'} | "
        f"Condition: {r.get('condition','?')} | "
        f"Looking for: {r.get('looking_for','?')}"
        for i, r in enumerate(rag_results[:3])
    ]) or "No similar listings found in market."

    rate = DEPRECIATION_RATES.get(category, 0.15)

    prompt = f"""You are an expert asset valuation engine for a barter marketplace.

Estimate the current market value of this item:

ITEM:           {item_name}
CATEGORY:       {category}
ORIGINAL PRICE: ₹{original_price:,.0f}
PURCHASE DATE:  {purchase_date}
CURRENT DATE:   {date.today().isoformat()}
CONDITION:      {condition}
BASE DEPRECIATION RATE: {rate*100:.0f}% per year for {category}

SEMANTIC MARKET CONTEXT (similar listings currently on the platform):
{market_context}

Instructions:
- Calculate age in years from purchase date to today
- Apply depreciation adjusted for condition and market context
- Cross-reference against the market listings to refine the estimate
- Higher confidence if market data is available and consistent
- For vintage/art items, value may appreciate — reflect this

Return ONLY valid JSON (no markdown, no extra text):
{{
  "estimated_value": <number in INR>,
  "depreciation_rate": <decimal between 0 and 1, e.g. 0.35 means 35% total depreciation>,
  "confidence_score": <decimal between 0 and 1>,
  "valuation_summary": "<2-3 sentence explanation of how you arrived at this value>"
}}"""

    message = get_client().messages.create(
        model=MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def enhance_listing(title: str, description: str, category: str = "", condition: str = "") -> dict:
    if MOCK_MODE:
        return {
            "enhanced_title":       title,
            "enhanced_description": description,
            "suggested_tags":       [category] if category else ["item", "barter", "trade"],
            "suggested_category":   category or "Other",
        }

    prompt = f"""You are a helpful assistant for a barter/trade marketplace.

A user wants to improve their listing. Rewrite it to be more compelling and searchable.

Original title: {title}
Original description: {description}
Category hint: {category or "unknown"}
Condition: {condition or "not specified"}

Return ONLY valid JSON (no markdown, no extra text):
{{
  "enhanced_title": "...",
  "enhanced_description": "...",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "suggested_category": "..."
}}

Rules:
- enhanced_title: max 100 chars, clear and specific
- enhanced_description: 2-4 sentences, mention condition, value, what you want in return
- suggested_tags: 3-5 short keywords
- suggested_category: one of Electronics, Clothing, Books & Media, Furniture, Sports & Fitness, Tools, Services, Food & Produce, Art & Crafts, Other
"""
    message = get_client().messages.create(
        model=MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def estimate_trade_fairness(
    offered_title: str, offered_desc: str, offered_value: float | None,
    requested_title: str, requested_desc: str, requested_value: float | None,
    similar_trades: list[dict],
) -> dict:
    if MOCK_MODE:
        o_val = offered_value or 0
        r_val = requested_value or 0
        if o_val and r_val:
            ratio = min(o_val, r_val) / max(o_val, r_val)
            if ratio >= 0.85:   verdict, note = "fair",            "Estimated values are close."
            elif ratio >= 0.65: verdict, note = "slightly_uneven", "One item may be worth a bit more."
            else:               verdict, note = "uneven",          "Significant value difference."
        else:
            verdict, note = "fair", "No estimated values provided."
        return {
            "verdict": verdict, "confidence": "low",
            "explanation": f"(Mock mode) {note}",
            "suggested_adjustment": None,
        }

    similar_str = "\n".join(
        f"- {t.get('offered','?')} ↔ {t.get('requested','?')} (outcome: {t.get('outcome','?')})"
        for t in similar_trades[:5]
    ) or "No similar trades found."

    prompt = f"""You are a fair trade advisor for a barter marketplace.

Assess whether this trade is fair:

OFFERED:   {offered_title} — {offered_desc} (estimated value: {offered_value or 'unknown'})
REQUESTED: {requested_title} — {requested_desc} (estimated value: {requested_value or 'unknown'})

Similar past trades:
{similar_str}

Return ONLY valid JSON:
{{
  "verdict": "fair" | "slightly_uneven" | "uneven",
  "confidence": "high" | "medium" | "low",
  "explanation": "2-3 sentence explanation",
  "suggested_adjustment": null or number
}}"""
    message = get_client().messages.create(
        model=MODEL,
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)
