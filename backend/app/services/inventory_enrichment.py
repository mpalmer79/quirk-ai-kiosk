"""
Inventory Enrichment Service
Derives missing fields (drivetrain, bodyStyle, fuelType, features) from existing inventory data
"""

from typing import Dict, Any, List, Optional
import re


class InventoryEnrichmentService:
    """Enriches raw inventory data with derived fields."""
    
    DRIVETRAIN_PATTERNS = [
        (r'\b4WD\b', '4WD'),
        (r'\bAWD\b', 'AWD'),
        (r'\b4x4\b', '4WD'),
        (r'\be4WD\b', 'Electric AWD'),
        (r'\b2WD\b', '2WD'),
        (r'\bFWD\b', 'FWD'),
        (r'\bRWD\b', 'RWD'),
    ]
    
    BODY_TYPE_MAP = {
        'APURP': 'SUV',
        'PKUP': 'Truck',
        'VAN': 'Van',
        'FLTBD': 'Flatbed Truck',
        'COUPE': 'Coupe',
        'CONVT': 'Convertible',
        'SUV': 'SUV',
        'SEDAN': 'Sedan',
    }
    
    TRIM_FEATURES = {
        'HIGH COUNTRY': ['Luxury Package', 'Premium Leather', 'Premium Audio'],
        'PREMIER': ['Leather Seats', 'Premium Audio', 'Navigation'],
        'LTZ': ['Leather Seats', 'Premium Audio'],
        'RS': ['Sport Package', 'Sport Suspension'],
        'Z71': ['Off-Road Package', 'Skid Plates', 'All-Terrain Tires'],
        'ZR2': ['Extreme Off-Road', 'Locking Differentials'],
        'TRAIL BOSS': ['Off-Road Package', 'Lift Kit'],
        'LT': ['LT Package', 'Upgraded Interior'],
        'LS': ['Base Features'],
        'WT': ['Work Truck', 'Durable Interior'],
    }
    
    TOWING_CAPACITY = {
        'SILVERADO 1500': 13300,
        'SILVERADO 2500HD': 18500,
        'SILVERADO 3500HD': 36000,
        'COLORADO': 7700,
        'TAHOE': 8400,
        'SUBURBAN': 8300,
        'TRAVERSE': 5000,
        'EQUINOX': 1500,
    }
    
    SEATING_CAPACITY = {
        'SUBURBAN': 8,
        'TAHOE': 8,
        'TRAVERSE': 8,
        'EQUINOX': 5,
        'BLAZER': 5,
        'TRAILBLAZER': 5,
        'TRAX': 5,
        'SILVERADO': 6,
        'COLORADO': 5,
        'CORVETTE': 2,
        'CAMARO': 4,
    }

    def enrich_vehicle(self, vehicle: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich a single vehicle record with derived fields."""
        enriched = vehicle.copy()
        
        model = str(vehicle.get('Model') or vehicle.get('model') or '')
        body = str(vehicle.get('Body') or vehicle.get('body') or '')
        body_type = str(vehicle.get('Body Type') or vehicle.get('bodyType') or '')
        trim = str(vehicle.get('Trim') or vehicle.get('trim') or '')
        year = vehicle.get('Year') or vehicle.get('year') or 0
        msrp = vehicle.get('MSRP') or vehicle.get('msrp') or vehicle.get('price') or 0
        
        enriched['drivetrain'] = self._extract_drivetrain(body)
        enriched['bodyStyle'] = self._map_body_style(body_type, model)
        enriched['fuelType'] = self._detect_fuel_type(model)
        enriched['features'] = self._extract_features(trim, model, msrp)
        enriched['towingCapacity'] = self._get_towing_capacity(model)
        enriched['seatingCapacity'] = self._get_seating_capacity(model)
        enriched['condition'] = 'New' if year >= 2024 else 'Used'
        enriched['mileage'] = enriched.get('mileage', 0 if enriched['condition'] == 'New' else None)
        enriched['isPerformance'] = self._is_performance_vehicle(model, trim)
        enriched['isLuxury'] = self._is_luxury_trim(trim, msrp)
        enriched['isElectric'] = 'EV' in model.upper() or enriched['fuelType'] == 'Electric'
        
        return enriched

    def enrich_inventory(self, inventory: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enrich all vehicles in inventory."""
        return [self.enrich_vehicle(v) for v in inventory]

    def _extract_drivetrain(self, body: str) -> str:
        body_upper = body.upper()
        for pattern, drivetrain in self.DRIVETRAIN_PATTERNS:
            if re.search(pattern, body_upper):
                return drivetrain
        return '2WD'

    def _map_body_style(self, body_type: str, model: str) -> str:
        if body_type.upper() in self.BODY_TYPE_MAP:
            return self.BODY_TYPE_MAP[body_type.upper()]
        
        model_upper = model.upper()
        if any(t in model_upper for t in ['SILVERADO', 'COLORADO']):
            return 'Truck'
        elif any(s in model_upper for s in ['EQUINOX', 'TRAVERSE', 'TAHOE', 'SUBURBAN', 'BLAZER']):
            return 'SUV'
        elif 'EXPRESS' in model_upper:
            return 'Van'
        elif 'CORVETTE' in model_upper:
            return 'Sports Car'
        return 'Other'

    def _detect_fuel_type(self, model: str) -> str:
        model_upper = model.upper()
        if 'EV' in model_upper or 'ELECTRIC' in model_upper:
            return 'Electric'
        elif 'HYBRID' in model_upper or 'E-RAY' in model_upper:
            return 'Hybrid'
        elif 'DIESEL' in model_upper or 'DURAMAX' in model_upper:
            return 'Diesel'
        return 'Gasoline'

    def _extract_features(self, trim: str, model: str, price: float) -> List[str]:
        features = []
        trim_upper = trim.upper()
        
        for trim_key, trim_features in self.TRIM_FEATURES.items():
            if trim_key in trim_upper:
                features.extend(trim_features)
        
        if price >= 70000:
            features.extend(['Premium Audio', 'Navigation'])
        if price >= 55000 and 'Leather' not in str(features):
            features.append('Leather Seats')
        
        model_upper = model.upper()
        if 'TAHOE' in model_upper or 'SUBURBAN' in model_upper or 'TRAVERSE' in model_upper:
            features.append('Third Row Seating')
        if 'SILVERADO' in model_upper:
            features.extend(['Truck Bed', 'Towing Package'])
        if 'EV' in model_upper:
            features.extend(['Electric Powertrain', 'DC Fast Charging'])
        
        return list(set(features))

    def _get_towing_capacity(self, model: str) -> int:
        model_upper = model.upper()
        for model_key, capacity in self.TOWING_CAPACITY.items():
            if model_key in model_upper:
                return capacity
        return 0

    def _get_seating_capacity(self, model: str) -> int:
        model_upper = model.upper()
        for model_key, seats in self.SEATING_CAPACITY.items():
            if model_key in model_upper:
                return seats
        return 5

    def _is_performance_vehicle(self, model: str, trim: str) -> bool:
        model_upper = model.upper()
        trim_upper = trim.upper()
        if any(p in model_upper for p in ['CORVETTE', 'CAMARO']):
            return True
        if any(p in trim_upper for p in ['SS', 'Z06', 'Z07', 'ZR2', 'ZL1']):
            return True
        return False

    def _is_luxury_trim(self, trim: str, price: float) -> bool:
        trim_upper = trim.upper()
        if any(l in trim_upper for l in ['HIGH COUNTRY', 'PREMIER', 'DENALI']):
            return True
        return price >= 60000


_enrichment_service: Optional[InventoryEnrichmentService] = None


def get_enrichment_service() -> InventoryEnrichmentService:
    global _enrichment_service
    if _enrichment_service is None:
        _enrichment_service = InventoryEnrichmentService()
    return _enrichment_service


def enrich_vehicle(vehicle: Dict[str, Any]) -> Dict[str, Any]:
    return get_enrichment_service().enrich_vehicle(vehicle)


def enrich_inventory(inventory: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return get_enrichment_service().enrich_inventory(inventory)
