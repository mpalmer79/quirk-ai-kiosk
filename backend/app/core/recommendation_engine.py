"""
Unified Vehicle Recommendation Engine for QUIRK AI Kiosk
Handles similarity scoring, feature extraction, and personalized recommendations
"""

import json
import os
import math
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path


class VehicleRecommender:
    """
    A configurable vehicle recommendation engine that uses weighted
    similarity scoring across multiple vehicle attributes.
    """
    
    # Default configuration
    DEFAULT_CONFIG = {
        "weights": {
            "body_style": 2.0,
            "price_range": 1.5,
            "fuel_type": 1.5,
            "drivetrain": 1.0,
            "features": 1.0,
            "performance": 0.75,
            "year": 0.5,
            "luxury": 0.5
        },
        "price_buckets": [0, 25000, 35000, 45000, 60000, 80000, 100000, float('inf')],
        "mileage_buckets": [0, 15000, 30000, 50000, 75000, 100000, float('inf')],
        "performance_features": [
            "sport mode", "performance package", "turbo", "supercharged",
            "v8", "sport suspension", "brembo", "launch control",
            "track mode", "performance exhaust"
        ],
        "luxury_features": [
            "leather", "heated seats", "cooled seats", "panoramic roof",
            "premium audio", "massage seats", "ambient lighting",
            "head-up display", "soft-close doors"
        ],
        "luxury_price_threshold": 55000,
        "adjacent_bucket_score": 0.5
    }
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the recommender with optional external configuration.
        
        Args:
            config_path: Path to JSON configuration file. If not provided,
                        uses RECOMMENDER_CONFIG_PATH env var or defaults.
        """
        self.config = self._load_config(config_path)
        self.weights = self.config.get("weights", self.DEFAULT_CONFIG["weights"])
        self.price_buckets = self.config.get("price_buckets", self.DEFAULT_CONFIG["price_buckets"])
        self.mileage_buckets = self.config.get("mileage_buckets", self.DEFAULT_CONFIG["mileage_buckets"])
        self.performance_features = self.config.get(
            "performance_features", 
            self.DEFAULT_CONFIG["performance_features"]
        )
        self.luxury_features = self.config.get(
            "luxury_features",
            self.DEFAULT_CONFIG["luxury_features"]
        )
        self.luxury_price_threshold = self.config.get(
            "luxury_price_threshold",
            self.DEFAULT_CONFIG["luxury_price_threshold"]
        )
        self.adjacent_bucket_score = self.config.get(
            "adjacent_bucket_score",
            self.DEFAULT_CONFIG["adjacent_bucket_score"]
        )
    
    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load configuration from file or environment variable."""
        # Try provided path first
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Warning: Could not load config from {config_path}: {e}")
        
        # Try environment variable
        env_path = os.environ.get('RECOMMENDER_CONFIG_PATH')
        if env_path and os.path.exists(env_path):
            try:
                with open(env_path, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Warning: Could not load config from {env_path}: {e}")
        
        # Try default location
        default_path = Path(__file__).parent.parent.parent / "config" / "recommender_config.json"
        if default_path.exists():
            try:
                with open(default_path, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Warning: Could not load config from {default_path}: {e}")
        
        # Return default config
        return self.DEFAULT_CONFIG.copy()
    
    def get_config(self) -> Dict[str, Any]:
        """Return current configuration for inspection/debugging."""
        return {
            "weights": self.weights,
            "price_buckets": self.price_buckets,
            "mileage_buckets": self.mileage_buckets,
            "performance_features": self.performance_features,
            "luxury_features": self.luxury_features,
            "luxury_price_threshold": self.luxury_price_threshold,
            "adjacent_bucket_score": self.adjacent_bucket_score
        }
    
    def _get_bucket(self, value: float, buckets: List[float]) -> int:
        """
        Determine which bucket a value falls into.
        
        Args:
            value: The numeric value to bucket
            buckets: List of bucket boundaries (must be sorted ascending)
            
        Returns:
            Index of the bucket (0-indexed)
        """
        for i, threshold in enumerate(buckets[1:], 1):
            if value < threshold:
                return i - 1
        return len(buckets) - 2
    
    def _normalize_string(self, value: Any) -> str:
        """Normalize a string value for comparison."""
        if value is None:
            return ""
        return str(value).lower().strip()
    
    def _get_vehicle_price(self, vehicle: Dict[str, Any]) -> float:
        """Extract price from vehicle data, handling different field names."""
        # Try different price field names (camelCase and snake_case)
        price_fields = ['salePrice', 'sale_price', 'price', 'msrp', 'MSRP']
        for field in price_fields:
            if field in vehicle and vehicle[field]:
                try:
                    return float(vehicle[field])
                except (ValueError, TypeError):
                    continue
        return 0.0
    
    def _get_vehicle_mileage(self, vehicle: Dict[str, Any]) -> float:
        """Extract mileage from vehicle data, handling different field names."""
        mileage_fields = ['mileage', 'odometer', 'miles']
        for field in mileage_fields:
            if field in vehicle and vehicle[field]:
                try:
                    return float(vehicle[field])
                except (ValueError, TypeError):
                    continue
        return 0.0
    
    def _get_field(self, vehicle: Dict[str, Any], *field_names: str) -> Any:
        """Get a field value trying multiple possible field names."""
        for field in field_names:
            if field in vehicle and vehicle[field] is not None:
                return vehicle[field]
        return None
    
    def extract_features(self, vehicle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract normalized features from a vehicle record.
        
        Handles both camelCase and snake_case field names for compatibility
        with different data sources.
        
        Args:
            vehicle: Raw vehicle data dictionary
            
        Returns:
            Normalized feature dictionary
        """
        # Get basic fields with fallbacks for different naming conventions
        body_style = self._normalize_string(
            self._get_field(vehicle, 'bodyStyle', 'body_style', 'body', 'type')
        )
        fuel_type = self._normalize_string(
            self._get_field(vehicle, 'fuelType', 'fuel_type', 'fuel')
        )
        drivetrain = self._normalize_string(
            self._get_field(vehicle, 'drivetrain', 'driveTrain', 'drive_train', 'drive')
        )
        
        # Get price and mileage
        price = self._get_vehicle_price(vehicle)
        mileage = self._get_vehicle_mileage(vehicle)
        
        # Get year
        year = 0
        year_val = self._get_field(vehicle, 'year', 'modelYear', 'model_year')
        if year_val:
            try:
                year = int(year_val)
            except (ValueError, TypeError):
                pass
        
        # Extract features list
        features_raw = self._get_field(vehicle, 'features', 'options', 'equipment') or []
        if isinstance(features_raw, str):
            features_raw = [f.strip() for f in features_raw.split(',')]
        features = [self._normalize_string(f) for f in features_raw if f]
        
        # Detect performance vehicle
        is_performance = self._detect_performance(vehicle, features)
        
        # Detect luxury vehicle
        is_luxury = self._detect_luxury(vehicle, features, price)
        
        return {
            "body_style": body_style,
            "fuel_type": fuel_type,
