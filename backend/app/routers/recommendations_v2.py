"""
Recommendations Router - AI-powered vehicle recommendations
Uses unified recommendation engine for consistent behavior across services
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.routers.inventory import INVENTORY
from app.core.recommendation_engine import VehicleRecommender, RecommendationResult

router = APIRouter()

# Initialize unified recommender
recommender = VehicleRecommender()


class RecommendationRequest(BaseModel):
    sessionId: Optional[str] = None
    viewedVehicles: List[str] = []


class PreferencesRequest(BaseModel):
    bodyStyle: Optional[str] = None
    priceMin: Optional[float] = None
    priceMax: Optional[float] = None
    fuelType: Optional[str] = None
    drivetrain: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Structured recommendation response with explainability"""
    vehicle: Dict[str, Any]
    similarityScore: float
    matchReason: str
    matchReasons: List[str]
    confidence: str
    featureContributions: Optional[Dict[str, float]] = None


def result_to_response(result: RecommendationResult) -> Dict[str, Any]:
    """Convert internal result to API response format"""
    return {
        **result.vehicle,
        "similarityScore": result.similarity_score,
        "matchReason": result.match_reasons[0] if result.match_reasons else "Popular choice",
        "matchReasons": result.match_reasons,
        "confidence": result.confidence,
        "featureContributions": result.feature_contributions,
    }


@router.get("/{vehicle_id}")
async def get_recommendations(
    vehicle_id: str,
    limit: int = Query(5, ge=1, le=10, description="Number of recommendations"),
    include_analytics: bool = Query(False, description="Include feature contribution data")
):
    """
    Get AI recommendations based on a specific vehicle.
    Uses unified content-based filtering engine.
    """
    # Find the source vehicle
    source_vehicle = next((v for v in INVENTORY if v["id"] == vehicle_id), None)
    if not source_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Get recommendations from unified engine
    results = recommender.recommend(
        source=source_vehicle,
        candidates=INVENTORY,
        limit=limit
    )
    
    # Convert to response format
    recommendations = []
    for result in results:
        rec = result_to_response(result)
        if not include_analytics:
            rec.pop("featureContributions", None)
        recommendations.append(rec)
    
    return {
        "sourceVehicle": source_vehicle,
        "recommendations": recommendations,
        "algorithm": "unified-content-filtering",
        "engineVersion": recommender.get_config().get("version", "1.0.0"),
    }


@router.post("/personalized")
async def get_personalized_recommendations(request: RecommendationRequest):
    """
    Get personalized recommendations based on browsing history.
    Analyzes viewed vehicles to find patterns.
    """
    if not request.viewedVehicles:
        # Return featured vehicles if no browsing history
        return {
            "recommendations": INVENTORY[:5],
            "basedOn": "featured",
        }
    
    # Get viewed vehicles
    viewed = [v for v in INVENTORY if v["id"] in request.viewedVehicles]
    if not viewed:
        return {
            "recommendations": INVENTORY[:5],
            "basedOn": "featured",
        }
    
    # Get personalized recommendations from unified engine
    results = recommender.recommend_personalized(
        viewed=viewed,
        candidates=INVENTORY,
        limit=5
    )
    
    # Analyze preferences for response
    body_styles = {}
    fuel_types = {}
    avg_price = 0
    
    for v in viewed:
        body_styles[v.get("bodyStyle", "unknown")] = body_styles.get(v.get("bodyStyle", "unknown"), 0) + 1
        fuel_types[v.get("fuelType", "unknown")] = fuel_types.get(v.get("fuelType", "unknown"), 0) + 1
        avg_price += v.get("price", 0)
    
    avg_price = avg_price / len(viewed) if viewed else 0
    preferred_body = max(body_styles, key=body_styles.get) if body_styles else None
    preferred_fuel = max(fuel_types, key=fuel_types.get) if fuel_types else None
    
    recommendations = [result_to_response(r) for r in results]
    
    return {
        "recommendations": recommendations,
        "basedOn": "browsing_history",
        "preferences": {
            "bodyStyle": preferred_body,
            "fuelType": preferred_fuel,
            "avgPrice": round(avg_price, 0),
        },
        "algorithm": "unified-personalized-filtering",
    }


@router.post("/preferences")
async def get_recommendations_by_preferences(preferences: PreferencesRequest):
    """
    Get recommendations based on explicit customer preferences.
    Combines filtering with similarity scoring.
    """
    candidates = INVENTORY.copy()
    
    # Apply hard filters first
    if preferences.bodyStyle:
        candidates = [v for v in candidates if v.get("bodyStyle", "").lower() == preferences.bodyStyle.lower()]
    if preferences.fuelType:
        candidates = [v for v in candidates if v.get("fuelType", "").lower() == preferences.fuelType.lower()]
    if preferences.drivetrain:
        candidates = [v for v in candidates if v.get("drivetrain", "").lower() == preferences.drivetrain.lower()]
    if preferences.priceMin:
        candidates = [v for v in candidates if v.get("price", 0) >= preferences.priceMin]
    if preferences.priceMax:
        candidates = [v for v in candidates if v.get("price", 0) <= preferences.priceMax]
    
    # If we have preferences, create a synthetic "ideal" vehicle for similarity scoring
    if preferences.bodyStyle or preferences.priceMin or preferences.priceMax:
        ideal_vehicle = {
            "bodyStyle": preferences.bodyStyle or "suv",
            "price": (preferences.priceMin or 30000 + preferences.priceMax or 60000) / 2 if preferences.priceMin or preferences.priceMax else 40000,
            "fuelType": preferences.fuelType or "gas",
            "drivetrain": preferences.drivetrain or "fwd",
            "features": [],
            "year": 2024,
            "mileage": 0,
        }
        
        results = recommender.recommend(
            source=ideal_vehicle,
            candidates=candidates,
            limit=10
        )
        
        recommendations = [result_to_response(r) for r in results]
    else:
        # No preferences - sort by value (savings)
        candidates.sort(
            key=lambda x: (x.get("msrp", x.get("price", 0)) - x.get("price", 0)),
            reverse=True
        )
        recommendations = candidates[:10]
    
    return {
        "recommendations": recommendations,
        "total": len(candidates),
        "filters": preferences.model_dump(exclude_none=True),
        "algorithm": "unified-preference-filtering",
    }


@router.get("/analytics/config")
async def get_recommender_config():
    """Get current recommender configuration (for debugging/tuning)"""
    return {
        "config": recommender.get_config(),
        "status": "active",
    }
