"""
Tests for Budget Calculation Logic
Covers the calculate_budget tool and affordability calculations
Critical business logic for customer financing
"""

import pytest
import math


# =============================================================================
# BUDGET CALCULATION LOGIC (Mirroring V3 AI Router)
# =============================================================================

def calculate_max_vehicle_price(
    down_payment: float,
    monthly_payment: float,
    apr: float = 7.0,
    term_months: int = 84
) -> dict:
    """
    Calculate maximum vehicle price from down payment and desired monthly payment.
    Uses standard amortization formula.
    
    PV = PMT × [(1 - (1 + r)^-n) / r]
    Max Price = Down Payment + PV
    
    Args:
        down_payment: Cash down payment in dollars
        monthly_payment: Desired monthly payment in dollars
        apr: Annual percentage rate (default 7%)
        term_months: Loan term in months (default 84)
        
    Returns:
        dict with calculation results
    """
    # Convert APR to monthly rate
    monthly_rate = (apr / 100) / 12
    
    # Present Value calculation
    if monthly_rate > 0:
        pv_factor = (1 - (1 + monthly_rate) ** -term_months) / monthly_rate
        financed_amount = monthly_payment * pv_factor
    else:
        financed_amount = monthly_payment * term_months
    
    max_vehicle_price = down_payment + financed_amount
    total_of_payments = monthly_payment * term_months
    total_interest = total_of_payments - financed_amount
    
    return {
        "down_payment": down_payment,
        "monthly_payment": monthly_payment,
        "apr": apr,
        "term_months": term_months,
        "financed_amount": round(financed_amount, 2),
        "max_vehicle_price": round(max_vehicle_price, 2),
        "total_of_payments": round(total_of_payments, 2),
        "total_interest": round(total_interest, 2),
    }


def calculate_monthly_payment(
    vehicle_price: float,
    down_payment: float,
    apr: float = 7.0,
    term_months: int = 84
) -> dict:
    """
    Calculate monthly payment from vehicle price.
    Standard loan amortization formula.
    
    PMT = PV × [r(1 + r)^n] / [(1 + r)^n - 1]
    """
    financed_amount = vehicle_price - down_payment
    monthly_rate = (apr / 100) / 12
    
    if monthly_rate > 0:
        payment = financed_amount * (monthly_rate * (1 + monthly_rate) ** term_months) / ((1 + monthly_rate) ** term_months - 1)
    else:
        payment = financed_amount / term_months
    
    total_of_payments = payment * term_months
    total_interest = total_of_payments - financed_amount
    
    return {
        "vehicle_price": vehicle_price,
        "down_payment": down_payment,
        "financed_amount": round(financed_amount, 2),
        "monthly_payment": round(payment, 2),
        "apr": apr,
        "term_months": term_months,
        "total_of_payments": round(total_of_payments, 2),
        "total_interest": round(total_interest, 2),
    }


# =============================================================================
# BUDGET CALCULATION TESTS
# =============================================================================

class TestCalculateMaxVehiclePrice:
    """Tests for max vehicle price calculation from budget"""
    
    def test_standard_budget_calculation(self):
        """Standard case: $5000 down, $500/month @ 7% for 84 months"""
        result = calculate_max_vehicle_price(
            down_payment=5000,
            monthly_payment=500,
            apr=7.0,
            term_months=84
        )
        
        # With these inputs, max price should be around $37,500
        assert result["max_vehicle_price"] > 35000
        assert result["max_vehicle_price"] < 40000
        assert result["down_payment"] == 5000
        assert result["monthly_payment"] == 500
    
    def test_high_down_payment(self):
        """High down payment: $20,000 down, $400/month"""
        result = calculate_max_vehicle_price(
            down_payment=20000,
            monthly_payment=400,
            apr=7.0,
            term_months=84
        )
        
        # $20k + financed amount should be around $46k
        assert result["max_vehicle_price"] > 44000
        assert result["max_vehicle_price"] < 50000
    
    def test_low_budget(self):
        """Budget buyer: $2000 down, $300/month"""
        result = calculate_max_vehicle_price(
            down_payment=2000,
            monthly_payment=300,
            apr=7.0,
            term_months=84
        )
        
        # Should be around $21,500
        assert result["max_vehicle_price"] > 20000
        assert result["max_vehicle_price"] < 25000
    
    def test_premium_buyer(self):
        """Premium buyer: $15,000 down, $800/month"""
        result = calculate_max_vehicle_price(
            down_payment=15000,
            monthly_payment=800,
            apr=7.0,
            term_months=84
        )
        
        # Should be around $67k
        assert result["max_vehicle_price"] > 60000
        assert result["max_vehicle_price"] < 70000
    
    def test_zero_down_payment(self):
        """Zero down payment scenario"""
        result = calculate_max_vehicle_price(
            down_payment=0,
            monthly_payment=500,
            apr=7.0,
            term_months=84
        )
        
        # All financed, should be around $32,500
        assert result["max_vehicle_price"] > 30000
        assert result["max_vehicle_price"] < 35000
        assert result["down_payment"] == 0
    
    def test_different_apr(self):
        """Different APR rates"""
        # Lower APR should allow higher price
        low_apr = calculate_max_vehicle_price(5000, 500, apr=4.0, term_months=84)
        high_apr = calculate_max_vehicle_price(5000, 500, apr=10.0, term_months=84)
        
        assert low_apr["max_vehicle_price"] > high_apr["max_vehicle_price"]
    
    def test_different_terms(self):
        """Different loan terms"""
        # Longer term should allow higher price (same monthly)
        short_term = calculate_max_vehicle_price(5000, 500, apr=7.0, term_months=60)
        long_term = calculate_max_vehicle_price(5000, 500, apr=7.0, term_months=84)
        
        assert long_term["max_vehicle_price"] > short_term["max_vehicle_price"]
    
    def test_zero_apr(self):
        """Zero APR (promotional financing)"""
        result = calculate_max_vehicle_price(
            down_payment=5000,
            monthly_payment=500,
            apr=0.0,
            term_months=84
        )
        
        # Simple: $5000 + ($500 * 84) = $47,000
        assert result["max_vehicle_price"] == 47000.0
        assert result["total_interest"] == 0.0
    
    def test_total_interest_calculation(self):
        """Verify total interest is calculated correctly"""
        result = calculate_max_vehicle_price(
            down_payment=5000,
            monthly_payment=500,
            apr=7.0,
            term_months=84
        )
        
        # Total of payments = $500 * 84 = $42,000
        assert result["total_of_payments"] == 42000.0
        
        # Interest = Total Payments - Financed Amount
        expected_interest = result["total_of_payments"] - result["financed_amount"]
        assert abs(result["total_interest"] - expected_interest) < 0.01


class TestCalculateMonthlyPayment:
    """Tests for monthly payment calculation from vehicle price"""
    
    def test_standard_payment_calculation(self):
        """Standard case: $40,000 vehicle, $5,000 down"""
        result = calculate_monthly_payment(
            vehicle_price=40000,
            down_payment=5000,
            apr=7.0,
            term_months=84
        )
        
        # Payment should be around $540
        assert result["monthly_payment"] > 500
        assert result["monthly_payment"] < 600
        assert result["financed_amount"] == 35000.0
    
    def test_expensive_vehicle(self):
        """Expensive vehicle: $70,000 with $10,000 down"""
        result = calculate_monthly_payment(
            vehicle_price=70000,
            down_payment=10000,
            apr=7.0,
            term_months=84
        )
        
        # Payment should be around $925
        assert result["monthly_payment"] > 850
        assert result["monthly_payment"] < 1000
    
    def test_budget_vehicle(self):
        """Budget vehicle: $25,000 with $3,000 down"""
        result = calculate_monthly_payment(
            vehicle_price=25000,
            down_payment=3000,
            apr=7.0,
            term_months=84
        )
        
        # Payment should be around $340
        assert result["monthly_payment"] > 300
        assert result["monthly_payment"] < 400
    
    def test_full_price_no_down(self):
        """Full financing: no down payment"""
        result = calculate_monthly_payment(
            vehicle_price=35000,
            down_payment=0,
            apr=7.0,
            term_months=84
        )
        
        assert result["financed_amount"] == 35000.0
        assert result["monthly_payment"] > 500


class TestBudgetCalculationRoundTrip:
    """Tests to verify calculations are reversible/consistent"""
    
    def test_round_trip_consistency(self):
        """Calculate max price, then verify payment matches"""
        # First, find max price for $500/month
        budget_result = calculate_max_vehicle_price(
            down_payment=5000,
            monthly_payment=500,
            apr=7.0,
            term_months=84
        )
        
        max_price = budget_result["max_vehicle_price"]
        
        # Now calculate payment for that price
        payment_result = calculate_monthly_payment(
            vehicle_price=max_price,
            down_payment=5000,
            apr=7.0,
            term_months=84
        )
        
        # Payment should match original (within rounding)
        assert abs(payment_result["monthly_payment"] - 500) < 1.0
    
    def test_multiple_scenarios_consistency(self):
        """Test multiple budget scenarios for consistency"""
        scenarios = [
            {"down": 3000, "monthly": 400},
            {"down": 5000, "monthly": 500},
            {"down": 10000, "monthly": 600},
            {"down": 15000, "monthly": 700},
            {"down": 20000, "monthly": 800},
        ]
        
        for scenario in scenarios:
            # Calculate max price
            budget = calculate_max_vehicle_price(
                down_payment=scenario["down"],
                monthly_payment=scenario["monthly"],
                apr=7.0,
                term_months=84
            )
            
            # Verify with payment calculation
            payment = calculate_monthly_payment(
                vehicle_price=budget["max_vehicle_price"],
                down_payment=scenario["down"],
                apr=7.0,
                term_months=84
            )
            
            # Should round-trip
            assert abs(payment["monthly_payment"] - scenario["monthly"]) < 1.0


class TestEdgeCases:
    """Edge case tests for budget calculations"""
    
    def test_very_low_monthly_payment(self):
        """Very low monthly payment"""
        result = calculate_max_vehicle_price(
            down_payment=1000,
            monthly_payment=100,
            apr=7.0,
            term_months=84
        )
        
        assert result["max_vehicle_price"] > 0
        assert result["max_vehicle_price"] < 10000
    
    def test_very_high_monthly_payment(self):
        """Very high monthly payment (luxury buyer)"""
        result = calculate_max_vehicle_price(
            down_payment=50000,
            monthly_payment=2000,
            apr=7.0,
            term_months=84
        )
        
        assert result["max_vehicle_price"] > 150000
    
    def test_short_term_loan(self):
        """Short term loan (36 months)"""
        result = calculate_max_vehicle_price(
            down_payment=5000,
            monthly_payment=500,
            apr=7.0,
            term_months=36
        )
        
        # Shorter term = less financed = lower max price
        assert result["max_vehicle_price"] < 25000
    
    def test_realistic_nh_scenario(self):
        """Realistic NH buyer scenario (no sales tax on payments)"""
        # NH buyer: $8000 down, wants $550/month, 84 months at 7%
        result = calculate_max_vehicle_price(
            down_payment=8000,
            monthly_payment=550,
            apr=7.0,
            term_months=84
        )
        
        # Should be able to afford around $43,800
        assert result["max_vehicle_price"] > 40000
        assert result["max_vehicle_price"] < 50000
        
        # Verify they can actually afford a Silverado LT (~$48k) with slightly higher payment
        silverado_result = calculate_monthly_payment(
            vehicle_price=48000,
            down_payment=8000,
            apr=7.0,
            term_months=84
        )
        
        # Payment would be around $617 for Silverado
        assert silverado_result["monthly_payment"] > 600
        assert silverado_result["monthly_payment"] < 650


class TestInventoryFiltering:
    """Tests for using budget to filter inventory"""
    
    def test_filter_inventory_by_budget(self):
        """Filter sample inventory by calculated budget"""
        sample_inventory = [
            {"stock": "M001", "model": "Trax", "price": 24000},
            {"stock": "M002", "model": "Equinox", "price": 35000},
            {"stock": "M003", "model": "Silverado", "price": 52000},
            {"stock": "M004", "model": "Tahoe", "price": 72000},
            {"stock": "M005", "model": "Corvette", "price": 85000},
        ]
        
        # Budget: $5000 down, $500/month
        budget = calculate_max_vehicle_price(5000, 500, 7.0, 84)
        max_price = budget["max_vehicle_price"]
        
        # Filter
        affordable = [v for v in sample_inventory if v["price"] <= max_price]
        
        # Should afford Trax and Equinox, not Silverado/Tahoe/Corvette
        assert len(affordable) == 2
        assert any(v["model"] == "Trax" for v in affordable)
        assert any(v["model"] == "Equinox" for v in affordable)
        assert not any(v["model"] == "Silverado" for v in affordable)
    
    def test_premium_buyer_filter(self):
        """Premium buyer can afford more"""
        sample_inventory = [
            {"stock": "M001", "model": "Trax", "price": 24000},
            {"stock": "M002", "model": "Equinox", "price": 35000},
            {"stock": "M003", "model": "Silverado", "price": 52000},
            {"stock": "M004", "model": "Tahoe", "price": 72000},
            {"stock": "M005", "model": "Corvette", "price": 85000},
        ]
        
        # Premium: $20000 down, $900/month
        budget = calculate_max_vehicle_price(20000, 900, 7.0, 84)
        max_price = budget["max_vehicle_price"]
        
        affordable = [v for v in sample_inventory if v["price"] <= max_price]
        
        # Should afford everything except Corvette
        assert len(affordable) == 4
        assert not any(v["model"] == "Corvette" for v in affordable)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
