"""
Conversation Entity Extraction Service
Extracts structured data (budget, preferences, trade-in info) from natural language
"""

from typing import Dict, Any, Optional, List
import re
from dataclasses import dataclass, field, asdict


@dataclass
class BudgetInfo:
    """Extracted budget information"""
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    monthly_payment: Optional[float] = None
    down_payment: Optional[float] = None
    has_budget_constraint: bool = False


@dataclass
class TradeInInfo:
    """Extracted trade-in information"""
    mentioned: bool = False
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    mileage: Optional[int] = None
    monthly_payment: Optional[float] = None
    payoff_amount: Optional[float] = None
    lender: Optional[str] = None
    is_lease: Optional[bool] = None


@dataclass
class VehiclePreferences:
    """Extracted vehicle preferences"""
    vehicle_types: List[str] = field(default_factory=list)
    body_styles: List[str] = field(default_factory=list)
    must_have_features: List[str] = field(default_factory=list)
    nice_to_have_features: List[str] = field(default_factory=list)
    use_cases: List[str] = field(default_factory=list)
    min_seating: Optional[int] = None
    min_towing: Optional[int] = None
    fuel_preference: Optional[str] = None
    drivetrain_preference: Optional[str] = None


@dataclass
class CustomerContext:
    """Extracted customer context"""
    family_size: Optional[int] = None
    urgency: str = "browsing"  # browsing, considering, ready_to_buy
    buying_timeline: Optional[str] = None
    previous_vehicle: Optional[str] = None
    sentiment: str = "neutral"  # positive, neutral, frustrated, confused
    # Decision maker tracking
    needs_spouse_approval: bool = False
    spouse_reference: Optional[str] = None  # "wife", "husband", "partner", etc.
    decision_maker_objection: bool = False


@dataclass
class ExtractedEntities:
    """All extracted entities from conversation"""
    budget: BudgetInfo = field(default_factory=BudgetInfo)
    trade_in: TradeInInfo = field(default_factory=TradeInInfo)
    preferences: VehiclePreferences = field(default_factory=VehiclePreferences)
    context: CustomerContext = field(default_factory=CustomerContext)
    mentioned_stock_numbers: List[str] = field(default_factory=list)
    mentioned_models: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "budget": asdict(self.budget),
            "trade_in": asdict(self.trade_in),
            "preferences": asdict(self.preferences),
            "context": asdict(self.context),
            "mentioned_stock_numbers": self.mentioned_stock_numbers,
            "mentioned_models": self.mentioned_models,
        }


class ConversationEntityExtractor:
    """
    Extracts structured entities from customer messages and conversation history.
    Uses rule-based extraction for reliability and speed.
    """
    
    # Chevrolet model names for detection
    CHEVY_MODELS = [
        'SILVERADO', 'COLORADO', 'EQUINOX', 'TRAVERSE', 'TAHOE', 'SUBURBAN',
        'BLAZER', 'TRAILBLAZER', 'TRAX', 'CORVETTE', 'CAMARO', 'MALIBU',
        'EXPRESS', 'BOLT'
    ]
    
    # Common vehicle makes for trade-in detection
    VEHICLE_MAKES = [
        'CHEVROLET', 'CHEVY', 'FORD', 'TOYOTA', 'HONDA', 'NISSAN', 'RAM',
        'GMC', 'JEEP', 'DODGE', 'HYUNDAI', 'KIA', 'SUBARU', 'MAZDA',
        'VOLKSWAGEN', 'VW', 'BMW', 'MERCEDES', 'AUDI', 'LEXUS', 'ACURA',
        'INFINITI', 'CADILLAC', 'LINCOLN', 'BUICK', 'CHRYSLER', 'TESLA'
    ]
    
    # Banks/lenders for trade-in detection
    LENDERS = [
        'ALLY', 'CHASE', 'CAPITAL ONE', 'WELLS FARGO', 'BANK OF AMERICA',
        'GM FINANCIAL', 'FORD CREDIT', 'TOYOTA FINANCIAL', 'HONDA FINANCIAL',
        'SANTANDER', 'WESTLAKE', 'CREDIT UNION', 'NAVY FEDERAL', 'USAA',
        'PNC', 'TD AUTO', 'FIFTH THIRD'
    ]
    
    def extract_all(
        self, 
        message: str, 
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> ExtractedEntities:
        """
        Extract all entities from a message and optionally conversation history.
        
        Args:
            message: Current user message
            conversation_history: List of previous messages [{role, content}]
            
        Returns:
            ExtractedEntities with all detected information
        """
        entities = ExtractedEntities()
        
        # Process current message
        entities.budget = self.extract_budget(message)
        entities.trade_in = self.extract_trade_in(message)
        entities.preferences = self.extract_preferences(message)
        entities.context = self.extract_context(message)
        entities.mentioned_stock_numbers = self.extract_stock_numbers(message)
        entities.mentioned_models = self.extract_model_mentions(message)
        
        # Aggregate from conversation history if provided
        if conversation_history:
            entities = self._aggregate_from_history(entities, conversation_history)
        
        return entities
    
    def extract_budget(self, message: str) -> BudgetInfo:
        """Extract budget-related information from message."""
        budget = BudgetInfo()
        message_lower = message.lower()
        
        # Pattern: "under $X" or "less than $X"
        under_match = re.search(
            r'(?:under|less than|below|max|maximum|up to|no more than)\s*\$?([\d,]+)\s*k?',
            message_lower
        )
        if under_match:
            value = self._parse_money(under_match.group(1), 'k' in message_lower[under_match.end():under_match.end()+2])
            budget.max_price = value
            budget.has_budget_constraint = True
        
        # Pattern: "around $X" or "about $X"
        around_match = re.search(
            r'(?:around|about|approximately|roughly|near)\s*\$?([\d,]+)\s*k?',
            message_lower
        )
        if around_match:
            value = self._parse_money(around_match.group(1), 'k' in message_lower[around_match.end():around_match.end()+2])
            budget.min_price = value * 0.85
            budget.max_price = value * 1.15
            budget.has_budget_constraint = True
        
        # Pattern: "$X to $Y" or "$X - $Y"
        range_match = re.search(
            r'\$?([\d,]+)\s*k?\s*(?:to|-)\s*\$?([\d,]+)\s*k?',
            message_lower
        )
        if range_match:
            budget.min_price = self._parse_money(range_match.group(1), 'k' in message_lower)
            budget.max_price = self._parse_money(range_match.group(2), 'k' in message_lower)
            budget.has_budget_constraint = True
        
        # Pattern: "$X a month" or "$X/month" or "$X per month"
        monthly_match = re.search(
            r'\$?([\d,]+)\s*(?:a|per|/)?\s*month',
            message_lower
        )
        if monthly_match:
            budget.monthly_payment = float(monthly_match.group(1).replace(',', ''))
            budget.has_budget_constraint = True
        
        # Pattern: "$X down" or "$X down payment"
        down_match = re.search(
            r'\$?([\d,]+)\s*k?\s*down',
            message_lower
        )
        if down_match:
            budget.down_payment = self._parse_money(down_match.group(1), 'k' in message_lower)
        
        return budget
    
    def extract_trade_in(self, message: str) -> TradeInInfo:
        """Extract trade-in related information."""
        trade = TradeInInfo()
        message_lower = message.lower()
        
        # Check if trade-in is mentioned
        trade_keywords = ['trade', 'trading', 'trade-in', 'tradein', 'current vehicle', 
                         'my car', 'my truck', 'my suv', 'getting rid of', 'sell my']
        
        if any(kw in message_lower for kw in trade_keywords):
            trade.mentioned = True
        
        # Extract year (4-digit year from 1990-2026)
        year_match = re.search(r'\b(19[89]\d|20[0-2]\d)\b', message)
        if year_match:
            trade.year = int(year_match.group(1))
        
        # Extract make
        for make in self.VEHICLE_MAKES:
            if make.lower() in message_lower:
                trade.make = make.title()
                if make.lower() == 'chevy':
                    trade.make = 'Chevrolet'
                break
        
        # Extract mileage
        mileage_match = re.search(
            r'(\d{1,3}[,.]?\d{3})\s*(?:miles?|mi\b)',
            message_lower
        )
        if mileage_match:
            trade.mileage = int(mileage_match.group(1).replace(',', '').replace('.', ''))
        
        # Alternative: "Xk miles"
        mileage_k_match = re.search(r'(\d{2,3})\s*k\s*miles?', message_lower)
        if mileage_k_match:
            trade.mileage = int(mileage_k_match.group(1)) * 1000
        
        # Extract monthly payment
        payment_match = re.search(
            r'(?:pay(?:ing)?|payment(?:s)?)\s*(?:is|of|about|around)?\s*\$?([\d,]+)\s*(?:a|per)?\s*month',
            message_lower
        )
        if payment_match:
            trade.monthly_payment = float(payment_match.group(1).replace(',', ''))
        
        # Extract payoff amount
        payoff_match = re.search(
            r'(?:owe|payoff|pay off|balance)\s*(?:is|of|about|around)?\s*\$?([\d,]+)\s*k?',
            message_lower
        )
        if payoff_match:
            trade.payoff_amount = self._parse_money(
                payoff_match.group(1), 
                'k' in message_lower[payoff_match.end():payoff_match.end()+2]
            )
        
        # Detect if lease or finance
        if any(word in message_lower for word in ['lease', 'leasing', 'leased']):
            trade.is_lease = True
        elif any(word in message_lower for word in ['finance', 'financing', 'financed', 'loan']):
            trade.is_lease = False
        
        # Extract lender
        for lender in self.LENDERS:
            if lender.lower() in message_lower:
                trade.lender = lender.title()
                break
        
        return trade
    
    def extract_preferences(self, message: str) -> VehiclePreferences:
        """Extract vehicle preference information."""
        prefs = VehiclePreferences()
        message_lower = message.lower()
        
        # Vehicle types
        type_keywords = {
            'truck': ['truck', 'pickup', 'silverado', 'colorado', 'tow', 'haul', 'work truck'],
            'suv': ['suv', 'crossover', 'equinox', 'traverse', 'tahoe', 'suburban', 'blazer'],
            'sports_car': ['sports car', 'corvette', 'camaro', 'fast', 'performance'],
            'electric': ['electric', 'ev', 'plug-in', 'zero emission', 'equinox ev', 'silverado ev'],
            'van': ['van', 'cargo', 'express'],
            'family': ['family car', 'family vehicle', 'minivan'],
        }
        
        for vtype, keywords in type_keywords.items():
            if any(kw in message_lower for kw in keywords):
                if vtype not in prefs.vehicle_types:
                    prefs.vehicle_types.append(vtype)
        
        # Features - must have
        must_have_keywords = {
            'awd': ['awd', 'all wheel', 'all-wheel', '4x4', '4wd', 'four wheel'],
            'third_row': ['third row', '3rd row', 'three row', '7 seat', '8 seat', '7 passenger', '8 passenger'],
            'leather': ['leather'],
            'sunroof': ['sunroof', 'moonroof', 'panoramic roof'],
            'navigation': ['navigation', 'nav', 'gps'],
            'towing': ['tow', 'towing', 'trailer', 'boat', 'camper', 'rv'],
            'heated_seats': ['heated seat'],
            'remote_start': ['remote start'],
            'backup_camera': ['backup camera', 'rear camera', 'rearview camera'],
            'apple_carplay': ['carplay', 'apple carplay', 'android auto'],
        }
        
        for feature, keywords in must_have_keywords.items():
            if any(kw in message_lower for kw in keywords):
                if feature not in prefs.must_have_features:
                    prefs.must_have_features.append(feature)
        
        # Use cases
        use_case_keywords = {
            'commuting': ['commut', 'daily driver', 'to work', 'work and back', 'daily drive'],
            'family': ['family', 'kids', 'children', 'car seat', 'soccer practice'],
            'work': ['work truck', 'job site', 'contractor', 'business', 'tools'],
            'towing': ['tow', 'boat', 'trailer', 'camper', 'rv', 'haul'],
            'off_road': ['off road', 'off-road', 'camping', 'trail', 'outdoor', 'adventure'],
            'road_trips': ['road trip', 'travel', 'long drive', 'vacation'],
            'city_driving': ['city', 'urban', 'parking', 'tight spaces'],
        }
        
        for use_case, keywords in use_case_keywords.items():
            if any(kw in message_lower for kw in keywords):
                if use_case not in prefs.use_cases:
                    prefs.use_cases.append(use_case)
        
        # Fuel preference
        if any(word in message_lower for word in ['electric', 'ev', 'plug-in', 'no gas']):
            prefs.fuel_preference = 'electric'
        elif any(word in message_lower for word in ['hybrid']):
            prefs.fuel_preference = 'hybrid'
        elif any(word in message_lower for word in ['diesel', 'duramax']):
            prefs.fuel_preference = 'diesel'
        elif any(word in message_lower for word in ['gas mileage', 'fuel efficient', 'mpg', 'fuel economy']):
            prefs.fuel_preference = 'fuel_efficient'
        
        # Drivetrain preference
        if any(word in message_lower for word in ['awd', 'all wheel', 'all-wheel']):
            prefs.drivetrain_preference = 'AWD'
        elif any(word in message_lower for word in ['4x4', '4wd', 'four wheel', '4 wheel']):
            prefs.drivetrain_preference = '4WD'
        
        # Seating needs
        seat_match = re.search(r'(\d+)\s*(?:seat|passenger|people)', message_lower)
        if seat_match:
            prefs.min_seating = int(seat_match.group(1))
        
        # Towing needs
        tow_match = re.search(r'tow\s*(?:ing)?\s*(\d{1,2}[,.]?\d{3})\s*(?:lb|pound)?', message_lower)
        if tow_match:
            prefs.min_towing = int(tow_match.group(1).replace(',', '').replace('.', ''))
        
        return prefs
    
    def extract_context(self, message: str) -> CustomerContext:
        """Extract customer context and sentiment."""
        context = CustomerContext()
        message_lower = message.lower()
        
        # Family size
        family_patterns = [
            (r'(\d+)\s*kids?', lambda m: int(m.group(1)) + 2),
            (r'(\d+)\s*children', lambda m: int(m.group(1)) + 2),
            (r'family of\s*(\d+)', lambda m: int(m.group(1))),
            (r'(\d+)\s*(?:of us|people|passengers)', lambda m: int(m.group(1))),
        ]
        
        for pattern, extractor in family_patterns:
            match = re.search(pattern, message_lower)
            if match:
                context.family_size = extractor(match)
                break
        
        # Urgency detection
        high_urgency = ['today', 'right now', 'asap', 'immediately', 'this weekend', 'need it now']
        medium_urgency = ['soon', 'this week', 'this month', 'looking to buy', 'ready to', 'serious about']
        
        if any(phrase in message_lower for phrase in high_urgency):
            context.urgency = 'ready_to_buy'
        elif any(phrase in message_lower for phrase in medium_urgency):
            context.urgency = 'considering'
        else:
            context.urgency = 'browsing'
        
        # Timeline
        timeline_patterns = [
            (r'(?:within|in)\s*(\d+)\s*(?:day|week|month)', lambda m: f"within {m.group(1)} {m.group(0).split()[-1]}"),
            (r'by\s*(?:end of\s*)?(january|february|march|april|may|june|july|august|september|october|november|december)', 
             lambda m: f"by {m.group(1)}"),
            (r'(?:this|next)\s*(week|month|weekend)', lambda m: f"{m.group(0)}"),
        ]
        
        for pattern, extractor in timeline_patterns:
            match = re.search(pattern, message_lower)
            if match:
                context.buying_timeline = extractor(match)
                break
        
        # Sentiment detection (basic)
        frustrated_words = ['frustrated', 'annoying', 'disappointed', 'unhappy', 'waste', 'terrible']
        confused_words = ['confused', 'don\'t understand', 'not sure', 'what do you mean', 'lost']
        positive_words = ['love', 'excited', 'great', 'perfect', 'awesome', 'thanks', 'helpful']
        
        if any(word in message_lower for word in frustrated_words):
            context.sentiment = 'frustrated'
        elif any(word in message_lower for word in confused_words):
            context.sentiment = 'confused'
        elif any(word in message_lower for word in positive_words):
            context.sentiment = 'positive'
        else:
            context.sentiment = 'neutral'
        
        # Decision maker / spouse detection
        spouse_patterns = [
            (r'(?:talk|speak|discuss|check)\s+(?:to|with)\s+(?:my\s+)?(wife|husband|spouse|partner)', 1),
            (r'(wife|husband|spouse|partner)\s+(?:needs?|wants?|has)\s+to', 1),
            (r'(?:need|get)\s+(?:her|his)\s+(?:input|approval|opinion|ok)', None),
            (r'(?:she|he)\s+(?:needs?|has|wants?)\s+to\s+(?:see|approve|agree)', None),
            (r'can\'?t\s+(?:decide|make.*decision).*(?:without|alone)', None),
            (r'(?:we|both)\s+need\s+to\s+(?:discuss|talk|decide)', None),
            (r'sleep\s+on\s+it', None),
            (r'think\s+(?:about\s+it|it\s+over)', None),
            (r'big\s+decision', None),
            (r'need\s+to\s+(?:talk|discuss).*(?:wife|husband|spouse|partner|her|him)', None),
        ]
        
        for pattern_tuple in spouse_patterns:
            pattern = pattern_tuple[0]
            group_idx = pattern_tuple[1] if len(pattern_tuple) > 1 else None
            match = re.search(pattern, message_lower)
            if match:
                context.needs_spouse_approval = True
                context.decision_maker_objection = True
                # Try to capture the specific reference (wife, husband, etc.)
                if group_idx is not None and match.lastindex and match.lastindex >= group_idx:
                    context.spouse_reference = match.group(group_idx)
                elif 'wife' in message_lower:
                    context.spouse_reference = 'wife'
                elif 'husband' in message_lower:
                    context.spouse_reference = 'husband'
                elif 'spouse' in message_lower:
                    context.spouse_reference = 'spouse'
                elif 'partner' in message_lower:
                    context.spouse_reference = 'partner'
                break
        
        return context
    
    def extract_stock_numbers(self, message: str) -> List[str]:
        """Extract stock numbers from message."""
        # Pattern: M followed by 4-6 digits
        pattern = r'\bM\d{4,6}\b'
        matches = re.findall(pattern, message, re.IGNORECASE)
        return list(set(m.upper() for m in matches))
    
    def extract_model_mentions(self, message: str) -> List[str]:
        """Extract mentioned Chevrolet models."""
        message_upper = message.upper()
        mentioned = []
        
        for model in self.CHEVY_MODELS:
            if model in message_upper:
                mentioned.append(model.title())
        
        return list(set(mentioned))
    
    def _aggregate_from_history(
        self, 
        current: ExtractedEntities, 
        history: List[Dict[str, str]]
    ) -> ExtractedEntities:
        """Aggregate entities from conversation history."""
        for msg in history:
            if msg.get('role') != 'user':
                continue
            
            content = msg.get('content', '')
            
            # Extract from historical message
            hist_budget = self.extract_budget(content)
            hist_trade = self.extract_trade_in(content)
            hist_prefs = self.extract_preferences(content)
            hist_context = self.extract_context(content)
            
            # Merge budget (prefer current if set, otherwise use historical)
            if not current.budget.has_budget_constraint and hist_budget.has_budget_constraint:
                current.budget = hist_budget
            
            # Merge trade-in info (accumulate)
            if hist_trade.mentioned:
                current.trade_in.mentioned = True
            if hist_trade.year and not current.trade_in.year:
                current.trade_in.year = hist_trade.year
            if hist_trade.make and not current.trade_in.make:
                current.trade_in.make = hist_trade.make
            if hist_trade.monthly_payment and not current.trade_in.monthly_payment:
                current.trade_in.monthly_payment = hist_trade.monthly_payment
            if hist_trade.payoff_amount and not current.trade_in.payoff_amount:
                current.trade_in.payoff_amount = hist_trade.payoff_amount
            if hist_trade.lender and not current.trade_in.lender:
                current.trade_in.lender = hist_trade.lender
            if hist_trade.is_lease is not None and current.trade_in.is_lease is None:
                current.trade_in.is_lease = hist_trade.is_lease
            
            # Merge preferences (accumulate lists)
            for vtype in hist_prefs.vehicle_types:
                if vtype not in current.preferences.vehicle_types:
                    current.preferences.vehicle_types.append(vtype)
            
            for feature in hist_prefs.must_have_features:
                if feature not in current.preferences.must_have_features:
                    current.preferences.must_have_features.append(feature)
            
            for use_case in hist_prefs.use_cases:
                if use_case not in current.preferences.use_cases:
                    current.preferences.use_cases.append(use_case)
            
            # Context - use most recent values but escalate urgency
            if hist_context.family_size and not current.context.family_size:
                current.context.family_size = hist_context.family_size
            
            # Urgency can only escalate
            urgency_levels = {'browsing': 0, 'considering': 1, 'ready_to_buy': 2}
            if urgency_levels.get(hist_context.urgency, 0) > urgency_levels.get(current.context.urgency, 0):
                current.context.urgency = hist_context.urgency
            
            # Accumulate mentioned models and stock numbers
            hist_stocks = self.extract_stock_numbers(content)
            hist_models = self.extract_model_mentions(content)
            
            for stock in hist_stocks:
                if stock not in current.mentioned_stock_numbers:
                    current.mentioned_stock_numbers.append(stock)
            
            for model in hist_models:
                if model not in current.mentioned_models:
                    current.mentioned_models.append(model)
        
        return current
    
    def _parse_money(self, value: str, is_thousands: bool = False) -> float:
        """Parse a money string to float."""
        cleaned = value.replace(',', '').replace('$', '')
        amount = float(cleaned)
        
        if is_thousands or (amount < 200 and not '.' in value):
            amount *= 1000
        
        return amount


# Module-level singleton
_extractor: Optional[ConversationEntityExtractor] = None


def get_entity_extractor() -> ConversationEntityExtractor:
    """Get or create the entity extractor instance."""
    global _extractor
    if _extractor is None:
        _extractor = ConversationEntityExtractor()
    return _extractor
