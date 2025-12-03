"""
Tests for Analytics Repository Implementations
Tests both in-memory and SQLite repositories
"""
import pytest
import os
import tempfile

from app.repositories.memory_repository import MemoryRepository
from app.repositories.sqlite_repository import SQLiteRepository


class TestMemoryRepository:
    """Test suite for in-memory repository implementation"""
    
    @pytest.fixture
    def repo(self):
        """Fresh repository for each test"""
        return MemoryRepository()
    
    @pytest.mark.asyncio
    async def test_create_session(self, repo):
        """Creating a session returns session data"""
        result = await repo.create_session("kiosk-001")
        
        assert "sessionId" in result
        assert result["kioskId"] == "kiosk-001"
        assert "startedAt" in result
    
    @pytest.mark.asyncio
    async def test_end_session(self, repo):
        """Ending a session calculates duration"""
        session = await repo.create_session("kiosk-001")
        session_id = session["sessionId"]
        
        result = await repo.end_session(session_id)
        
        assert result["status"] == "ended"
        assert "duration" in result
        assert result["duration"] >= 0
    
    @pytest.mark.asyncio
    async def test_end_nonexistent_session(self, repo):
        """Ending nonexistent session returns None"""
        result = await repo.end_session("fake-session-id")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_session(self, repo):
        """Can retrieve session by ID"""
        session = await repo.create_session("kiosk-001")
        session_id = session["sessionId"]
        
        result = await repo.get_session(session_id)
        
        assert result is not None
        assert result["id"] == session_id
        assert result["kiosk_id"] == "kiosk-001"
    
    @pytest.mark.asyncio
    async def test_track_vehicle_view(self, repo):
        """Vehicle views are aggregated"""
        session = await repo.create_session("kiosk-001")
        session_id = session["sessionId"]
        
        await repo.track_vehicle_view("v001", session_id)
        await repo.track_vehicle_view("v001", session_id)
        
        stats = await repo.get_vehicle_stats("v001")
        assert stats["totalViews"] == 2
        assert stats["uniqueUsers"] == 1
    
    @pytest.mark.asyncio
    async def test_vehicle_stats_multiple_sessions(self, repo):
        """Unique users tracked across sessions"""
        session1 = await repo.create_session("kiosk-001")
        session2 = await repo.create_session("kiosk-002")
        
        await repo.track_vehicle_view("v001", session1["sessionId"])
        await repo.track_vehicle_view("v001", session2["sessionId"])
        
        stats = await repo.get_vehicle_stats("v001")
        assert stats["totalViews"] == 2
        assert stats["uniqueUsers"] == 2
    
    @pytest.mark.asyncio
    async def test_get_dashboard_stats(self, repo):
        """Dashboard returns aggregated stats"""
        session = await repo.create_session("kiosk-001")
        sid = session["sessionId"]
        
        await repo.track_vehicle_view("v001", sid)
        await repo.end_session(sid)
        
        stats = await repo.get_dashboard_stats()
        
        assert stats["summary"]["totalSessions"] == 1
        assert stats["summary"]["activeSessions"] == 0
        assert "topViewedVehicles" in stats
        assert "recentEvents" in stats


class TestSQLiteRepository:
    """Test suite for SQLite repository implementation"""
    
    @pytest.fixture
    def repo(self):
        """Fresh repository with temp database for each test"""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        
        repo = SQLiteRepository(db_path)
        yield repo
        
        try:
            os.unlink(db_path)
        except:
            pass
    
    @pytest.mark.asyncio
    async def test_create_session(self, repo):
        """Creating a session returns session data"""
        result = await repo.create_session("kiosk-001")
        
        assert "sessionId" in result
        assert result["kioskId"] == "kiosk-001"
    
    @pytest.mark.asyncio
    async def test_session_persists(self, repo):
        """Session data persists in database"""
        session = await repo.create_session("kiosk-001")
        session_id = session["sessionId"]
        
        result = await repo.get_session(session_id)
        
        assert result is not None
        assert result["kiosk_id"] == "kiosk-001"
    
    @pytest.mark.asyncio
    async def test_track_vehicle_view(self, repo):
        """Vehicle views persist"""
        session = await repo.create_session("kiosk-001")
        
        await repo.track_vehicle_view("v001", session["sessionId"])
        
        stats = await repo.get_vehicle_stats("v001")
        assert stats["totalViews"] == 1
