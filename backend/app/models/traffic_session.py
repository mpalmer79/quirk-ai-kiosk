"""
SQLAlchemy model for Traffic Sessions.
Stores kiosk customer session data in PostgreSQL.
"""
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Float, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database import Base


class TrafficSession(Base):
    """Traffic session model for PostgreSQL storage."""
    
    __tablename__ = "traffic_sessions"
    
    # Primary key
    session_id = Column(String(50), primary_key=True, index=True)
    
    # Customer info
    customer_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Journey tracking
    path = Column(String(50), nullable=True)  # stockLookup, modelBudget, aiChat, etc.
    current_step = Column(String(50), nullable=True)
    
    # Vehicle interest (JSONB for complex nested data)
    vehicle_interest = Column(JSONB, nullable=True)  # {model, cab, colors[]}
    
    # Budget info
    budget = Column(JSONB, nullable=True)  # {min, max, downPaymentPercent}
    
    # Trade-in info
    trade_in = Column(JSONB, nullable=True)  # {hasTrade, vehicle{}, hasPayoff, payoffAmount, etc.}
    
    # Selected vehicle
    vehicle = Column(JSONB, nullable=True)  # {stockNumber, year, make, model, trim, msrp}
    
    # Payment info
    payment = Column(JSONB, nullable=True)  # {type, monthly, term, downPayment}
    
    # Flags
    vehicle_requested = Column(Boolean, default=False)
    
    # Actions and history
    actions = Column(JSONB, default=list)  # List of actions taken
    chat_history = Column(JSONB, nullable=True)  # AI chat conversation
    quiz_answers = Column(JSONB, nullable=True)
    
    # Timestamps (stored in Eastern Time)
    created_at = Column(String(30), nullable=False)
    updated_at = Column(String(30), nullable=False)
    
    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        return {
            "sessionId": self.session_id,
            "customerName": self.customer_name,
            "phone": self.phone,
            "path": self.path,
            "currentStep": self.current_step,
            "vehicleInterest": self.vehicle_interest,
            "budget": self.budget,
            "tradeIn": self.trade_in,
            "vehicle": self.vehicle,
            "payment": self.payment,
            "vehicleRequested": self.vehicle_requested,
            "actions": self.actions or [],
            "chatHistory": self.chat_history,
            "quizAnswers": self.quiz_answers,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "TrafficSession":
        """Create model from dictionary."""
        return cls(
            session_id=data.get("sessionId"),
            customer_name=data.get("customerName"),
            phone=data.get("phone"),
            path=data.get("path"),
            current_step=data.get("currentStep"),
            vehicle_interest=data.get("vehicleInterest"),
            budget=data.get("budget"),
            trade_in=data.get("tradeIn"),
            vehicle=data.get("vehicle"),
            payment=data.get("payment"),
            vehicle_requested=data.get("vehicleRequested", False),
            actions=data.get("actions", []),
            chat_history=data.get("chatHistory"),
            quiz_answers=data.get("quizAnswers"),
            created_at=data.get("createdAt"),
            updated_at=data.get("updatedAt"),
        )
