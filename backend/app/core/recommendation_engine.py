"""
QUIRK AI - Unified Vehicle Recommendation Engine
Single source of truth for all recommendation logic across backend and AI services.

Architecture:
- Externalized configuration (weights, buckets) loaded from config file
- Feature extraction pipeline for consistent vehicle vectorization
- Pluggable similarity metrics with weighted scoring
- Observability hooks for analytics and A/B testing

Usage:
    from app.core.recommendation_engine import VehicleRecommender
    
    recommender = VehicleRecommender()  # Uses default config
    recommender = VehicleRecommender(config_path='custom_config.yaml')
    
    # Single vehicle recommendations
    results = recommender.recommend(source_vehicle, candidates, limit=5)
    
    # Personalized recommendations from browsing history
    results = recommender.recommend_personalized(viewed_vehicles, candidates, limit=5)
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json
import os
from pathlib import Path


class FuelCategory(Enum):
    """Fuel type categories for similarity grouping"""
    ELECTRIC = "electric"
    HYBRID = "hybrid"  # Includes PHEV
    GAS = "gas"
    DIESEL = "diesel"


@dataclass
class RecommenderConfig:
    """
    Externalized configuration for the recommendation engine.
    Allows tuning without code changes - supports A/B testing and optimization.
    """
    # Feature weights (sum doesn't need to equal 1.0 - normalized internally)
    weights: Dict[str, float] = field(default_factory=lambda: {
        'body_style': 2.0,      # Strongest signal - customer knows what they want
        'price_range': 1.5,     # Budget is hard constraint
        'fuel_type': 1.5,       # EV/Gas preference is sticky
        'drivetrain': 1.0,      # AWD needs are often regional/seasonal
        'features': 1.0,        # Feature overlap indicates similar needs
        'performance': 0.75,    # Efficiency/range secondary consideration
        'year': 0.5,            # Newer preference exists but flexible
        'luxury': 0.5,          # Price bracket indicator
    })
    
    # Price bucket thresholds (used for bucketed similarity)
    price_buckets: List[float] = field(default_factory=lambda: [
        0, 25000, 35000, 45000, 60000, 80000, 100000, float('inf')
    ])
    
    # Mileage thresholds for used vehicles
    mileage_buckets: List[int] = field(default_factory=lambda: [
        0, 15000, 30000, 50000, 75000, 100000, float('inf')
    ])
    
    # Year brackets (relative to current year)
    year_brackets: List[int] = field(default_factory=lambda: [0, 1, 2, 3, 5])
    
    # Features that indicate performance orientation
    performance_features: Set[str] = field(default_factory=lambda: {
        'performance exhaust', 'magnetic ride', 'brembo', 'recaro',
        'sport mode', 'adaptive suspension', 'performance package',
        'track mode', 'launch control', 'carbon fiber'
    })
    
    # Features that indicate luxury orientation
    luxury_features: Set[str] = field(default_factory=lambda: {
        'premium audio', 'heated steering wheel', 'ventilated seats',
        'panoramic roof', 'heads-up display', 'massaging seats',
        'ambient lighting', 'premium leather', 'wood trim'
    })
    
    # Luxury price threshold
    luxury_price_threshold: float = 55000
    
    # Adjacent bucket similarity (0.0 to 1.0)
    adjacent_bucket_score: float = 0.5
    
    # Config version for A/B testing tracking
    version: str = "1.0.0"
    experiment_id: Optional[str] = None
    
    @classmethod
    def from_file(cls, path: str) -> 'RecommenderConfig':
        """Load configuration from JSON or YAML file"""
        file_path = Path(path)
        
        if not file_path.exists():
            return cls()  # Return defaults
        
        with open(file_path, 'r') as f:
            if file_path.suffix in ['.yaml', '.yml']:
                import yaml
                data = yaml.safe_load(f)
            else:
                data = json.load(f)
        
        # Convert lists back to sets for set fields
        if 'performance_features' in data:
            data['performance_features'] = set(data['performance_features'])
        if 'luxury_features' in data:
            data['luxury_features'] = set(data['luxury_features'])
        
        return cls(**data)
    
    def to_dict(self) -> Dict[str, Any]:
        """Export config for logging/debugging"""
        return {
            'weights': self.weights,
            'price_buckets': self.price_buckets,
            'version': self.version,
            'experiment_id': self.experiment_id,
        }


@dataclass
class VehicleFeatures:
    """Extracted feature vector from a vehicle"""
    body_style: str
    price_bucket: int
    fuel_type: str
    fuel_category: FuelCategory
    drivetrain: str
    year: int
    mileage_bucket: int
    performance_score: float  # 0-100 normalized
    features_set: Set[str]
    is_electric: bool
    is_luxury: bool
    is_performance: bool
    raw_price: float
    raw_mileage: int


@dataclass
class RecommendationResult:
    """Structured recommendation with explainability"""
    vehicle: Dict[str, Any]
    similarity_score: float
    match_reasons: List[str]
    feature_contributions: Dict[str, float]  # Which features drove the score
    confidence: str  # 'high', 'medium', 'low'


class VehicleRecommender:
    """
    Unified vehicle recommendation engine using content-based filtering.
    
    Design Principles:
    1. Single source of truth - all recommendation logic lives here
    2. Configurable - weights and thresholds externalized
    3. Observable - structured outputs for analytics
    4. Testable - pure functions where possible
    """
    
    def __init__(self, config: Optional[RecommenderConfig] = None, config_path: Optional[str] = None):
        """
        Initialize recommender with configuration.
        
        Args:
            config: Direct configuration object
            config_path: Path to config file (JSON or YAML)
        """
        if config:
            self.config = config
        elif config_path:
            self.config = RecommenderConfig.from_file(config_path)
        else:
            # Check environment for config path
            env_path = os.getenv('RECOMMENDER_CONFIG_PATH')
            if env_path:
                self.config = RecommenderConfig.from_file(env_path)
            else:
                self.config = RecommenderConfig()
        
        # Pre-compute normalized weights
        total_weight = sum(self.config.weights.values())
        self._normalized_weights = {
            k: v / total_weight for k, v in self.config.weights.items()
        }
    
    def extract_features(self, vehicle: Dict[str, Any]) -> VehicleFeatures:
        """
        Extract normalized feature vector from vehicle data.
        Handles both camelCase and snake_case field names.
        """
        # Normalize field access
        def get_field(obj: Dict, *keys: str, default=None):
            for key in keys:
                if key in obj:
                    return obj[key]
            return default
        
        # Extract basic fields with fallbacks
        body_style = get_field(vehicle, 'bodyStyle', 'body_style', default='sedan').lower()
        price = float(get_field(vehicle, 'price', 'sale_price', 'salePrice', default=30000))
        fuel_type = get_field(vehicle, 'fuelType', 'fuel_type', default='gas').lower()
        drivetrain = get_field(vehicle, 'drivetrain', default='fwd').lower()
        year = int(get_field(vehicle, 'year', default=2024))
        mileage = int(get_field(vehicle, 'mileage', default=0))
        features = get_field(vehicle, 'features', default=[])
        mpg_city = get_field(vehicle, 'mpgCity', 'mpg_city')
        mpg_highway = get_field(vehicle, 'mpgHighway', 'mpg_highway')
        ev_range = get_field(vehicle, 'evRange', 'ev_range')
        
        # Calculate price bucket
        price_bucket = self._get_bucket(price, self.config.price_buckets)
        
        # Calculate mileage bucket
        mileage_bucket = self._get_bucket(mileage, self.config.mileage_buckets)
        
        # Determine fuel category
        fuel_category = self._categorize_fuel(fuel_type)
        is_electric = fuel_category in [FuelCategory.ELECTRIC, FuelCategory.HYBRID]
        
        # Calculate performance score (normalized 0-100)
        if fuel_category == FuelCategory.ELECTRIC:
            # For EVs, use range as performance metric
            range_val = ev_range if ev_range else 250
            if isinstance(range_val, str):
                # Handle "300 mi" format
                range_val = int(''.join(filter(str.isdigit, range_val)) or 250)
            performance_score = min(100, 50 + range_val / 5)
        else:
            # For ICE, use combined MPG
            city = mpg_city if mpg_city else 20
            highway = mpg_highway if mpg_highway else 30
            avg_mpg = (city + highway) / 2
            performance_score = min(100, 30 + avg_mpg * 1.5)
        
        # Normalize features to lowercase set
        features_set = set(f.lower() for f in features if isinstance(f, str))
        
        # Check for performance orientation
        is_performance = bool(features_set & self.config.performance_features)
        
        # Check for luxury indicators
        is_luxury = (
            price > self.config.luxury_price_threshold or
            bool(features_set & self.config.luxury_features)
        )
        
        return VehicleFeatures(
            body_style=body_style,
            price_bucket=price_bucket,
            fuel_type=fuel_type,
            fuel_category=fuel_category,
            drivetrain=drivetrain,
            year=year,
            mileage_bucket=mileage_bucket,
            performance_score=performance_score,
            features_set=features_set,
            is_electric=is_electric,
            is_luxury=is_luxury,
            is_performance=is_performance,
            raw_price=price,
            raw_mileage=mileage,
        )
    
    def calculate_similarity(
        self, 
        source: VehicleFeatures, 
        target: VehicleFeatures
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculate weighted similarity score between two vehicles.
        
        Returns:
            Tuple of (overall_score, feature_contributions)
        """
        contributions = {}
        weights = self._normalized_weights
        
        # Body style match (exact match required)
        if source.body_style == target.body_style:
            contributions['body_style'] = weights.get('body_style', 0)
        else:
            contributions['body_style'] = 0.0
        
        # Price bucket similarity
        price_diff = abs(source.price_bucket - target.price_bucket)
        if price_diff == 0:
            contributions['price_range'] = weights.get('price_range', 0)
        elif price_diff == 1:
            contributions['price_range'] = weights.get('price_range', 0) * self.config.adjacent_bucket_score
        else:
            contributions['price_range'] = 0.0
        
        # Fuel type similarity
        if source.fuel_type == target.fuel_type:
            contributions['fuel_type'] = weights.get('fuel_type', 0)
        elif source.fuel_category == target.fuel_category:
            # Same category but different specific type (e.g., hybrid vs PHEV)
            contributions['fuel_type'] = weights.get('fuel_type', 0) * 0.7
        elif source.is_electric == target.is_electric:
            # Both electrified or both not
            contributions['fuel_type'] = weights.get('fuel_type', 0) * 0.3
        else:
            contributions['fuel_type'] = 0.0
        
        # Drivetrain match
        if source.drivetrain == target.drivetrain:
            contributions['drivetrain'] = weights.get('drivetrain', 0)
        else:
            contributions['drivetrain'] = 0.0
        
        # Feature overlap (Jaccard similarity)
        if source.features_set and target.features_set:
            intersection = len(source.features_set & target.features_set)
            union = len(source.features_set | target.features_set)
            if union > 0:
                jaccard = intersection / union
                contributions['features'] = weights.get('features', 0) * jaccard
            else:
                contributions['features'] = 0.0
        else:
            contributions['features'] = 0.0
        
        # Performance score similarity
        perf_diff = abs(source.performance_score - target.performance_score)
        perf_similarity = max(0, 1 - perf_diff / 50)
        contributions['performance'] = weights.get('performance', 0) * perf_similarity
        
        # Year similarity
        year_diff = abs(source.year - target.year)
        if year_diff == 0:
            contributions['year'] = weights.get('year', 0)
        elif year_diff <= 2:
            contributions['year'] = weights.get('year', 0) * 0.7
        elif year_diff <= 4:
            contributions['year'] = weights.get('year', 0) * 0.3
        else:
            contributions['year'] = 0.0
        
        # Luxury alignment
        if source.is_luxury == target.is_luxury:
            contributions['luxury'] = weights.get('luxury', 0)
        else:
            contributions['luxury'] = 0.0
        
        # Calculate total score
        total_score = sum(contributions.values())
        
        return min(total_score, 1.0), contributions
    
    def recommend(
        self, 
        source: Dict[str, Any], 
        candidates: List[Dict[str, Any]], 
        limit: int = 5,
        min_score: float = 0.0
    ) -> List[RecommendationResult]:
        """
        Get recommendations based on a source vehicle.
        
        Args:
            source: Source vehicle to find similar matches for
            candidates: Pool of candidate vehicles
            limit: Maximum recommendations to return
            min_score: Minimum similarity score threshold
            
        Returns:
            List of RecommendationResult sorted by similarity
        """
        source_id = source.get('id', source.get('stock_number', ''))
        source_features = self.extract_features(source)
        
        results = []
        for candidate in candidates:
            # Skip the source vehicle itself
            candidate_id = candidate.get('id', candidate.get('stock_number', ''))
            if candidate_id == source_id:
                continue
            
            target_features = self.extract_features(candidate)
            score, contributions = self.calculate_similarity(source_features, target_features)
            
            if score < min_score:
                continue
            
            # Generate match reasons
            match_reasons = self._generate_match_reasons(
                source_features, target_features, score, contributions
            )
            
            # Determine confidence level
            confidence = 'high' if score > 0.7 else ('medium' if score > 0.4 else 'low')
            
            results.append(RecommendationResult(
                vehicle=candidate,
                similarity_score=round(score, 3),
                match_reasons=match_reasons,
                feature_contributions=contributions,
                confidence=confidence,
            ))
        
        # Sort by score descending
        results.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return results[:limit]
    
    def recommend_personalized(
        self,
        viewed: List[Dict[str, Any]],
        candidates: List[Dict[str, Any]],
        limit: int = 5
    ) -> List[RecommendationResult]:
        """
        Get recommendations based on browsing history (multiple viewed vehicles).
        
        Analyzes patterns in viewed vehicles to infer preferences.
        """
        if not viewed:
            return []
        
        # Extract features from all viewed vehicles
        viewed_features = [self.extract_features(v) for v in viewed]
        viewed_ids = {v.get('id', v.get('stock_number', '')) for v in viewed}
        
        # Analyze preferences from viewing history
        body_prefs = {}
        fuel_prefs = {}
        total_price = 0
        
        for features in viewed_features:
            body_prefs[features.body_style] = body_prefs.get(features.body_style, 0) + 1
            fuel_prefs[features.fuel_type] = fuel_prefs.get(features.fuel_type, 0) + 1
            total_price += features.raw_price
        
        avg_price = total_price / len(viewed_features)
        preferred_body = max(body_prefs, key=body_prefs.get)
        preferred_fuel = max(fuel_prefs, key=fuel_prefs.get)
        
        results = []
        for candidate in candidates:
            candidate_id = candidate.get('id', candidate.get('stock_number', ''))
            if candidate_id in viewed_ids:
                continue
            
            # Calculate average similarity to all viewed vehicles
            target_features = self.extract_features(candidate)
            
            total_simi
