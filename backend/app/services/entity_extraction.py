# backend/app/services/entity_extraction.py

from typing import Dict, Any, Optional
import re

class ConversationEntityExtractor:
    """Extract structured entities from customer messages"""
    
    def extract_all(self, message: str, conversation_history: list = None) -> Dict[str, Any]:
        """Extract all entities from a message"""
        return {
            "budget": self.extract_budget(message),
            "vehicle_type": self.extract_vehicle_type(message),
            "features": self.extract_features(message),
            "trade_in": self.extract_trade_in_info(message),
            "urgency": self.extract_urgency(message),
            "family_size": self.extract_family_size(message),
            "use_case": self.extract_use_case(message),
        }
    
    def extract_budget(self, message: str) -> Dict[str, Optional[float]]:
        """Extract budget information"""
        patterns = [
            r'under\s*\$?([\d,]+)k?',
            r'budget\s*(?:is|of)?\s*\$?([\d,]+)k?',
            r'around\s*\$?([\d,]+)k?',
            r'\$?([\d,]+)k?\s*(?:to|-)\s*\$?([\d,]+)k?',
            r'([\d,]+)\s*(?:a|per)\s*month',
        ]
        
        result = {"min": None, "max": None, "monthly": None}
        
        for pattern in patterns:
            match = re.search(pattern, message.lower())
            if match:
                groups = match.groups()
                value = float(groups[0].replace(',', ''))
                
                # Handle "k" suffix
                if 'k' in message.lower()[match.start():match.end()+2]:
                    value *= 1000
                
                if 'month' in pattern:
                    result["monthly"] = value
                elif len(groups) > 1 and groups[1]:
                    result["min"] = value
                    result["max"] = float(groups[1].replace(',', ''))
                elif 'under' in pattern:
                    result["max"] = value
                else:
                    result["max"] = value * 1.15  # +15% buffer
                    result["min"] = value * 0.85  # -15% buffer
                break
        
        return result
    
    def extract_vehicle_type(self, message: str) -> list:
        """Extract vehicle type preferences"""
        types = []
        message_lower = message.lower()
        
        type_keywords = {
            'truck': ['truck', 'pickup', 'silverado', 'colorado', 'tow', 'haul'],
            'suv': ['suv', 'crossover', 'equinox', 'traverse', 'tahoe', 'suburban', 'blazer'],
            'electric': ['electric', 'ev', 'plug-in', 'zero emission'],
            'sporty': ['sport', 'fast', 'corvette', 'camaro', 'performance'],
            'van': ['van', 'cargo', 'express'],
        }
        
        for vtype, keywords in type_keywords.items():
            if any(kw in message_lower for kw in keywords):
                types.append(vtype)
        
        return types
    
    def extract_features(self, message: str) -> list:
        """Extract desired features"""
        features = []
        message_lower = message.lower()
        
        feature_keywords = {
            'awd': ['awd', 'all wheel', '4x4', '4wd', 'four wheel'],
            'leather': ['leather'],
            'sunroof': ['sunroof', 'moonroof', 'panoramic'],
            'towing': ['tow', 'towing', 'trailer', 'haul'],
            'fuel_efficient': ['fuel efficient', 'gas mileage', 'mpg', 'efficient'],
            'third_row': ['third row', '3rd row', '7 seat', '8 seat', 'three row'],
            'safety': ['safety', 'safe', 'airbag', 'crash'],
            'tech': ['tech', 'apple carplay', 'android auto', 'navigation', 'screen'],
        }
        
        for feature, keywords in feature_keywords.items():
            if any(kw in message_lower for kw in keywords):
                features.append(feature)
        
        return features
    
    def extract_trade_in_info(self, message: str) -> Dict[str, Any]:
        """Extract trade-in vehicle information"""
        result = {"mentioned": False, "year": None, "make": None, "model": None, "payment": None}
        
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['trade', 'trading', 'current vehicle', 'my car']):
            result["mentioned"] = True
            
            # Extract year
            year_match = re.search(r'20[0-2]\d|19[89]\d', message)
            if year_match:
                result["year"] = int(year_match.group())
            
            # Extract payment amount
            payment_match = re.search(r'\$?([\d,]+)\s*(?:a|per)?\s*month', message_lower)
            if payment_match:
                result["payment"] = float(payment_match.group(1).replace(',', ''))
        
        return result
    
    def extract_urgency(self, message: str) -> str:
        """Detect purchase urgency"""
        message_lower = message.lower()
        
        high_urgency = ['today', 'now', 'asap', 'immediately', 'right now', 'this week']
        medium_urgency = ['soon', 'this month', 'next week', 'looking to buy']
        
        if any(word in message_lower for word in high_urgency):
            return "high"
        elif any(word in message_lower for word in medium_urgency):
            return "medium"
        return "browsing"
    
    def extract_family_size(self, message: str) -> Optional[int]:
        """Extract family/passenger size needs"""
        message_lower = message.lower()
        
        # Direct mentions
        size_match = re.search(r'(\d+)\s*(?:kids?|children|people|passengers|family)', message_lower)
        if size_match:
            return int(size_match.group(1)) + 1  # +1 for driver
        
        # Implicit mentions
        if any(word in message_lower for word in ['large family', 'big family']):
            return 7
        elif any(word in message_lower for word in ['family', 'kids', 'children']):
            return 5
        
        return None
    
    def extract_use_case(self, message: str) -> list:
        """Extract primary use cases"""
        use_cases = []
        message_lower = message.lower()
        
        case_keywords = {
            'commute': ['commut', 'daily driver', 'work and back', 'to work'],
            'family': ['family', 'kids', 'children', 'car seats'],
            'work': ['work truck', 'job site', 'contractor', 'business'],
            'towing': ['tow', 'boat', 'trailer', 'camper', 'rv'],
            'off_road': ['off road', 'camping', 'trail', 'adventure'],
            'luxury': ['luxury', 'comfortable', 'premium', 'nice'],
        }
        
        for use_case, keywords in case_keywords.items():
            if any(kw in message_lower for kw in keywords):
                use_cases.append(use_case)
        
        return use_cases if use_cases else ['general']
