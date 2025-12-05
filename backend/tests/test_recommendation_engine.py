"""
Tests for Vehicle Recommendation Engine
"""

import pytest
from app.core.recommendation_engine import VehicleRecommender


@pytest.fixture
def recommender():
    """Create a recommender instance for testing."""
    return VehicleRecommender()


@pytest.fixture
def sample_vehicles():
    """Sample vehicle data for testing."""
    return [
        {
            "Stock Number": "M12345",
            "Year": 2024,
            "Make": "Chevrolet",
            "Model": "Silverado 1500",
            "Trim": "LT",
            "MSRP": 52000,
            "Body": "4WD Crew Cab 147\"",
            "Body Type": "PKUP",
            "fuelType": "Gasoline",
            "drivetrain": "4WD",
            "features": ["Towing Package", "LT Package"]
        },
        {
            "Stock Number": "M12346",
            "Year": 2024,
            "Make": "Chevrolet",
            "Model": "Equinox",
            "Trim": "RS",
            "MSRP": 35000,
            "Body": "AWD 4dr RS",
            "Body Type": "APURP",
            "fuelType": "Gasoline",
            "drivetrain": "AWD",
            "features": ["RS Sport Package", "Leather Seats"]
        },
        {
            "Stock Number": "M12347",
            "Year": 2024,
            "Make": "Chevrolet",
            "Model": "Tahoe",
            "Trim": "Premier",
            "MSRP": 72000,
            "Body": "4WD 4dr",
            "Body Type": "APURP",
            "fuelType": "Gasoline",
            "drivetrain": "4WD",
            "features": ["Premium Audio", "Leather Seats", "Third Row Seating"]
        },
        {
            "Stock Number": "M12348",
            "Year": 2024,
            "Make": "Chevrolet",
            "Model": "Corvette",
            "Trim": "Stingray",
            "MSRP": 65000,
            "Body": "2dr Stingray",
            "Body Type": "COUPE",
            "fuelType": "Gasoline",
            "drivetrain": "RWD",
            "features": ["Performance Package", "Sport Suspension"]
        },
        {
            "Stock Number": "M12349",
            "Year": 2025,
            "Make": "Chevrolet",
            "Model": "Equinox EV",
            "Trim": "RS",
            "MSRP": 48000,
            "Body": "AWD 4dr",
            "Body Type": "APURP",
            "fuelType": "Electric",
            "drivetrain": "AWD",
            "features": ["Electric Powertrain", "RS Sport Package"]
        },
        {
            "Stock Number": "M12350",
            "Year": 2024,
            "Make": "Chevrolet",
            "Model": "Silverado 1500",
            "Trim": "High Country",
            "MSRP": 68000,
            "Body": "4WD Crew Cab 147\"",
            "Body Type": "PKUP",
            "fuelType": "Gasoline",
            "drivetrain": "4WD",
            "features": ["Luxury Package", "Premium Leather", "Towing Package"]
        }
    ]


class TestFeatureExtraction:
    """Tests for feature extraction from vehicle data."""
    
    def test_extract_basic_features(self, recommender, sample_vehicles):
        """Test basic feature extraction."""
        vehicle = sample_vehicles[0]  # Silverado
        features = recommender.extract_features(vehicle)
        
        assert features["make"] == "chevrolet"
        assert features["model"] == "silverado 1500"
        assert features["year"] == 2024
        assert features["price"] == 52000
    
    def test_extract_ev_features(self, recommender, sample_vehicles):
        """Test EV vehicle feature extraction."""
        vehicle = sample_vehicles[4]  # Equinox EV
        features = recommender.extract_features(vehicle)
        
        assert features["fuel_type"] == "electric"
    
    def test_extract_performance_vehicle(self, recommender, sample_vehicles):
        """Test performance vehicle detection."""
        vehicle = sample_vehicles[3]  # Corvette
        features = recommender.extract_features(vehicle)
        
        assert features["is_performance"] == True
    
    def test_extract_luxury_vehicle(self, recommender, sample_vehicles):
        """Test luxury vehicle detection."""
        vehicle = sample_vehicles[2]  # Tahoe Premier at $72k
        features = recommender.extract_features(vehicle)
        
        assert features["is_luxury"] == True
    
    def test_handle_missing_fields(self, recommender):
        """Test handling of missing fields."""
        vehicle = {"Stock Number": "M99999", "Year": 2024}
        features = recommender.extract_features(vehicle)
        
        assert features["make"] == ""
        assert features["model"] == ""
        assert features["price"] == 0


class TestSimilarityCalculation:
    """Tests for similarity scoring."""
    
    def test_identical_vehicles_high_similarity(self, recommender, sample_vehicles):
        """Test that identical vehicles have high similarity."""
        vehicle = sample_vehicles[0]
        features = recommender.extract_features(vehicle)
        
        score, components = recommender.calculate_similarity(features, features)
        
        assert score >= 0.8
    
    def test_similar_trucks_high_similarity(self, recommender, sample_vehicles):
        """Test that similar trucks have good similarity."""
        truck1 = sample_vehicles[0]  # Silverado LT
        truck2 = sample_vehicles[5]  # Silverado High Country
        
        features1 = recommender.extract_features(truck1)
        features2 = recommender.extract_features(truck2)
        
        score, components = recommender.calculate_similarity(features1, features2)
        
        assert score >= 0.5  # Should have decent similarity
    
    def test_different_body_styles_lower_similarity(self, recommender, sample_vehicles):
        """Test that different body styles have lower similarity."""
        truck = sample_vehicles[0]  # Silverado (truck)
        suv = sample_vehicles[1]    # Equinox (SUV)
        
        features1 = recommender.extract_features(truck)
        features2 = recommender.extract_features(suv)
        
        score, components = recommender.calculate_similarity(features1, features2)
        
        assert score < 0.7  # Should have lower similarity


class TestRecommendations:
    """Tests for recommendation generation."""
    
    def test_recommend_returns_results(self, recommender, sample_vehicles):
        """Test that recommendations are returned."""
        source = sample_vehicles[0]
        
        recommendations = recommender.get_recommendations(
            source_vehicle=source,
            candidates=sample_vehicles,
            limit=3
        )
        
        assert len(recommendations) <= 3
    
    def test_recommend_excludes_source(self, recommender, sample_vehicles):
        """Test that source vehicle is excluded from recommendations."""
        source = sample_vehicles[0]
        
        recommendations = recommender.get_recommendations(
            source_vehicle=source,
            candidates=sample_vehicles,
            limit=6
        )
        
        stock_numbers = [r["vehicle"].get("Stock Number") for r in recommendations]
        assert source["Stock Number"] not in stock_numbers
    
    def test_recommend_sorted_by_score(self, recommender, sample_vehicles):
        """Test that recommendations are sorted by score descending."""
        source = sample_vehicles[0]
        
        recommendations = recommender.get_recommendations(
            source_vehicle=source,
            candidates=sample_vehicles,
            limit=6
        )
        
        if len(recommendations) >= 2:
            scores = [r["score"] for r in recommendations]
            assert scores == sorted(scores, reverse=True)
    
    def test_recommend_includes_match_reasons(self, recommender, sample_vehicles):
        """Test that recommendations include match reasons."""
        source = sample_vehicles[0]
        
        recommendations = recommender.get_recommendations(
            source_vehicle=source,
            candidates=sample_vehicles,
            limit=3
        )
        
        if recommendations:
            assert "match_reasons" in recommendations[0]
            assert isinstance(recommendations[0]["match_reasons"], list)
    
    def test_recommend_includes_confidence(self, recommender, sample_vehicles):
        """Test that recommendations include confidence level."""
        source = sample_vehicles[0]
        
        recommendations = recommender.get_recommendations(
            source_vehicle=source,
            candidates=sample_vehicles,
            limit=3
        )
        
        if recommendations:
            assert "confidence" in recommendations[0]
            assert recommendations[0]["confidence"] in ["high", "medium", "low"]


class TestPersonalizedRecommendations:
    """Tests for personalized recommendations based on browsing history."""
    
    def test_personalized_with_history(self, recommender, sample_vehicles):
        """Test personalized recommendations with browsing history."""
        # Browsed trucks
        history = [sample_vehicles[0], sample_vehicles[5]]
        
        recommendations = recommender.get_personalized_recommendations(
            browsing_history=history,
            candidates=sample_vehicles,
            limit=3
        )
        
        assert len(recommendations) <= 3
    
    def test_personalized_empty_history(self, recommender, sample_vehicles):
        """Test personalized recommendations with empty history."""
        recommendations = recommender.get_personalized_recommendations(
            browsing_history=[],
            candidates=sample_vehicles,
            limit=3
        )
        
        assert recommendations == []


class TestConfiguration:
    """Tests for recommender configuration."""
    
    def test_default_config(self, recommender):
        """Test that default configuration is loaded."""
        config = recommender.get_config()
        
        assert "weights" in config
        assert "price_buckets" in config
    
    def test_weights_exist(self, recommender):
        """Test that all weight categories exist."""
        config = recommender.get_config()
        
        expected_weights = ["body_style", "price_range", "fuel_type", "drivetrain"]
        for weight in expected_weights:
            assert weight in config["weights"]


class TestEdgeCases:
    """Tests for edge cases."""
    
    def test_empty_candidates(self, recommender, sample_vehicles):
        """Test with empty candidate list."""
        source = sample_vehicles[0]
        
        recommendations = recommender.get_recommendations(
            source_vehicle=source,
            candidates=[],
            limit=6
        )
        
        assert recommendations == []
    
    def test_single_candidate(self, recommender, sample_vehicles):
        """Test with single candidate (the source itself)."""
        source = sample_vehicles[0]
        
        recommendations = recommender.get_recommendations(
            source_vehicle=source,
            candidates=[source],
            limit=6
        )
        
        # Should be empty since source is excluded
        assert len(recommendations) == 0
    
    def test_vehicle_with_no_features(self, recommender, sample_vehicles):
        """Test vehicle with minimal data."""
        source = {"Stock Number": "M99999"}
        
        recommendations = recommender.get_recommendations(
            source_vehicle=source,
            candidates=sample_vehicles,
            limit=3
        )
        
        # Should still return results based on other criteria
        assert isinstance(recommendations, list)
