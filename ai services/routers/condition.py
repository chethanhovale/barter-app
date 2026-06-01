"""
POST /listings/analyse-condition
Vision-based item condition analyser.
Requires ANTHROPIC_API_KEY to work fully.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from pydantic import BaseModel
from services.llm import analyse_item_condition

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB   = 5


class ConditionResponse(BaseModel):
    condition:            str
    confidence:           float
    damage_detected:      list[str]
    positive_signs:       list[str]
    condition_score:      int
    analysis_summary:     str
    suggested_multiplier: float


@router.post("/analyse-condition", response_model=ConditionResponse)
async def analyse_condition(
    image:     UploadFile = File(...),
    item_name: Optional[str] = Form(default=""),
    category:  Optional[str] = Form(default=""),
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail=f"Unsupported file type: {image.content_type}")

    image_bytes = await image.read()
    if len(image_bytes) / (1024 * 1024) > MAX_SIZE_MB:
        raise HTTPException(status_code=422, detail="Image too large. Max 5MB.")

    try:
        result = analyse_item_condition(
            image_bytes=image_bytes,
            media_type=image.content_type,
            item_name=item_name or "",
            category=category or "",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {e}")

    return ConditionResponse(**result)
