"""
Tests for Recommendations Router functions
Tests the actual functions in app/routers/recommendations.py
"""
import pytest
from app.routers.recommendations import (
    calculate_similarity_score,
    get_match_reason,
)


class TestCalculateSimilarityScore:
    """Test similarity score calculation"""

    def test_identical_vehicles_score_one(self):
        vehicle = {
            "bodyStyle": "Truck",
            "price": 50000,
            "fuelType": "Gasoline",
            "drivetrain": "4WD",
            "features": ["Leather", "Nav"],
        }
        score = calculate_similarity_score(vehicle, vehicle)
        assert score == 1.0

    def test_same_body_style_increases_score(self):
        v1 = {"bodyStyle": "Truck", "price": 50000, "fuelType": "Gasoline", "drivetrain": "4WD", "features": []}
        v2 = {"bodyStyle": "Truck", "price": 80000, "fuelType": "Diesel", "drivetrain": "2WD", "features": []}
        v3 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "4WD", "features": []}
        
        score_same_body = calculate_similarity_score(v1, v2)
        score_diff_body = calculate_similarity_score(v1, v3)
        
        assert score_same_body > score_diff_body

    def test_similar_price_increases_score(self):
        v1 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "AWD", "features": []}
        v2 = {"bodyStyle": "Truck", "price": 52000, "fuelType": "Diesel", "drivetrain": "2WD", "features": []}
        v3 = {"bodyStyle": "Truck", "price": 90000, "fuelType": "Diesel", "drivetrain": "2WD", "features": []}
        
        score_close_price = calculate_similarity_score(v1, v2)
        score_far_price = calculate_similarity_score(v1, v3)
        
        assert score_close_price > score_far_price

    def test_same_fuel_type_increases_score(self):
        v1 = {"bodyStyle": "SUV", "price": 60000, "fuelType": "Electric", "drivetrain": "AWD", "features": []}
        v2 = {"bodyStyle": "Sedan", "price": 80000, "fuelType": "Electric", "drivetrain": "FWD", "features": []}
        v3 = {"bodyStyle": "Sedan", "price": 80000, "fuelType": "Gasoline", "drivetrain": "FWD", "features": []}
        
        score_same_fuel = calculate_similarity_score(v1, v2)
        score_diff_fuel = calculate_similarity_score(v1, v3)
        
        assert score_same_fuel > score_diff_fuel

    def test_score_bounded_zero_to_one(self):
        v1 = {"bodyStyle": "Sedan", "price": 30000, "fuelType": "Gasoline", "drivetrain": "FWD", "features": []}
        v2 = {"bodyStyle": "Truck", "price": 90000, "fuelType": "Diesel", "drivetrain": "4WD", "features": []}
        
        score = calculate_similarity_score(v1, v2)
        assert 0.0 <= score <= 1.0

    def test_feature_overlap_increases_score(self):
        v1 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "AWD", "features": ["Leather", "Nav", "Sunroof"]}
        v2 = {"bodyStyle": "Truck", "price": 80000, "fuelType": "Diesel", "drivetrain": "2WD", "features": ["Leather", "Nav", "Sunroof"]}
        v3 = {"bodyStyle": "Truck", "price": 80000, "fuelType": "Diesel", "drivetrain": "2WD", "features": ["Basic"]}
        
        score_same_features = calculate_similarity_score(v1, v2)
        score_diff_features = calculate_similarity_score(v1, v3)
        
        assert score_same_features > score_diff_features

    def test_empty_features_no_error(self):
        v1 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "AWD", "features": []}
        v2 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "AWD", "features": []}
        
        score = calculate_similarity_score(v1, v2)
        assert score > 0

    def test_missing_features_key_no_error(self):
        v1 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "AWD"}
        v2 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "AWD", "features": ["Nav"]}
        
        score = calculate_similarity_score(v1, v2)
        assert 0 <= score <= 1.0


class TestGetMatchReason:
    """Test match reason generation"""

    def test_same_body_style_reason(self):
        v1 = {"bodyStyle": "Truck", "price": 50000, "fuelType": "Gasoline", "drivetrain": "4WD"}
        v2 = {"bodyStyle": "Truck", "price": 90000, "fuelType": "Diesel", "drivetrain": "2WD"}
        
        reason = get_match_reason(v1, v2)
        assert "Truck" in reason

    def test_similar_price_reason(self):
        v1 = {"bodyStyle": "Sedan", "price": 30000, "fuelType": "Gasoline", "drivetrain": "FWD"}
        v2 = {"bodyStyle": "Truck", "price": 32000, "fuelType": "Diesel", "drivetrain": "4WD"}
        
        reason = get_match_reason(v1, v2)
        assert "price" in reason.lower()

    def test_electric_fuel_type_reason(self):
        v1 = {"bodyStyle": "SUV", "price": 60000, "fuelType": "Electric", "drivetrain": "AWD"}
        v2 = {"bodyStyle": "Sedan", "price": 80000, "fuelType": "Electric", "drivetrain": "AWD"}
        
        reason = get_match_reason(v1, v2)
        assert "electric" in reason.lower()

    def test_hybrid_fuel_type_reason(self):
        v1 = {"bodyStyle": "SUV", "price": 60000, "fuelType": "Hybrid", "drivetrain": "AWD"}
        v2 = {"bodyStyle": "Sedan", "price": 80000, "fuelType": "Hybrid", "drivetrain": "AWD"}
        
        reason = get_match_reason(v1, v2)
        assert "hybrid" in reason.lower()

    def test_same_drivetrain_reason(self):
        v1 = {"bodyStyle": "Sedan", "price": 30000, "fuelType": "Gasoline", "drivetrain": "AWD"}
        v2 = {"bodyStyle": "Truck", "price": 80000, "fuelType": "Diesel", "drivetrain": "AWD"}
        
        reason = get_match_reason(v1, v2)
        assert "AWD" in reason

    def test_no_match_returns_popular_choice(self):
        v1 = {"bodyStyle": "Sedan", "price": 30000, "fuelType": "Gasoline", "drivetrain": "FWD"}
        v2 = {"bodyStyle": "Truck", "price": 80000, "fuelType": "Diesel", "drivetrain": "4WD"}
        
        reason = get_match_reason(v1, v2)
        assert reason == "Popular choice"
