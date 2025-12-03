"""
SQLite Repository Implementation
Persistent storage using SQLite - suitable for production single-instance deployments
"""
import sqlite3
import json
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from contextlib import contextmanager
import os

from . import AnalyticsRepository


class SQLiteRepository(AnalyticsRepository):
    """
    SQLite implementation of the analytics repository.
    Data persists across restarts - suitable for production.
    """
    
    def __init__(self, db_path: str = "data/analytics.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_db()
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def _init_db(self):
        """Initialize database schema."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    kiosk_id TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    ended_at TEXT,
                    vehicle_views TEXT DEFAULT '[]',
                    interactions INTEGER DEFAULT 0,
                    duration_seconds REAL
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    event_data TEXT,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES sessions(id)
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS vehicle_views (
                    vehicle_id TEXT PRIMARY KEY,
                    total_views INTEGER DEFAULT 0,
                    unique_sessions TEXT DEFAULT '[]'
                )
            """)
            
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_kiosk ON sessions(kiosk_id)")
    
    async def create_session(self, kiosk_id: str) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        started_at = datetime.utcnow().isoformat()
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO sessions (id, kiosk_id, started_at, vehicle_views, interactions)
                VALUES (?, ?, ?, '[]', 0)
            """, (session_id, kiosk_id, started_at))
        
        return {
            "sessionId": session_id,
            "kioskId": kiosk_id,
            "startedAt": started_at,
        }
    
    async def end_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            started_at = datetime.fromisoformat(row["started_at"])
            ended_at = datetime.utcnow()
            duration = (ended_at - started_at).total_seconds()
            
            cursor.execute("""
                UPDATE sessions 
                SET ended_at = ?, duration_seconds = ?
                WHERE id = ?
            """, (ended_at.isoformat(), duration, session_id))
        
        return {
            "sessionId": session_id,
            "status": "ended",
            "duration": duration,
        }
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            return {
                "id": row["id"],
                "kiosk_id": row["kiosk_id"],
                "started_at": row["started_at"],
                "ended_at": row["ended_at"],
                "vehicle_views": json.loads(row["vehicle_views"]),
                "interactions": row["interactions"],
                "duration_seconds": row["duration_seconds"],
            }
    
    async def update_session_interactions(self, session_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE sessions SET interactions = interactions + 1
                WHERE id = ?
            """, (session_id,))
            return cursor.rowcount > 0
    
    async def add_vehicle_view_to_session(self, session_id: str, vehicle_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT vehicle_views FROM sessions WHERE id = ?", (session_id,))
            row = cursor.fetchone()
            
            if not row:
                return False
            
            views = json.loads(row["vehicle_views"])
            views.append(vehicle_id)
            
            cursor.execute("""
                UPDATE sessions 
                SET vehicle_views = ?, interactions = interactions + 1
                WHERE id = ?
            """, (json.dumps(views), session_id))
            
            return True
    
    async def track_vehicle_view(self, vehicle_id: str, session_id: str) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM vehicle_views WHERE vehicle_id = ?", (vehicle_id,))
            row = cursor.fetchone()
            
            if row:
                unique_sessions = set(json.loads(row["unique_sessions"]))
                unique_sessions.add(session_id)
                
                cursor.execute("""
                    UPDATE vehicle_views 
                    SET total_views = total_views + 1, unique_sessions = ?
                    WHERE vehicle_id = ?
                """, (json.dumps(list(unique_sessions)), vehicle_id))
            else:
                cursor.execute("""
                    INSERT INTO vehicle_views (vehicle_id, total_views, unique_sessions)
                    VALUES (?, 1, ?)
                """, (vehicle_id, json.dumps([session_id])))
        
        await self.log_event("vehicle_view", session_id, {"vehicleId": vehicle_id})
    
    async def get_vehicle_stats(self, vehicle_id: str) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM vehicle_views WHERE vehicle_id = ?", (vehicle_id,))
            row = cursor.fetchone()
            
            if not row:
                return {
                    "vehicleId": vehicle_id,
                    "totalViews": 0,
                    "uniqueUsers": 0,
                }
            
            unique_sessions = json.loads(row["unique_sessions"])
            return {
                "vehicleId": vehicle_id,
                "totalViews": row["total_views"],
                "uniqueUsers": len(unique_sessions),
            }
    
    async def get_top_viewed_vehicles(self, limit: int = 10) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT vehicle_id, total_views, unique_sessions 
                FROM vehicle_views 
                ORDER BY total_views DESC 
                LIMIT ?
            """, (limit,))
            
            results = []
            for row in cursor.fetchall():
                unique_sessions = json.loads(row["unique_sessions"])
                results.append({
                    "vehicleId": row["vehicle_id"],
                    "views": row["total_views"],
                    "uniqueUsers": len(unique_sessions),
                })
            
            return results
    
    async def log_event(
        self, 
        event_type: str, 
        session_id: str,
        event_data: Optional[Dict[str, Any]] = None,
        timestamp: Optional[str] = None
    ) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO events (event_type, session_id, event_data, timestamp)
                VALUES (?, ?, ?, ?)
            """, (
                event_type, 
                session_id, 
                json.dumps(event_data) if event_data else None,
                timestamp or datetime.utcnow().isoformat()
            ))
    
    async def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT event_type, session_id, event_data, timestamp 
                FROM events 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (limit,))
            
            return [
                {
                    "type": row["event_type"],
                    "sessionId": row["session_id"],
                    "data": json.loads(row["event_data"]) if row["event_data"] else None,
                    "timestamp": row["timestamp"],
                }
                for row in cursor.fetchall()
            ]
    
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM sessions")
            total_sessions = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM sessions WHERE ended_at IS NULL")
            active_sessions = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM events")
            total_events = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT AVG(duration_seconds) 
                FROM sessions 
                WHERE duration_seconds IS NOT NULL
            """)
            avg_duration = cursor.fetchone()[0] or 0.0
        
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


_repository: Optional[SQLiteRepository] = None


def get_sqlite_repository(db_path: str = "data/analytics.db") -> SQLiteRepository:
    """Get or create the singleton SQLite repository instance."""
    global _repository
    if _repository is None:
        _repository = SQLiteRepository(db_path)
    return _repository
