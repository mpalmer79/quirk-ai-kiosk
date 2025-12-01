"""
Analytics Router - Kiosk telemetry and usage tracking
Tracks user interactions, vehicle views, and session data
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

router = APIRouter()


class ViewEvent(BaseModel):
    vehicleId: str
    sessionId: str


class InteractionEvent(BaseModel):
    eventType: str
    eventData: Optional[Dict[str, Any]] = None
    sessionId: str
    timestamp: Optional[str] = None


class SessionStart(BaseModel):
    kioskId: str


class SessionEnd(BaseModel):
    sessionId: str


# In-memory analytics storage (would be database/analytics service in production)
sessions = {}
events = []
vehicle_views = {}


@router.post("/session/start")
async def start_session(request: SessionStart):
    """
    Start a new kiosk session when a user touches the screen.
    """
    session_id = str(uuid.uuid4())
    
    sessions[session_id] = {
        "id": session_id,
        "kiosk_id": request.kioskId,
        "started_at": datetime.utcnow().isoformat(),
        "ended_at": None,
        "vehicle_views": [],
        "interactions": 0,
    }
    
    return {
        "sessionId": session_id,
        "kioskId": request.kioskId,
        "startedAt": sessions[session_id]["started_at"],
    }


@router.post("/session/end")
async def end_session(request: SessionEnd):
    """
    End a kiosk session (user inactive or explicitly ended).
    """
    if request.sessionId in sessions:
        sessions[request.sessionId]["ended_at"] = datetime.utcnow().isoformat()
        
        # Calculate session duration
        start = datetime.fromisoformat(sessions[request.sessionId]["started_at"])
        end = datetime.fromisoformat(sessions[request.sessionId]["ended_at"])
        duration = (end - start).total_seconds()
        sessions[request.sessionId]["duration_seconds"] = duration
        
        return {
            "sessionId": request.sessionId,
            "status": "ended",
            "duration": duration,
        }
    
    return {"status": "session_not_found"}


@router.post("/view")
async def track_vehicle_view(event: ViewEvent):
    """
    Track when a user views a vehicle detail page.
    """
    # Update session
    if event.sessionId in sessions:
        sessions[event.sessionId]["vehicle_views"].append(event.vehicleId)
        sessions[event.sessionId]["interactions"] += 1
    
    # Update vehicle view counts
    if event.vehicleId not in vehicle_views:
        vehicle_views[event.vehicleId] = {
            "total_views": 0,
            "unique_sessions": set(),
        }
    
    vehicle_views[event.vehicleId]["total_views"] += 1
    vehicle_views[event.vehicleId]["unique_sessions"].add(event.sessionId)
    
    # Log event
    events.append({
        "type": "vehicle_view",
        "vehicleId": event.vehicleId,
        "sessionId": event.sessionId,
        "timestamp": datetime.utcnow().isoformat(),
    })
    
    return {"status": "tracked"}


@router.post("/interaction")
async def track_interaction(event: InteractionEvent):
    """
    Track generic user interactions (button clicks, filter changes, etc).
    """
    if event.sessionId in sessions:
        sessions[event.sessionId]["interactions"] += 1
    
    events.append({
        "type": event.eventType,
        "data": event.eventData,
        "sessionId": event.sessionId,
        "timestamp": event.timestamp or datetime.utcnow().isoformat(),
    })
    
    return {"status": "tracked"}


@router.get("/dashboard")
async def get_analytics_dashboard():
    """
    Get analytics dashboard data for internal monitoring.
    """
    total_sessions = len(sessions)
    active_sessions = sum(1 for s in sessions.values() if s["ended_at"] is None)
    total_events = len(events)
    
    # Calculate average session duration
    completed_sessions = [s for s in sessions.values() if s.get("duration_seconds")]
    avg_duration = 0
    if completed_sessions:
        avg_duration = sum(s["duration_seconds"] for s in completed_sessions) / len(completed_sessions)
    
    # Top viewed vehicles
    top_vehicles = sorted(
        [
            {"vehicleId": vid, "views": data["total_views"], "uniqueUsers": len(data["unique_sessions"])}
            for vid, data in vehicle_views.items()
        ],
        key=lambda x: x["views"],
        reverse=True
    )[:10]
    
    # Recent events
    recent_events = events[-20:][::-1]
    
    return {
        "summary": {
            "totalSessions": total_sessions,
            "activeSessions": active_sessions,
            "totalEvents": total_events,
            "avgSessionDuration": round(avg_duration, 1),
        },
        "topViewedVehicles": top_vehicles,
        "recentEvents": recent_events,
    }


@router.get("/vehicle/{vehicle_id}")
async def get_vehicle_analytics(vehicle_id: str):
    """
    Get analytics for a specific vehicle.
    """
    if vehicle_id not in vehicle_views:
        return {
            "vehicleId": vehicle_id,
            "totalViews": 0,
            "uniqueUsers": 0,
        }
    
    data = vehicle_views[vehicle_id]
    return {
        "vehicleId": vehicle_id,
        "totalViews": data["total_views"],
        "uniqueUsers": len(data["unique_sessions"]),
    }
