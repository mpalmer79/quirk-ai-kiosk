"""
Quirk AI Kiosk - FastAPI Backend Routes
Complete API endpoints for kiosk customer journey
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import httpx
import os

# Create router
router = APIRouter(prefix="/api", tags=["kiosk"])

# ============================================
# PYDANTIC MODELS
# ============================================

class VehicleFilter(BaseModel):
    model: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    body_type: Optional[str] = None
    drivetrain: Optional[str] = None
    cab_type: Optional[str] = None
    condition: Optional[str] = None
    sort_by: Optional[str] = "recommended"
    limit: Optional[int] = 50

class QuizPreferences(BaseModel):
    primary_use: Optional[str] = None
    passengers: Optional[str] = None
    mileage: Optional[str] = None
    trade_in: Optional[str] = None
    payment_type: Optional[str] = None
    monthly_payment: Optional[str] = None
    down_payment: Optional[str] = None
    features: Optional[List[str]] = None
    timeline: Optional[str] = None
    rebates: Optional[str] = None

class TradeInRequest(BaseModel):
    year: int
    make: str
    model: str
    trim: Optional[str] = None
    mileage: int
    condition: str
    vin: Optional[str] = None

class LeaseCalculation(BaseModel):
    vehicle_price: float
    msrp: float
    term: int = 39
    miles_per_year: int = 12000
    down_payment: float = 0
    trade_equity: float = 0
    tax_rate: float = 0.0625

class FinanceCalculation(BaseModel):
    vehicle_price: float
    term: int = 72
    apr: float = 6.9
    down_payment: float = 0
    trade_equity: float = 0
    tax_rate: float = 0.0625

class LeadSubmission(BaseModel):
    phone: str
    name: Optional[str] = None
    vehicle: Optional[Dict[str, Any]] = None
    payment_preference: Optional[Dict[str, Any]] = None
    trade_in: Optional[Dict[str, Any]] = None
    quiz_answers: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None

class TestDriveRequest(BaseModel):
    phone: str
    name: Optional[str] = None
    vehicle_stock: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None

# ============================================
# INVENTORY ENDPOINTS
# ============================================

@router.get("/inventory")
async def get_inventory(
    model: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    body_type: Optional[str] = None,
    drivetrain: Optional[str] = None,
    cab_type: Optional[str] = None,
    condition: Optional[str] = None,
    sort_by: str = "recommended",
    limit: int = 50
):
    """Get inventory with optional filters"""
    try:
        # Import inventory data from existing inventory module
        from inventory import get_inventory_data
        vehicles = get_inventory_data()
        
        # Apply filters
        filtered = vehicles
        
        if model:
            filtered = [v for v in filtered if model.lower() in v.get('model', '').lower()]
        
        if min_price:
            filtered = [v for v in filtered if v.get('salePrice', 0) >= min_price]
        
        if max_price:
            filtered = [v for v in filtered if v.get('salePrice', float('inf')) <= max_price]
        
        if body_type:
            filtered = [v for v in filtered if v.get('bodyType', '').lower() == body_type.lower()]
        
        if drivetrain:
            filtered = [v for v in filtered if drivetrain.lower() in v.get('drivetrain', '').lower()]
        
        if condition:
            filtered = [v for v in filtered if v.get('condition', '').lower() == condition.lower()]
        
        # Sort
        if sort_by == "priceLow":
            filtered.sort(key=lambda x: x.get('salePrice', 0))
        elif sort_by == "priceHigh":
            filtered.sort(key=lambda x: x.get('salePrice', 0), reverse=True)
        elif sort_by == "newest":
            filtered.sort(key=lambda x: x.get('year', 0), reverse=True)
        
        # Limit results
        filtered = filtered[:limit]
        
        return {"vehicles": filtered, "total": len(filtered)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inventory/stock/{stock_number}")
async def get_vehicle_by_stock(stock_number: str):
    """Get vehicle by stock number"""
    try:
        from inventory import get_inventory_data
        vehicles = get_inventory_data()
        
        vehicle = next(
            (v for v in vehicles if str(v.get('stockNumber', '')).lower() == stock_number.lower()),
            None
        )
        
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        return vehicle
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inventory/vin/{vin}")
async def get_vehicle_by_vin(vin: str):
    """Get vehicle by VIN"""
    try:
        from inventory import get_inventory_data
        vehicles = get_inventory_data()
        
        vehicle = next(
            (v for v in vehicles if v.get('vin', '').upper() == vin.upper()),
            None
        )
        
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        return vehicle
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inventory/search")
async def search_by_preferences(preferences: QuizPreferences):
    """Search inventory based on quiz preferences"""
    try:
        from inventory import get_inventory_data
        vehicles = get_inventory_data()
        
        scored_vehicles = []
        
        for vehicle in vehicles:
            score = calculate_match_score(vehicle, preferences)
            if score > 0:
                vehicle_copy = vehicle.copy()
                vehicle_copy['matchScore'] = score
                scored_vehicles.append(vehicle_copy)
        
        # Sort by match score
        scored_vehicles.sort(key=lambda x: x['matchScore'], reverse=True)
        
        return {"vehicles": scored_vehicles[:20], "total": len(scored_vehicles)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_match_score(vehicle: Dict, preferences: QuizPreferences) -> int:
    """Calculate how well a vehicle matches customer preferences"""
    score = 50  # Base score
    
    # Primary use matching
    if preferences.primary_use:
        body_type = vehicle.get('bodyType', '').lower()
        if preferences.primary_use == 'commute' and body_type in ['sedan', 'compact suv']:
            score += 15
        elif preferences.primary_use == 'family' and body_type in ['suv', 'minivan', '3-row suv']:
            score += 15
        elif preferences.primary_use == 'work' and body_type in ['truck', 'heavy duty']:
            score += 15
        elif preferences.primary_use == 'weekend' and body_type in ['sports car', 'convertible']:
            score += 15
    
    # Passenger capacity
    if preferences.passengers:
        seats = vehicle.get('seatingCapacity', 5)
        if preferences.passengers == '1' and seats <= 4:
            score += 10
        elif preferences.passengers == '2-4' and 4 <= seats <= 5:
            score += 10
        elif preferences.passengers == '5+' and seats >= 6:
            score += 10
        elif preferences.passengers == '3rdRow' and seats >= 7:
            score += 15
    
    # Monthly payment matching
    if preferences.monthly_payment:
        # Estimate monthly payment
        price = vehicle.get('salePrice', 50000)
        est_monthly = price / 72  # Rough estimate
        
        if preferences.monthly_payment == 'under400' and est_monthly < 500:
            score += 10
        elif preferences.monthly_payment == '400-600' and 400 <= est_monthly <= 700:
            score += 10
        elif preferences.monthly_payment == '600-800' and 600 <= est_monthly <= 900:
            score += 10
        elif preferences.monthly_payment == 'over800' and est_monthly > 800:
            score += 10
    
    # Features matching
    if preferences.features:
        vehicle_features = [f.lower() for f in vehicle.get('features', [])]
        for feature in preferences.features:
            if any(feature.lower() in f for f in vehicle_features):
                score += 5
    
    return min(score, 100)  # Cap at 100


@router.get("/inventory/stats")
async def get_inventory_stats():
    """Get inventory statistics"""
    try:
        from inventory import get_inventory_data
        vehicles = get_inventory_data()
        
        total = len(vehicles)
        suvs = len([v for v in vehicles if 'suv' in v.get('bodyType', '').lower()])
        trucks = len([v for v in vehicles if 'truck' in v.get('bodyType', '').lower()])
        sedans = len([v for v in vehicles if 'sedan' in v.get('bodyType', '').lower()])
        
        prices = [v.get('salePrice', 0) for v in vehicles if v.get('salePrice')]
        min_price = min(prices) if prices else 0
        
        return {
            "total": total,
            "suvs": suvs,
            "trucks": trucks,
            "sedans": sedans,
            "startingAt": min_price
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# TRADE-IN ENDPOINTS
# ============================================

@router.post("/trade-in/estimate")
async def get_trade_in_estimate(request: TradeInRequest):
    """Get trade-in value estimate"""
    try:
        # Base values by age
        current_year = datetime.now().year
        age = current_year - request.year
        
        base_values = {
            0: 35000, 1: 30000, 2: 26000, 3: 23000, 4: 20000,
            5: 17500, 6: 15000, 7: 13000, 8: 11000, 9: 9500, 10: 8000
        }
        
        base_value = base_values.get(age, 6000)
        
        # Condition multipliers
        condition_multipliers = {
            'excellent': 1.10,
            'good': 1.00,
            'fair': 0.85,
            'poor': 0.65
        }
        
        condition_mult = condition_multipliers.get(request.condition.lower(), 1.0)
        
        # Mileage adjustment
        avg_miles_per_year = 12000
        expected_miles = age * avg_miles_per_year
        mile_diff = expected_miles - request.mileage
        mileage_adjustment = mile_diff * 0.05  # $0.05 per mile difference
        
        # Calculate estimate
        estimated_value = (base_value + mileage_adjustment) * condition_mult
        estimated_value = max(estimated_value, 1000)  # Minimum $1000
        
        low_value = int(estimated_value * 0.90)
        mid_value = int(estimated_value)
        high_value = int(estimated_value * 1.10)
        
        return {
            "low": low_value,
            "mid": mid_value,
            "high": high_value,
            "vehicle": {
                "year": request.year,
                "make": request.make,
                "model": request.model,
                "mileage": request.mileage,
                "condition": request.condition
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trade-in/decode/{vin}")
async def decode_trade_in_vin(vin: str):
    """Decode VIN using NHTSA API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json"
            )
            data = response.json()
        
        results = data.get('Results', [])
        
        decoded = {}
        for item in results:
            var = item.get('Variable', '')
            val = item.get('Value', '')
            if val and val != 'Not Applicable':
                if var == 'Model Year':
                    decoded['year'] = int(val)
                elif var == 'Make':
                    decoded['make'] = val
                elif var == 'Model':
                    decoded['model'] = val
                elif var == 'Trim':
                    decoded['trim'] = val
                elif var == 'Body Class':
                    decoded['bodyType'] = val
        
        return decoded
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trade-in/appraisal")
async def request_appraisal(request: TradeInRequest, background_tasks: BackgroundTasks):
    """Request in-person appraisal"""
    # Queue notification to sales team
    background_tasks.add_task(notify_appraisal_request, request)
    
    return {
        "status": "scheduled",
        "message": "A manager will appraise your vehicle while you browse",
        "vehicle": f"{request.year} {request.make} {request.model}"
    }


async def notify_appraisal_request(request: TradeInRequest):
    """Send notification for appraisal request"""
    # TODO: Integrate with Slack/SMS notification service
    print(f"Appraisal requested: {request.year} {request.make} {request.model}")


# ============================================
# PAYMENT CALCULATION ENDPOINTS
# ============================================

@router.post("/payments/lease")
async def calculate_lease(params: LeaseCalculation):
    """Calculate lease payment"""
    try:
        # Lease calculation
        capitalized_cost = params.vehicle_price - params.down_payment - params.trade_equity
        
        # Residual value based on term
        residual_percents = {24: 0.72, 36: 0.65, 39: 0.58, 48: 0.50}
        residual_percent = residual_percents.get(params.term, 0.55)
        residual_value = params.msrp * residual_percent
        
        # Money factor (roughly APR / 2400)
        money_factor = 0.00125  # ~3% APR equivalent
        
        # Monthly payment components
        depreciation = (capitalized_cost - residual_value) / params.term
        rent_charge = (capitalized_cost + residual_value) * money_factor
        monthly_pretax = depreciation + rent_charge
        
        # Tax on monthly payment
        monthly_payment = monthly_pretax * (1 + params.tax_rate)
        
        # Due at signing
        first_payment = monthly_payment
        acquisition_fee = 895
        due_at_signing = params.down_payment + first_payment + acquisition_fee
        
        return {
            "monthly": round(monthly_payment),
            "dueAtSigning": round(due_at_signing),
            "residualValue": round(residual_value),
            "totalCost": round(monthly_payment * params.term + params.down_payment),
            "term": params.term,
            "milesPerYear": params.miles_per_year
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payments/finance")
async def calculate_finance(params: FinanceCalculation):
    """Calculate finance payment"""
    try:
        # Add tax to principal
        tax_amount = params.vehicle_price * params.tax_rate
        principal = params.vehicle_price + tax_amount - params.down_payment - params.trade_equity
        
        # Monthly payment calculation
        monthly_rate = params.apr / 100 / 12
        
        if monthly_rate > 0:
            payment = principal * (monthly_rate * (1 + monthly_rate) ** params.term) / \
                     ((1 + monthly_rate) ** params.term - 1)
        else:
            payment = principal / params.term
        
        total_cost = payment * params.term + params.down_payment
        total_interest = total_cost - params.vehicle_price - tax_amount
        
        return {
            "monthly": round(payment),
            "totalCost": round(total_cost),
            "totalInterest": round(max(0, total_interest)),
            "term": params.term,
            "apr": params.apr
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payments/rebates/{vehicle_id}")
async def get_rebates(vehicle_id: str):
    """Get available rebates for a vehicle"""
    # Mock rebates - integrate with GM incentives API in production
    rebates = [
        {"name": "Customer Cash", "amount": 2500, "description": "Factory rebate"},
        {"name": "Bonus Cash", "amount": 1500, "description": "Limited time offer"},
        {"name": "Conquest Bonus", "amount": 1000, "description": "Competitive owner bonus"},
    ]
    
    return {"rebates": rebates, "totalSavings": sum(r["amount"] for r in rebates)}


# ============================================
# LEAD / HANDOFF ENDPOINTS
# ============================================

@router.post("/leads/handoff")
async def submit_lead(lead: LeadSubmission, background_tasks: BackgroundTasks):
    """Submit customer lead and notify sales team"""
    try:
        # Generate lead ID
        lead_id = f"KIOSK-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Queue notifications
        background_tasks.add_task(notify_sales_team, lead, lead_id)
        background_tasks.add_task(send_customer_sms, lead.phone, lead_id)
        
        # Estimate wait time (2-5 minutes)
        import random
        wait_time = random.randint(2, 5)
        
        return {
            "status": "success",
            "leadId": lead_id,
            "estimatedWait": wait_time,
            "message": "A team member has been notified"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def notify_sales_team(lead: LeadSubmission, lead_id: str):
    """Send notification to sales team via Slack/SMS"""
    # Build notification message
    vehicle_info = ""
    if lead.vehicle:
        vehicle_info = f"{lead.vehicle.get('year', '')} {lead.vehicle.get('model', '')} (Stock #{lead.vehicle.get('stockNumber', '')})"
    
    message = f"""
🚗 NEW KIOSK LEAD: {lead_id}
📱 Phone: {lead.phone}
👤 Name: {lead.name or 'Not provided'}
🚙 Interest: {vehicle_info or 'Browsing'}
"""
    
    if lead.payment_preference:
        message += f"💰 Payment: ${lead.payment_preference.get('monthly', 'N/A')}/mo ({lead.payment_preference.get('type', 'N/A')})\n"
    
    if lead.trade_in:
        message += f"🔄 Trade: {lead.trade_in.get('year', '')} {lead.trade_in.get('make', '')} {lead.trade_in.get('model', '')}\n"
    
    # TODO: Send to Slack webhook
    slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
    if slack_webhook:
        async with httpx.AsyncClient() as client:
            await client.post(slack_webhook, json={"text": message})
    
    print(message)  # Log for now


async def send_customer_sms(phone: str, lead_id: str):
    """Send confirmation SMS to customer"""
    # TODO: Integrate with Twilio or similar
    message = f"Thanks for visiting Quirk Chevrolet! A team member will be with you shortly. Ref: {lead_id}"
    print(f"SMS to {phone}: {message}")


@router.post("/leads/test-drive")
async def schedule_test_drive(request: TestDriveRequest, background_tasks: BackgroundTasks):
    """Schedule a test drive"""
    try:
        background_tasks.add_task(notify_test_drive, request)
        
        return {
            "status": "scheduled",
            "message": "Test drive request submitted",
            "vehicle": request.vehicle_stock
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def notify_test_drive(request: TestDriveRequest):
    """Notify team of test drive request"""
    print(f"Test drive requested: {request.vehicle_stock} for {request.phone}")


@router.post("/leads/send-summary")
async def send_deal_summary(phone: str, deal_data: Dict[str, Any]):
    """Send deal summary via SMS"""
    # TODO: Integrate with SMS service
    return {"status": "sent", "phone": phone}


# ============================================
# VEHICLE DATA ENDPOINTS
# ============================================

@router.get("/vehicles/makes")
async def get_makes():
    """Get available makes for trade-in"""
    makes = [
        "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
        "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jeep", "Kia",
        "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Nissan", "Ram", "Subaru",
        "Tesla", "Toyota", "Volkswagen", "Volvo"
    ]
    return {"makes": makes}


@router.get("/vehicles/models/{make}")
async def get_models(make: str):
    """Get models for a make"""
    models_by_make = {
        "Honda": ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot", "Ridgeline"],
        "Toyota": ["4Runner", "Camry", "Corolla", "Highlander", "RAV4", "Tacoma", "Tundra"],
        "Ford": ["Bronco", "Edge", "Escape", "Explorer", "F-150", "Maverick", "Mustang", "Ranger"],
        "Chevrolet": ["Blazer", "Camaro", "Colorado", "Corvette", "Equinox", "Malibu", "Silverado", "Tahoe", "Traverse"],
    }
    
    models = models_by_make.get(make, ["Model 1", "Model 2", "Model 3"])
    return {"models": models}


@router.get("/vehicles/trims")
async def get_trims(make: str, model: str, year: int):
    """Get trims for a vehicle"""
    # Generic trims - could integrate with vehicle data API
    trims = ["Base", "LE", "SE", "XLE", "Limited", "Sport", "Premium"]
    return {"trims": trims}


# ============================================
# KIOSK UTILITIES
# ============================================

@router.post("/kiosk/analytics")
async def log_analytics(event: str, data: Dict[str, Any] = {}, session_id: str = None):
    """Log kiosk analytics event"""
    # TODO: Store in database or send to analytics service
    print(f"Analytics: {event} | Session: {session_id} | Data: {data}")
    return {"status": "logged"}


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "quirk-kiosk-api"
    }
