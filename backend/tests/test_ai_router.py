"""
Tests for Enhanced AI Router
Covers structured output parsing, retry logic, and fallback behavior
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import json
import sys

sys.path.insert(0, '/home/claude/quirk-ai-kiosk-main/backend')

from app.routers.ai_v2 import (
    parse_structured_response,
    extract_stock_numbers,
    generate_fallback_response,
    AIStructuredResponse,
    VehicleSuggestion,
    RetryConfig,
    call_with_retry,
)


# Structured Response Parsing Tests
class TestStructuredResponseParsing:
    
    def test_parse_valid_json_response(self):
        """Parse a well-formatted JSON response"""
        raw = '''```json
{
    "message": "I found some great trucks for you!",
    "suggestedVehicles": [
        {"stockNumber": "M12345", "confidence": 0.9, "reason": "Perfect match for towing"}
    ],
    "intent": "browse",
    "nextAction": "View inventory",
    "shouldNotifyStaff": false,
    "staffNotificationType": null
}
``````````'''
        
        result = parse_structured_response(raw)
        
        assert result is not None
        assert result.message == "I found some great trucks for you!"
        assert len(result.suggestedVehicles) == 1
        assert result.suggestedVehicles[0].stockNumber == "M12345"
        assert result.suggestedVehicles[0].confidence == 0.9
        assert result.intent == "browse"
        assert result.shouldNotifyStaff == False
    
    def test_parse_json_without_markdown(self):
        """Parse JSON without markdown code blocks"""
        raw = '''{
    "message": "Here are some options",
    "suggestedVehicles": [],
    "intent": "general"
}'''
        
        result = parse_structured_response(raw)
        
        assert result is not None
        assert result.message == "Here are some options"
        assert result.intent == "general"
    
    def test_parse_multiple_suggestions(self):
        """Parse response with multiple vehicle suggestions"""
        raw = '''```json
{
    "message": "I have several options",
    "suggestedVehicles": [
        {"stockNumber": "M12345", "confidence": 0.95, "reason": "Best match"},
        {"stockNumber": "M12346", "confidence": 0.85, "reason": "Great alternative"},
        {"stockNumber": "M12347", "confidence": 0.75, "reason": "Budget option"}
    ],
    "intent": "compare"
}
`````````'''
        
        result = parse_structured_response(raw)
        
        assert len(result.suggestedVehicles) == 3
        assert result.suggestedVehicles[0].confidence > result.suggestedVehicles[1].confidence
        assert result.intent == "compare"
    
    def test_parse_staff_notification_trigger(self):
        """Parse response that should notify staff"""
        raw = '''```json
{
    "message": "I'll have someone come help with your trade-in",
    "suggestedVehicles": [],
    "intent": "trade-in",
    "shouldNotifyStaff": true,
    "staffNotificationType": "appraisal"
}
````````'''
        
        result = parse_structured_response(raw)
        
        assert result.shouldNotifyStaff == True
        assert result.staffNotificationType == "appraisal"
        assert result.intent == "trade-in"
    
    def test_parse_invalid_json_returns_none(self):
        """Invalid JSON should return None"""
        raw = "This is just plain text with no JSON"
        
        result = parse_structured_response(raw)
        
        assert result is None
    
    def test_parse_partial_json(self):
        """Partial/malformed JSON should be handled gracefully"""
        raw = '{"message": "Hello", "suggestedVehicles": ['  # Incomplete
        
        result = parse_structured_response(raw)
        
        assert result is None
    
    def test_parse_json_with_surrounding_text(self):
        """JSON embedded in other text should be extracted"""
        raw = '''Sure! Let me help you find a truck.
```````json
{
    "message": "Here are some trucks",
    "suggestedVehicles": [{"stockNumber": "M99999", "confidence": 0.8, "reason": "Great truck"}],
    "intent": "browse"
}
```````

Let me know if you need more info!'''
        
        result = parse_structured_response(raw)
        
        assert result is not None
        assert result.message == "Here are some trucks"
    
    def test_parse_normalizes_confidence(self):
        """Confidence values should be normalized to floats"""
        raw = '''```json
{
    "message": "Test",
    "suggestedVehicles": [
        {"stockNumber": "M123", "confidence": "0.9", "reason": "Test"}
    ]
}
```````'''
        
        result = parse_structured_response(raw)
        
        assert result is not None
        assert isinstance(result.suggestedVehicles[0].confidence, float)
    
    def test_parse_missing_optional_fields(self):
        """Missing optional fields should use defaults"""
        raw = '''```json
{
    "message": "Hello"
}
``````'''
        
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
    
    def test_extract_various_lengths(self):
        """Extract stock numbers of various lengths"""
        text = "M1234 M12345 M123456"
        
        result = extract_stock_numbers(text)
        
        assert len(result) == 3
    
    def test_extract_case_insensitive(self):
        """Extraction should be case insensitive"""
        text = "Stock m12345 is available"
        
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
        assert "towing" in response.lower()
    
    def test_fallback_suv_keywords(self):
        """SUV/family queries should get SUV response"""
        response = generate_fallback_response("I need space for my family")
        
        assert any(model in response for model in ["Equinox", "Traverse", "Tahoe", "Suburban", "SUV"])
    
    def test_fallback_electric_keywords(self):
        """Electric queries should get EV response"""
        response = generate_fallback_response("Show me electric vehicles")
        
        assert "EV" in response or "electric" in response.lower()
    
    def test_fallback_performance_keywords(self):
        """Performance queries should get sports car response"""
        response = generate_fallback_response("I want something fast and fun")
        
        assert "Corvette" in response or "Camaro" in response
    
    def test_fallback_budget_keywords(self):
        """Budget queries should get affordable options"""
        response = generate_fallback_response("What's your cheapest option?")
        
        assert "Trax" in response or "$" in response
    
    def test_fallback_generic_response(self):
        """Generic queries should get helpful response"""
        response = generate_fallback_response("Hello")
        
        assert "help" in response.lower() or "looking for" in response.lower()
    
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


# Retry Logic Tests
class TestRetryLogic:
    
    @pytest.mark.asyncio
    async def test_retry_succeeds_first_attempt(self):
        """Successful first attempt should return immediately"""
        call_count = 0
        
        async def mock_func():
            nonlocal call_count
            call_count += 1
            return "success"
        
        result = await call_with_retry(mock_func, RetryConfig(max_retries=3))
        
        assert result == "success"
        assert call_count == 1
    
    @pytest.mark.asyncio
    async def test_retry_succeeds_after_failures(self):
        """Should retry and eventually succeed"""
        import httpx
        
        call_count = 0
        
        async def mock_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise httpx.RequestError("Connection failed")
            return "success"
        
        config = RetryConfig(max_retries=3, base_delay=0.01)
        result = await call_with_retry(mock_func, config)
        
        assert result == "success"
        assert call_count == 3
    
    @pytest.mark.asyncio
    async def test_retry_exhausts_attempts(self):
        """Should raise exception after exhausting retries"""
        import httpx
        
        async def mock_func():
            raise httpx.RequestError("Always fails")
        
        config = RetryConfig(max_retries=2, base_delay=0.01)
        
        with pytest.raises(httpx.RequestError):
            await call_with_retry(mock_func, config)


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
    
    def test_confidence_bounds(self):
        """Confidence should be between 0 and 1"""
        with pytest.raises(ValueError):
            VehicleSuggestion(stockNumber="M123", confidence=1.5, reason="Test")
        
        with pytest.raises(ValueError):
            VehicleSuggestion(stockNumber="M123", confidence=-0.1, reason="Test")
    
    def test_default_confidence(self):
        """Default confidence should be 0.5 if not provided"""
        # Using parse which provides defaults
        raw = '''{"message": "Test", "suggestedVehicles": [{"stockNumber": "M123", "reason": "Test"}]}'''
        result = parse_structured_response(raw)
        
        assert result.suggestedVehicles[0].confidence == 0.5


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


# Integration-style Tests
class TestIntegrationScenarios:
    
    def test_trade_in_scenario(self):
        """Trade-in scenario should parse correctly"""
        raw = '''```json
{
    "message": "I can have our appraisal team take a look at your trade. While they're evaluating it (usually 10-15 minutes), would you like me to have a Silverado brought up front for you to check out?",
    "suggestedVehicles": [
        {"stockNumber": "M55123", "confidence": 0.7, "reason": "Popular truck choice"}
    ],
    "intent": "trade-in",
    "nextAction": "Arrange appraisal",
    "shouldNotifyStaff": true,
    "staffNotificationType": "appraisal"
}
`````'''
        
        result = parse_structured_response(raw)
        
        assert result is not None
        assert result.intent == "trade-in"
        assert result.shouldNotifyStaff == True
        assert result.staffNotificationType == "appraisal"
        assert "appraisal" in result.message.lower()
    
    def test_comparison_scenario(self):
        """Comparison scenario with multiple vehicles"""
        raw = '''```json
{
    "message": "Great question! Let me compare the Equinox and Traverse for you.",
    "suggestedVehicles": [
        {"stockNumber": "M11111", "confidence": 0.9, "reason": "Equinox - compact, efficient"},
        {"stockNumber": "M22222", "confidence": 0.85, "reason": "Traverse - more space"}
    ],
    "intent": "compare",
    "nextAction": "View both vehicles"
}
````'''
        
        result = parse_structured_response(raw)
        
        assert result.intent == "compare"
        assert len(result.suggestedVehicles) == 2
    
    def test_test_drive_scenario(self):
        """Test drive scenario should trigger sales notification"""
        raw = '''```json
{
    "message": "I'd be happy to have someone bring that Corvette up front! Let me notify our team.",
    "suggestedVehicles": [
        {"stockNumber": "M99999", "confidence": 1.0, "reason": "Customer requested test drive"}
    ],
    "intent": "test-drive",
    "nextAction": "Bring vehicle to front",
    "shouldNotifyStaff": true,
    "staffNotificationType": "sales"
}
```'''
        
        result = parse_structured_response(raw)
        
        assert result.intent == "test-drive"
        assert result.shouldNotifyStaff == True
        assert result.staffNotificationType == "sales"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

---

## 8. `frontend/src/utils/vehicleHelpers.ts`
```typescript
/**
 * Vehicle Helper Utilities
 * Shared functions for vehicle image URLs, VIN decoding, and color handling
 */

import type { Vehicle } from '../types';

// GM Truck VIN Decoder - extracts cab type and drive type for Silverado models
export interface TruckVINInfo {
  cabType: string;
  driveType: string;
}

/**
 * Decode GM truck VIN to extract cab type and drive type
 * Works for Silverado 1500, 2500, and 3500 models
 */
export const decodeGMTruckVIN = (vin: string, model: string): TruckVINInfo | null => {
  if (!vin || vin.length !== 17) return null;
  
  // Only decode for Silverado models
  const modelLower = (model || '').toLowerCase();
  if (!modelLower.includes('silverado')) return null;
  
  const vinUpper = vin.toUpperCase();
  
  // GM Silverado VIN Structure (2019+):
  // Position 6 (index 5) - Cab type
  // Position 7 (index 6) - Drive type
  const cabCode = vinUpper[5];
  const driveCode = vinUpper[6];
  
  // Cab type mapping for Silverado
  let cabType = '';
  switch (cabCode) {
    case 'A':
    case 'B':
      cabType = 'Regular Cab';
      break;
    case 'C':
    case 'D':
      cabType = 'Double Cab';
      break;
    case 'K':
    case 'U':
    case 'G':
      cabType = 'Crew Cab';
      break;
    default:
      cabType = '';
  }
  
  // Drive type mapping for GM trucks
  let driveType = '';
  switch (driveCode) {
    case 'E':
    case 'K':
    case 'G':
    case 'J':
      driveType = '4WD';
      break;
    case 'A':
    case 'D':
    case 'C':
    case 'B':
      driveType = '2WD';
      break;
    default:
      driveType = '';
  }
  
  if (cabType || driveType) {
    return { cabType, driveType };
  }
  
  return null;
};

/**
 * Map color descriptions to base color categories for image matching
 */
export const getColorCategory = (colorDesc: string): string => {
  const color = colorDesc.toLowerCase();
  if (color.includes('black')) return 'black';
  if (color.includes('white') || color.includes('summit') || color.includes('arctic') || color.includes('polar')) return 'white';
  if (color.includes('red') || color.includes('cherry') || color.includes('cajun') || color.includes('radiant')) return 'red';
  if (color.includes('blue') || color.includes('northsky') || color.includes('glacier') || color.includes('reef')) return 'blue';
  if (color.includes('silver') || color.includes('sterling')) return 'silver';
  if (color.includes('gray') || color.includes('grey') || color.includes('shadow')) return 'gray';
  if (color.includes('green') || color.includes('woodland')) return 'green';
  if (color.includes('orange') || color.includes('tangier')) return 'orange';
  if (color.includes('yellow') || color.includes('accelerate')) return 'yellow';
  if (color.includes('brown') || color.includes('harvest')) return 'brown';
  return '';
};

/**
 * Generate gradient background based on vehicle color
 */
export const getColorGradient = (color?: string): string => {
  const colorMap: Record<string, string> = {
    'white': 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
    'black': 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    'red': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    'blue': 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    'silver': 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
    'gray': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    'green': 'linear-gradient(135deg, #16a34a 0%, #166534 100%)',
    'orange': 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    'yellow': 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    'brown': 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
  };
  
  const lowerColor = (color || '').toLowerCase();
  const category = getColorCategory(lowerColor);
  return colorMap[category] || 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
};

/**
 * Build image URL candidates for a vehicle based on model and color rules
 * Priority: API URL > Stock-specific > Model+Color > Base Model+Color > Model-only
 */
export const getVehicleImageCandidates = (vehicle: Vehicle, exteriorColor: string): string[] => {
  const candidates: string[] = [];
  const stockNumber = vehicle.stockNumber || vehicle.stock_number || '';
  
  // 1. First check API-provided URLs
  if (vehicle.imageUrl) candidates.push(vehicle.imageUrl);
  if (vehicle.image_url) candidates.push(vehicle.image_url);
  if (vehicle.images && vehicle.images.length > 0) {
    candidates.push(...vehicle.images);
  }
  
  // Normalize model for file matching
  const fullModel = (vehicle.model || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  // Get base model without EV/HD/etc suffixes for fallback (equinox-ev -> equinox)
  const baseModel = fullModel.replace(/-ev$/, '').replace(/-hd$/, '').replace(/\d+$/, '');
  const colorCategory = getColorCategory(exteriorColor);
  
  // 2. Stock-specific image (for featured/special vehicles)
  if (stockNumber) {
    candidates.push(`/images/vehicles/${stockNumber}.jpg`);
  }
  
  // 3. Full Model + Color combination (e.g., equinox-ev-gray.jpg)
  if (fullModel && colorCategory) {
    candidates.push(`/images/vehicles/${fullModel}-${colorCategory}.jpg`);
  }
  
  // 4. Base Model + Color (e.g., equinox-gray.jpg for Equinox EV)
  if (baseModel && baseModel !== fullModel && colorCategory) {
    candidates.push(`/images/vehicles/${baseModel}-${colorCategory}.jpg`);
  }
  
  // 5. Model-only fallback (e.g., equinox.jpg)
  if (fullModel) {
    candidates.push(`/images/vehicles/${fullModel}.jpg`);
  }
  if (baseModel && baseModel !== fullModel) {
    candidates.push(`/images/vehicles/${baseModel}.jpg`);
  }
  
  return candidates;
};

/**
 * Get single vehicle image URL (for inventory listings)
 */
export const getVehicleImageUrl = (vehicle: Vehicle): string | null => {
  // Check for API-provided URLs first
  if (vehicle.imageUrl) return vehicle.imageUrl;
  if (vehicle.image_url) return vehicle.image_url;
  if (vehicle.images && vehicle.images.length > 0) return vehicle.images[0];
  
  // Normalize model for file matching
  const fullModel = (vehicle.model || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const baseModel = fullModel.replace(/-ev$/, '').replace(/-hd$/, '').replace(/\d+$/, '');
  const exteriorColor = (vehicle.exteriorColor || vehicle.exterior_color || '').toLowerCase();
  const colorCategory = getColorCategory(exteriorColor);
  
  // Use base model name for images (equinox-ev uses equinox-gray.jpg)
  const modelForImage = baseModel || fullModel;
  
  if (modelForImage && colorCategory) {
    return `/images/vehicles/${modelForImage}-${colorCategory}.jpg`;
  }
  if (modelForImage) {
    return `/images/vehicles/${modelForImage}.jpg`;
  }
  
  return null;
};
```

---

## 9. `backend/app/main_v2.py`
```python
"""
Quirk AI Kiosk - FastAPI Main Application
Entry point for the kiosk backend API

Version 2.0 - Now includes enhanced recommendation engine and AI router
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("quirk_api")

# Import original routers
from app.routers import inventory, recommendations, leads, analytics, traffic, ai

# Import enhanced v2 routers (side-by-side for gradual migration)
try:
    from app.routers import recommendations_v2, ai_v2
    V2_AVAILABLE = True
    logger.info("✅ V2 routers loaded successfully")
except ImportError as e:
    V2_AVAILABLE = False
    logger.warning(f"⚠️ V2 routers not available: {e}")


# Lifespan handler for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Quirk AI Kiosk API starting...")
    logger.info(f"   Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"   V2 Features: {'enabled' if V2_AVAILABLE else 'disabled'}")
    
    # Initialize recommendation engine config if available
    if V2_AVAILABLE:
        config_path = os.getenv('RECOMMENDER_CONFIG_PATH', 'config/recommender_config.json')
        logger.info(f"   Recommender config: {config_path}")
    
    yield
    
    # Shutdown
    logger.info("👋 Quirk AI Kiosk API shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Quirk AI Kiosk API",
    description="""
    Backend API for Quirk AI Kiosk customer journey.
    
    ## Features
    - Vehicle inventory management
    - AI-powered recommendations
    - Conversational AI assistant
    - Customer lead capture
    - Traffic analytics
    
    ## V2 Endpoints
    Enhanced AI features available at `/api/v2/` prefix:
    - Unified recommendation engine with configurable weights
    - Structured LLM outputs with retry logic
    - Enhanced observability and analytics
    """,
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://quirk-ai-kiosk.railway.app",
    "https://quirk-ai-kiosk.netlify.app",
    "https://quirk-ai-kiosk.vercel.app",
    "https://quirk-frontend-production.up.railway.app",
    "https://quirk-backend-production.up.railway.app",
]

# Allow all origins in development
if os.getenv("ENVIRONMENT", "development") == "development":
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# V1 Routes (Original - maintained for backward compatibility)
# =============================================================================
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["recommendations"])
app.include_router(leads.router, prefix="/api/v1/leads", tags=["leads"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(traffic.router, prefix="/api/v1/traffic", tags=["traffic"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])

# =============================================================================
# V2 Routes (Enhanced - new features with gradual rollout)
# =============================================================================
if V2_AVAILABLE:
    # Enhanced recommendations with unified engine
    app.include_router(
        recommendations_v2.router, 
        prefix="/api/v2/recommendations", 
        tags=["recommendations-v2"]
    )
    
    # Enhanced AI with structured outputs
    app.include_router(
        ai_v2.router, 
        prefix="/api/v2/ai", 
        tags=["ai-v2"]
    )
    
    logger.info("📦 V2 routes registered: /api/v2/recommendations, /api/v2/ai")


# =============================================================================
# Health & Status Endpoints
# =============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Quirk AI Kiosk API",
        "status": "running",
        "docs": "/docs",
        "version": "2.0.0",
        "features": {
            "v1_api": True,
            "v2_api": V2_AVAILABLE,
            "unified_recommender": V2_AVAILABLE,
            "structured_ai_output": V2_AVAILABLE,
        }
    }


@app.get("/api/health")
async def health_check():
    """Comprehensive health check endpoint"""
    from datetime import datetime
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "quirk-kiosk-api",
        "version": "2.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "components": {
            "inventory": "healthy",
            "recommendations": "healthy",
            "ai": "healthy" if os.getenv("ANTHROPIC_API_KEY") else "degraded (no API key)",
            "v2_features": "enabled" if V2_AVAILABLE else "disabled",
        }
    }
    
    return health_status


@app.get("/api/v2/status")
async def v2_status():
    """V2 feature status endpoint"""
    if not V2_AVAILABLE:
        return {
            "v2_available": False,
            "reason": "V2 modules not loaded"
        }
    
    # Get recommender config if available
    try:
        from app.core.recommendation_engine import get_recommender
        recommender = get_recommender()
        config = recommender.get_config()
    except Exception as e:
        config = {"error": str(e)}
    
    return {
        "v2_available": True,
        "features": {
            "unified_recommender": True,
            "structured_ai_output": True,
            "retry_logic": True,
            "observability": True,
        },
        "recommender_config": config,
        "ai_config": {
            "api_key_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
            "model": "claude-sonnet-4-20250514",
        }
    }


# Run with uvicorn
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT", "development") == "development"
    )
```

---

## Summary of Files to Create/Add

| File Path | Action |
|-----------|--------|
| `backend/app/core/__init__.py` | **CREATE** (new directory + file) |
| `backend/app/core/recommendation_engine.py` | **CREATE** |
| `backend/config/recommender_config.json` | **CREATE** (new directory + file) |
| `backend/app/routers/recommendations_v2.py` | **CREATE** |
| `backend/app/routers/ai_v2.py` | **CREATE** |
| `backend/tests/test_recommendation_engine.py` | **CREATE** |
| `backend/tests/test_ai_router.py` | **CREATE** |
| `frontend/src/utils/vehicleHelpers.ts` | **CREATE** (replaces misnamed file) |
| `backend/app/main_v2.py` | **CREATE** |

**Also delete:** `frontend/src/utils/vehicleHelpers,ts` (the misnamed file with comma)
