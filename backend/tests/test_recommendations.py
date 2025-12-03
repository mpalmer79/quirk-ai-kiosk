"""
Tests for Recommendation Scoring Algorithm
Tests the content-based filtering and similarity calculations
"""
import pytest
from app.routers.recommendations import (
    calculate_similarity_score,
    get_match_reason,
)


@pytest.fixture
def truck_vehicle():
    """Sample truck vehicle for testing"""
    return {
        "id": "v001",
        "bodyStyle": "Truck",
        "price": 55000,
        "fuelType": "Gasoline",
        "drivetrain": "4WD",
        "features": ["Towing Package", "Leather Seats", "Navigation"],
    }


@pytest.fixture
def similar_truck():
    """Similar truck for high similarity score"""
    return {
        "id": "v002",
        "bodyStyle": "Truck",
        "price": 58000,
        "fuelType": "Gasoline",
        "drivetrain": "4WD",
        "features": ["Towing Package", "Leather Seats", "Heated Seats"],
    }


@pytest.fixture
def suv_vehicle():
    """Different body style for lower similarity"""
    return {
        "id": "v003",
        "bodyStyle": "SUV",
        "price": 52000,
        "fuelType": "Gasoline",
        "drivetrain": "4WD",
        "features": ["Third Row Seating", "Leather Seats", "Navigation"],
    }


@pytest.fixture
def electric_suv():
    """Electric vehicle for fuel type comparison"""
    return {
        "id": "v004",
        "bodyStyle": "SUV",
        "price": 65000,
        "fuelType": "Electric",
        "drivetrain": "AWD",
        "features": ["Autopilot", "Premium Audio", "Navigation"],
    }


@pytest.fixture
def budget_sedan():
    """Budget sedan for price comparison"""
    return {
        "id": "v005",
        "bodyStyle": "Sedan",
        "price": 28000,
        "fuelType": "Gasoline",
        "drivetrain": "FWD",
        "features": ["Apple CarPlay", "Backup Camera"],
    }


class TestSimilarityScoreCalculation:
    """Test suite for similarity score calculations"""
    
    def test_identical_vehicles_high_score(self, truck_vehicle):
        """Identical vehicles should have max similarity"""
        score = calculate_similarity_score(truck_vehicle, truck_vehicle)
        assert score == 1.0
    
    def test_similar_trucks_high_score(self, truck_vehicle, similar_truck):
        """Similar trucks should have high similarity"""
        score = calculate_similarity_score(truck_vehicle, similar_truck)
        assert score >= 0.7, "Similar trucks should score >= 0.7"
    
    def test_different_body_style_reduces_score(self, truck_vehicle, suv_vehicle):
        """Different body style should reduce similarity"""
        score = calculate_similarity_score(truck_vehicle, suv_vehicle)
        assert score < 1.0
    
    def test_large_price_difference_reduces_score(self, truck_vehicle, budget_sedan):
        """Large price difference should reduce similarity"""
        score = calculate_similarity_score(truck_vehicle, budget_sedan)
        assert score < 0.5, "Large price gap should score < 0.5"
    
    def test_different_fuel_type_reduces_score(self, suv_vehicle, electric_suv):
        """Different fuel type should reduce similarity"""
        score = calculate_similarity_score(suv_vehicle, electric_suv)
        assert score < 0.8
    
    def test_score_bounded_zero_to_one(self, truck_vehicle, budget_sedan):
        """Similarity score should always be between 0 and 1"""
        score = calculate_similarity_score(truck_vehicle, budget_sedan)
        assert 0.0 <= score <= 1.0
    
    def test_score_is_symmetric(self, truck_vehicle, suv_vehicle):
        """Similarity should be symmetric: sim(A,B) == sim(B,A)"""
        score_ab = calculate_similarity_score(truck_vehicle, suv_vehicle)
        score_ba = calculate_similarity_score(suv_vehicle, truck_vehicle)
        assert abs(score_ab - score_ba) < 0.01


class TestBodyStyleWeight:
    """Test body style scoring component"""
    
    def test_same_body_style_adds_weight(self):
        """Same body style should add 1.5 to score"""
        v1 = {"bodyStyle": "Truck", "price": 50000, "fuelType": "Gasoline", 
              "drivetrain": "4WD", "features": []}
        v2 = {"bodyStyle": "Truck", "price": 100000, "fuelType": "Diesel",
              "drivetrain": "2WD", "features": []}
        
        score = calculate_similarity_score(v1, v2)
        assert score > 0.2
    
    def test_different_body_style_no_weight(self):
        """Different body style should not add points"""
        v1 = {"bodyStyle": "Truck", "price": 50000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": []}
        v2 = {"bodyStyle": "Sedan", "price": 50000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": []}
        
        score = calculate_similarity_score(v1, v2)
        assert score < 0.8


class TestPriceProximityWeight:
    """Test price proximity scoring component"""
    
    def test_same_price_full_weight(self):
        """Same price should add full 1.0 weight"""
        v1 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": []}
        v2 = {"bodyStyle": "Truck", "price": 50000, "fuelType": "Diesel",
              "drivetrain": "2WD", "features": []}
        
        score = calculate_similarity_score(v1, v2)
        assert score >= 0.2
    
    def test_price_within_20_percent_full_weight(self):
        """Price within 20% should add full weight"""
        v1 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": []}
        v2 = {"bodyStyle": "SUV", "price": 55000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": []}
        
        score = calculate_similarity_score(v1, v2)
        assert score > 0.8


class TestFeatureOverlapWeight:
    """Test feature overlap scoring component"""
    
    def test_identical_features_full_weight(self):
        """Identical features should add full 0.75 weight"""
        features = ["Leather Seats", "Navigation", "Sunroof"]
        v1 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": features}
        v2 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": features}
        
        score = calculate_similarity_score(v1, v2)
        assert score == 1.0
    
    def test_empty_features_no_error(self):
        """Empty features should not cause errors"""
        v1 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": []}
        v2 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": []}
        
        score = calculate_similarity_score(v1, v2)
        assert score > 0.7


class TestMatchReasonGeneration:
    """Test human-readable match reason generation"""
    
    def test_same_body_style_reason(self):
        """Same body style generates body style reason"""
        v1 = {"bodyStyle": "Truck", "price": 50000, "fuelType": "Gasoline", 
              "drivetrain": "4WD"}
        v2 = {"bodyStyle": "Truck", "price": 100000, "fuelType": "Diesel",
              "drivetrain": "2WD"}
        
        reason = get_match_reason(v1, v2)
        assert "Truck" in reason
    
    def test_similar_price_reason(self):
        """Similar price generates price reason"""
        v1 = {"bodyStyle": "Sedan", "price": 30000, "fuelType": "Gasoline",
              "drivetrain": "FWD"}
        v2 = {"bodyStyle": "Truck", "price": 32000, "fuelType": "Diesel",
              "drivetrain": "4WD"}
        
        reason = get_match_reason(v1, v2)
        assert "price" in reason.lower()
    
    def test_electric_fuel_type_reason(self):
        """Electric vehicles get 'Also electric' reason"""
        v1 = {"bodyStyle": "SUV", "price": 60000, "fuelType": "Electric",
              "drivetrain": "AWD"}
        v2 = {"bodyStyle": "Sedan", "price": 45000, "fuelType": "Electric",
              "drivetrain": "AWD"}
        
        reason = get_match_reason(v1, v2)
        assert "electric" in reason.lower()
    
    def test_no_match_returns_popular(self):
        """No matching attributes returns 'Popular choice'"""
        v1 = {"bodyStyle": "Sedan", "price": 30000, "fuelType": "Gasoline",
              "drivetrain": "FWD"}
        v2 = {"bodyStyle": "Truck", "price": 80000, "fuelType": "Diesel",
              "drivetrain": "4WD"}
        
        reason = get_match_reason(v1, v2)
        assert reason == "Popular choice"


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_zero_price_vehicle(self):
        """Handle zero price gracefully"""
        v1 = {"bodyStyle": "SUV", "price": 0, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": []}
        v2 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline",
              "drivetrain": "4WD", "features": []}
        
        score = calculate_similarity_score(v1, v2)
        assert 0 <= score <= 1.0
    
    def test_missing_features_key(self):
