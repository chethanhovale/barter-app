"""
Anthropic API wrapper.
All prompts to Claude live here — easy to tune in one place.

Features:
  - enhance_listing          → improve listing title/description
  - estimate_trade_fairness  → RAG-based trade fairness
  - valuate_asset            → depreciation + market context valuation
  - analyse_item_condition   → Vision: detect damage from photo
"""

import os
import json
import base64
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
    "Electronics":      0.25,
    "Books & Media":    0.10,
    "Clothing":         0.20,
    "Furniture":        0.10,
    "Sports & Fitness": 0.15,
    "Tools":            0.08,
    "Services":         0.00,
    "Food & Produce":   0.80,
    "Art & Crafts":     0.05,
    "Other":            0.15,
}

CONDITION_MULT = {
    "new":       1.00,
    "like_new":  0.90,
    "good":      0.75,
    "fair":      0.55,
    "poor":      0.35,
}


# ══════════════════════════════════════════════════════════════
#  IMAGE CONDITION ANALYSER (Claude Vision)
# ══════════════════════════════════════════════════════════════

def analyse_item_condition(
    image_bytes: bytes,
    media_type:  str,
    item_name:   str = "",
    category:    str = "",
) -> dict:
    """
    Pass an image to Claude Vision.
    Returns condition label, damage report, and a multiplier
    for the valuation engine.
    """
    if MOCK_MODE:
        return {
            "condition":            "good",
            "confidence":           0.50,
            "damage_detected":      ["Unable to analyse — add ANTHROPIC_API_KEY"],
            "positive_signs":       ["Image received successfully"],
            "condition_score":      70,
            "analysis_summary":     "Mock mode — add ANTHROPIC_API_KEY to enable AI vision analysis.",
            "suggested_multiplier": 0.75,
        }

    image_b64 = base64.standard_b64encode(image_bytes).decode("utf-8")

    prompt = f"""You are an expert item condition assessor for a barter marketplace.

Carefully examine this image of: {item_name or 'an item'} (Category: {category or 'unknown'})

Assess the physical condition by looking for:
- Scratches, dents, cracks, chips
- Fading, discolouration, stains
- Missing parts, broken components
- Wear on edges, corners, surfaces
- Screen damage (if applicable)
- Overall cleanliness and presentation

Return ONLY valid JSON (no markdown, no extra text):
{{
  "condition": "new" | "like_new" | "good" | "fair" | "poor",
  "confidence": <0.0 to 1.0>,
  "damage_detected": ["specific damage 1", "specific damage 2"],
  "positive_signs": ["positive observation 1", "positive observation 2"],
  "condition_score": <0 to 100>,
  "analysis_summary": "2-3 sentences describing the item condition honestly",
  "suggested_multiplier": <0.35 to 1.0>
}}

Condition guide:
- new (95-100):      Never used, original packaging
- like_new (85-94):  Minimal use, no visible damage
- good (65-84):      Normal wear, minor scratches only
- fair (40-64):      Noticeable damage, still functional
- poor (0-39):       Heavy damage, may affect functionality

suggested_multiplier: new=1.0, like_new=0.90, good=0.75, fair=0.55, poor=0.35
"""

    message = get_client().messages.create(
        model=MODEL,
        max_tokens=600,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type":       "base64",
                        "media_type": media_type,
                        "data":       image_b64,
                    },
                },
                {"type": "text", "text": prompt},
            ],
        }],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


# ══════════════════════════════════════════════════════════════
#  ASSET VALUATION ENGINE
# ══════════════════════════════════════════════════════════════

def _mock_valuation(original_price, purchase_date, condition, category):
    try:
        purchased = date.fromisoformat(purchase_date)
    except Exception:
        purchased = date.today()
    age_years    = (date.today() - purchased).days / 365.0
    rate         = DEPRECIATION_RATES.get(category, 0.15)
    cond_mult    = CONDITION_MULT.get(condition.lower().replace(" ", "_"), 0.70)
    depreciation = min(rate * age_years, 0.85)
    estimated    = round(original_price * (1 - depreciation) * cond_mult, 2)
    return {
        "estimated_value":   estimated,
        "depreciation_rate": round(depreciation, 4),
        "confidence_score":  0.55,
        "valuation_summary": (
            f"(Mock mode) Item is {age_years:.1f} years old in {condition} condition. "
            f"Applied {rate*100:.0f}%/yr depreciation → estimated ₹{estimated:,.0f}."
        ),
    }


def valuate_asset(
    item_name, original_price, purchase_date,
    condition, category, rag_results,
    condition_multiplier_override=None,
):
    if MOCK_MODE:
        result = _mock_valuation(original_price, purchase_date, condition, category)
        if condition_multiplier_override:
            result["estimated_value"] = round(
                original_price * (1 - result["depreciation_rate"]) * condition_multiplier_override, 2
            )
        return result

    market_context = "\n".join([
        f"{i+1}. {r.get('title','?')} — Est. value: ₹{r.get('estimated_value') or 'unknown'} | "
        f"Condition: {r.get('condition','?')} | Looking for: {r.get('looking_for','?')}"
        for i, r in enumerate(rag_results[:3])
    ]) or "No similar listings found."

    rate     = DEPRECIATION_RATES.get(category, 0.15)
    mult_note = ""
    if condition_multiplier_override:
        mult_note = f"\nIMPORTANT: AI Vision detected condition multiplier {condition_multiplier_override:.2f} — use this."

    prompt = f"""You are an expert asset valuation engine for a barter marketplace.

ITEM:           {item_name}
CATEGORY:       {category}
ORIGINAL PRICE: ₹{original_price:,.0f}
PURCHASE DATE:  {purchase_date}
CURRENT DATE:   {date.today().isoformat()}
CONDITION:      {condition}
BASE DEPRECIATION: {rate*100:.0f}% per year
{mult_note}

MARKET CONTEXT:
{market_context}

Return ONLY valid JSON:
{{
  "estimated_value": <number in INR>,
  "depreciation_rate": <decimal 0-1>,
  "confidence_score": <decimal 0-1>,
  "valuation_summary": "<2-3 sentence explanation>"
}}"""

    message = get_client().messages.create(
        model=MODEL, max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


# ══════════════════════════════════════════════════════════════
#  ENHANCE LISTING
# ══════════════════════════════════════════════════════════════

def enhance_listing(title, description, category="", condition=""):
    if MOCK_MODE:
        return {
            "enhanced_title":       title,
            "enhanced_description": description,
            "suggested_tags":       [category] if category else ["item", "barter", "trade"],
            "suggested_category":   category or "Other",
        }

    prompt = f"""You are a helpful assistant for a barter/trade marketplace.
Improve this listing to be more compelling and searchable.

Title: {title}
Description: {description}
Category: {category or 'unknown'}
Condition: {condition or 'not specified'}

Return ONLY valid JSON:
{{
  "enhanced_title": "...",
  "enhanced_description": "...",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "suggested_category": "..."
}}"""

    message = get_client().messages.create(
        model=MODEL, max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


# ══════════════════════════════════════════════════════════════
#  TRADE FAIRNESS
# ══════════════════════════════════════════════════════════════

def estimate_trade_fairness(
    offered_title, offered_desc, offered_value,
    requested_title, requested_desc, requested_value,
    similar_trades,
):
    if MOCK_MODE:
        o_val = offered_value or 0
        r_val = requested_value or 0
        if o_val and r_val:
            ratio = min(o_val, r_val) / max(o_val, r_val)
            if ratio >= 0.85:   verdict, note = "fair",            "Values are close."
            elif ratio >= 0.65: verdict, note = "slightly_uneven", "One item may be worth more."
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

OFFERED:   {offered_title} — {offered_desc} (value: {offered_value or 'unknown'})
REQUESTED: {requested_title} — {requested_desc} (value: {requested_value or 'unknown'})

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
        model=MODEL, max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)
