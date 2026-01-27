"""
Tests for Worksheet Models
Validates Pydantic models for Digital Worksheet feature.
"""

import pytest
from datetime import datetime, timedelta
from pydantic import ValidationError

from app.models.worksheet import (
    WorksheetStatus,
    TermOption,
    TradeInInfo,
    VehicleInfo,
    Worksheet,
    WorksheetCreateRequest,
    WorksheetUpdateRequest,
    WorksheetManagerUpdate,
    WorksheetCounterOffer,
    WorksheetSummary,
    StatusHistoryEntry,
)


class TestWorksheetStatus:
    """Tests for WorksheetStatus enum"""
    
    def test_all_statuses_exist(self):
        """Verify all expected statuses exist"""
        assert WorksheetStatus.DRAFT.value == "draft"
        assert WorksheetStatus.READY.value == "ready"
        assert WorksheetStatus.MANAGER_REVIEW.value == "manager_review"
        assert WorksheetStatus.NEGOTIATING.value == "negotiating"
        assert WorksheetStatus.ACCEPTED.value == "accepted"
        assert WorksheetStatus.EXPIRED.value == "expired"
        assert WorksheetStatus.DECLINED.value == "declined"


class TestTermOption:
    """Tests for TermOption model"""
    
    def test_create_term_option(self):
        """Create a valid term option"""
        opt = TermOption(
            term_months=72,
            apr=6.99,
            monthly_payment=532.50,
            total_of_payments=38340.00,
            total_interest=3340.00,
            is_selected=True
        )
        
        assert opt.term_months == 72
        assert opt.apr == 6.99
        assert opt.monthly_payment == 532.50
        assert opt.is_selected is True
    
    def test_term_option_defaults(self):
        """Term option with default is_selected"""
        opt = TermOption(
            term_months=60,
            apr=6.49,
            monthly_payment=600.00,
            total_of_payments=36000.00,
            total_interest=1000.00
        )
        
        assert opt.is_selected is False


class TestTradeInInfo:
    """Tests for TradeInInfo model"""
    
    def test_create_trade_in_info(self):
        """Create valid trade-in info"""
        trade = TradeInInfo(
            year=2020,
            make="Chevrolet",
            model="Equinox",
            mileage=45000,
            estimated_value=18000,
            payoff_amount=12000,
            equity=6000
        )
        
        assert trade.year == 2020
        assert trade.model == "Equinox"
        assert trade.equity == 6000
    
    def test_trade_in_with_lien(self):
        """Trade-in with lien holder"""
        trade = TradeInInfo(
            model="Silverado",
            has_lien=True,
            lien_holder="GM Financial",
            payoff_amount=25000
        )
        
        assert trade.has_lien is True
        assert trade.lien_holder == "GM Financial"
    
    def test_trade_in_minimal(self):
        """Trade-in with minimal required fields"""
        trade = TradeInInfo(model="Tahoe")
        
        assert trade.model == "Tahoe"
        assert trade.year is None
        assert trade.make is None


class TestVehicleInfo:
    """Tests for VehicleInfo model"""
    
    def test_create_vehicle_info(self):
        """Create valid vehicle info"""
        vehicle = VehicleInfo(
            stock_number="M12345",
            year=2025,
            make="Chevrolet",
            model="Corvette",
            trim="3LZ",
            exterior_color="Red Mist",
            vin="1G1YY22G955123456",
            msrp=130575.00
        )
        
        assert vehicle.stock_number == "M12345"
        assert vehicle.model == "Corvette"
        assert vehicle.msrp == 130575.00
    
    def test_vehicle_info_minimal(self):
        """Vehicle info with minimal required fields"""
        vehicle = VehicleInfo(
            stock_number="M99999",
            year=2025,
            make="Chevrolet",
            model="Equinox",
            msrp=32000.00
        )
        
        assert vehicle.trim is None
        assert vehicle.exterior_color is None
    
    def test_vehicle_get_selling_price_basic(self):
        """Test selling price equals MSRP when no adjustments"""
        vehicle = VehicleInfo(
            stock_number="M12345",
            year=2025,
            make="Chevrolet",
            model="Silverado",
            msrp=55000.00
        )
        
        assert vehicle.get_selling_price() == 55000.00


class TestWorksheetCreateRequest:
    """Tests for WorksheetCreateRequest model"""
    
    def test_create_request_minimal(self):
        """Minimal create request"""
        request = WorksheetCreateRequest(
            session_id="session-123",
            stock_number="M12345"
        )
        
        assert request.session_id == "session-123"
        assert request.stock_number == "M12345"
        assert request.down_payment is 0
    
    def test_create_request_full(self):
        """Full create request"""
        request = WorksheetCreateRequest(
            session_id="session-123",
            stock_number="M12345",
            down_payment=10000.00,
            monthly_payment_target=600.00,
            include_trade=True,
            customer_name="John Doe",
            customer_phone="6175551234",
            customer_email="john@example.com"
        )
        
        assert request.down_payment == 10000.00
        assert request.include_trade is True
    
    def test_create_request_requires_session_id(self):
        """Create request requires session_id"""
        with pytest.raises(ValidationError):
            WorksheetCreateRequest(stock_number="M123")
    
    def test_create_request_requires_stock_number(self):
        """Create request requires stock_number"""
        with pytest.raises(ValidationError):
            WorksheetCreateRequest(session_id="abc")


class TestWorksheetUpdateRequest:
    """Tests for WorksheetUpdateRequest model"""
    
    def test_update_down_payment(self):
        """Update down payment only"""
        request = WorksheetUpdateRequest(down_payment=15000.00)
        
        assert request.down_payment == 15000.00
        assert request.selected_term is None
    
    def test_update_selected_term(self):
        """Update selected term"""
        request = WorksheetUpdateRequest(selected_term=84)
        
        assert request.selected_term == 84
    
    def test_update_multiple_fields(self):
        """Update multiple fields"""
        request = WorksheetUpdateRequest(
            down_payment=20000.00,
            selected_term=72,
            customer_phone="6175559999"
        )
        
        assert request.down_payment == 20000.00
        assert request.selected_term == 72
        assert request.customer_phone == "6175559999"


class TestWorksheetManagerUpdate:
    """Tests for WorksheetManagerUpdate model"""
    
    def test_manager_adjustment(self):
        """Manager price adjustment"""
        update = WorksheetManagerUpdate(
            manager_adjustment=-2000.00,
            manager_notes="Loyalty discount applied"
        )
        
        assert update.manager_adjustment == -2000.00
        assert update.manager_notes == "Loyalty discount applied"
    
    def test_manager_status_change(self):
        """Manager status change"""
        update = WorksheetManagerUpdate(
            status=WorksheetStatus.ACCEPTED
        )
        
        assert update.status == WorksheetStatus.ACCEPTED


class TestStatusHistoryEntry:
    """Tests for StatusHistoryEntry model"""
    
    def test_create_status_entry(self):
        """Create status history entry"""
        now = datetime.utcnow()
        entry = StatusHistoryEntry(
            status="draft",
            timestamp=now,
            actor="system"
        )
        
        assert entry.status == "draft"
        assert entry.actor == "system"
    
    def test_status_entry_with_notes(self):
        """Status entry with notes"""
        entry = StatusHistoryEntry(
            status="ready",
            timestamp=datetime.utcnow(),
            actor="customer",
            notes="Customer pressed ready button"
        )
        
        assert entry.notes == "Customer pressed ready button"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
