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
    WorksheetSendRequest,
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
    
    def test_trade_in_appraisal_status(self):
        """Trade-in appraisal status"""
        trade = TradeInInfo(
            model="Tahoe",
            appraisal_status="pending"
        )
        
        assert trade.appraisal_status == "pending"


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
    
    def test_vehicle_selling_price(self):
        """Test selling price calculation"""
        vehicle = VehicleInfo(
            stock_number="M12345",
            year=2025,
            make="Chevrolet",
            model="Silverado",
            msrp=55000.00,
            dealer_discount=-2000.00,
            dealer_accessories=1500.00
        )
        
        # Selling price = MSRP + discount + accessories
        assert vehicle.get_selling_price() == 54500.00


class TestWorksheet:
    """Tests for Worksheet model"""
    
    @pytest.fixture
    def sample_vehicle(self):
        return VehicleInfo(
            stock_number="M12345",
            year=2025,
            make="Chevrolet",
            model="Corvette",
            trim="3LZ",
            msrp=130575.00
        )
    
    @pytest.fixture
    def sample_term_options(self):
        return [
            TermOption(term_months=60, apr=6.49, monthly_payment=2150.00,
                      total_of_payments=129000.00, total_interest=18425.00),
            TermOption(term_months=72, apr=6.99, monthly_payment=1850.00,
                      total_of_payments=133200.00, total_interest=22625.00, is_selected=True),
            TermOption(term_months=84, apr=7.49, monthly_payment=1682.00,
                      total_of_payments=141288.00, total_interest=30713.00),
        ]
    
    def test_create_worksheet(self, sample_vehicle, sample_term_options):
        """Create a valid worksheet"""
        now = datetime.utcnow()
        worksheet = Worksheet(
            id="ws-12345",
            session_id="session-abc",
            created_at=now,
            updated_at=now,
            expires_at=now + timedelta(hours=24),
            status=WorksheetStatus.DRAFT,
            vehicle=sample_vehicle,
            selling_price=130575.00,
            down_payment=20000.00,
            amount_financed=110575.00,
            term_options=sample_term_options,
            selected_term=72,
            total_due_at_signing=20624.00,
            monthly_payment=1850.00
        )
        
        assert worksheet.id == "ws-12345"
        assert worksheet.status == WorksheetStatus.DRAFT
        assert worksheet.monthly_payment == 1850.00
        assert len(worksheet.term_options) == 3
    
    def test_worksheet_with_trade(self, sample_vehicle, sample_term_options):
        """Worksheet with trade-in"""
        trade = TradeInInfo(
            year=2020,
            make="Chevrolet",
            model="Equinox",
            estimated_value=15000,
            payoff_amount=10000,
            equity=5000
        )
        
        worksheet = Worksheet(
            id="ws-12345",
            session_id="session-abc",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24),
            status=WorksheetStatus.DRAFT,
            vehicle=sample_vehicle,
            has_trade=True,
            trade_in=trade,
            trade_equity=5000.00,
            selling_price=130575.00,
            down_payment=20000.00,
            amount_financed=105575.00,
            term_options=sample_term_options,
            monthly_payment=1750.00
        )
        
        assert worksheet.has_trade is True
        assert worksheet.trade_equity == 5000.00
    
    def test_worksheet_status_history(self, sample_vehicle, sample_term_options):
        """Worksheet with status history"""
        now = datetime.utcnow()
        worksheet = Worksheet(
            id="ws-12345",
            session_id="session-abc",
            created_at=now,
            updated_at=now,
            expires_at=now + timedelta(hours=24),
            status=WorksheetStatus.READY,
            status_history=[
                StatusHistoryEntry(status="draft", timestamp=now, actor="system"),
                StatusHistoryEntry(status="ready", timestamp=now, actor="customer"),
            ],
            vehicle=sample_vehicle,
            selling_price=130575.00,
            down_payment=20000.00,
            amount_financed=110575.00,
            term_options=sample_term_options,
            monthly_payment=1850.00
        )
        
        assert len(worksheet.status_history) == 2
        assert worksheet.status_history[-1].status == "ready"
    
    def test_worksheet_to_dict(self, sample_vehicle, sample_term_options):
        """Worksheet serialization"""
        worksheet = Worksheet(
            id="ws-12345",
            session_id="session-abc",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24),
            status=WorksheetStatus.DRAFT,
            vehicle=sample_vehicle,
            selling_price=130575.00,
            down_payment=20000.00,
            amount_financed=110575.00,
            term_options=sample_term_options,
            monthly_payment=1850.00
        )
        
        data = worksheet.to_dict()
        
        assert data["id"] == "ws-12345"
        assert data["status"] == "draft"
        assert "vehicle" in data
        assert "term_options" in data


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
        assert request.down_payment is None
    
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
    
    def test_create_request_validation(self):
        """Create request requires session_id and stock_number"""
        with pytest.raises(ValidationError):
            WorksheetCreateRequest(session_id="abc")
        
        with pytest.raises(ValidationError):
            WorksheetCreateRequest(stock_number="M123")


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


class TestWorksheetCounterOffer:
    """Tests for WorksheetCounterOffer model"""
    
    def test_counter_offer(self):
        """Create counter offer"""
        offer = WorksheetCounterOffer(
            adjustment=-1500.00,
            notes="Best price we can do today",
            manager_id="mgr-123",
            manager_name="Mike Smith"
        )
        
        assert offer.adjustment == -1500.00
        assert offer.manager_name == "Mike Smith"
    
    def test_counter_offer_validation(self):
        """Counter offer requires adjustment"""
        with pytest.raises(ValidationError):
            WorksheetCounterOffer(
                notes="Some notes",
                manager_id="mgr-123"
            )


class TestWorksheetSendRequest:
    """Tests for WorksheetSendRequest model"""
    
    def test_send_via_sms(self):
        """Send worksheet via SMS"""
        request = WorksheetSendRequest(
            method="sms",
            destination="6175551234"
        )
        
        assert request.method == "sms"
        assert request.destination == "6175551234"
    
    def test_send_via_email(self):
        """Send worksheet via email"""
        request = WorksheetSendRequest(
            method="email",
            destination="customer@example.com"
        )
        
        assert request.method == "email"


class TestWorksheetSummary:
    """Tests for WorksheetSummary model"""
    
    def test_create_from_worksheet(self):
        """Create summary from full worksheet"""
        vehicle = VehicleInfo(
            stock_number="M12345",
            year=2025,
            make="Chevrolet",
            model="Corvette",
            trim="3LZ",
            msrp=130575.00
        )
        
        worksheet = Worksheet(
            id="ws-12345",
            session_id="session-abc",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24),
            status=WorksheetStatus.READY,
            vehicle=vehicle,
            customer_name="John Doe",
            selling_price=130575.00,
            down_payment=20000.00,
            amount_financed=110575.00,
            term_options=[],
            selected_term=72,
            monthly_payment=1850.00,
            lead_score=75
        )
        
        summary = WorksheetSummary.from_worksheet(worksheet)
        
        assert summary.id == "ws-12345"
        assert summary.status == WorksheetStatus.READY
        assert summary.vehicle_description == "2025 Corvette 3LZ"
        assert summary.customer_name == "John Doe"
        assert summary.monthly_payment == 1850.00
        assert summary.lead_score == 75


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
