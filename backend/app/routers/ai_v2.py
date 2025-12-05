"""
Quirk AI Kiosk - Enhanced AI Assistant Router
Robust LLM integration with structured outputs, retry logic, and observability

Key Improvements:
- Structured JSON output schema for reliable parsing
- Exponential backoff retry for API resilience
- Comprehensive logging for debugging and analytics
- Prompt versioning for A/B testing
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import httpx
import asyncio
import json
import re
import logging
from datetime import datetime
from enum import Enum

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("quirk_ai")

# Anthropic API configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

# Retry configuration
MAX_RETRIES = 3
BASE_DELAY = 1.0  # seconds
MAX_DELAY = 10.0  # seconds


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ConversationMessage(BaseModel):
    role: str
    content: str


class VehicleSuggestion(BaseModel):
    """Structured vehicle suggestion from AI"""
    stockNumber: str
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str


class AIStructuredResponse(BaseModel):
    """Structured response format from AI"""
    message: str
    suggestedVehicles: List[VehicleSuggestion] = []
    intent: Optional[str] = None  # browse, compare, trade-in, test-drive, etc.
    nextAction: Optional[str] = None  # Suggested next step
    shouldNotifyStaff: bool = False
    staffNotificationType: Optional[str] = None  # sales, appraisal, finance


class AIChatRequest(BaseModel):
    message: str
    inventoryContext: str
    conversationHistory: List[ConversationMessage] = []
    customerName: Optional[str] = None
    sessionId: Optional[str] = None


class AIChatResponse(BaseModel):
    message: str
    suggestedVehicles: Optional[List[str]] = None
    structuredData: Optional[AIStructuredResponse] = None
    metadata: Optional[Dict[str, Any]] = None


# Prompt version for tracking
PROMPT_VERSION = "2.0.0"

# Enhanced system prompt with structured output instructions
SYSTEM_PROMPT = """You are a friendly, knowledgeable AI sales assistant on an interactive kiosk INSIDE the Quirk Chevrolet showroom. The customer you're speaking with is physically present in the dealership RIGHT NOW.

CRITICAL - SHOWROOM CONTEXT:
- The customer is ALREADY HERE - they do NOT need to "come in" or "visit"
- You can offer to have vehicles brought to the front, get keys, arrange test drives
- You can notify the sales team, appraisal team, or finance team directly
- NEVER say "head into the dealership", "visit us", "come see us"
- Instead say "I can have that brought up front", "Let me get the keys", "I'll let the team know you're here"

PERSONALITY:
- Warm, helpful, conversational (not pushy)
- Knowledgeable about Chevrolet vehicles
- Patient with questions
- Focus on understanding needs before recommendations

RESPONSE FORMAT:
You MUST respond with a JSON object in this exact format:
``````````json
{{
  "message": "Your conversational response to the customer",
  "suggestedVehicles": [
    {{"stockNumber": "M12345", "confidence": 0.9, "reason": "Matches their truck needs"}}
  ],
  "intent": "browse|compare|trade-in|test-drive|financing|general",
  "nextAction": "Suggested next step if any",
  "shouldNotifyStaff": false,
  "staffNotificationType": null
}}
``````````

INTENT CATEGORIES:
- "browse": Customer is exploring options
- "compare": Customer wants to compare specific vehicles
- "trade-in": Customer mentioned trading their current vehicle
- "test-drive": Customer wants to see/drive a vehicle
- "financing": Customer asking about payments/financing
- "general": General questions or conversation

WHEN TO NOTIFY STAFF (set shouldNotifyStaff: true):
- Customer ready for test drive → staffNotificationType: "sales"
- Customer wants trade-in appraisal → staffNotificationType: "appraisal"
- Customer ready to discuss financing → staffNotificationType: "finance"

TRADE-IN CONVERSATION FLOW:
When customer mentions trading/upgrading:
1. Acknowledge positively
2. Ask about current monthly payment
3. Ask if leasing or financing
4. Ask about payoff amount and lender

TRADE-IN VALUATION POLICY:
- NEVER provide dollar amounts for trade-ins
- ALWAYS offer to notify Appraisal department for FREE professional appraisal
- Mention appraisal takes ~10-15 minutes
- Combine with offering to bring a vehicle up front while they wait

INVENTORY CONTEXT:
{inventory_context}

Remember: Focus on understanding their complete situation - trade, budget, financing - to provide the best guidance. Always respond with valid JSON."""


class RetryConfig:
    """Configuration for retry behavior"""
    def __init__(
        self, 
        max_retries: int = MAX_RETRIES,
        base_delay: float = BASE_DELAY,
        max_delay: float = MAX_DELAY
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay


async def call_with_retry(
    func,
    retry_config: RetryConfig = RetryConfig(),
    *args,
    **kwargs
) -> Any:
    """
    Execute an async function with exponential backoff retry.
    
    Args:
        func: Async function to execute
        retry_config: Retry configuration
        *args, **kwargs: Arguments to pass to func
        
    Returns:
        Result from successful function call
        
    Raises:
        Last exception if all retries fail
    """
    last_exception = None
    
    for attempt in range(retry_config.max_retries):
        try:
            return await func(*args, **kwargs)
        except (httpx.HTTPStatusError, httpx.RequestError, httpx.TimeoutException) as e:
            last_exception = e
            
            if attempt < retry_config.max_retries - 1:
                # Calculate delay with exponential backoff and jitter
                delay = min(
                    retry_config.base_delay * (2 ** attempt),
                    retry_config.max_delay
                )
                # Add jitter (±20%)
                import random
                delay = delay * (0.8 + random.random() * 0.4)
                
                logger.warning(
                    f"API call failed (attempt {attempt + 1}/{retry_config.max_retries}), "
                    f"retrying in {delay:.2f}s: {str(e)}"
                )
                
                await asyncio.sleep(delay)
            else:
                logger.error(f"API call failed after {retry_config.max_retries} attempts: {str(e)}")
    
    raise last_exception


async def call_anthropic_api(
    messages: List[Dict[str, str]],
    system: str,
    timeout: float = 30.0
) -> Dict[str, Any]:
    """
    Make a call to the Anthropic API with proper error handling.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            ANTHROPIC_API_URL,
            headers={
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1500,
                "system": system,
                "messages": messages
            },
            timeout=timeout
        )
        
        response.raise_for_status()
        return response.json()


def parse_structured_response(raw_text: str) -> Optional[AIStructuredResponse]:
    """
    Parse structured JSON from AI response.
    Handles various formatting issues gracefully.
    """
    try:
        # Try to extract JSON from markdown code blocks
        json_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', raw_text)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find raw JSON object
            json_match = re.search(r'\{[\s\S]*\}', raw_text)
            if json_match:
                json_str = json_match.group(0)
            else:
                return None
        
        data = json.loads(json_str)
        
        # Validate and normalize suggestedVehicles
        vehicles = []
        for v in data.get("suggestedVehicles", []):
            if isinstance(v, dict) and "stockNumber" in v:
                vehicles.append(VehicleSuggestion(
                    stockNumber=v["stockNumber"],
                    confidence=float(v.get("confidence", 0.5)),
                    reason=v.get("reason", "Recommended match")
                ))
        
        return AIStructuredResponse(
            message=data.get("message", raw_text),
            suggestedVehicles=vehicles,
            intent=data.get("intent"),
            nextAction=data.get("nextAction"),
            shouldNotifyStaff=data.get("shouldNotifyStaff", False),
            staffNotificationType=data.get("staffNotificationType")
        )
        
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning(f"Failed to parse structured response: {e}")
        return None


def extract_stock_numbers(text: str) -> List[str]:
    """Extract stock numbers from text (fallback for non-structured responses)"""
    pattern = r'M\d{4,6}'
    matches = re.findall(pattern, text, re.IGNORECASE)
    return list(set(matches))


def generate_fallback_response(message: str, customer_name: Optional[str] = None) -> str:
    """Generate a helpful fallback response when AI is unavailable"""
    greeting = f"Hi {customer_name}! " if customer_name else "Hi there! "
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['truck', 'tow', 'haul', 'work']):
        return f"{greeting}Looking for a truck? Great choice! Our Silverado lineup is perfect for work and play. The Silverado 1500 offers excellent towing capacity up to 13,300 lbs, while the 2500HD and 3500HD are built for serious hauling. Would you like me to show you what's available?"
    
    elif any(word in message_lower for word in ['suv', 'family', 'space', 'kids']):
        return f"{greeting}For family needs, I'd recommend our SUV lineup! The Equinox is perfect for small families, the Traverse offers three rows, and the Tahoe/Suburban are ideal for larger families. What size are you thinking?"
    
    elif any(word in message_lower for word in ['electric', 'ev', 'hybrid', 'efficient']):
        return f"{greeting}Interested in going electric? Check out our Equinox EV with up to 319 miles of range, or the Silverado EV for truck capability with zero emissions. Both qualify for federal tax credits!"
    
    elif any(word in message_lower for word in ['sport', 'fast', 'performance', 'fun']):
        return f"{greeting}Looking for something exciting? The Corvette is an American icon with mid-engine performance! We also have the legendary Camaro for muscle car heritage. Want me to show you what's in stock?"
    
    elif any(word in message_lower for word in ['budget', 'cheap', 'affordable', 'price']):
        return f"{greeting}We have great options at every price point! The Trax starts around $22k, Trailblazer around $24k, and Equinox around $28k. What's your target monthly payment?"
    
    else:
        return f"{greeting}I'd love to help you find the perfect vehicle! Could you tell me a bit more about what you're looking for? For example:\n\n• What will you primarily use it for?\n• How many passengers typically?\n• Any must-have features?\n• Budget in mind?"


async def log_interaction(
    session_id: Optional[str],
    request_message: str,
    response_message: str,
    structured_data: Optional[AIStructuredResponse],
    latency_ms: float,
    success: bool,
    error: Optional[str] = None
):
    """Log interaction for analytics and debugging"""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "session_id": session_id,
        "prompt_version": PROMPT_VERSION,
        "request_preview": request_message[:100],
        "response_preview": response_message[:100],
        "latency_ms": round(latency_ms, 2),
        "success": success,
        "has_structured_data": structured_data is not None,
        "intent": structured_data.intent if structured_data else None,
        "suggested_count": len(structured_data.suggestedVehicles) if structured_data else 0,
        "error": error,
    }
    
    logger.info(f"AI_INTERACTION: {json.dumps(log_entry)}")


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(request: AIChatRequest, background_tasks: BackgroundTasks):
    """
    Process a chat message and return AI response with structured vehicle recommendations.
    
    Features:
    - Structured JSON output with vehicle suggestions
    - Automatic retry with exponential backoff
    - Intent detection for workflow routing
    - Staff notification triggers
    """
    start_time = datetime.utcnow()
    
    # Check for API key
    if not ANTHROPIC_API_KEY:
        return AIChatResponse(
            message=generate_fallback_response(request.message, request.customerName),
            suggestedVehicles=None,
            metadata={"fallback": True, "reason": "no_api_key"}
        )
    
    try:
        # Build the system prompt with inventory context
        system = SYSTEM_PROMPT.format(inventory_context=request.inventoryContext)
        
        # Build conversation messages
        messages = []
        
        # Add conversation history (last 10 messages)
        for msg in request.conversationHistory[-10:]:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current message
        user_message = request.message
        if request.customerName and not request.conversationHistory:
            user_message = f"(Customer's name is {request.customerName}) {request.message}"
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call Anthropic API with retry
        result = await call_with_retry(
            call_anthropic_api,
            RetryConfig(),
            messages=messages,
            system=system
        )
        
        raw_response = result.get("content", [{}])[0].get("text", "")
        
        # Parse structured response
        structured = parse_structured_response(raw_response)
        
        if structured:
            # Use structured message
            response_message = structured.message
            suggested_vehicles = [v.stockNumber for v in structured.suggestedVehicles]
        else:
            # Fall back to raw response with regex extraction
            response_message = raw_response
            # Try to clean up JSON artifacts if parsing failed
            response_message = re.sub(r'```(?:json)?\s*\{[\s\S]*?\}\s*```', '', response_message).strip()
            if not response_message:
                response_message = raw_response
            suggested_vehicles = extract_stock_numbers(raw_response)
        
        # Calculate latency
        latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        # Log interaction in background
        background_tasks.add_task(
            log_interaction,
            request.sessionId,
            request.message,
            response_message,
            structured,
            latency_ms,
            True
        )
        
        return AIChatResponse(
            message=response_message,
            suggestedVehicles=suggested_vehicles if suggested_vehicles else None,
            structuredData=structured,
            metadata={
                "prompt_version": PROMPT_VERSION,
                "latency_ms": round(latency_ms, 2),
                "structured_parse_success": structured is not None,
            }
        )
        
    except Exception as e:
        # Calculate latency even for errors
        latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        logger.error(f"AI Chat error: {str(e)}")
        
        # Log failed interaction
        background_tasks.add_task(
            log_interaction,
            request.sessionId,
            request.message,
            "",
            None,
            latency_ms,
            False,
            str(e)
        )
        
        return AIChatResponse(
            message=generate_fallback_response(request.message, request.customerName),
            suggestedVehicles=None,
            metadata={
                "fallback": True,
                "reason": "api_error",
                "error": str(e)[:100],
                "latency_ms": round(latency_ms, 2),
            }
        )


@router.get("/health")
async def ai_health_check():
    """Health check endpoint for AI service"""
    return {
        "status": "healthy",
        "api_key_configured": bool(ANTHROPIC_API_KEY),
        "prompt_version": PROMPT_VERSION,
    }


@router.get("/config")
async def get_ai_config():
    """Get current AI configuration (for debugging)"""
    return {
        "prompt_version": PROMPT_VERSION,
        "max_retries": MAX_RETRIES,
        "base_delay": BASE_DELAY,
        "max_delay": MAX_DELAY,
        "model": "claude-sonnet-4-20250514",
    }
