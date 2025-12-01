"""
Recommendations Router - AI-powered vehicle recommendations
Uses content-based filtering algorithm
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from app.routers.inventory import INVENTORY

router = APIRouter()


class RecommendationRequest(BaseModel):
    sessionId: Optional[str] = None
    viewedVehicles: List[str] = []


class PreferencesRequest(BaseModel):
    bodyStyle: Optional[str] = None
    priceMin: Optional[float] = None
    priceMax: Optional[float] = None
    fuelType: Optional[str] = None
    drivetrain: Optional[str] = None


def calculate_similarity_score(vehicle1: dict, vehicle2: dict) -> float:
    """
    Calculate similarity score between two vehicles using content-based filtering.
    Higher score = more similar.
    """
    score = 0.0
    max_score = 5.0
    
    # Same body style (weight: 1.5)
    if vehicle1["bodyStyle"] == vehicle2["bodyStyle"]:
        score += 1.5
    
    # Similar price range within 20% (weight: 1.0)
    price_diff = abs(vehicle1["price"] - vehicle2["price"])
    avg_price = (vehicle1["price"] + vehicle2["price"]) / 2
    if price_diff / avg_price < 0.2:
        score += 1.0
    elif price_diff / avg_price < 0.4:
        score += 0.5
    
    # Same fuel type (weight: 1.0)
    if vehicle1["fuelType"] == vehicle2["fuelType"]:
        score += 1.0
    
    # Same drivetrain (weight: 0.75)
    if vehicle1["drivetrain"] == vehicle2["drivetrain"]:
        score += 0.75
    
    # Overlapping features (weight: up to 0.75)
    features1 = set(vehicle1.get("features", []))
    features2 = set(vehicle2.get("features", []))
    if features1 and features2:
        overlap = len(features1 & features2) / max(len(features1), len(features2))
        score += overlap * 0.75
    
    return min(score / max_score, 1.0)


@router.get("/{vehicle_id}")
async def get_recommendations(
    vehicle_id: str,
    limit: int = Query(5, ge=1, le=10, description="Number of recommendations")
):
    """
    Get AI recommendations based on a specific vehicle.
    Uses content-based filtering to find similar vehicles.
    """
    # Find the source vehicle
    source_vehicle = next((v for v in INVENTORY if v["id"] == vehicle_id), None)
    if not source_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Calculate similarity scores for all other vehicles
    recommendations = []
    for vehicle in INVENTORY:
        if vehicle["id"] != vehicle_id:
            score = calculate_similarity_score(source_vehicle, vehicle)
            recommendations.append({
                **vehicle,
                "similarityScore": round(score, 2),
                "matchReason": get_match_reason(source_vehicle, vehicle)
            })
    
    # Sort by similarity score and return top results
    recommendations.sort(key=lambda x: x["similarityScore"], reverse=True)
    
    return {
        "sourceVehicle": source_vehicle,
        "recommendations": recommendations[:limit],
        "algorithm": "content-based-filtering",
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
    
    # Analyze preferences from viewed vehicles
    body_styles = {}
    fuel_types = {}
    avg_price = 0
    
    for v in viewed:
        body_styles[v["bodyStyle"]] = body_styles.get(v["bodyStyle"], 0) + 1
        fuel_types[v["fuelType"]] = fuel_types.get(v["fuelType"], 0) + 1
        avg_price += v["price"]
    
    avg_price = avg_price / len(viewed)
    preferred_body = max(body_styles, key=body_styles.get)
    preferred_fuel = max(fuel_types, key=fuel_types.get)
    
    # Score unviewed vehicles based on preferences
    candidates = [v for v in INVENTORY if v["id"] not in request.viewedVehicles]
    scored = []
    
    for v in candidates:
        score = 0
        if v["bodyStyle"] == preferred_body:
            score += 2
        if v["fuelType"] == preferred_fuel:
            score += 1
        # Price proximity
        price_diff = abs(v["price"] - avg_price) / avg_price
        score += max(0, 1 - price_diff)
        
        scored.append({**v, "preferenceScore": round(score, 2)})
    
    scored.sort(key=lambda x: x["preferenceScore"], reverse=True)
    
    return {
        "recommendations": scored[:5],
        "basedOn": "browsing_history",
        "preferences": {
            "bodyStyle": preferred_body,
            "fuelType": preferred_fuel,
            "avgPrice": round(avg_price, 0),
        }
    }


@router.post("/preferences")
async def get_recommendations_by_preferences(preferences: PreferencesRequest):
    """
    Get recommendations based on explicit customer preferences.
    """
    candidates = INVENTORY.copy()
    
    # Apply filters
    if preferences.bodyStyle:
        candidates = [v for v in candidates if v["bodyStyle"].lower() == preferences.bodyStyle.lower()]
    if preferences.fuelType:
        candidates = [v for v in candidates if v["fuelType"].lower() == preferences.fuelType.lower()]
    if preferences.drivetrain:
        candidates = [v for v in candidates if v["drivetrain"].lower() == preferences.drivetrain.lower()]
    if preferences.priceMin:
        candidates = [v for v in candidates if v["price"] >= preferences.priceMin]
    if preferences.priceMax:
        candidates = [v for v in candidates if v["price"] <= preferences.priceMax]
    
    # Sort by best value (savings)
    candidates.sort(
        key=lambda x: (x.get("msrp", x["price"]) - x["price"]),
        reverse=True
    )
    
    return {
        "recommendations": candidates[:10],
        "total": len(candidates),
        "filters": preferences.model_dump(exclude_none=True),
    }


def get_match_reason(source: dict, target: dict) -> str:
    """Generate human-readable match reason"""
    reasons = []
    
    if source["bodyStyle"] == target["bodyStyle"]:
        reasons.append(f"Same {target['bodyStyle']} body style")
    
    price_diff = abs(source["price"] - target["price"])
    if price_diff < 10000:
        reasons.append("Similar price range")
    
    if source["fuelType"] == target["fuelType"]:
        if target["fuelType"] == "Electric":
            reasons.append("Also electric")
        elif target["fuelType"] == "Hybrid":
            reasons.append("Also hybrid")
    
    if source["drivetrain"] == target["drivetrain"]:
        reasons.append(f"{target['drivetrain']} drivetrain")
    
    return reasons[0] if reasons else "Popular choice"
