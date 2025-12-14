"""
Tests for Enhanced AI Router
Covers structured output parsing, retry logic, and fallback behavior
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import json
import sys

sys.path.insert(0, '/home/runner/work/quirk-ai-kiosk/quirk-ai-kiosk/backend')

from app.routers.ai_v2 import (
    parse_structured_response,
    extract_stock_numbers,
    generate_fallback_response,
    AIStructuredResponse,
    VehicleSuggestion,
    RetryConfig,
)


# Structured Response Parsing Tests
class TestStructuredResponseParsing:
    
    def test_parse_valid_json_response(self):
        """Parse a well-formatted JSON response"""
        raw = '''{
    "message": "I found some great trucks for you!",
    "suggestedVehicles": [
        {"stockNumber": "M12345", "confidence": 0.9, "reason": "Perfect match for towing"}
    ],
    "intent": "browse",
    "nextAction": "View inventory",
    "shouldNotifyStaff": false,
    "staffNotificationType": null
}'''
        
        result = parse_structured_response(raw)
        
        assert result is not None
        assert result.message == "I found some great trucks for you!"
        assert len(result.suggestedVehicles) == 1
        assert result.suggestedVehicles[0].stockNumber == "M12345"
        assert result.suggestedVehicles[0].confidence == 0.9
        assert result.intent == "browse"
        assert result.shouldNotifyStaff == False
    
    def test_parse_multiple_suggestions(self):
        """Parse response with multiple vehicle suggestions"""
        raw = '''{
    "message": "I have several options",
    "suggestedVehicles": [
        {"stockNumber": "M12345", "confidence": 0.95, "reason": "Best match"},
        {"stockNumber": "M12346", "confidence": 0.85, "reason": "Great alternative"},
        {"stockNumber": "M12347", "confidence": 0.75, "reason": "Budget option"}
    ],
    "intent": "compare"
}'''
        
        result = parse_structured_response(raw)
        
        assert len(result.suggestedVehicles) == 3
        assert result.suggestedVehicles[0].confidence > result.suggestedVehicles[1].confidence
        assert result.intent == "compare"
    
    def test_parse_staff_notification_trigger(self):
        """Parse response that should notify staff"""
        raw = '''{
    "message": "I will have someone come help with your trade-in",
    "suggestedVehicles": [],
    "intent": "trade-in",
    "shouldNotifyStaff": true,
    "staffNotificationType": "appraisal"
}'''
        
        result = parse_structured_response(raw)
        
        assert result.shouldNotifyStaff == True
        assert result.staffNotificationType == "appraisal"
        assert result.intent == "trade-in"
    
    def test_parse_invalid_json_returns_none(self):
        """Invalid JSON should return None"""
        raw = "This is just plain text with no JSON"
        
        result = parse_structured_response(raw)
        
        assert result is None
    
    def test_parse_missing_optional_fields(self):
        """Missing optional fields should use defaults"""
        raw = '{"message": "Hello"}'
        
        result = parse_structured_response(raw)
        
        assert result is not None
        assert result.message == "Hello"
        assert result.suggestedVehicles == []
        assert result.intent is None
        assert result.shouldNotifyStaff == False


# Stock Number Extraction Tests
class TestStockNumberExtraction:
    
    def test_extract_single_stock_number(self):
        """Extract a single stock number"""
        text = "Check out the Silverado with stock number M12345"
        
        result = extract_stock_numbers(text)
        
        assert "M12345" in result
    
    def test_extract_multiple_stock_numbers(self):
        """Extract multiple stock numbers"""
        text = "Compare M12345 with M67890 and M11111"
        
        result = extract_stock_numbers(text)
        
        assert len(result) == 3
        assert "M12345" in result
        assert "M67890" in result
        assert "M11111" in result
    
    def test_extract_deduplicated(self):
        """Duplicate stock numbers should be removed"""
        text = "M12345 is great. Did I mention M12345?"
        
        result = extract_stock_numbers(text)
        
        assert len(result) == 1
    
    def test_extract_no_matches(self):
        """No stock numbers should return empty list"""
        text = "We have many great vehicles available!"
        
        result = extract_stock_numbers(text)
        
        assert result == []


# Fallback Response Tests
class TestFallbackResponses:
    
    def test_fallback_truck_keywords(self):
        """Truck-related queries should get truck response"""
        response = generate_fallback_response("I need a truck for towing")
        
        assert "Silverado" in response or "truck" in response.lower()
    
    def test_fallback_suv_keywords(self):
        """SUV/family queries should get SUV response"""
        response = generate_fallback_response("I need space for my family")
        
        assert any(model in response for model in ["Equinox", "Traverse", "Tahoe", "Suburban", "SUV"])
    
    def test_fallback_electric_keywords(self):
        """Electric queries should get EV response"""
        response = generate_fallback_response("Show me electric vehicles")
        
        assert "EV" in response or "electric" in response.lower()
    
    def test_fallback_with_customer_name(self):
        """Response should include customer name if provided"""
        response = generate_fallback_response("Hi", customer_name="John")
        
        assert "John" in response
    
    def test_fallback_without_customer_name(self):
        """Response should work without customer name"""
        response = generate_fallback_response("Hi", customer_name=None)
        
        assert len(response) > 0


# Retry Configuration Tests
class TestRetryConfig:
    
    def test_default_retry_config(self):
        """Default retry configuration"""
        config = RetryConfig()
        
        assert config.max_retries == 3
        assert config.base_delay > 0
        assert config.max_delay >= config.base_delay
    
    def test_custom_retry_config(self):
        """Custom retry configuration"""
        config = RetryConfig(max_retries=5, base_delay=2.0, max_delay=20.0)
        
        assert config.max_retries == 5
        assert config.base_delay == 2.0
        assert config.max_delay == 20.0


# VehicleSuggestion Model Tests
class TestVehicleSuggestionModel:
    
    def test_valid_suggestion(self):
        """Valid suggestion should be created"""
        suggestion = VehicleSuggestion(
            stockNumber="M12345",
            confidence=0.85,
            reason="Great match"
        )
        
        assert suggestion.stockNumber == "M12345"
        assert suggestion.confidence == 0.85
        assert suggestion.reason == "Great match"


# AIStructuredResponse Model Tests
class TestAIStructuredResponseModel:
    
    def test_full_response(self):
        """Full response with all fields"""
        response = AIStructuredResponse(
            message="Here are your options",
            suggestedVehicles=[
                VehicleSuggestion(stockNumber="M123", confidence=0.9, reason="Best match")
            ],
            intent="browse",
            nextAction="View inventory",
            shouldNotifyStaff=True,
            staffNotificationType="sales"
        )
        
        assert response.message == "Here are your options"
        assert len(response.suggestedVehicles) == 1
        assert response.intent == "browse"
        assert response.shouldNotifyStaff == True
    
    def test_minimal_response(self):
        """Response with only required fields"""
        response = AIStructuredResponse(message="Hello!")
        
        assert response.message == "Hello!"
        assert response.suggestedVehicles == []
        assert response.intent is None
        assert response.shouldNotifyStaff == False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


# =============================================================================
# AI Router v1 (ai.py) - Spouse Objection Handling Tests
# =============================================================================

from app.routers.ai import SYSTEM_PROMPT, generate_fallback_response as v1_fallback


class TestSpouseObjectionSystemPrompt:
    """Tests to verify spouse/partner objection handling is configured in system prompt"""
    
    def test_system_prompt_contains_spouse_section(self):
        """System prompt should contain spouse objection handling section"""
        assert "SPOUSE/PARTNER OBJECTION HANDLING" in SYSTEM_PROMPT
    
    def test_system_prompt_contains_step_1_acknowledge(self):
        """System prompt should contain Step 1 - Acknowledge & Validate"""
        assert "Acknowledge & Validate" in SYSTEM_PROMPT
        assert "major decision" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_contains_step_2_urgency(self):
        """System prompt should contain Step 2 - Introduce Urgency & Incentive"""
        assert "Urgency" in SYSTEM_PROMPT
        assert "incentive" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_contains_step_3_call_spouse(self):
        """System prompt should contain Step 3 - Propose Calling the Spouse"""
        assert "call" in SYSTEM_PROMPT.lower()
        assert "speaker" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_contains_step_4_test_drive(self):
        """System prompt should contain Step 4 - Propose Test Drive/Take-Home"""
        assert "test drive" in SYSTEM_PROMPT.lower() or "take it home" in SYSTEM_PROMPT.lower()
        assert "temporary plates" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_contains_step_5_commitment(self):
        """System prompt should contain Step 5 - Isolate & Confirm Commitment"""
        assert "Confirm Commitment" in SYSTEM_PROMPT or "commitment" in SYSTEM_PROMPT.lower()
        assert "finalize" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_contains_step_6_followup(self):
        """System prompt should contain Step 6 - Provide Information & Set Follow-up"""
        assert "follow-up" in SYSTEM_PROMPT.lower() or "followup" in SYSTEM_PROMPT.lower()
        assert "VIN" in SYSTEM_PROMPT
    
    def test_system_prompt_contains_key_principles(self):
        """System prompt should contain key principles section"""
        assert "KEY PRINCIPLES" in SYSTEM_PROMPT
        assert "validate" in SYSTEM_PROMPT.lower()
        assert "INVOLVE" in SYSTEM_PROMPT
    
    def test_system_prompt_handles_wife_reference(self):
        """System prompt should reference wife"""
        assert "wife" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_handles_husband_reference(self):
        """System prompt should reference husband"""
        assert "husband" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_handles_partner_reference(self):
        """System prompt should reference partner"""
        assert "partner" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_no_ultimatums_principle(self):
        """System prompt should emphasize no ultimatums"""
        assert "ultimatum" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_specific_followup_time(self):
        """System prompt should emphasize getting specific follow-up time"""
        assert "specific" in SYSTEM_PROMPT.lower()
        assert "time" in SYSTEM_PROMPT.lower()
