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
    return {
        "id": "v005",
        "bodyStyle": "Sedan",
        "price": 28000,
        "fuelType": "Gasoline",
        "drivetrain": "FWD",
        "features": ["Apple CarPlay", "Backup Camera"],
    }


class TestSimilarityScoreCalculation:
    def test_identical_vehicles_high_score(self, truck_vehicle):
        score = calculate_similarity_score(truck_vehicle, truck_vehicle)
        assert score == 1.0

    def test_similar_trucks_high_score(self, truck_vehicle, similar_truck):
        score = calculate_similarity_score(truck_vehicle, similar_truck)
        assert score >= 0.7

    def test_different_body_style_reduces_score(self, truck_vehicle, suv_vehicle):
        score = calculate_similarity_score(truck_vehicle, suv_vehicle)
        assert score < 1.0

    def test_large_price_difference_reduces_score(self, truck_vehicle, budget_sedan):
        score = calculate_similarity_score(truck_vehicle, budget_sedan)
        assert score < 0.5

    def test_score_bounded_zero_to_one(self, truck_vehicle, budget_sedan):
        score = calculate_similarity_score(truck_vehicle, budget_sedan)
        assert 0.0 <= score <= 1.0

    def test_score_is_symmetric(self, truck_vehicle, suv_vehicle):
        score_ab = calculate_similarity_score(truck_vehicle, suv_vehicle)
        score_ba = calculate_similarity_score(suv_vehicle, truck_vehicle)
        assert abs(score_ab - score_ba) < 0.01


class TestMatchReasonGeneration:
    def test_same_body_style_reason(self):
        v1 = {"bodyStyle": "Truck", "price": 50000, "fuelType": "Gasoline", "drivetrain": "4WD"}
        v2 = {"bodyStyle": "Truck", "price": 100000, "fuelType": "Diesel", "drivetrain": "2WD"}
        reason = get_match_reason(v1, v2)
        assert "Truck" in reason

    def test_similar_price_reason(self):
        v1 = {"bodyStyle": "Sedan", "price": 30000, "fuelType": "Gasoline", "drivetrain": "FWD"}
        v2 = {"bodyStyle": "Truck", "price": 32000, "fuelType": "Diesel", "drivetrain": "4WD"}
        reason = get_match_reason(v1, v2)
        assert "price" in reason.lower()

    def test_electric_fuel_type_reason(self):
        v1 = {"bodyStyle": "SUV", "price": 60000, "fuelType": "Electric", "drivetrain": "AWD"}
        v2 = {"bodyStyle": "Sedan", "price": 45000, "fuelType": "Electric", "drivetrain": "AWD"}
        reason = get_match_reason(v1, v2)
        assert "electric" in reason.lower()

    def test_no_match_returns_popular(self):
        v1 = {"bodyStyle": "Sedan", "price": 30000, "fuelType": "Gasoline", "drivetrain": "FWD"}
        v2 = {"bodyStyle": "Truck", "price": 80000, "fuelType": "Diesel", "drivetrain": "4WD"}
        reason = get_match_reason(v1, v2)
        assert reason == "Popular choice"


class TestEdgeCases:
    def test_zero_price_vehicle(self):
        v1 = {"bodyStyle": "SUV", "price": 0, "fuelType": "Gasoline", "drivetrain": "4WD", "features": []}
        v2 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "4WD", "features": []}
        score = calculate_similarity_score(v1, v2)
        assert 0 <= score <= 1.0

    def test_missing_features_key(self):
        v1 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "4WD"}
        v2 = {"bodyStyle": "SUV", "price": 50000, "fuelType": "Gasoline", "drivetrain": "4WD", "features": ["Nav"]}
        score = calculate_similarity_score(v1, v2)
        assert 0 <= score <= 1.0
