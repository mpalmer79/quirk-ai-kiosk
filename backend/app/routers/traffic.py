"""
Traffic Router - Kiosk Session Tracking
Logs customer interactions for internal dashboard

All timestamps stored and displayed in Eastern Time (America/New_York)
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import json
import os

router = APIRouter()

# File-based storage for persistence
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
TRAFFIC_LOG_FILE = os.path.join(DATA_DIR, 'traffic_log.json')

# Eastern Time offset (EST = UTC-5, EDT = UTC-4)
# For simplicity, using EST. In production, use pytz for DST handling.
EST_OFFSET = timedelta(hours=-5)

# Active session timeout (minutes)
ACTIVE_SESSION_TIMEOUT = 30


def get_eastern_time() -> datetime:
    """Get current time in Eastern Time."""
    utc_now = datetime.now(timezone.utc)
    # Simple EST offset - in production use pytz for DST
    est_now = utc_now + EST_OFFSET
    return est_now


def get_eastern_date_str() -> str:
    """Get current date string in Eastern Time (YYYY-MM-DD)."""
    return get_eastern_time().strftime('%Y-%m-%d')


def format_eastern_timestamp() -> str:
    """Get ISO format timestamp in Eastern Time."""
    return get_eastern_time().strftime('%Y-%m-%dT%H:%M:%S') + '-05:00'


def parse_timestamp(ts_str: str) -> datetime:
    """Parse a timestamp string into datetime."""
    try:
        # Handle ISO format with timezone
        if '+' in ts_str or ts_str.endswith('Z'):
            return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
        elif '-05:00' in ts_str:
            return datetime.fromisoformat(ts_str)
        else:
            return datetime.fromisoformat(ts_str)
    except:
        return datetime.now()


def load_traffic_log() -> List[Dict]:
    """Load traffic log from JSON file."""
    try:
        if os.path.exists(TRAFFIC_LOG_FILE):
            with open(TRAFFIC_LOG_FILE, 'r') as f:
                data = json.load(f)
                print(f"Loaded {len(data)} sessions from traffic log")
                return data
    except Exception as e:
        print(f"Error loading traffic log: {e}")
    return []


def save_traffic_log(data: List[Dict]):
    """Save traffic log to JSON file."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(TRAFFIC_LOG_FILE, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        print(f"Saved {len(data)} sessions to traffic log")
    except Exception as e:
        print(f"Error saving traffic log: {e}")


# In-memory cache (synced with file)
traffic_sessions = load_traffic_log()


# ============ Models ============

class VehicleInfo(BaseModel):
    stockNumber: Optional[str] = None
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    trim: Optional[str] = None
    msrp: Optional[float] = None
    salePrice: Optional[float] = None


class TradeInVehicle(BaseModel):
    """Trade-in vehicle details (Year/Make/Model/Mileage)"""
    year: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    mileage: Optional[int] = None


class TradeInInfo(BaseModel):
    """Full trade-in info including vehicle and payoff details"""
    hasTrade: Optional[bool] = None
    vehicle: Optional[TradeInVehicle] = None
    hasPayoff: Optional[bool] = None
    payoffAmount: Optional[float] = None
    monthlyPayment: Optional[float] = None
    financedWith: Optional[str] = None
    # Legacy fields for backward compatibility
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    mileage: Optional[int] = None
    condition: Optional[str] = None
    estimatedValue: Optional[float] = None


class PaymentInfo(BaseModel):
    type: Optional[str] = None  # 'lease' or 'finance'
    monthly: Optional[float] = None
    term: Optional[int] = None
    downPayment: Optional[float] = None


class BudgetInfo(BaseModel):
    """Budget range info for 4-square"""
    min: Optional[int] = None
    max: Optional[int] = None
    downPaymentPercent: Optional[int] = None


class VehicleInterest(BaseModel):
    """Vehicle interest from ModelBudgetSelector"""
    model: Optional[str] = None
    cab: Optional[str] = None
    colors: Optional[List[str]] = None


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None


class SessionCreate(BaseModel):
    sessionId: Optional[str] = None
    customerName: Optional[str] = None
    phone: Optional[str] = None
    path: Optional[str] = None  # stockLookup, modelBudget, guidedQuiz, browse, aiChat
    currentStep: Optional[str] = None  # Current step in journey
    vehicle: Optional[VehicleInfo] = None
    vehicleInterest: Optional[VehicleInterest] = None  # New: model/cab/colors
    budget: Optional[BudgetInfo] = None  # New: budget range
    tradeIn: Optional[TradeInInfo] = None
    payment: Optional[PaymentInfo] = None
    vehicleRequested: Optional[bool] = False
    quizAnswers: Optional[Dict[str, Any]] = None
    actions: Optional[List[str]] = None  # List of actions taken
    chatHistory: Optional[List[ChatMessage]] = None  # AI chat conversation


class SessionResponse(BaseModel):
    sessionId: str
    status: str
    message: str


class TrafficLogEntry(BaseModel):
    sessionId: str
    customerName: Optional[str]
    phone: Optional[str]
    path: Optional[str]
    currentStep: Optional[str]
    vehicle: Optional[Dict]
    vehicleInterest: Optional[Dict]
    budget: Optional[Dict]
    tradeIn: Optional[Dict]
    payment: Optional[Dict]
    vehicleRequested: bool
    actions: List[str]
    chatHistory: Optional[List[Dict]]
    createdAt: str
    updatedAt: str


# ============ Helper Functions ============

def format_session_for_dashboard(session: Dict) -> Dict:
    """Format a session for the Sales Manager Dashboard 4-square view."""
    trade_in = session.get('tradeIn') or {}
    vehicle_interest = session.get('vehicleInterest') or {}
    budget = session.get('budget') or {}
    selected_vehicle = session.get('vehicle')
    
    return {
        'sessionId': session.get('sessionId'),
        'customerName': session.get('customerName'),
        'phone': session.get('phone'),
        'startTime': session.get('createdAt'),
        'lastActivity': session.get('updatedAt'),
        'currentStep': session.get('currentStep') or session.get('path') or 'browsing',
        'vehicleInterest': {
            'model': vehicle_interest.get('model'),
            'cab': vehicle_interest.get('cab'),
            'colors': vehicle_interest.get('colors') or [],
        },
        'budget': {
            'min': budget.get('min'),
            'max': budget.get('max'),
            'downPaymentPercent': budget.get('downPaymentPercent'),
        },
        'tradeIn': {
            'hasTrade': trade_in.get('hasTrade'),
            'vehicle': trade_in.get('vehicle') if trade_in.get('vehicle') else (
                # Backward compatibility with old format
                {
                    'year': str(trade_in.get('year')) if trade_in.get('year') else None,
                    'make': trade_in.get('make'),
                    'model': trade_in.get('model'),
                    'mileage': trade_in.get('mileage'),
                } if trade_in.get('year') or trade_in.get('make') else None
            ),
            'hasPayoff': trade_in.get('hasPayoff'),
            'payoffAmount': trade_in.get('payoffAmount'),
            'monthlyPayment': trade_in.get('monthlyPayment'),
            'financedWith': trade_in.get('financedWith'),
        },
        'selectedVehicle': {
            'stockNumber': selected_vehicle.get('stockNumber'),
            'year': selected_vehicle.get('year'),
            'make': selected_vehicle.get('make'),
            'model': selected_vehicle.get('model'),
            'trim': selected_vehicle.get('trim'),
            'price': selected_vehicle.get('salePrice') or selected_vehicle.get('msrp'),
        } if selected_vehicle else None,
    }


# ============ Endpoints ============

@router.post("/session", response_model=SessionResponse)
async def create_or_update_session(session: SessionCreate):
    """
    Create or update a kiosk session.
    Called when customer completes key actions.
    All timestamps are in Eastern Time.
    """
    global traffic_sessions
    
    session_id = session.sessionId or str(uuid.uuid4())[:12].upper()
    now = format_eastern_timestamp()
    
    # Find existing session or create new
    existing_idx = None
    for idx, s in enumerate(traffic_sessions):
        if s.get('sessionId') == session_id:
            existing_idx = idx
            break
    
    session_data = {
        'sessionId': session_id,
        'customerName': session.customerName,
        'phone': session.phone,
        'path': session.path,
        'currentStep': session.currentStep,
        'vehicle': session.vehicle.dict() if session.vehicle else None,
        'vehicleInterest': session.vehicleInterest.dict() if session.vehicleInterest else None,
        'budget': session.budget.dict() if session.budget else None,
        'tradeIn': session.tradeIn.dict() if session.tradeIn else None,
        'payment': session.payment.dict() if session.payment else None,
        'vehicleRequested': session.vehicleRequested or False,
        'quizAnswers': session.quizAnswers,
        'actions': session.actions or [],
        'chatHistory': [msg.dict() for msg in session.chatHistory] if session.chatHistory else None,
        'updatedAt': now,
    }
    
    if existing_idx is not None:
        # Update existing - merge data
        existing = traffic_sessions[existing_idx]
        session_data['createdAt'] = existing.get('createdAt', now)
        
        # Merge actions
        existing_actions = existing.get('actions', [])
        new_actions = session.actions or []
        session_data['actions'] = list(dict.fromkeys(existing_actions + new_actions))
        
        # Merge chat history - append new messages
        existing_chat = existing.get('chatHistory') or []
        new_chat = [msg.dict() for msg in session.chatHistory] if session.chatHistory else []
        if new_chat:
            # Only add messages that aren't already in the history
            existing_contents = {(m.get('role'), m.get('content')) for m in existing_chat}
            for msg in new_chat:
                if (msg.get('role'), msg.get('content')) not in existing_contents:
                    existing_chat.append(msg)
            session_data['chatHistory'] = existing_chat
        else:
            session_data['chatHistory'] = existing_chat if existing_chat else None
        
        # Keep non-null values from existing if new value is null
        for key in ['customerName', 'phone', 'path', 'currentStep', 'vehicle', 'vehicleInterest', 'budget', 'tradeIn', 'payment']:
            if session_data.get(key) is None and existing.get(key) is not None:
                session_data[key] = existing[key]
        
        traffic_sessions[existing_idx] = session_data
    else:
        session_data['createdAt'] = now
        traffic_sessions.append(session_data)
    
    # Persist to file
    save_traffic_log(traffic_sessions)
    
    return SessionResponse(
        sessionId=session_id,
        status="success",
        message="Session logged successfully"
    )


@router.get("/active")
async def get_active_sessions(
    timeout_minutes: int = Query(ACTIVE_SESSION_TIMEOUT, ge=1, le=120),
):
    """
    Get active kiosk sessions for Sales Manager Dashboard.
    Returns sessions that have been updated within the timeout period.
    Formatted for the 4-square worksheet view.
    """
    global traffic_sessions
    traffic_sessions = load_traffic_log()
    
    now = get_eastern_time()
    cutoff = now - timedelta(minutes=timeout_minutes)
    
    active = []
    for session in traffic_sessions:
        updated_at = session.get('updatedAt', session.get('createdAt', ''))
        if updated_at:
            try:
                session_time = parse_timestamp(updated_at)
                # Remove timezone info for comparison if needed
                if session_time.tzinfo:
                    session_time = session_time.replace(tzinfo=None)
                cutoff_naive = cutoff.replace(tzinfo=None)
                
                if session_time >= cutoff_naive:
                    active.append(format_session_for_dashboard(session))
            except Exception as e:
                print(f"Error parsing timestamp: {e}")
                continue
    
    # Sort by most recent activity first
    active.sort(key=lambda x: x.get('lastActivity', ''), reverse=True)
    
    return {
        "sessions": active,
        "count": len(active),
        "timeout_minutes": timeout_minutes,
        "server_time": format_eastern_timestamp(),
        "timezone": "America/New_York"
    }


@router.get("/log")
async def get_traffic_log(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    filter_today: bool = Query(False, description="Filter to today's sessions only"),
):
    """
    Get traffic log entries for admin dashboard.
    Returns most recent sessions first.
    All timestamps are in Eastern Time.
    """
    global traffic_sessions
    
    # Reload from file to get latest
    traffic_sessions = load_traffic_log()
    
    # Filter by date if provided
    filtered = traffic_sessions
    
    # Filter to today only if requested
    if filter_today:
        today = get_eastern_date_str()
        filtered = [s for s in filtered if s.get('createdAt', '').startswith(today)]
    
    if date_from:
        filtered = [s for s in filtered if s.get('createdAt', '') >= date_from]
    
    if date_to:
        filtered = [s for s in filtered if s.get('createdAt', '') <= date_to]
    
    # Sort by most recent first
    sorted_sessions = sorted(
        filtered,
        key=lambda x: x.get('updatedAt', x.get('createdAt', '')),
        reverse=True
    )
    
    # Paginate
    paginated = sorted_sessions[offset:offset + limit]
    
    return {
        "total": len(filtered),
        "limit": limit,
        "offset": offset,
        "sessions": paginated,
        "timezone": "America/New_York",
        "server_time": format_eastern_timestamp()
    }


@router.get("/log/{session_id}")
async def get_session_detail(session_id: str):
    """Get details for a specific session including chat history."""
    global traffic_sessions
    traffic_sessions = load_traffic_log()
    
    for session in traffic_sessions:
        if session.get('sessionId') == session_id:
            return session
    
    return {"error": "Session not found"}


@router.get("/dashboard/{session_id}")
async def get_session_for_dashboard(session_id: str):
    """Get a single session formatted for the 4-square dashboard view."""
    global traffic_sessions
    traffic_sessions = load_traffic_log()
    
    for session in traffic_sessions:
        if session.get('sessionId') == session_id:
            return format_session_for_dashboard(session)
    
    return {"error": "Session not found"}


@router.get("/stats")
async def get_traffic_stats():
    """
    Get traffic statistics for dashboard.
    Uses Eastern Time for 'today' calculation.
    """
    global traffic_sessions
    traffic_sessions = load_traffic_log()
    
    total = len(traffic_sessions)
    
    # Count by path
    by_path = {}
    # Count with vehicle selected
    with_vehicle = 0
    # Count with trade-in
    with_trade = 0
    # Count with vehicle requested
    vehicle_requests = 0
    # Count with phone (completed handoff)
    completed = 0
    # Count with chat history
    with_chat = 0
    
    # Today's sessions (in Eastern Time)
    today = get_eastern_date_str()
    today_count = 0
    
    # Active sessions count (last 30 min)
    now = get_eastern_time()
    active_cutoff = now - timedelta(minutes=ACTIVE_SESSION_TIMEOUT)
    active_count = 0
    
    for session in traffic_sessions:
        path = session.get('path') or 'unknown'
        by_path[path] = by_path.get(path, 0) + 1
        
        if session.get('vehicle'):
            with_vehicle += 1
        
        if session.get('tradeIn'):
            with_trade += 1
        
        if session.get('vehicleRequested'):
            vehicle_requests += 1
        
        if session.get('phone'):
            completed += 1
        
        if session.get('chatHistory'):
            with_chat += 1
        
        created = session.get('createdAt', '')
        if created.startswith(today):
            today_count += 1
        
        # Check if active
        updated_at = session.get('updatedAt', created)
        if updated_at:
            try:
                session_time = parse_timestamp(updated_at)
                if session_time.tzinfo:
                    session_time = session_time.replace(tzinfo=None)
                active_cutoff_naive = active_cutoff.replace(tzinfo=None)
                if session_time >= active_cutoff_naive:
                    active_count += 1
            except:
                pass
    
    return {
        "total_sessions": total,
        "active_now": active_count,
        "today": today_count,
        "today_date": today,
        "by_path": by_path,
        "with_vehicle_selected": with_vehicle,
        "with_trade_in": with_trade,
        "vehicle_requests": vehicle_requests,
        "completed_handoffs": completed,
        "with_ai_chat": with_chat,
        "conversion_rate": round((completed / total * 100), 1) if total > 0 else 0,
        "timezone": "America/New_York",
        "server_time": format_eastern_timestamp()
    }


@router.delete("/log/{session_id}")
async def delete_session(session_id: str):
    """Delete a session (admin only)."""
    global traffic_sessions
    traffic_sessions = load_traffic_log()
    
    original_len = len(traffic_sessions)
    traffic_sessions = [s for s in traffic_sessions if s.get('sessionId') != session_id]
    
    if len(traffic_sessions) < original_len:
        save_traffic_log(traffic_sessions)
        return {"status": "deleted", "sessionId": session_id}
    
    return {"error": "Session not found"}


@router.delete("/log")
async def clear_traffic_log():
    """Clear all traffic log entries (admin only - use with caution)."""
    global traffic_sessions
    traffic_sessions = []
    save_traffic_log(traffic_sessions)
    return {"status": "cleared", "message": "All traffic log entries deleted"}
