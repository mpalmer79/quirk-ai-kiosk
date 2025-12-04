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


class TradeInInfo(BaseModel):
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


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None


class SessionCreate(BaseModel):
    sessionId: Optional[str] = None
    customerName: Optional[str] = None
    phone: Optional[str] = None
    path: Optional[str] = None  # stockLookup, modelBudget, guidedQuiz, browse, aiChat
    vehicle: Optional[VehicleInfo] = None
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
    vehicle: Optional[Dict]
    tradeIn: Optional[Dict]
    payment: Optional[Dict]
    vehicleRequested: bool
    actions: List[str]
    chatHistory: Optional[List[Dict]]
    createdAt: str
    updatedAt: str


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
        'vehicle': session.vehicle.dict() if session.vehicle else None,
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
        for key in ['customerName', 'phone', 'path', 'vehicle', 'tradeIn', 'payment']:
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
    
    return {
        "total_sessions": total,
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
