"""
Quirk AI Kiosk - AI Assistant Router
Handles AI-powered conversational vehicle discovery using Anthropic Claude API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx

router = APIRouter()

# Anthropic API configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
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
SYSTEM_PROMPT = """You are a friendly, knowledgeable AI sales assistant at Quirk Chevrolet, one of New England's largest Chevrolet dealerships. Your goal is to help customers find their perfect vehicle.

PERSONALITY:
- Warm, helpful, and conversational (not pushy or salesy)
- Knowledgeable about Chevrolet vehicles and their features
- Patient with questions and happy to explain things
- Focus on understanding customer needs before making recommendations

CAPABILITIES:
- You have access to the dealership's current inventory (provided in context)
- You can recommend vehicles based on customer needs
- You can explain features, compare models, and discuss pricing
- You understand towing capacity, fuel economy, safety features, and technology

GUIDELINES:
1. Ask clarifying questions to understand what the customer really needs
2. Make specific recommendations from the actual inventory when possible
3. Mention stock numbers when recommending specific vehicles
4. Highlight relevant features that match customer needs
5. Be honest about trade-offs between different options
6. Keep responses concise but helpful (2-3 paragraphs max)
7. If you don't have a vehicle that matches, suggest the closest alternatives

INVENTORY CONTEXT:
{inventory_context}

Remember: You're here to help customers find the right vehicle, not to push the most expensive option. Focus on fit and value."""

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(request: AIChatRequest):
    """
    Process a chat message and return AI response with vehicle recommendations
    """
    
    # Check for API key
    if not ANTHROPIC_API_KEY:
        # Fallback response when no API key is configured
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
                    "x-api-key": ANTHROPIC_API_KEY,
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
                print(f"Anthropic API error: {response.status_code} - {response.text}")
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
            
    except Exception as e:
        print(f"AI Chat error: {str(e)}")
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
