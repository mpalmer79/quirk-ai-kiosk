"""
Quirk AI Kiosk - Services Module
Business logic and AI/ML services
"""

# Import only what exists and use absolute imports
from app.services.entity_extraction import ConversationEntityExtractor

__all__ = [
    "ConversationEntityExtractor",
]
