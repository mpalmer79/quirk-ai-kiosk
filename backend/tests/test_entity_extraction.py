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


class TestPreferenceExtraction:
    """Tests for vehicle preference extraction"""
    
    def test_truck_preference(self, extractor):
        result = extractor.extract_preferences("I need a truck for towing")
        assert "truck" in result.vehicle_types
    
    def test_suv_preference(self, extractor):
        result = extractor.extract_preferences("Looking for an SUV for my family")
        assert "suv" in result.vehicle_types


class TestContextExtraction:
    """Tests for customer context extraction"""
    
    def test_high_urgency(self, extractor):
        result = extractor.extract_context("I need something today")
        assert result.urgency == "ready_to_buy"
    
    def test_browsing_urgency(self, extractor):
        result = extractor.extract_context("Just looking around")
        assert result.urgency == "browsing"


class TestStockNumberExtraction:
    """Tests for stock number extraction"""
    
    def test_single_stock(self, extractor):
        result = extractor.extract_stock_numbers("Tell me about M12345")
        assert "M12345" in result


class TestModelExtraction:
    """Tests for model mention extraction"""
    
    def test_silverado(self, extractor):
        result = extractor.extract_model_mentions("I want a Silverado")
        assert "Silverado" in result
