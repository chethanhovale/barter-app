"""
POST /listings/enhance

Takes a rough listing title + description and returns:
- A polished title and description
- Suggested tags
- Recommended category
"""

from fastapi import APIRouter, HTTPException
from models.schemas import EnhanceRequest, EnhanceResponse
from services.llm import enhance_listing

router = APIRouter()


@router.post("/enhance", response_model=EnhanceResponse)
async def enhance_listing_endpoint(body: EnhanceRequest):
    """
    Improve a listing's content using Claude.
    Call this from the CreateListing page before submitting.
    """
    try:
        result = enhance_listing(
            title=body.title,
            description=body.description,
            category=body.category or "",
            condition=body.condition or "",
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"LLM returned invalid JSON: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhancement failed: {e}")

    return EnhanceResponse(
        original_title=body.title,
        enhanced_title=result.get("enhanced_title", body.title),
        enhanced_description=result.get("enhanced_description", body.description),
        suggested_tags=result.get("suggested_tags", []),
        suggested_category=result.get("suggested_category"),
    )
