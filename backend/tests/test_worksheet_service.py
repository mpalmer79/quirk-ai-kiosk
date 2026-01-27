"""
Tests for Worksheet Service
Validates worksheet creation, updates, and manager interactions.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.worksheet_service import WorksheetService
from app.models.worksheet import (
    WorksheetStatus,
    WorksheetCreateRequest,
    WorksheetUpdateRequest,
)


class TestWorksheetServiceLeadScore:
    """Tests for lead score calculation (doesn't require mocking)"""
    
    @pytest.fixture
    def service(self):
        """Get a service instance with mocked dependencies"""
        with patch('app.services.worksheet_service.get_payment_calculator'), \
             patch('app.services.worksheet_service.get_vehicle_retriever'), \
             patch('app.services.worksheet_service.get_state_manager'), \
             patch('app.services.worksheet_service.get_notification_service'):
            return WorksheetService()
    
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
        
        # High down payment (>$10k) adds 15 + 10 = 25 points
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
    
    def test_lead_score_with_engagement(self, service):
        """Lead score includes engagement bonus"""
        mock_state = MagicMock()
        mock_state.customer_phone = None
        mock_state.message_count = 12  # Engaged customer
        mock_state.interest_level = None
        
        score = service._calculate_lead_score(
            state=mock_state,
            down_payment=0,
            amount_financed=30000,
            has_trade=False
        )
        
        # 5+ messages = 10 points, 10+ messages = additional 10
        assert score >= 20
    
    def test_lead_score_high_interest(self, service):
        """Lead score includes high interest bonus"""
        mock_state = MagicMock()
        mock_state.customer_phone = None
        mock_state.message_count = 0
        mock_state.interest_level = MagicMock()
        mock_state.interest_level.value = "high"
        
        score = service._calculate_lead_score(
            state=mock_state,
            down_payment=0,
            amount_financed=30000,
            has_trade=False
        )
        
        # High interest adds 15 points
        assert score >= 15
    
    def test_lead_score_reasonable_financing(self, service):
        """Lead score bonus for reasonable financing"""
        score = service._calculate_lead_score(
            state=None,
            down_payment=0,
            amount_financed=50000,  # Under 80k threshold
            has_trade=False
        )
        
        # Reasonable deal adds 10 points
        assert score >= 10
    
    def test_lead_score_max_100(self, service):
        """Lead score should not exceed 100"""
        mock_state = MagicMock()
        mock_state.customer_phone = "6175551234"  # +15
        mock_state.message_count = 15  # +20
        mock_state.interest_level = MagicMock()
        mock_state.interest_level.value = "high"  # +15
        
        score = service._calculate_lead_score(
            state=mock_state,
            down_payment=20000,  # +25
            amount_financed=50000,  # +10
            has_trade=True  # +15
        )
        
        # Total would be 100, capped at 100
        assert score <= 100
    
    def test_lead_score_no_state(self, service):
        """Lead score works without state"""
        score = service._calculate_lead_score(
            state=None,
            down_payment=5000,
            amount_financed=30000,
            has_trade=False
        )
        
        # Down payment gives points, reasonable financing gives points
        assert score > 0


class TestWorksheetServiceBasic:
    """Basic tests for WorksheetService"""
    
    def test_service_constants(self):
        """Verify service constants"""
        with patch('app.services.worksheet_service.get_payment_calculator'), \
             patch('app.services.worksheet_service.get_vehicle_retriever'), \
             patch('app.services.worksheet_service.get_state_manager'), \
             patch('app.services.worksheet_service.get_notification_service'):
            service = WorksheetService()
        
        assert service.EXPIRATION_HOURS == 24
        assert service.HOT_LEAD_THRESHOLD == 70
        assert service.WARM_LEAD_THRESHOLD == 40
    
    def test_worksheet_storage_initialized(self):
        """Verify in-memory storage is initialized"""
        with patch('app.services.worksheet_service.get_payment_calculator'), \
             patch('app.services.worksheet_service.get_vehicle_retriever'), \
             patch('app.services.worksheet_service.get_state_manager'), \
             patch('app.services.worksheet_service.get_notification_service'):
            service = WorksheetService()
        
        assert isinstance(service._worksheets, dict)
        assert isinstance(service._session_worksheets, dict)


class TestWorksheetStatusFlow:
    """Tests for worksheet status transitions"""
    
    def test_worksheet_status_values(self):
        """Verify status enum values"""
        assert WorksheetStatus.DRAFT.value == "draft"
        assert WorksheetStatus.READY.value == "ready"
        assert WorksheetStatus.MANAGER_REVIEW.value == "manager_review"
        assert WorksheetStatus.NEGOTIATING.value == "negotiating"
        assert WorksheetStatus.ACCEPTED.value == "accepted"
        assert WorksheetStatus.DECLINED.value == "declined"
        assert WorksheetStatus.EXPIRED.value == "expired"


class TestWorksheetCreateRequest:
    """Tests for worksheet create request validation"""
    
    def test_valid_create_request(self):
        """Valid create request"""
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345"
        )
        
        assert request.session_id == "test-session"
        assert request.stock_number == "M12345"
    
    def test_create_request_with_all_fields(self):
        """Create request with all optional fields"""
        request = WorksheetCreateRequest(
            session_id="test-session",
            stock_number="M12345",
            down_payment=10000,
            monthly_payment_target=500,
            include_trade=True,
            customer_name="John Doe",
            customer_phone="6175551234",
            customer_email="john@example.com"
        )
        
        assert request.down_payment == 10000
        assert request.include_trade is True


class TestWorksheetUpdateRequest:
    """Tests for worksheet update request"""
    
    def test_update_request_down_payment(self):
        """Update request with down payment"""
        request = WorksheetUpdateRequest(down_payment=15000)
        
        assert request.down_payment == 15000
    
    def test_update_request_selected_term(self):
        """Update request with selected term"""
        request = WorksheetUpdateRequest(selected_term=72)
        
        assert request.selected_term == 72
    
    def test_update_request_empty(self):
        """Empty update request is valid"""
        request = WorksheetUpdateRequest()
        
        assert request.down_payment is None
        assert request.selected_term is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
