"""
Tests for Entity Extraction Service
"""

import pytest
from app.services.entity_extraction import ConversationEntityExtractor


@pytest.fixture
def extractor():
    return ConversationEntityExtractor()


class TestBudgetExtraction:
    """Tests for budget entity extraction"""
    
    def test_under_budget(self, extractor):
        result = extractor.extract_budget("I'm looking for something under $50,000")
        assert result.has_budget_constraint
        assert result.max_price == 50000
    
    def test_under_budget_with_k(self, extractor):
        result = extractor.extract_budget("I want to stay under 45k")
        assert result.has_budget_constraint
        assert result.max_price == 45000
    
    def test_around_budget(self, extractor):
        result = extractor.extract_budget("My budget is around $40,000")
        assert result.has_budget_constraint
        assert result.min_price == pytest.approx(34000, rel=0.1)
        assert result.max_price == pytest.approx(46000, rel=0.1)
    
    def test_budget_range(self, extractor):
        result = extractor.extract_budget("I'm looking in the $35,000 to $50,000 range")
        assert result.has_budget_constraint
        assert result.min_price == 35000
        assert result.max_price == 50000
    
    def test_monthly_payment(self, extractor):
        result = extractor.extract_budget("I want to keep my payment under $500 a month")
        assert result.has_budget_constraint
        assert result.monthly_payment == 500
    
    def test_down_payment(self, extractor):
        result = extractor.extract_budget("I can put $10k down")
        assert result.down_payment == 10000
    
    def test_no_budget(self, extractor):
        result = extractor.extract_budget("I'm looking for a truck")
        assert not result.has_budget_constraint


class TestTradeInExtraction:
    """Tests for trade-in entity extraction"""
    
    def test_trade_mentioned(self, extractor):
        result = extractor.extract_trade_in("I have a trade-in")
        assert result.mentioned
    
    def test_trade_with_year(self, extractor):
        result = extractor.extract_trade_in("I'm trading in my 2019 truck")
        assert result.mentioned
        assert result.year == 2019
    
    def test_trade_with_make(self, extractor):
        result = extractor.extract_trade_in("Trading my Ford F-150")
        assert result.mentioned
        assert result.make == "Ford"
    
    def test_trade_with_mileage(self, extractor):
        result = extractor.extract_trade_in("My trade has 45,000 miles")
        assert result.mileage == 45000
    
    def test_trade_with_mileage_k(self, extractor):
        result = extractor.extract_trade_in("It has about 60k miles")
        assert result.mileage == 60000
    
    def test_trade_monthly_payment(self, extractor):
        result = extractor.extract_trade_in("I'm paying $450 a month on it")
        assert result.monthly_payment == 450
    
    def test_trade_payoff(self, extractor):
        result = extractor.extract_trade_in("I still owe about $15,000 on it")
        assert result.payoff_amount == 15000
    
    def test_trade_is_lease(self, extractor):
        result = extractor.extract_trade_in("I'm leasing my current car")
        assert result.is_lease == True
    
    def test_trade_is_financed(self, extractor):
        result = extractor.extract_trade_in("I'm financing through Capital One")
        assert result.is_lease == False
        assert result.lender == "Capital One"


class TestPreferenceExtraction:
    """Tests for vehicle preference extraction"""
    
    def test_truck_preference(self, extractor):
        result = extractor.extract_preferences("I need a truck for towing")
        assert "truck" in result.vehicle_types
    
    def test_suv_preference(self, extractor):
        result = extractor.extract_preferences("Looking for an SUV for my family")
        assert "suv" in result.vehicle_types
    
    def test_electric_preference(self, extractor):
        result = extractor.extract_preferences("I want to go electric")
        assert "electric" in result.vehicle_types
        assert result.fuel_preference == "electric"
    
    def test_awd_feature(self, extractor):
        result = extractor.extract_preferences("I need all wheel drive")
        assert "awd" in result.must_have_features
        assert result.drivetrain_preference == "AWD"
    
    def test_third_row_feature(self, extractor):
        result = extractor.extract_preferences("We need a third row for the kids")
        assert "third_row" in result.must_have_features
    
    def test_towing_use_case(self, extractor):
        result = extractor.extract_preferences("I need to tow my boat")
        assert "towing" in result.use_cases
        assert "towing" in result.must_have_features
    
    def test_seating_requirement(self, extractor):
        result = extractor.extract_preferences("I need at least 7 seats")
        assert result.min_seating == 7
    
    def test_towing_capacity(self, extractor):
        result = extractor.extract_preferences("I need to tow 8,000 lbs")
        assert result.min_towing == 8000


class TestContextExtraction:
    """Tests for customer context extraction"""
    
    def test_family_size_kids(self, extractor):
        result = extractor.extract_context("I have 3 kids")
        assert result.family_size == 5  # 3 kids + 2 adults
    
    def test_family_size_direct(self, extractor):
        result = extractor.extract_context("There's 5 of us")
        assert result.family_size == 5
    
    def test_high_urgency(self, extractor):
        result = extractor.extract_context("I need something today")
        assert result.urgency == "ready_to_buy"
    
    def test_medium_urgency(self, extractor):
        result = extractor.extract_context("Looking to buy this month")
        assert result.urgency == "considering"
    
    def test_browsing_urgency(self, extractor):
        result = extractor.extract_context("Just looking around")
        assert result.urgency == "browsing"
    
    def test_frustrated_sentiment(self, extractor):
        result = extractor.extract_context("This is so frustrating")
        assert result.sentiment == "frustrated"
    
    def test_positive_sentiment(self, extractor):
        result = extractor.extract_context("This is great, thanks!")
        assert result.sentiment == "positive"


class TestStockNumberExtraction:
    """Tests for stock number extraction"""
    
    def test_single_stock(self, extractor):
        result = extractor.extract_stock_numbers("Tell me about M12345")
        assert "M12345" in result
    
    def test_multiple_stocks(self, extractor):
        result = extractor.extract_stock_numbers("Compare M12345 and M67890")
        assert "M12345" in result
        assert "M67890" in result
    
    def test_no_stocks(self, extractor):
        result = extractor.extract_stock_numbers("Show me trucks")
        assert len(result) == 0


class TestModelExtraction:
    """Tests for model mention extraction"""
    
    def test_silverado(self, extractor):
        result = extractor.extract_model_mentions("I want a Silverado")
        assert "Silverado" in result
    
    def test_multiple_models(self, extractor):
        result = extractor.extract_model_mentions("Should I get a Tahoe or Suburban?")
        assert "Tahoe" in result
        assert "Suburban" in result


class TestFullExtraction:
    """Tests for full entity extraction with history"""
    
    def test_aggregate_from_history(self, extractor):
        history = [
            {"role": "user", "content": "I'm looking for a truck"},
            {"role": "assistant", "content": "Great choice!"},
            {"role": "user", "content": "My budget is around 50k"},
        ]
        
        result = extractor.extract_all(
            "I also need to tow a boat",
            history
        )
        
        assert "truck" in result.preferences.vehicle_types
        assert result.budget.has_budget_constraint
        assert "towing" in result.preferences.use_cases
