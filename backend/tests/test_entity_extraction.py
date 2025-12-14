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


class TestSpouseObjectionExtraction:
    """Tests for spouse/partner decision maker objection detection"""
    
    def test_talk_to_wife(self, extractor):
        result = extractor.extract_context("I need to talk to my wife first")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
        assert result.spouse_reference == "wife"
    
    def test_talk_to_husband(self, extractor):
        result = extractor.extract_context("I need to discuss this with my husband")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
        assert result.spouse_reference == "husband"
    
    def test_talk_to_spouse(self, extractor):
        result = extractor.extract_context("Let me talk to my spouse about it")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
        assert result.spouse_reference == "spouse"
    
    def test_talk_to_partner(self, extractor):
        result = extractor.extract_context("My partner needs to see this first")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
        assert result.spouse_reference == "partner"
    
    def test_cant_decide_alone(self, extractor):
        result = extractor.extract_context("I can't decide this alone")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_cant_make_decision_without(self, extractor):
        result = extractor.extract_context("I can't make this decision without her")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_we_need_to_discuss(self, extractor):
        result = extractor.extract_context("We need to discuss this first")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_both_need_to_decide(self, extractor):
        result = extractor.extract_context("We both need to decide on this")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_sleep_on_it(self, extractor):
        result = extractor.extract_context("I need to sleep on it")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_think_it_over(self, extractor):
        result = extractor.extract_context("Let me think it over")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_think_about_it(self, extractor):
        result = extractor.extract_context("I need to think about it")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_big_decision(self, extractor):
        result = extractor.extract_context("This is a big decision")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_wife_needs_to_approve(self, extractor):
        result = extractor.extract_context("My wife needs to approve this")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
        assert result.spouse_reference == "wife"
    
    def test_need_her_input(self, extractor):
        result = extractor.extract_context("I need her input before deciding")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_she_needs_to_see(self, extractor):
        result = extractor.extract_context("She needs to see it first")
        assert result.needs_spouse_approval
        assert result.decision_maker_objection
    
    def test_no_spouse_objection_normal_message(self, extractor):
        result = extractor.extract_context("I'm looking for a truck")
        assert not result.needs_spouse_approval
        assert not result.decision_maker_objection
        assert result.spouse_reference is None
    
    def test_no_spouse_objection_ready_to_buy(self, extractor):
        result = extractor.extract_context("I want to buy this today")
        assert not result.needs_spouse_approval
        assert not result.decision_maker_objection
