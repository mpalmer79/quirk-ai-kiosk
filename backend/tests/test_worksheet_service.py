"""
Tests for Worksheet Service
Validates worksheet creation, updates, and manager interactions.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.worksheet_service import WorksheetService, get_worksheet_service
from app.models.worksheet import (
    WorksheetStatus,
    WorksheetCreateRequest,
    WorksheetUpdateRequest,
    WorksheetCounterOffer,
)


class TestWorksheetService:
    """Tests for WorksheetService"""
    
    @pytest.fixture
    def service(self):
        """Get a fresh service instance"""
        # Create new instance (bypass singleton for testing)
        return WorksheetService()
    
    @pytest.fixture
    def mock_retriever(self):
        """Mock vehicle retriever"""
        retriever = MagicMock()
        retriever.get_vehicle_by_stock.return_value = {
            "Stock Number": "M12345",
            "Year": 2025,
            "Make": "Chevrolet",
            "Model": "Equinox",
            "Trim": "LT",
            "MSRP": 35000,
            "exteriorColor": "Summit White",
            "VIN": "1G1YY22G955123456"
        }
        return retriever
    
    @pytest.fixture
    def mock_state(self):
        """Mock conversation state"""
        state = MagicMock()
        state.session_id = "test-session-123"
        state.customer_name = "Test Customer"
        state.customer_phone = "6175551234"
        state.down_payment = 5000
        state.monthly_payment_target = 500
        state.trade_model = None
        state.has_trade_in = False
        return state
    
    # =========================================================================
    # WORKSHEET CREATION TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_create_worksheet_basic(self, service, mock_retriever, mock_state):
        """Create basic worksheet"""
        # Patch dependencies
        service.retriever = mock_retriever
        service.state_manager = MagicMock()
        service.state_manager.get_state.return_value = mock_state
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session-123",
            stock_number="M12345",
            down_payment=5000
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        
        assert worksheet is not None
        assert worksheet.id is not None
        assert worksheet.session_id == "test-session-123"
        assert worksheet.status == WorksheetStatus.DRAFT
        assert worksheet.vehicle.stock_number == "M12345"
        assert worksheet.vehicle.model == "Equinox"
        assert worksheet.down_payment == 5000
        assert len(worksheet.term_options) == 3
    
    @pytest.mark.asyncio
    async def test_create_worksheet_vehicle_not_found(self, service):
        """Create worksheet with invalid stock number"""
        mock_retriever = MagicMock()
        mock_retriever.get_vehicle_by_stock.return_value = None
        service.retriever = mock_retriever
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="INVALID"
        )
        
        with pytest.raises(ValueError, match="not found"):
            await service.create_worksheet(request)
    
    @pytest.mark.asyncio
    async def test_create_worksheet_with_trade(self, service, mock_retriever, mock_state):
        """Create worksheet with trade-in"""
        mock_state.has_trade_in = True
        mock_state.trade_model = "Equinox"
        mock_state.trade_year = 2020
        mock_state.trade_make = "Chevrolet"
        mock_state.trade_payoff = 10000
        
        service.retriever = mock_retriever
        service.state_manager = MagicMock()
        service.state_manager.get_state.return_value = mock_state
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345",
            include_trade=True
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        
        assert worksheet.has_trade is True
        assert worksheet.trade_in is not None
        assert worksheet.trade_in.model == "Equinox"
    
    @pytest.mark.asyncio
    async def test_create_worksheet_lead_score(self, service, mock_retriever, mock_state):
        """Verify lead score is calculated"""
        mock_state.customer_phone = "6175551234"
        mock_state.message_count = 8
        
        service.retriever = mock_retriever
        service.state_manager = MagicMock()
        service.state_manager.get_state.return_value = mock_state
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345",
            down_payment=10000
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        
        # Should have decent lead score (phone + down payment + engagement)
        assert worksheet.lead_score > 30
    
    # =========================================================================
    # WORKSHEET RETRIEVAL TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_get_worksheet(self, service, mock_retriever, mock_state):
        """Get worksheet by ID"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        created = await service.create_worksheet(request, mock_state)
        
        retrieved = service.get_worksheet(created.id)
        
        assert retrieved is not None
        assert retrieved.id == created.id
    
    def test_get_worksheet_not_found(self, service):
        """Get non-existent worksheet"""
        result = service.get_worksheet("non-existent-id")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_session_worksheets(self, service, mock_retriever, mock_state):
        """Get all worksheets for a session"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        # Create multiple worksheets
        for stock in ["M12345", "M12346", "M12347"]:
            mock_retriever.get_vehicle_by_stock.return_value = {
                "Stock Number": stock,
                "Year": 2025,
                "Make": "Chevrolet",
                "Model": "Equinox",
                "MSRP": 35000
            }
            
            request = WorksheetCreateRequest(
                session_id="test-session",
                stock_number=stock
            )
            await service.create_worksheet(request, mock_state)
        
        worksheets = service.get_session_worksheets("test-session")
        
        assert len(worksheets) == 3
    
    # =========================================================================
    # WORKSHEET UPDATE TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_update_down_payment(self, service, mock_retriever, mock_state):
        """Update worksheet down payment"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345",
            down_payment=5000
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        original_monthly = worksheet.monthly_payment
        
        # Update down payment
        updates = WorksheetUpdateRequest(down_payment=10000)
        updated = await service.update_worksheet(worksheet.id, updates)
        
        assert updated.down_payment == 10000
        assert updated.monthly_payment < original_monthly  # Higher down = lower payment
        assert updated.adjustments_made == 1
    
    @pytest.mark.asyncio
    async def test_update_selected_term(self, service, mock_retriever, mock_state):
        """Update selected term"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        
        # Select 84-month term
        updated = await service.select_term(worksheet.id, 84)
        
        assert updated.selected_term == 84
        # Find selected term option
        selected_opt = next(t for t in updated.term_options if t.is_selected)
        assert selected_opt.term_months == 84
    
    @pytest.mark.asyncio
    async def test_update_worksheet_not_editable(self, service, mock_retriever, mock_state):
        """Cannot update worksheet in non-editable status"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        
        # Force status to ACCEPTED (not editable)
        worksheet.status = WorksheetStatus.ACCEPTED
        
        updates = WorksheetUpdateRequest(down_payment=15000)
        
        with pytest.raises(ValueError, match="cannot be edited"):
            await service.update_worksheet(worksheet.id, updates)
    
    # =========================================================================
    # MARK READY TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_mark_ready(self, service, mock_retriever, mock_state):
        """Mark worksheet as ready"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        original_score = worksheet.lead_score
        
        ready_worksheet = await service.mark_ready(worksheet.id)
        
        assert ready_worksheet.status == WorksheetStatus.READY
        assert ready_worksheet.lead_score > original_score  # Score boosted
        
        # Verify notification was sent
        service.notifications.notify_staff.assert_called()
    
    # =========================================================================
    # MANAGER INTERACTION TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_manager_review(self, service, mock_retriever, mock_state):
        """Manager starts reviewing worksheet"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        
        reviewed = await service.manager_review(
            worksheet.id,
            manager_id="mgr-123",
            manager_name="Mike Smith"
        )
        
        assert reviewed.status == WorksheetStatus.MANAGER_REVIEW
        assert reviewed.manager_id == "mgr-123"
        assert reviewed.manager_name == "Mike Smith"
    
    @pytest.mark.asyncio
    async def test_manager_counter_offer(self, service, mock_retriever, mock_state):
        """Manager sends counter offer"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        original_price = worksheet.selling_price
        
        counter = WorksheetCounterOffer(
            adjustment=-1500,
            notes="Loyalty discount",
            manager_id="mgr-123",
            manager_name="Mike Smith"
        )
        
        updated = await service.manager_counter_offer(worksheet.id, counter)
        
        assert updated.status == WorksheetStatus.NEGOTIATING
        assert updated.manager_adjustment == -1500
        assert updated.selling_price == original_price - 1500
        assert updated.counter_offer_sent is True
    
    @pytest.mark.asyncio
    async def test_accept_deal(self, service, mock_retriever, mock_state):
        """Manager accepts deal"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        
        accepted = await service.accept_deal(worksheet.id, "mgr-123")
        
        assert accepted.status == WorksheetStatus.ACCEPTED
    
    @pytest.mark.asyncio
    async def test_decline_worksheet(self, service, mock_retriever, mock_state):
        """Decline worksheet"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        worksheet = await service.create_worksheet(request, mock_state)
        
        declined = await service.decline_worksheet(
            worksheet.id,
            actor="customer",
            reason="Changed mind"
        )
        
        assert declined.status == WorksheetStatus.DECLINED
    
    # =========================================================================
    # ACTIVE WORKSHEETS TESTS
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_get_active_worksheets(self, service, mock_retriever, mock_state):
        """Get active worksheets for sales floor"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        # Create worksheets with different statuses
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        ws1 = await service.create_worksheet(request, mock_state)
        ws2 = await service.create_worksheet(request, mock_state)
        ws3 = await service.create_worksheet(request, mock_state)
        
        # Mark one as ready, one as accepted
        await service.mark_ready(ws2.id)
        await service.accept_deal(ws3.id, "mgr-123")
        
        active = service.get_active_worksheets()
        
        # Should include DRAFT and READY, not ACCEPTED
        active_ids = [w.id for w in active]
        assert ws1.id in active_ids
        assert ws2.id in active_ids
        assert ws3.id not in active_ids
    
    @pytest.mark.asyncio
    async def test_active_worksheets_sorted_by_score(self, service, mock_retriever, mock_state):
        """Active worksheets sorted by lead score"""
        service.retriever = mock_retriever
        service.notifications = AsyncMock()
        
        # Create worksheets with different scores
        for i, down in enumerate([5000, 20000, 10000]):
            mock_state.down_payment = down
            request = WorksheetCreateRequest(
                session_id=f"session-{i}",
                stock_number="M12345",
                down_payment=down
            )
            await service.create_worksheet(request, mock_state)
        
        active = service.get_active_worksheets()
        
        # Should be sorted by lead_score DESC
        scores = [w.lead_score for w in active]
        assert scores == sorted(scores, reverse=True)
    
    # =========================================================================
    # LEAD SCORE TESTS
    # =========================================================================
    
    def test_lead_score_with_phone(self, service):
        """Lead score includes phone bonus"""
        mock_state = MagicMock()
        mock_state.customer_phone = "6175551234"
        mock_state.message_count = 0
        mock_state.interest_level = None
        
        score = service._calculate_lead_score(
            state=mock_state,
            down_payment=0,
            amount_financed=30000,
            has_trade=False
        )
        
        # Phone adds 15 points
        assert score >= 15
    
    def test_lead_score_with_high_down(self, service):
        """Lead score includes down payment bonus"""
        mock_state = MagicMock()
        mock_state.customer_phone = None
        mock_state.message_count = 0
        mock_state.interest_level = None
        
        score = service._calculate_lead_score(
            state=mock_state,
            down_payment=15000,
            amount_financed=30000,
            has_trade=False
        )
        
        # High down payment (>$10k) adds 25 points
        assert score >= 25
    
    def test_lead_score_with_trade(self, service):
        """Lead score includes trade-in bonus"""
        score = service._calculate_lead_score(
            state=None,
            down_payment=0,
            amount_financed=30000,
            has_trade=True
        )
        
        # Trade-in adds 15 points
        assert score >= 15


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
