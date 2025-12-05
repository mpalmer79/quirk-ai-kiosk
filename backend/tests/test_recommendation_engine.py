"""
Tests for the Unified Vehicle Recommendation Engine
Covers feature extraction, similarity calculation, and recommendation generation
"""

import pytest
from typing import Dict, Any, List

# Import the recommendation engine components
import sys
sys.path.insert(0, '/home/claude/quirk-ai-kiosk-main/backend')

from app.core.recommendation_engine import (
    VehicleRecommender,
    RecommenderConfig,
    VehicleFeatures,
    RecommendationResult,
    FuelCategory,
    get_recommender
)


# Test fixtures
@pytest.fixture
def recommender():
    """Create a recommender instance with default config"""
    return VehicleRecommender()


@pytest.fixture
def custom_config():
    """Create a custom configuration for testing"""
    return RecommenderConfig(
        weights={
            'body_style': 3.0,  # Higher weight for body style
            'price_range': 1.0,
            'fuel_type': 1.0,
            'drivetrain': 0.5,
            'features': 0.5,
            'performance': 0.5,
            'year': 0.25,
            'luxury': 0.25,
        },
        price_buckets=[0, 30000, 50000, 75000, float('inf')],
    )


@pytest.fixture
def sample_vehicles() -> List[Dict[str, Any]]:
    """Sample inventory for testing"""
    return [
        {
            "id": "V001",
            "year": 2024,
            "make": "Chevrolet",
            "model": "Silverado 1500",
            "bodyStyle": "Truck",
            "price": 52000,
            "mileage": 0,
            "fuelType": "Gas",
            "drivetrain": "4WD",
            "features": ["Towing Package", "Heated Seats", "Apple CarPlay"],
            "mpgCity": 16,
            "mpgHighway": 23,
        },
        {
            "id": "V002",
            "year": 2024,
            "make": "Chevrolet",
            "model": "Silverado 1500",
            "bodyStyle": "Truck",
            "price": 48000,
            "mileage": 5000,
            "fuelType": "Gas",
            "drivetrain": "4WD",
            "features": ["Towing Package", "Backup Camera"],
            "mpgCity": 16,
            "mpgHighway": 23,
        },
        {
            "id": "V003",
            "year": 2024,
            "make": "Chevrolet",
            "model": "Equinox EV",
            "bodyStyle": "SUV",
            "price": 45000,
            "mileage": 0,
            "fuelType": "Electric",
            "drivetrain": "AWD",
            "features": ["Super Cruise", "Heated Seats", "Panoramic Roof"],
            "evRange": 319,
        },
        {
            "id": "V004",
            "year": 2023,
            "make": "Chevrolet",
            "model": "Tahoe",
            "bodyStyle": "SUV",
            "price": 68000,
            "mileage": 15000,
            "fuelType": "Gas",
            "drivetrain": "4WD",
            "features": ["Third Row", "Premium Audio", "Heated Seats", "Ventilated Seats"],
            "mpgCity": 15,
            "mpgHighway": 20,
        },
        {
            "id": "V005",
            "year": 2024,
            "make": "Chevrolet",
            "model": "Corvette",
            "bodyStyle": "Coupe",
            "price": 75000,
            "mileage": 0,
            "fuelType": "Gas",
            "drivetrain": "RWD",
            "features": ["Performance Exhaust", "Magnetic Ride", "Brembo", "Carbon Fiber"],
            "mpgCity": 15,
            "mpgHighway": 27,
        },
        {
            "id": "V006",
            "year": 2024,
            "make": "Chevrolet",
            "model": "Trax",
            "bodyStyle": "SUV",
            "price": 22000,
            "mileage": 0,
            "fuelType": "Gas",
            "drivetrain": "FWD",
            "features": ["Apple CarPlay", "Backup Camera"],
            "mpgCity": 28,
            "mpgHighway": 32,
        },
    ]


# Feature Extraction Tests
class TestFeatureExtraction:
    
    def test_extract_basic_features(self, recommender, sample_vehicles):
        """Test that basic features are extracted correctly"""
        truck = sample_vehicles[0]
        features = recommender.extract_features(truck)
        
        assert features.body_style == "truck"
        assert features.fuel_type == "gas"
        assert features.drivetrain == "4wd"
        assert features.year == 2024
        assert features.raw_price == 52000
        assert features.raw_mileage == 0
    
    def test_extract_ev_features(self, recommender, sample_vehicles):
        """Test EV-specific feature extraction"""
        ev = sample_vehicles[2]  # Equinox EV
        features = recommender.extract_features(ev)
        
        assert features.fuel_type == "electric"
        assert features.fuel_category == FuelCategory.ELECTRIC
        assert features.is_electric == True
        # EV performance score should be based on range
        assert features.performance_score > 80  # 319 mi range
    
    def test_extract_performance_vehicle(self, recommender, sample_vehicles):
        """Test performance vehicle detection"""
        corvette = sample_vehicles[4]
        features = recommender.extract_features(corvette)
        
        assert features.is_performance == True
        assert "performance exhaust" in features.features_set or "magnetic ride" in features.features_set
    
    def test_extract_luxury_by_price(self, recommender, sample_vehicles):
        """Test luxury detection by price threshold"""
        tahoe = sample_vehicles[3]  # $68k
        features = recommender.extract_features(tahoe)
        
        assert features.is_luxury == True
    
    def test_extract_luxury_by_features(self, recommender):
        """Test luxury detection by features"""
        vehicle = {
            "id": "test",
            "bodyStyle": "Sedan",
            "price": 40000,  # Below luxury threshold
            "features": ["Massaging Seats", "Premium Audio", "Wood Trim"],
            "fuelType": "Gas",
            "drivetrain": "FWD",
        }
        features = recommender.extract_features(vehicle)
        
        assert features.is_luxury == True
    
    def test_price_bucket_assignment(self, recommender):
        """Test correct price bucket assignment"""
        vehicles = [
            {"id": "1", "price": 20000, "bodyStyle": "Sedan", "fuelType": "Gas", "drivetrain": "FWD"},
            {"id": "2", "price": 40000, "bodyStyle": "SUV", "fuelType": "Gas", "drivetrain": "AWD"},
            {"id": "3", "price": 90000, "bodyStyle": "Truck", "fuelType": "Gas", "drivetrain": "4WD"},
        ]
        
        features = [recommender.extract_features(v) for v in vehicles]
        
        # Buckets should be different and increasing
        assert features[0].price_bucket < features[1].price_bucket
        assert features[1].price_bucket < features[2].price_bucket
    
    def test_handle_missing_fields(self, recommender):
        """Test graceful handling of missing fields"""
        sparse_vehicle = {"id": "sparse"}
        
        # Should not raise exception
        features = recommender.extract_features(sparse_vehicle)
        
        # Should have defaults
        assert features.body_style == "sedan"
        assert features.fuel_type == "gas"
        assert features.year == 2024
    
    def test_handle_snake_case_fields(self, recommender):
        """Test handling of snake_case field names"""
        vehicle = {
            "id": "snake",
            "body_style": "Truck",
            "fuel_type": "Diesel",
            "mpg_city": 20,
            "mpg_highway": 28,
        }
        
        features = recommender.extract_features(vehicle)
        
        assert features.body_style == "truck"
        assert features.fuel_type == "diesel"


# Similarity Calculation Tests
class TestSimilarityCalculation:
    
    def test_identical_vehicles_high_similarity(self, recommender, sample_vehicles):
        """Identical vehicles should have similarity close to 1.0"""
        truck1 = sample_vehicles[0]
        truck2 = sample_vehicles[0].copy()
        truck2["id"] = "copy"
        
        f1 = recommender.extract_features(truck1)
        f2 = recommender.extract_features(truck2)
        
        score, contributions = recommender.calculate_similarity(f1, f2)
        
        assert score >= 0.95
    
    def test_similar_trucks_high_similarity(self, recommender, sample_vehicles):
        """Similar trucks should have high similarity"""
        truck1 = sample_vehicles[0]  # Silverado $52k
        truck2 = sample_vehicles[1]  # Silverado $48k
        
        f1 = recommender.extract_features(truck1)
        f2 = recommender.extract_features(truck2)
        
        score, contributions = recommender.calculate_similarity(f1, f2)
        
        assert score > 0.7  # Should be highly similar
        assert contributions['body_style'] > 0  # Body style should contribute
        assert contributions['drivetrain'] > 0  # Same 4WD
    
    def test_different_body_styles_lower_similarity(self, recommender, sample_vehicles):
        """Different body styles should reduce similarity"""
        truck = sample_vehicles[0]
        suv = sample_vehicles[2]
        
        f_truck = recommender.extract_features(truck)
        f_suv = recommender.extract_features(suv)
        
        score, contributions = recommender.calculate_similarity(f_truck, f_suv)
        
        assert contributions['body_style'] == 0  # No body style match
        assert score < 0.5  # Should be lower similarity
    
    def test_fuel_type_similarity_exact_match(self, recommender):
        """Exact fuel type match should get full score"""
        gas1 = {"id": "1", "fuelType": "Gas", "bodyStyle": "Sedan", "price": 30000, "drivetrain": "FWD"}
        gas2 = {"id": "2", "fuelType": "Gas", "bodyStyle": "Sedan", "price": 32000, "drivetrain": "FWD"}
        
        f1 = recommender.extract_features(gas1)
        f2 = recommender.extract_features(gas2)
        
        _, contributions = recommender.calculate_similarity(f1, f2)
        
        assert contributions['fuel_type'] > 0
    
    def test_fuel_type_similarity_electric_variants(self, recommender):
        """Electric and Hybrid should get partial fuel similarity"""
        ev = {"id": "1", "fuelType": "Electric", "bodyStyle": "SUV", "price": 45000, "drivetrain": "AWD"}
        hybrid = {"id": "2", "fuelType": "Hybrid", "bodyStyle": "SUV", "price": 40000, "drivetrain": "AWD"}
        
        f_ev = recommender.extract_features(ev)
        f_hybrid = recommender.extract_features(hybrid)
        
        _, contributions = recommender.calculate_similarity(f_ev, f_hybrid)
        
        # Both are electrified, should get partial credit
        assert contributions['fuel_type'] > 0
    
    def test_feature_overlap_jaccard(self, recommender):
        """Feature similarity should use Jaccard index"""
        v1 = {
            "id": "1",
            "bodyStyle": "SUV",
            "fuelType": "Gas",
            "drivetrain": "AWD",
            "price": 40000,
            "features": ["Heated Seats", "Apple CarPlay", "Backup Camera", "Sunroof"]
        }
        v2 = {
            "id": "2",
            "bodyStyle": "SUV",
            "fuelType": "Gas",
            "drivetrain": "AWD",
            "price": 42000,
            "features": ["Heated Seats", "Apple CarPlay", "Navigation"]  # 2 common features
        }
        
        f1 = recommender.extract_features(v1)
        f2 = recommender.extract_features(v2)
        
        _, contributions = recommender.calculate_similarity(f1, f2)
        
        # Should have some feature contribution (Jaccard = 2/5 = 0.4)
        assert contributions['features'] > 0
    
    def test_performance_score_similarity(self, recommender, sample_vehicles):
        """Similar performance vehicles should get performance credit"""
        corvette = sample_vehicles[4]  # Performance car
        
        # Another performance-oriented vehicle
        camaro = {
            "id": "camaro",
            "bodyStyle": "Coupe",
            "price": 70000,
            "fuelType": "Gas",
            "drivetrain": "RWD",
            "features": ["Performance Exhaust", "Track Mode"],
            "mpgCity": 16,
            "mpgHighway": 26,
        }
        
        f1 = recommender.extract_features(corvette)
        f2 = recommender.extract_features(camaro)
        
        _, contributions = recommender.calculate_similarity(f1, f2)
        
        assert contributions['performance'] > 0


# Recommendation Generation Tests
class TestRecommendations:
    
    def test_recommend_returns_results(self, recommender, sample_vehicles):
        """Basic test that recommend returns results"""
        source = sample_vehicles[0]
        
        results = recommender.recommend(source, sample_vehicles, limit=3)
        
        assert len(results) <= 3
        assert all(isinstance(r, RecommendationResult) for r in results)
    
    def test_recommend_excludes_source(self, recommender, sample_vehicles):
        """Recommendations should not include the source vehicle"""
        source = sample_vehicles[0]
        
        results = recommender.recommend(source, sample_vehicles, limit=10)
        
        result_ids = [r.vehicle["id"] for r in results]
        assert source["id"] not in result_ids
    
    def test_recommend_sorted_by_score(self, recommender, sample_vehicles):
        """Results should be sorted by similarity score descending"""
        source = sample_vehicles[0]
        
        results = recommender.recommend(source, sample_vehicles, limit=5)
        
        scores = [r.similarity_score for r in results]
        assert scores == sorted(scores, reverse=True)
    
    def test_recommend_includes_match_reasons(self, recommender, sample_vehicles):
        """Results should include human-readable match reasons"""
        source = sample_vehicles[0]
        
        results = recommender.recommend(source, sample_vehicles, limit=5)
        
        for result in results:
            assert len(result.match_reasons) > 0
            assert all(isinstance(r, str) for r in result.match_reasons)
    
    def test_recommend_min_score_filter(self, recommender, sample_vehicles):
        """Results should respect minimum score threshold"""
        source = sample_vehicles[4]  # Corvette - unique
        
        results = recommender.recommend(source, sample_vehicles, limit=10, min_score=0.5)
        
        for result in results:
            assert result.similarity_score >= 0.5
    
    def test_recommend_confidence_levels(self, recommender, sample_vehicles):
        """Results should have appropriate confidence levels"""
        source = sample_vehicles[0]
        
        results = recommender.recommend(source, sample_vehicles, limit=10)
        
        for result in results:
            assert result.confidence in ['high', 'medium', 'low']
            if result.similarity_score > 0.7:
                assert result.confidence == 'high'
    
    def test_personalized_recommendations(self, recommender, sample_vehicles):
        """Personalized recommendations based on browsing history"""
        # Customer viewed two trucks
        viewed = [sample_vehicles[0], sample_vehicles[1]]
        
        results = recommender.recommend_personalized(viewed, sample_vehicles, limit=3)
        
        assert len(results) > 0
        # Results should not include viewed vehicles
        result_ids = [r.vehicle["id"] for r in results]
        assert sample_vehicles[0]["id"] not in result_ids
        assert sample_vehicles[1]["id"] not in result_ids
    
    def test_personalized_empty_history(self, recommender, sample_vehicles):
        """Personalized with empty history should return empty"""
        results = recommender.recommend_personalized([], sample_vehicles, limit=3)
        
        assert results == []


# Configuration Tests
class TestConfiguration:
    
    def test_default_config(self, recommender):
        """Default configuration should be valid"""
        config = recommender.get_config()
        
        assert "weights" in config
        assert "price_buckets" in config
        assert "version" in config
    
    def test_custom_config(self, custom_config):
        """Custom configuration should be applied"""
        recommender = VehicleRecommender(config=custom_config)
        
        # Body style has higher weight in custom config
        config = recommender.get_config()
        assert config["weights"]["body_style"] == 3.0
    
    def test_config_from_dict(self):
        """Configuration can be loaded from dict"""
        config_dict = {
            "weights": {"body_style": 5.0, "price_range": 1.0},
            "price_buckets": [0, 50000, float('inf')],
        }
        
        # This would normally load from file, but we're testing the pattern
        config = RecommenderConfig(**config_dict)
        assert config.weights["body_style"] == 5.0


# Edge Cases
class TestEdgeCases:
    
    def test_empty_candidates(self, recommender, sample_vehicles):
        """Empty candidate list should return empty results"""
        source = sample_vehicles[0]
        
        results = recommender.recommend(source, [], limit=5)
        
        assert results == []
    
    def test_single_candidate(self, recommender, sample_vehicles):
        """Single candidate should work correctly"""
        source = sample_vehicles[0]
        candidates = [sample_vehicles[1]]
        
        results = recommender.recommend(source, candidates, limit=5)
        
        assert len(results) == 1
    
    def test_limit_exceeds_candidates(self, recommender, sample_vehicles):
        """Limit exceeding candidates should return all available"""
        source = sample_vehicles[0]
        
        results = recommender.recommend(source, sample_vehicles, limit=100)
        
        assert len(results) == len(sample_vehicles) - 1  # Excluding source
    
    def test_vehicle_with_no_features(self, recommender):
        """Vehicles without features should still work"""
        v1 = {"id": "1", "bodyStyle": "SUV", "price": 40000, "fuelType": "Gas", "drivetrain": "AWD"}
        v2 = {"id": "2", "bodyStyle": "SUV", "price": 42000, "fuelType": "Gas", "drivetrain": "AWD"}
        
        results = recommender.recommend(v1, [v2], limit=5)
        
        assert len(results) == 1
    
    def test_extreme_prices(self, recommender):
        """Extreme price values should be handled"""
        cheap = {"id": "1", "bodyStyle": "Sedan", "price": 1000, "fuelType": "Gas", "drivetrain": "FWD"}
        expensive = {"id": "2", "bodyStyle": "Sedan", "price": 500000, "fuelType": "Gas", "drivetrain": "FWD"}
        
        f_cheap = recommender.extract_features(cheap)
        f_expensive = recommender.extract_features(expensive)
        
        # Should not crash
        score, _ = recommender.calculate_similarity(f_cheap, f_expensive)
        assert 0 <= score <= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
