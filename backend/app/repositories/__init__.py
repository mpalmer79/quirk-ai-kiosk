"""
Base Repository Interface
Abstract base class defining the repository contract for analytics storage
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List


class AnalyticsRepository(ABC):
    """
    Abstract base class for analytics data storage.
    Implementations can use in-memory, SQLite, PostgreSQL, etc.
    """
    
    @abstractmethod
    async def create_session(self, kiosk_id: str) -> Dict[str, Any]:
        """Create a new kiosk session."""
        pass
    
    @abstractmethod
    async def end_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """End an existing session."""
        pass
    
    @abstractmethod
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID."""
        pass
    
    @abstractmethod
    async def update_session_interactions(self, session_id: str) -> bool:
        """Increment interaction count for a session."""
        pass
    
    @abstractmethod
    async def add_vehicle_view_to_session(self, session_id: str, vehicle_id: str) -> bool:
        """Add a vehicle view to session history."""
        pass
    
    @abstractmethod
    async def track_vehicle_view(self, vehicle_id: str, session_id: str) -> None:
        """Track a vehicle view event."""
        pass
    
    @abstractmethod
    async def get_vehicle_stats(self, vehicle_id: str) -> Dict[str, Any]:
        """Get view statistics for a vehicle."""
        pass
    
    @abstractmethod
    async def get_top_viewed_vehicles(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most viewed vehicles."""
        pass
    
    @abstractmethod
    async def log_event(
        self, 
        event_type: str, 
        session_id: str,
        event_data: Optional[Dict[str, Any]] = None,
        timestamp: Optional[str] = None
    ) -> None:
        """Log a generic analytics event."""
        pass
    
    @abstractmethod
    async def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get most recent events."""
        pass
    
    @abstractmethod
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get aggregated statistics for dashboard."""
        pass
