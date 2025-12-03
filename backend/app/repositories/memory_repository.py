"""
In-Memory Repository Implementation
Default implementation using dictionaries - suitable for development/prototyping
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

from . import AnalyticsRepository


class MemoryRepository(AnalyticsRepository):
    """
    In-memory implementation of the analytics repository.
    Data is lost on restart - use for development/prototyping only.
    """
    
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.events: List[Dict[str, Any]] = []
        self.vehicle_views: Dict[str, Dict[str, Any]] = {}
    
    async def create_session(self, kiosk_id: str) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        
        session = {
            "id": session_id,
            "kiosk_id": kiosk_id,
            "started_at": datetime.utcnow().isoformat(),
            "ended_at": None,
            "vehicle_views": [],
            "interactions": 0,
            "duration_seconds": None,
        }
        
        self.sessions[session_id] = session
        
        return {
            "sessionId": session_id,
            "kioskId": kiosk_id,
            "startedAt": session["started_at"],
        }
    
    async def end_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        session["ended_at"] = datetime.utcnow().isoformat()
        
        start = datetime.fromisoformat(session["started_at"])
        end = datetime.fromisoformat(session["ended_at"])
        duration = (end - start).total_seconds()
        session["duration_seconds"] = duration
        
        return {
            "sessionId": session_id,
            "status": "ended",
            "duration": duration,
        }
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.sessions.get(session_id)
    
    async def update_session_interactions(self, session_id: str) -> bool:
        if session_id not in self.sessions:
            return False
        
        self.sessions[session_id]["interactions"] += 1
        return True
    
    async def add_vehicle_view_to_session(self, session_id: str, vehicle_id: str) -> bool:
        if session_id not in self.sessions:
            return False
        
        self.sessions[session_id]["vehicle_views"].append(vehicle_id)
        self.sessions[session_id]["interactions"] += 1
        return True
    
    async def track_vehicle_view(self, vehicle_id: str, session_id: str) -> None:
        if vehicle_id not in self.vehicle_views:
            self.vehicle_views[vehicle_id] = {
                "total_views": 0,
                "unique_sessions": set(),
            }
        
        self.vehicle_views[vehicle_id]["total_views"] += 1
        self.vehicle_views[vehicle_id]["unique_sessions"].add(session_id)
        
        await self.log_event("vehicle_view", session_id, {"vehicleId": vehicle_id})
    
    async def get_vehicle_stats(self, vehicle_id: str) -> Dict[str, Any]:
        if vehicle_id not in self.vehicle_views:
            return {
                "vehicleId": vehicle_id,
                "totalViews": 0,
                "uniqueUsers": 0,
            }
        
        data = self.vehicle_views[vehicle_id]
        return {
            "vehicleId": vehicle_id,
            "totalViews": data["total_views"],
            "uniqueUsers": len(data["unique_sessions"]),
        }
    
    async def get_top_viewed_vehicles(self, limit: int = 10) -> List[Dict[str, Any]]:
        sorted_vehicles = sorted(
            [
                {
                    "vehicleId": vid, 
                    "views": data["total_views"], 
                    "uniqueUsers": len(data["unique_sessions"])
                }
                for vid, data in self.vehicle_views.items()
            ],
            key=lambda x: x["views"],
            reverse=True
        )
        return sorted_vehicles[:limit]
    
    async def log_event(
        self, 
        event_type: str, 
        session_id: str,
        event_data: Optional[Dict[str, Any]] = None,
        timestamp: Optional[str] = None
    ) -> None:
        event = {
            "type": event_type,
            "sessionId": session_id,
            "data": event_data,
            "timestamp": timestamp or datetime.utcnow().isoformat(),
        }
        self.events.append(event)
    
    async def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.events[-limit:][::-1]
    
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        total_sessions = len(self.sessions)
        active_sessions = sum(1 for s in self.sessions.values() if s["ended_at"] is None)
        total_events = len(self.events)
        
        completed_sessions = [s for s in self.sessions.values() if s.get("duration_seconds")]
        avg_duration = 0.0
        if completed_sessions:
            avg_duration = sum(s["duration_seconds"] for s in completed_sessions) / len(completed_sessions)
        
        return {
            "summary": {
                "totalSessions": total_sessions,
                "activeSessions": active_sessions,
                "totalEvents": total_events,
                "avgSessionDuration": round(avg_duration, 1),
            },
            "topViewedVehicles": await self.get_top_viewed_vehicles(),
            "recentEvents": await self.get_recent_events(),
        }


_repository: Optional[MemoryRepository] = None


def get_memory_repository() -> MemoryRepository:
    """Get or create the singleton memory repository instance."""
    global _repository
    if _repository is None:
        _repository = MemoryRepository()
    return _repository
