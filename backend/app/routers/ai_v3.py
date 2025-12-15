"""
Quirk AI Kiosk - Intelligent AI Assistant Router (V3)
Production-grade AI with persistent memory, tool use, and smart vehicle retrieval.

Key Features:
- Persistent conversation state across turns
- Semantic vehicle retrieval (RAG-lite)
- Claude tool use for real actions
- Dynamic context building
- Outcome tracking for learning
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import httpx
import json
import re
import logging
import asyncio
import random
from datetime import datetime
from enum import Enum

# Core services
from app.services.conversation_state import (
    ConversationStateManager,
    ConversationState,
    ConversationStage,
    InterestLevel,
    get_state_manager
)
from app.services.vehicle_retriever import (
    SemanticVehicleRetriever,
    ScoredVehicle,
    get_vehicle_retriever
)
from app.services.outcome_tracker import (
    OutcomeTracker,
    ConversationOutcome,
    get_outcome_tracker
)
from app.services.entity_extraction import get_entity_extractor

# Security
from app.core.security import get_key_manager

router = APIRouter()
logger = logging.getLogger("quirk_ai.intelligent")

# =============================================================================
# CONFIGURATION
# =============================================================================

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
PROMPT_VERSION = "3.3.1"
MODEL_NAME = "claude-sonnet-4-20250514"
MAX_CONTEXT_TOKENS = 4000  # Reserve tokens for context

# Retry configuration (from V2)
MAX_RETRIES = 3
BASE_DELAY = 1.0  # seconds
MAX_DELAY = 10.0  # seconds


async def call_with_retry(
    func,
    max_retries: int = MAX_RETRIES,
    base_delay: float = BASE_DELAY,
    max_delay: float = MAX_DELAY,
    *args,
    **kwargs
) -> Any:
    """
    Execute an async function with exponential backoff retry.
    """
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return await func(*args, **kwargs)
        except (httpx.HTTPStatusError, httpx.RequestError, httpx.TimeoutException) as e:
            last_exception = e
            
            if attempt < max_retries - 1:
                # Calculate delay with exponential backoff and jitter
                delay = min(base_delay * (2 ** attempt), max_delay)
                # Add jitter (±20%)
                delay = delay * (0.8 + random.random() * 0.4)
                
                logger.warning(
                    f"API call failed (attempt {attempt + 1}/{max_retries}), "
                    f"retrying in {delay:.2f}s: {str(e)}"
                )
                
                await asyncio.sleep(delay)
            else:
                logger.error(f"API call failed after {max_retries} attempts: {str(e)}")
    
    raise last_exception

# Tool definitions for Claude
TOOLS = [
    {
        "name": "calculate_budget",
        "description": "Calculate what vehicle price a customer can afford based on their down payment and desired monthly payment. ALWAYS use this when a customer mentions both a down payment AND monthly payment amount. Uses 7% APR at 84 months.",
        "input_schema": {
            "type": "object",
            "properties": {
                "down_payment": {
                    "type": "number",
                    "description": "Customer's cash down payment amount in dollars"
                },
                "monthly_payment": {
                    "type": "number",
                    "description": "Customer's desired monthly payment amount in dollars"
                },
                "apr": {
                    "type": "number",
                    "description": "Annual percentage rate (default 7.0 if not specified)",
                    "default": 7.0
                },
                "term_months": {
                    "type": "integer",
                    "description": "Loan term in months (default 84 if not specified)",
                    "default": 84
                }
            },
            "required": ["down_payment", "monthly_payment"]
        }
    },
    {
        "name": "search_inventory",
        "description": "Search dealership inventory for vehicles matching customer needs. Use this when the customer asks about available vehicles, specific models, or wants recommendations.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Natural language search query based on customer needs (e.g., 'blue truck for towing', 'family SUV under 50k')"
                },
                "body_style": {
                    "type": "string",
                    "description": "Filter by body style: Truck, SUV, Van, Sedan, Sports Car",
                    "enum": ["Truck", "SUV", "Van", "Sedan", "Sports Car", "Coupe", "Convertible"]
                },
                "max_price": {
                    "type": "number",
                    "description": "Maximum price filter"
                },
                "min_seating": {
                    "type": "integer",
                    "description": "Minimum seating capacity needed"
                },
                "min_towing": {
                    "type": "integer",
                    "description": "Minimum towing capacity in lbs"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_vehicle_details",
        "description": "Get detailed information about a specific vehicle by stock number. Use when customer asks about a specific vehicle or wants more details.",
        "input_schema": {
            "type": "object",
            "properties": {
                "stock_number": {
                    "type": "string",
                    "description": "The vehicle stock number (e.g., M12345)"
                }
            },
            "required": ["stock_number"]
        }
    },
    {
        "name": "find_similar_vehicles",
        "description": "Find vehicles similar to one the customer likes. Use when they want alternatives or comparisons.",
        "input_schema": {
            "type": "object",
            "properties": {
                "stock_number": {
                    "type": "string",
                    "description": "Stock number of the vehicle to find similar matches for"
                }
            },
            "required": ["stock_number"]
        }
    },
    {
        "name": "notify_staff",
        "description": "Notify dealership staff to assist the customer. Use when customer is ready for test drive, wants appraisal, or needs finance help.",
        "input_schema": {
            "type": "object",
            "properties": {
                "notification_type": {
                    "type": "string",
                    "description": "Type of staff to notify",
                    "enum": ["sales", "appraisal", "finance"]
                },
                "message": {
                    "type": "string",
                    "description": "Brief message about what the customer needs"
                },
                "vehicle_stock": {
                    "type": "string",
                    "description": "Stock number of vehicle customer is interested in (if applicable)"
                }
            },
            "required": ["notification_type", "message"]
        }
    },
    {
        "name": "mark_favorite",
        "description": "Mark a vehicle as a customer favorite for quick reference.",
        "input_schema": {
            "type": "object",
            "properties": {
                "stock_number": {
                    "type": "string",
                    "description": "Stock number to mark as favorite"
                }
            },
            "required": ["stock_number"]
        }
    },
    {
        "name": "lookup_conversation",
        "description": "Look up a customer's previous conversation using their phone number. Use this when customer says they want to continue a previous conversation or when they provide a phone number to retrieve their history.",
        "input_schema": {
            "type": "object",
            "properties": {
                "phone_number": {
                    "type": "string",
                    "description": "Customer's 10-digit phone number (digits only, e.g., '6175551234')"
                }
            },
            "required": ["phone_number"]
        }
    },
    {
        "name": "save_customer_phone",
        "description": "Save the customer's phone number to their conversation for future lookup. Use this when customer provides their phone number.",
        "input_schema": {
            "type": "object",
            "properties": {
                "phone_number": {
                    "type": "string",
                    "description": "Customer's 10-digit phone number"
                }
            },
            "required": ["phone_number"]
        }
    }
]

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class ConversationMessage(BaseModel):
    role: str
    content: str


class IntelligentChatRequest(BaseModel):
    message: str
    session_id: str
    conversation_history: List[ConversationMessage] = []
    customer_name: Optional[str] = None


class VehicleRecommendation(BaseModel):
    stock_number: str
    model: str
    price: Optional[float]
    match_reasons: List[str]
    score: float


class IntelligentChatResponse(BaseModel):
    message: str
    vehicles: Optional[List[VehicleRecommendation]] = None
    conversation_state: Optional[Dict[str, Any]] = None
    tools_used: List[str] = []
    staff_notified: bool = False
    metadata: Optional[Dict[str, Any]] = None


# =============================================================================
# SYSTEM PROMPT - DYNAMIC CONTEXT AWARE
# =============================================================================

SYSTEM_PROMPT_TEMPLATE = """You are a knowledgeable, friendly AI sales assistant on an interactive kiosk INSIDE the Quirk Chevrolet showroom. The customer is standing in front of you RIGHT NOW.

CRITICAL SHOWROOM CONTEXT:
- Customer is ALREADY HERE - never say "come in" or "visit us"
- You can have vehicles brought up front, get keys, arrange test drives
- You can notify sales, appraisal, or finance teams directly
- Say things like "I can have that brought up front", "Let me get the keys"

🌐 LANGUAGE DETECTION (CRITICAL):
- If the customer writes in Spanish, YOU MUST RESPOND ENTIRELY IN SPANISH
- Match the customer's language automatically
- Examples of Spanish triggers: "¿Habla español?", "Busco", "Quiero", "Necesito", "camioneta", "carro"
- When responding in Spanish, maintain the same helpful, friendly tone
- Use proper Spanish automotive terminology (camioneta = truck, SUV = SUV, sedán = sedan)

PERSONALITY:
- Warm, helpful, conversational (not pushy)
- Patient and understanding
- Focused on finding the RIGHT vehicle, not just ANY vehicle

YOUR CAPABILITIES (Use these tools!):
- calculate_budget: CRITICAL - Calculate what vehicle price customer can afford from down payment + monthly payment
- search_inventory: Find vehicles matching customer needs
- get_vehicle_details: Get specifics on a vehicle
- find_similar_vehicles: Show alternatives
- notify_staff: Get sales/appraisal/finance to help
- mark_favorite: Save vehicles customer likes
- lookup_conversation: Retrieve a customer's previous conversation by phone
- save_customer_phone: Save customer's phone to their conversation

💰 BUDGET QUALIFICATION (MANDATORY - DO THIS FIRST!):
⚠️ STOP! When a customer mentions BOTH a down payment AND monthly payment:
1. You MUST use calculate_budget tool FIRST - before ANY other tool
2. You MUST wait for the result before calling search_inventory
3. You MUST use the calculated max_price when searching - NO EXCEPTIONS
4. You MUST NOT show vehicles above their budget - this wastes their time

Example: Customer says "$10,000 down, $600/month" or "10 grand down, 600 a month"
- FIRST: Call calculate_budget(down_payment=10000, monthly_payment=600)
- Result shows: max vehicle price ~$49,750
- THEN: Call search_inventory with max_price=49750
- Show ONLY vehicles under $50k

WRONG: Showing $80k trucks to someone who can afford $50k
WRONG: Notifying sales before qualifying the customer's budget
WRONG: Searching inventory without using calculate_budget first

RIGHT: "With $10,000 down and $600/month at 7% APR for 84 months, you can look at vehicles up to about $49,750. Let me find Silverado 1500s in that range..."

ALWAYS DISCLOSE: "Taxes and fees are separate. NH doesn't tax vehicle payments, but other states may add tax on top of the monthly payment."

CONVERSATION GUIDELINES:
1. Use search_inventory when customer describes what they want
2. Use get_vehicle_details when discussing specific stock numbers
3. Use notify_staff when customer is ready for test drive or appraisal
4. Always mention stock numbers when recommending vehicles
5. Keep responses conversational and concise (2-3 paragraphs max)

CONTINUE CONVERSATION FLOW:
When customer says "continue our conversation" or similar:
1. Ask for their 10-digit phone number (be friendly about it)
2. Use lookup_conversation tool with their phone number
3. If found, summarize what you remember and ask how to proceed
4. If not found, kindly explain and offer to start fresh

SAVING CUSTOMER INFO:
- After a productive conversation, offer to save their phone number
- Use save_customer_phone to store it for future visits
- This lets them continue where they left off next time

{conversation_context}

{inventory_context}

TRADE-IN POLICY:
- NEVER give dollar values for trade-ins
- Offer FREE professional appraisal (takes ~10-15 minutes)
- Ask about: current payment, lease vs finance, payoff amount, lender

⚠️ CRITICAL TRADE-IN RULE:
When a customer mentions trading in a vehicle (e.g., "I'm trading in my Equinox"):
- The trade-in vehicle is what they're GETTING RID OF, not what they want to buy
- NEVER search for or show vehicles matching the trade-in model
- Continue showing vehicles that match their ORIGINAL request (e.g., trucks for towing)
- Example: If customer wants "a truck to tow a boat" and says "I'm trading in my Equinox":
  - CORRECT: Continue showing Silverado trucks
  - WRONG: Show Equinox vehicles for sale

SPOUSE OBJECTION HANDLING (CRITICAL):
When a customer says they "need to talk to my wife/husband/spouse/partner" or indicates they can't decide alone, follow this proven 6-step process:

Step 1 - Acknowledge & Validate:
"I completely understand - this is a major decision you want to share with your [wife/husband/partner]. That makes perfect sense."
(Establishes empathy and trust - never make them feel pressured)

Step 2 - Introduce Urgency & Incentive:
"We do have a significant incentive available right now that makes this a particularly advantageous time. This kind of offer is time-sensitive and may not be available tomorrow."
(Creates urgency while highlighting present value - be specific about the incentive if you know it)

Step 3 - Propose Calling the Spouse (Primary Option):
"Considering how great this offer is, would you like to call [her/him] right now? You can put me on speaker, and I can quickly go over the key benefits and answer any questions [she/he] might have immediately. That way you won't miss out on this pricing."
(Proactive solution that maintains momentum)

Step 4 - Propose Test Drive/Take-Home (Fallback if they decline calling):
"No problem at all - my goal is to make sure you're both comfortable with this. How about this: would you like to take this vehicle for a drive to show [her/him]? I can get temporary plates ready so you can take it home for an hour or so. That way you can discuss it in person and [she/he] can see it firsthand."
(Physical presence of the vehicle helps secure the decision and gets the spouse invested)

Step 5 - Isolate & Confirm Commitment:
"If you drive it over now, and you both decide this is the perfect vehicle, are you in a position to finalize the purchase when you return today?"
(Ensures commitment and prevents further stalling - gets verbal agreement)

Step 6 - Provide Information & Set Follow-up:
"Great! I'll prepare a detailed summary with this specific vehicle's VIN, the complete price breakdown, and all the incentive details. What time should I expect you back, or when would be the best time for me to follow up with you and your [wife/husband] this evening?"
(Structures the exit and the next interaction - never let them leave without a specific follow-up time)

KEY PRINCIPLES:
- Always validate their need to discuss with their partner - it's a reasonable request
- Present options, not ultimatums
- The goal is to INVOLVE the spouse in the decision, not bypass them
- Getting the vehicle in front of the spouse is the strongest close
- Always get a specific follow-up time - "I'll call you" is not specific enough
- If they insist on leaving without commitment, get their phone number and a specific callback time

Remember: You have TOOLS - use them to provide real, accurate inventory information!"""


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def build_dynamic_context(state: ConversationState) -> str:
    """Build dynamic context from conversation state"""
    if not state or state.message_count == 0:
        return "CUSTOMER CONTEXT:\nNew customer - no information gathered yet."
    
    context = f"""CUSTOMER CONTEXT (What you know about this customer):
{state.to_context_summary()}

CONVERSATION PROGRESS:
- Messages exchanged: {state.message_count}
- Stage: {state.stage.value}
- Interest level: {state.interest_level.value}"""
    
    # Add explicit trade-in exclusion warning
    if state.trade_model:
        context += f"""

⚠️ TRADE-IN EXCLUSION: Customer is trading in a {state.trade_model}.
DO NOT show or search for {state.trade_model} vehicles - they want something DIFFERENT!
Focus on their original request (what they want to BUY, not trade)."""
    
    return context


def build_inventory_context(retriever: SemanticVehicleRetriever) -> str:
    """Build inventory summary for context"""
    summary = retriever.get_inventory_summary()
    
    if summary.get('total', 0) == 0:
        return "INVENTORY: Unable to load inventory data."
    
    return f"""CURRENT INVENTORY SUMMARY:
- Total vehicles: {summary['total']}
- Types: {', '.join(f"{k}: {v}" for k, v in summary.get('by_body_style', {}).items())}
- Price range: ${summary.get('price_range', {}).get('min', 0):,.0f} - ${summary.get('price_range', {}).get('max', 0):,.0f}
- Top models: {', '.join(summary.get('top_models', {}).keys())}"""


def format_vehicle_for_response(vehicle: Dict[str, Any], reasons: List[str] = None) -> Dict[str, Any]:
    """Format vehicle data for response"""
    return {
        "stock_number": vehicle.get('Stock Number') or vehicle.get('stockNumber', ''),
        "year": vehicle.get('Year') or vehicle.get('year', ''),
        "make": vehicle.get('Make') or vehicle.get('make', 'Chevrolet'),
        "model": vehicle.get('Model') or vehicle.get('model', ''),
        "trim": vehicle.get('Trim') or vehicle.get('trim', ''),
        "price": vehicle.get('MSRP') or vehicle.get('msrp') or vehicle.get('price', 0),
        "body_style": vehicle.get('bodyStyle', ''),
        "drivetrain": vehicle.get('drivetrain', ''),
        "exterior_color": vehicle.get('exteriorColor') or vehicle.get('Exterior Color', ''),
        "features": vehicle.get('features', [])[:5],
        "seating_capacity": vehicle.get('seatingCapacity', 5),
        "towing_capacity": vehicle.get('towingCapacity', 0),
        "match_reasons": reasons or [],
    }


def format_vehicles_for_tool_result(vehicles: List[ScoredVehicle]) -> str:
    """Format vehicle list for tool result to Claude"""
    if not vehicles:
        return "No vehicles found matching the criteria."
    
    result_parts = [f"Found {len(vehicles)} matching vehicles:\n"]
    
    for idx, sv in enumerate(vehicles, 1):
        v = sv.vehicle
        stock = v.get('Stock Number') or v.get('stockNumber', '')
        year = v.get('Year') or v.get('year', '')
        model = v.get('Model') or v.get('model', '')
        trim = v.get('Trim') or v.get('trim', '')
        price = v.get('MSRP') or v.get('msrp') or v.get('price', 0)
        color = v.get('exteriorColor') or v.get('Exterior Color', '')
        
        result_parts.append(
            f"{idx}. Stock #{stock}: {year} {model} {trim}\n"
            f"   Price: ${price:,.0f} | Color: {color}\n"
            f"   Why it matches: {', '.join(sv.match_reasons[:3])}\n"
        )
    
    return '\n'.join(result_parts)


def format_vehicle_details_for_tool(vehicle: Dict[str, Any]) -> str:
    """Format single vehicle details for tool result"""
    if not vehicle:
        return "Vehicle not found."
    
    stock = vehicle.get('Stock Number') or vehicle.get('stockNumber', '')
    year = vehicle.get('Year') or vehicle.get('year', '')
    make = vehicle.get('Make') or vehicle.get('make', 'Chevrolet')
    model = vehicle.get('Model') or vehicle.get('model', '')
    trim = vehicle.get('Trim') or vehicle.get('trim', '')
    price = vehicle.get('MSRP') or vehicle.get('msrp') or vehicle.get('price', 0)
    color = vehicle.get('exteriorColor') or vehicle.get('Exterior Color', '')
    drivetrain = vehicle.get('drivetrain', '')
    features = vehicle.get('features', [])
    seating = vehicle.get('seatingCapacity', 5)
    towing = vehicle.get('towingCapacity', 0)
    
    return f"""Vehicle Details - Stock #{stock}:
{year} {make} {model} {trim}

PRICE: ${price:,.0f}
COLOR: {color}
DRIVETRAIN: {drivetrain}
SEATING: {seating} passengers
TOWING CAPACITY: {towing:,} lbs

KEY FEATURES:
{chr(10).join(f'- {f}' for f in features[:8])}

This vehicle is available in our showroom. I can have it brought up front or get the keys for a closer look."""


# =============================================================================
# TOOL EXECUTION
# =============================================================================

async def execute_tool(
    tool_name: str,
    tool_input: Dict[str, Any],
    state: ConversationState,
    retriever: SemanticVehicleRetriever,
    state_manager: ConversationStateManager
) -> tuple:
    """
    Execute a tool and return the result.
    
    Returns:
        (result_text, vehicles_to_show, staff_notified)
    """
    vehicles_to_show = []
    staff_notified = False
    
    if tool_name == "calculate_budget":
        down_payment = tool_input.get("down_payment", 0)
        monthly_payment = tool_input.get("monthly_payment", 0)
        apr = tool_input.get("apr", 7.0)  # Default 7% APR
        term_months = tool_input.get("term_months", 84)  # Default 84 months
        
        # Calculate present value of loan (what they can finance)
        monthly_rate = apr / 100 / 12
        
        if monthly_rate > 0:
            # PV = PMT × [(1 - (1 + r)^-n) / r]
            pv_factor = (1 - (1 + monthly_rate) ** -term_months) / monthly_rate
            financed_amount = monthly_payment * pv_factor
        else:
            financed_amount = monthly_payment * term_months
        
        max_vehicle_price = down_payment + financed_amount
        total_of_payments = monthly_payment * term_months
        total_interest = total_of_payments - financed_amount
        
        # Update state with budget info
        state.budget_max = max_vehicle_price
        state.down_payment = down_payment
        state.monthly_payment_target = monthly_payment
        
        result = f"""BUDGET CALCULATION RESULT:
- Down Payment: ${down_payment:,.0f}
- Monthly Payment: ${monthly_payment:,.0f}
- APR: {apr}%
- Term: {term_months} months
- Amount Financed: ${financed_amount:,.0f}
- MAX VEHICLE PRICE: ${max_vehicle_price:,.0f}
- Total Interest: ${total_interest:,.0f}

IMPORTANT: Use max_price of {int(max_vehicle_price)} when searching inventory.
DISCLOSE: Taxes and fees are separate. NH doesn't tax payments; other states may add tax."""
        
        return (result, vehicles_to_show, staff_notified)
    
    elif tool_name == "search_inventory":
        query = tool_input.get("query", "")
        
        # Use semantic retrieval
        scored_vehicles = retriever.retrieve(
            query=query,
            conversation_state=state,
            limit=6
        )
        
        if tool_input.get("body_style"):
            scored_vehicles = [
                sv for sv in scored_vehicles 
                if (sv.vehicle.get('bodyStyle') or '').lower() == tool_input['body_style'].lower()
            ]
        
        # Apply max_price filter from tool input OR from calculated budget
        max_price = tool_input.get("max_price")
        if not max_price and state.budget_max:
            # Use budget from calculate_budget tool if no explicit max_price given
            max_price = state.budget_max
            logger.info(f"Using calculated budget max: ${max_price:,.0f}")
        
        if max_price:
            scored_vehicles = [
                sv for sv in scored_vehicles
                if (sv.vehicle.get('MSRP') or sv.vehicle.get('price', 0)) <= max_price
            ]
        
        # CRITICAL: Filter out vehicles matching trade-in model
        # Customer is trading IN this model, not looking to BUY it
        if state.trade_model:
            trade_model_lower = state.trade_model.lower()
            scored_vehicles = [
                sv for sv in scored_vehicles
                if trade_model_lower not in (sv.vehicle.get('Model') or sv.vehicle.get('model', '')).lower()
            ]
            if scored_vehicles:
                logger.info(f"Filtered out {state.trade_model} vehicles (trade-in model)")
        
        vehicles_to_show = scored_vehicles
        result = format_vehicles_for_tool_result(scored_vehicles)
        
    elif tool_name == "get_vehicle_details":
        stock = tool_input.get("stock_number", "")
        vehicle = retriever.get_vehicle_by_stock(stock)
        
        if vehicle:
            vehicles_to_show = [ScoredVehicle(
                vehicle=vehicle, 
                score=100, 
                match_reasons=["Requested by customer"],
                preference_matches={}
            )]
        
        result = format_vehicle_details_for_tool(vehicle)
        
    elif tool_name == "find_similar_vehicles":
        stock = tool_input.get("stock_number", "")
        source_vehicle = retriever.get_vehicle_by_stock(stock)
        
        if source_vehicle:
            similar = retriever.retrieve_similar(source_vehicle, limit=4)
            vehicles_to_show = similar
            result = f"Similar vehicles to Stock #{stock}:\n" + format_vehicles_for_tool_result(similar)
        else:
            result = f"Could not find vehicle {stock} to compare."
            
    elif tool_name == "notify_staff":
        notification_type = tool_input.get("notification_type", "sales")
        message = tool_input.get("message", "Customer needs assistance")
        vehicle_stock = tool_input.get("vehicle_stock")
        
        # Update state
        state.staff_notified = True
        state.staff_notification_type = notification_type
        
        if notification_type == "appraisal":
            state.appraisal_requested = True
        elif notification_type == "sales":
            state.test_drive_requested = True
        
        staff_notified = True
        result = f"✓ {notification_type.title()} team has been notified: {message}"
        if vehicle_stock:
            result += f" (regarding Stock #{vehicle_stock})"
            
    elif tool_name == "mark_favorite":
        stock = tool_input.get("stock_number", "")
        state_manager.mark_vehicle_favorite(state.session_id, stock)
        result = f"✓ Stock #{stock} marked as a favorite. I'll remember this is one you like!"
    
    elif tool_name == "lookup_conversation":
        phone = tool_input.get("phone_number", "")
        # Normalize to digits only
        phone_digits = ''.join(c for c in phone if c.isdigit())
        
        if len(phone_digits) != 10:
            result = "I need a valid 10-digit phone number to look up your previous conversation. Please provide your phone number with area code."
        else:
            previous_state = state_manager.get_state_by_phone(phone_digits)
            
            if previous_state:
                # Found previous conversation - generate summary
                summary_parts = ["✓ Found your previous conversation! Here's what I remember:"]
                
                if previous_state.customer_name:
                    summary_parts.append(f"\nName: {previous_state.customer_name}")
                
                if previous_state.budget_max:
                    summary_parts.append(f"\nBudget: Up to ${previous_state.budget_max:,.0f}")
                
                if previous_state.preferred_types:
                    summary_parts.append(f"\nLooking for: {', '.join(previous_state.preferred_types)}")
                
                if previous_state.use_cases:
                    summary_parts.append(f"\nPrimary use: {', '.join(previous_state.use_cases)}")
                
                if previous_state.favorite_vehicles:
                    summary_parts.append(f"\nFavorite vehicles: {', '.join(previous_state.favorite_vehicles)}")
                
                if previous_state.has_trade_in:
                    trade_info = f"\nTrade-in: {previous_state.trade_year or ''} {previous_state.trade_make or ''} {previous_state.trade_model or ''}"
                    if previous_state.trade_monthly_payment:
                        trade_info += f" (${previous_state.trade_monthly_payment:,.0f}/mo)"
                    summary_parts.append(trade_info)
                
                if previous_state.discussed_vehicles:
                    models = [v.model for v in previous_state.discussed_vehicles.values()][:5]
                    summary_parts.append(f"\nVehicles we discussed: {', '.join(models)}")
                
                summary_parts.append(f"\n\nYour conversation had {previous_state.message_count} messages. How would you like to continue?")
                
                result = ''.join(summary_parts)
                
                # Merge previous state into current session
                state.budget_max = previous_state.budget_max or state.budget_max
                state.budget_min = previous_state.budget_min or state.budget_min
                state.monthly_payment_target = previous_state.monthly_payment_target or state.monthly_payment_target
                state.preferred_types = previous_state.preferred_types or state.preferred_types
                state.preferred_features = previous_state.preferred_features or state.preferred_features
                state.use_cases = previous_state.use_cases or state.use_cases
                state.has_trade_in = previous_state.has_trade_in or state.has_trade_in
                state.trade_year = previous_state.trade_year or state.trade_year
                state.trade_make = previous_state.trade_make or state.trade_make
                state.trade_model = previous_state.trade_model or state.trade_model
                state.trade_monthly_payment = previous_state.trade_monthly_payment or state.trade_monthly_payment
                state.trade_payoff = previous_state.trade_payoff or state.trade_payoff
                state.favorite_vehicles = previous_state.favorite_vehicles or state.favorite_vehicles
                state.customer_phone = phone_digits
                state.customer_name = previous_state.customer_name or state.customer_name
                
                logger.info(f"Merged previous conversation into session {state.session_id}")
            else:
                result = f"I couldn't find a previous conversation with phone number ending in {phone_digits[-4:]}. This might be your first visit, or you may have used a different number. Would you like to start fresh?"
    
    elif tool_name == "save_customer_phone":
        phone = tool_input.get("phone_number", "")
        phone_digits = ''.join(c for c in phone if c.isdigit())
        
        if len(phone_digits) != 10:
            result = "I need a valid 10-digit phone number. Please provide your full phone number with area code."
        else:
            state_manager.set_customer_phone(state.session_id, phone_digits)
            state_manager.persist_session(state.session_id)
            result = f"✓ I've saved your phone number ending in {phone_digits[-4:]}. Next time you visit, just tap 'Continue our conversation' and enter this number to pick up where we left off!"
        
    else:
        result = f"Unknown tool: {tool_name}"
    
    return result, vehicles_to_show, staff_notified


# =============================================================================
# MAIN CHAT ENDPOINT
# =============================================================================

@router.post("/chat", response_model=IntelligentChatResponse)
async def intelligent_chat(
    request: IntelligentChatRequest,
    background_tasks: BackgroundTasks
):
    """
    Intelligent chat endpoint with persistent memory and tool use.
    
    Features:
    - Persistent conversation state
    - Semantic vehicle retrieval
    - Claude tool use for real actions
    - Dynamic context building
    """
    start_time = datetime.utcnow()
    tools_used = []
    all_vehicles = []
    staff_notified = False
    
    # Get services
    key_manager = get_key_manager()
    api_key = key_manager.anthropic_key
    state_manager = get_state_manager()
    retriever = get_vehicle_retriever()
    outcome_tracker = get_outcome_tracker()
    
    # Check API key
    if not api_key:
        return IntelligentChatResponse(
            message=generate_fallback_response(request.message, request.customer_name),
            metadata={"fallback": True, "reason": "no_api_key"}
        )
    
    # Ensure retriever is fitted with inventory
    if not retriever._is_fitted:
        try:
            # Load inventory (you'll need to import/inject this based on your setup)
            from app.routers.inventory import load_inventory
            inventory = load_inventory()
            retriever.fit(inventory)
            logger.info(f"Fitted retriever with {len(inventory)} vehicles")
        except Exception as e:
            logger.error(f"Failed to load inventory for retriever: {e}")
    
    # Get or create conversation state
    state = state_manager.get_or_create_state(
        request.session_id,
        request.customer_name
    )
    
    # Build dynamic system prompt
    conversation_context = build_dynamic_context(state)
    inventory_context = build_inventory_context(retriever)
    
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        conversation_context=conversation_context,
        inventory_context=inventory_context
    )
    
    # Build messages
    messages = []
    for msg in request.conversation_history[-10:]:
        messages.append({"role": msg.role, "content": msg.content})
    
    # Add current message with context hints
    user_message = request.message
    if request.customer_name and not request.conversation_history:
        user_message = f"(Customer's name is {request.customer_name}) {request.message}"
    
    messages.append({"role": "user", "content": user_message})
    
    try:
        # Initial API call with tools
        async with httpx.AsyncClient() as client:
            response = await client.post(
                ANTHROPIC_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": MODEL_NAME,
                    "max_tokens": 2048,
                    "system": system_prompt,
                    "messages": messages,
                    "tools": TOOLS,
                },
                timeout=45.0
            )
            
            if response.status_code != 200:
                logger.error(f"Anthropic API error: {response.status_code}")
                raise Exception(f"API error: {response.status_code}")
            
            result = response.json()
        
        # Process response - handle tool use loop
        max_tool_iterations = 5
        iteration = 0
        final_response = ""
        
        while iteration < max_tool_iterations:
            iteration += 1
            
            stop_reason = result.get("stop_reason")
            content_blocks = result.get("content", [])
            
            # Extract text and tool use blocks
            text_content = ""
            tool_use_blocks = []
            
            for block in content_blocks:
                if block.get("type") == "text":
                    text_content += block.get("text", "")
                elif block.get("type") == "tool_use":
                    tool_use_blocks.append(block)
            
            # If no tool use, we're done
            if stop_reason != "tool_use" or not tool_use_blocks:
                final_response = text_content
                break
            
            # Execute tools and collect results
            tool_results = []
            
            for tool_block in tool_use_blocks:
                tool_name = tool_block.get("name")
                tool_id = tool_block.get("id")
                tool_input = tool_block.get("input", {})
                
                tools_used.append(tool_name)
                logger.info(f"Executing tool: {tool_name} with input: {tool_input}")
                
                # Execute the tool
                tool_result, vehicles, notified = await execute_tool(
                    tool_name,
                    tool_input,
                    state,
                    retriever,
                    state_manager
                )
                
                all_vehicles.extend(vehicles)
                if notified:
                    staff_notified = True
                
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_id,
                    "content": tool_result
                })
            
            # Continue conversation with tool results
            messages.append({"role": "assistant", "content": content_blocks})
            messages.append({"role": "user", "content": tool_results})
            
            # Make another API call
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    ANTHROPIC_API_URL,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": MODEL_NAME,
                        "max_tokens": 2048,
                        "system": system_prompt,
                        "messages": messages,
                        "tools": TOOLS,
                    },
                    timeout=45.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Anthropic API error in tool loop: {response.status_code}")
                    break
                
                result = response.json()
        
        # Update conversation state
        mentioned_vehicles = [sv.vehicle for sv in all_vehicles] if all_vehicles else None
        state = state_manager.update_state(
            session_id=request.session_id,
            user_message=request.message,
            assistant_response=final_response,
            mentioned_vehicles=mentioned_vehicles,
            customer_name=request.customer_name
        )
        
        # Record quality signal
        if tools_used:
            outcome_tracker.record_signal(
                request.session_id,
                "positive",
                f"Used tools: {', '.join(tools_used)}"
            )
        
        # Build response
        vehicle_recommendations = None
        if all_vehicles:
            vehicle_recommendations = [
                VehicleRecommendation(
                    stock_number=sv.vehicle.get('Stock Number') or sv.vehicle.get('stockNumber', ''),
                    model=f"{sv.vehicle.get('Year', '')} {sv.vehicle.get('Model', '')} {sv.vehicle.get('Trim', '')}".strip(),
                    price=sv.vehicle.get('MSRP') or sv.vehicle.get('price'),
                    match_reasons=sv.match_reasons[:3],
                    score=sv.score
                )
                for sv in all_vehicles[:6]
            ]
        
        latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        return IntelligentChatResponse(
            message=final_response,
            vehicles=vehicle_recommendations,
            conversation_state=state.to_dict(),
            tools_used=tools_used,
            staff_notified=staff_notified,
            metadata={
                "prompt_version": PROMPT_VERSION,
                "model": MODEL_NAME,
                "latency_ms": round(latency_ms, 2),
                "tool_iterations": iteration,
                "conversation_stage": state.stage.value,
                "interest_level": state.interest_level.value,
            }
        )
        
    except httpx.TimeoutException:
        logger.error("API timeout")
        outcome_tracker.record_signal(request.session_id, "negative", "API timeout")
        return IntelligentChatResponse(
            message=generate_fallback_response(request.message, request.customer_name),
            metadata={"fallback": True, "reason": "timeout"}
        )
    except Exception as e:
        logger.exception(f"Intelligent chat error: {e}")
        outcome_tracker.record_signal(request.session_id, "negative", f"Error: {str(e)[:50]}")
        return IntelligentChatResponse(
            message=generate_fallback_response(request.message, request.customer_name),
            metadata={"fallback": True, "reason": "error", "error": str(e)[:100]}
        )


# =============================================================================
# ADDITIONAL ENDPOINTS
# =============================================================================

@router.get("/state/{session_id}")
async def get_conversation_state(session_id: str):
    """Get current conversation state for a session"""
    state_manager = get_state_manager()
    state = state_manager.get_state(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return state.to_dict()


@router.post("/state/{session_id}/favorite/{stock_number}")
async def mark_vehicle_favorite(session_id: str, stock_number: str):
    """Mark a vehicle as favorite for a session"""
    state_manager = get_state_manager()
    state_manager.mark_vehicle_favorite(session_id, stock_number)
    return {"status": "ok", "stock_number": stock_number}


@router.get("/lookup/phone/{phone_number}")
async def lookup_by_phone(phone_number: str):
    """
    Look up a previous conversation by phone number.
    Returns conversation state if found.
    """
    state_manager = get_state_manager()
    
    # Normalize phone
    phone_digits = ''.join(c for c in phone_number if c.isdigit())
    
    if len(phone_digits) != 10:
        raise HTTPException(
            status_code=400, 
            detail="Phone number must be exactly 10 digits"
        )
    
    state = state_manager.get_state_by_phone(phone_digits)
    
    if not state:
        raise HTTPException(
            status_code=404, 
            detail="No conversation found for this phone number"
        )
    
    return {
        "found": True,
        "phone_last_four": phone_digits[-4:],
        "conversation": state.to_dict()
    }


@router.post("/state/{session_id}/phone/{phone_number}")
async def save_customer_phone(session_id: str, phone_number: str):
    """Save customer phone number to session for future lookup"""
    state_manager = get_state_manager()
    
    # Normalize phone
    phone_digits = ''.join(c for c in phone_number if c.isdigit())
    
    if len(phone_digits) != 10:
        raise HTTPException(
            status_code=400, 
            detail="Phone number must be exactly 10 digits"
        )
    
    state = state_manager.get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    state_manager.set_customer_phone(session_id, phone_digits)
    state_manager.persist_session(session_id)
    
    return {
        "status": "ok",
        "phone_last_four": phone_digits[-4:],
        "message": "Phone saved. Customer can continue conversation in future visits."
    }


@router.post("/state/{session_id}/finalize")
async def finalize_conversation(
    session_id: str,
    outcome: Optional[str] = None
):
    """Finalize a conversation and record outcome"""
    state_manager = get_state_manager()
    outcome_tracker = get_outcome_tracker()
    
    state = state_manager.get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Convert outcome string to enum if provided
    outcome_enum = None
    if outcome:
        try:
            outcome_enum = ConversationOutcome(outcome)
        except ValueError:
            pass
    
    record = outcome_tracker.finalize_conversation(
        state,
        outcome=outcome_enum,
        prompt_version=PROMPT_VERSION
    )
    
    return record.to_dict()


@router.get("/analytics")
async def get_analytics():
    """Get AI conversation analytics"""
    outcome_tracker = get_outcome_tracker()
    return outcome_tracker.get_analytics()


@router.get("/analytics/suggestions")
async def get_improvement_suggestions():
    """Get suggestions for AI improvement"""
    outcome_tracker = get_outcome_tracker()
    return outcome_tracker.get_improvement_suggestions()


@router.get("/health")
async def health_check():
    """Health check for intelligent AI service"""
    key_manager = get_key_manager()
    retriever = get_vehicle_retriever()
    
    return {
        "status": "healthy",
        "version": PROMPT_VERSION,
        "model": MODEL_NAME,
        "api_key_configured": bool(key_manager.anthropic_key),
        "retriever_fitted": retriever._is_fitted,
        "inventory_count": len(retriever.inventory) if retriever._is_fitted else 0,
    }


# =============================================================================
# FALLBACK RESPONSE
# =============================================================================

def generate_fallback_response(message: str, customer_name: Optional[str] = None) -> str:
    """Generate fallback response when AI is unavailable"""
    message_lower = message.lower()
    
    # Detect Spanish
    spanish_patterns = ['español', 'busco', 'quiero', 'necesito', 'camioneta', 'carro', '¿']
    is_spanish = any(p in message_lower for p in spanish_patterns) or any(c in message for c in 'áéíóúñ')
    
    if is_spanish:
        greeting = f"¡Hola {customer_name}! " if customer_name else "¡Hola! "
        
        if any(word in message_lower for word in ['camioneta', 'truck', 'remolcar', 'trabajo']):
            return f"{greeting}¿Busca una camioneta? ¡Excelente elección! Nuestra línea Silverado ofrece una capacidad de remolque de hasta 13,300 lbs. ¿Le gustaría ver lo que tenemos disponible?"
        
        elif any(word in message_lower for word in ['suv', 'familia', 'espacio', 'niños']):
            return f"{greeting}Para necesidades familiares, le recomiendo nuestra línea de SUV. El Equinox es perfecto para familias pequeñas, el Traverse ofrece tres filas, y el Tahoe/Suburban son ideales para familias más grandes. ¿Qué tamaño busca?"
        
        elif any(word in message_lower for word in ['eléctrico', 'ev', 'híbrido']):
            return f"{greeting}¿Interesado en vehículos eléctricos? Nuestro Equinox EV ofrece hasta 319 millas de autonomía, y el Silverado EV combina capacidad de camioneta con cero emisiones. ¡Ambos califican para créditos fiscales federales!"
        
        elif any(word in message_lower for word in ['precio', 'costo', 'económico', 'presupuesto']):
            return f"{greeting}¡Tenemos opciones para cada presupuesto! El Trax comienza alrededor de $22k, el Trailblazer alrededor de $24k, y el Equinox alrededor de $28k. ¿Qué pago mensual le acomoda?"
        
        else:
            return f"{greeting}¡Me encantaría ayudarle a encontrar el vehículo perfecto! Cuénteme un poco sobre lo que está buscando - ¿para qué lo usará principalmente y hay alguna característica que debe tener?"
    
    # English fallback
    greeting = f"Hi {customer_name}! " if customer_name else "Hi there! "
    
    if any(word in message_lower for word in ['truck', 'tow', 'haul', 'work']):
        return f"{greeting}Looking for a truck? Great choice! Our Silverado lineup offers excellent towing capacity up to 13,300 lbs for the 1500, and our HD trucks can handle serious hauling. Would you like me to show you what's available?"
    
    elif any(word in message_lower for word in ['suv', 'family', 'space', 'kids']):
        return f"{greeting}For family needs, I'd recommend our SUV lineup! The Equinox is perfect for smaller families, Traverse offers three rows, and Tahoe/Suburban are ideal for larger families. What size family are you shopping for?"
    
    elif any(word in message_lower for word in ['electric', 'ev', 'hybrid']):
        return f"{greeting}Interested in electric? Our Equinox EV offers up to 319 miles of range, and the Silverado EV combines truck capability with zero emissions. Both qualify for federal tax credits!"
    
    elif any(word in message_lower for word in ['sport', 'fast', 'performance', 'fun', 'corvette', 'camaro']):
        return f"{greeting}Looking for something exciting? The Corvette is an American icon with mid-engine performance that rivals European exotics! We also have the legendary Camaro for muscle car heritage. Want me to show you what's in stock?"
    
    elif any(word in message_lower for word in ['budget', 'price', 'afford', 'cheap']):
        return f"{greeting}We have options at every price point! The Trax starts around $22k, Trailblazer around $24k, and Equinox around $28k. What monthly payment are you comfortable with?"
    
    else:
        return f"{greeting}I'd love to help you find the perfect vehicle! Tell me a bit about what you're looking for - what will you mainly use it for, and are there any must-have features?"
