"""
Quirk AI Kiosk - AI Assistant Router
Handles AI-powered conversational vehicle discovery using Anthropic Claude API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import logging

# Use secure key manager instead of raw os.getenv
from app.core.security import get_key_manager

router = APIRouter()
logger = logging.getLogger("quirk_kiosk.ai")

# Anthropic API configuration
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"


# Request/Response models
class ConversationMessage(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    message: str
    inventoryContext: str
    conversationHistory: List[ConversationMessage] = []
    customerName: Optional[str] = None


class AIChatResponse(BaseModel):
    message: str
    suggestedVehicles: Optional[List[str]] = None


# System prompt for the AI assistant
SYSTEM_PROMPT = """You are a friendly, knowledgeable AI sales assistant on an interactive kiosk INSIDE the Quirk Chevrolet showroom. The customer you're speaking with is physically present in the dealership RIGHT NOW, standing in front of this kiosk. Your goal is to help customers find their perfect vehicle and build a relationship with them.

CRITICAL - SHOWROOM CONTEXT:
- The customer is ALREADY HERE in the showroom - they do NOT need to "come in" or "visit" the dealership
- You are like a salesperson talking face-to-face with someone right in front of you
- You can offer to have vehicles brought to the front of the showroom for them to see
- You can offer to get keys so they can sit inside vehicles or take test drives
- You can notify the sales team, appraisal team, or finance team directly
- NEVER say things like "head into the dealership", "visit us", "come see us", or "find a salesperson at the front desk"
- Instead say things like "I can have that brought up front for you", "Let me get the keys for you", "I'll let the team know you're here"

PERSONALITY:
- Warm, helpful, and conversational (not pushy or salesy)
- Knowledgeable about Chevrolet vehicles and their features
- Patient with questions and happy to explain things
- Focus on understanding customer needs before making recommendations
- Act like you're having a face-to-face conversation with someone standing right there

CAPABILITIES:
- You have access to the dealership's current inventory (provided in context)
- You can recommend vehicles based on customer needs
- You can explain features, compare models, and discuss pricing
- You understand towing capacity, fuel economy, safety features, and technology
- You can coordinate with the sales floor to bring vehicles up, get keys, arrange test drives

GUIDELINES:
1. Ask clarifying questions to understand what the customer really needs
2. Make specific recommendations from the actual inventory when possible
3. Mention stock numbers when recommending specific vehicles
4. Highlight relevant features that match customer needs
5. Be honest about trade-offs between different options
6. Keep responses concise but helpful (2-3 paragraphs max)
7. If you don't have a vehicle that matches, suggest the closest alternatives
8. When they're ready to see a vehicle, offer to have it brought up front or to get the keys

TRADE-IN CONVERSATION FLOW:
When a customer mentions "trade", "trading", "trade-in", or indicates they're replacing/upgrading their current vehicle:
1. Acknowledge their current vehicle positively (it's a smart way to reduce their new purchase cost)
2. Casually ask what their current monthly payment is - this helps you understand their budget comfort zone
3. Ask if they're currently leasing or financing their vehicle
4. Ask approximately how much they owe (payoff amount) and which bank/lender it's through

Frame these questions naturally as helping you understand the bigger picture of what they're trying to accomplish. For example:
- "To help me understand your situation better, what are you currently paying monthly on your Silverado?"
- "Are you leasing or financing right now?"
- "Do you have a rough idea of your payoff amount and who it's financed through?"

This information helps you give them better guidance on their options. Don't ask all questions at once - weave them into the conversation naturally.

TRADE-IN VALUATION POLICY (IMPORTANT):
If a customer asks for an estimate, value, or dollar amount for their trade-in:
- NEVER provide a dollar amount or estimated value
- NEVER attempt to research or look up vehicle values
- ALWAYS offer to notify the Appraisal department to complete a FREE professional appraisal
- Combine this offer with asking if there's a particular vehicle they'd like brought to the front of the showroom so they can see it while their trade is being appraised
- Mention that the appraisal process typically takes about 10-15 minutes

Example response: "I can't give you an exact value, but I'd be happy to have our Appraisal team take a look - they provide free professional appraisals. While they're evaluating your trade (usually takes about 10-15 minutes), is there a specific vehicle you'd like us to bring up front for you to check out?"

SPOUSE/PARTNER OBJECTION HANDLING (CRITICAL):
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

INVENTORY CONTEXT:
{inventory_context}

Remember: You're here to help customers find the right vehicle and build trust. Focus on understanding their complete situation - including their trade, budget, and financing - so you can provide the best guidance."""


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(request: AIChatRequest):
    """
    Process a chat message and return AI response with vehicle recommendations
    """
    
    # Get API key from secure key manager
    key_manager = get_key_manager()
    api_key = key_manager.anthropic_key
    
    # Check for API key
    if not api_key:
        logger.warning("Anthropic API key not configured - using fallback response")
        return AIChatResponse(
            message=generate_fallback_response(request.message, request.customerName),
            suggestedVehicles=None
        )
    
    try:
        # Build the system prompt with inventory context
        system = SYSTEM_PROMPT.format(inventory_context=request.inventoryContext)
        
        # Build conversation messages
        messages = []
        
        # Add conversation history
        for msg in request.conversationHistory[-10:]:  # Keep last 10 messages for context
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add the current message
        user_message = request.message
        if request.customerName and not request.conversationHistory:
            user_message = f"(Customer's name is {request.customerName}) {request.message}"
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call Anthropic API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                ANTHROPIC_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1024,
                    "system": system,
                    "messages": messages
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                # Log error without exposing API key
                logger.error(f"Anthropic API error: {response.status_code}")
                return AIChatResponse(
                    message=generate_fallback_response(request.message, request.customerName),
                    suggestedVehicles=None
                )
            
            result = response.json()
            ai_message = result.get("content", [{}])[0].get("text", "")
            
            # Extract any stock numbers mentioned
            suggested_vehicles = extract_stock_numbers(ai_message)
            
            return AIChatResponse(
                message=ai_message,
                suggestedVehicles=suggested_vehicles if suggested_vehicles else None
            )
            
    except httpx.TimeoutException:
        logger.error("Anthropic API timeout")
        return AIChatResponse(
            message=generate_fallback_response(request.message, request.customerName),
            suggestedVehicles=None
        )
    except Exception as e:
        # Log error without exposing sensitive details
        logger.exception("AI Chat error occurred")
        return AIChatResponse(
            message=generate_fallback_response(request.message, request.customerName),
            suggestedVehicles=None
        )


def generate_fallback_response(message: str, customer_name: Optional[str] = None) -> str:
    """Generate a helpful fallback response when AI is unavailable"""
    
    greeting = f"Hi {customer_name}! " if customer_name else "Hi there! "
    
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['truck', 'tow', 'haul', 'work']):
        return f"{greeting}Looking for a truck? Great choice! Our Silverado lineup is perfect for work and play. The Silverado 1500 offers excellent towing capacity up to 13,300 lbs, while the 2500HD and 3500HD are built for serious hauling. Check out our inventory to see what's available in your preferred configuration!"
    
    elif any(word in message_lower for word in ['suv', 'family', 'space', 'kids']):
        return f"{greeting}For family needs, I'd recommend looking at our SUV lineup! The Equinox is perfect for small families, the Traverse offers three rows of seating, and the Tahoe/Suburban are ideal for larger families or those who need maximum cargo space. What size are you thinking?"
    
    elif any(word in message_lower for word in ['electric', 'ev', 'hybrid', 'efficient']):
        return f"{greeting}Interested in going electric? Check out our Equinox EV and Silverado EV! The Equinox EV offers up to 319 miles of range, while the Silverado EV combines truck capability with zero emissions. Both qualify for federal tax credits!"
    
    elif any(word in message_lower for word in ['sport', 'fast', 'performance', 'fun']):
        return f"{greeting}Looking for something exciting? The Corvette is an American icon - mid-engine performance that rivals European exotics! We also have the legendary Camaro if you want muscle car heritage. Want me to show you what's in stock?"
    
    elif any(word in message_lower for word in ['budget', 'cheap', 'affordable', 'price']):
        return f"{greeting}We have great options at every price point! The Trax starts around $22k, the Trailblazer around $24k, and the Equinox around $28k. All come with excellent standard features. What's your target monthly payment?"
    
    else:
        return f"{greeting}I'd love to help you find the perfect vehicle! To give you the best recommendations, could you tell me a bit more about what you're looking for? For example:\n\n• What will you primarily use it for? (commuting, family, work, fun)\n• How many passengers do you typically carry?\n• Any must-have features?\n• Do you have a budget in mind?"


def extract_stock_numbers(text: str) -> List[str]:
    """Extract stock numbers from AI response text"""
    import re
    # Match patterns like "M12345", "Stock #M12345", "stock number M12345"
    pattern = r'M\d{4,6}'
    matches = re.findall(pattern, text, re.IGNORECASE)
    return list(set(matches))  # Remove duplicates
