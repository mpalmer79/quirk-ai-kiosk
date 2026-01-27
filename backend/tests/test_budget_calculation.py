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


# =============================================================================
# CHECK VEHICLE AFFORDABILITY TESTS (New Tool)
# =============================================================================

def check_vehicle_affordability(
    vehicle_price: float,
    down_payment: float,
    monthly_payment: float,
    apr: float = 7.0,
    term_months: int = 84
) -> dict:
    """
    Check if a customer can afford a SPECIFIC vehicle.
    
    This is the logic behind the new check_vehicle_affordability tool.
    Returns whether they can afford it and relevant details.
    """
    # Calculate max affordable price (same as calculate_max_vehicle_price)
    monthly_rate = (apr / 100) / 12
    
    if monthly_rate > 0:
        pv_factor = (1 - (1 + monthly_rate) ** -term_months) / monthly_rate
        financed_amount = monthly_payment * pv_factor
    else:
        financed_amount = monthly_payment * term_months
        pv_factor = term_months
    
    max_affordable = down_payment + financed_amount
    
    # Calculate actual monthly payment for this vehicle
    actual_finance = vehicle_price - down_payment
    if monthly_rate > 0 and pv_factor > 0:
        actual_monthly = actual_finance / pv_factor
    else:
        actual_monthly = actual_finance / term_months
    
    # Determine affordability
    difference = max_affordable - vehicle_price
    can_afford = difference >= 0
    
    return {
        "can_afford": can_afford,
        "vehicle_price": vehicle_price,
        "max_affordable": round(max_affordable, 2),
        "difference": round(difference, 2),
        "actual_monthly_payment": round(actual_monthly, 2),
        "target_monthly_payment": monthly_payment,
        "down_payment": down_payment,
    }


class TestCheckVehicleAffordability:
    """Tests for the check_vehicle_affordability tool logic"""
    
    def test_corvette_3lz_affordability_over_budget(self):
        """
        Test case from the bug report:
        Customer: $20,000 down, $1,000/month
        Vehicle: 2025 Corvette 3LZ at $130,575
        
        Expected: NOT affordable (over budget by ~$44,810)
        """
        result = check_vehicle_affordability(
            vehicle_price=130575,
            down_payment=20000,
            monthly_payment=1000,
            apr=7.0,
            term_months=84
        )
        
        # Should NOT be affordable
        assert result["can_afford"] is False
        
        # Max affordable should be around $85,765
        assert 85000 < result["max_affordable"] < 86500
        
        # Should be over budget by about $44,810
        assert result["difference"] < 0
        assert abs(result["difference"]) > 44000
        assert abs(result["difference"]) < 46000
        
        # Actual monthly would be much higher than target
        assert result["actual_monthly_payment"] > result["target_monthly_payment"]
    
    def test_corvette_1lt_affordability_within_budget(self):
        """
        Same customer budget but checking the 1LT at $77,865
        Expected: AFFORDABLE
        """
        result = check_vehicle_affordability(
            vehicle_price=77865,
            down_payment=20000,
            monthly_payment=1000,
            apr=7.0,
            term_months=84
        )
        
        # Should be affordable
        assert result["can_afford"] is True
        
        # Should have headroom
        assert result["difference"] > 0
        
        # Actual monthly should be under target
        assert result["actual_monthly_payment"] < result["target_monthly_payment"]
    
    def test_affordable_vehicle(self):
        """Test a vehicle that IS affordable"""
        # $10,000 down, $600/month → max ~$49,470
        # Equinox at $35,000 should be affordable
        result = check_vehicle_affordability(
            vehicle_price=35000,
            down_payment=10000,
            monthly_payment=600,
            apr=7.0,
            term_months=84
        )
        
        assert result["can_afford"] is True
        assert result["difference"] > 0  # Has headroom
        assert result["actual_monthly_payment"] < result["target_monthly_payment"]
    
    def test_exactly_at_budget(self):
        """Test vehicle price exactly at max affordable"""
        # Calculate max first
        budget = calculate_max_vehicle_price(5000, 500, 7.0, 84)
        max_price = budget["max_vehicle_price"]
        
        result = check_vehicle_affordability(
            vehicle_price=max_price,
            down_payment=5000,
            monthly_payment=500,
            apr=7.0,
            term_months=84
        )
        
        # Should be exactly affordable (or just barely)
        assert result["can_afford"] is True
        assert abs(result["difference"]) < 1  # Essentially zero
    
    def test_slightly_over_budget(self):
        """Test vehicle just $1000 over budget"""
        budget = calculate_max_vehicle_price(5000, 500, 7.0, 84)
        over_budget_price = budget["max_vehicle_price"] + 1000
        
        result = check_vehicle_affordability(
            vehicle_price=over_budget_price,
            down_payment=5000,
            monthly_payment=500,
            apr=7.0,
            term_months=84
        )
        
        assert result["can_afford"] is False
        assert -1100 < result["difference"] < -900
    
    def test_1lt_vs_3lz_comparison(self):
        """Compare affordability of 1LT ($77,865) vs 3LZ ($130,575) Corvette"""
        down = 20000
        monthly = 1000
        
        # 1LT at $77,865
        result_1lt = check_vehicle_affordability(
            vehicle_price=77865,
            down_payment=down,
            monthly_payment=monthly
        )
        
        # 3LZ at $130,575
        result_3lz = check_vehicle_affordability(
            vehicle_price=130575,
            down_payment=down,
            monthly_payment=monthly
        )
        
        # 1LT should be affordable, 3LZ should not
        assert result_1lt["can_afford"] is True
        assert result_3lz["can_afford"] is False
        
        # Both should have same max_affordable (same budget)
        assert result_1lt["max_affordable"] == result_3lz["max_affordable"]
    
    def test_what_it_takes_to_afford_corvette_3lz(self):
        """Calculate what's needed to afford the $130,575 Corvette 3LZ"""
        vehicle_price = 130575
        
        # Option 1: Keep $1000/month, increase down payment
        # We need to finance less, so need more down
        budget_1k = calculate_max_vehicle_price(0, 1000, 7.0, 84)
        max_finance = budget_1k["financed_amount"]  # ~$65,765
        needed_down = vehicle_price - max_finance  # ~$64,810
        
        result_high_down = check_vehicle_affordability(
            vehicle_price=vehicle_price,
            down_payment=needed_down,
            monthly_payment=1000
        )
        
        assert result_high_down["can_afford"] is True
        
        # Option 2: Keep $20,000 down, calculate needed monthly
        # Using reverse calculation
        financed_needed = vehicle_price - 20000  # $110,575
        monthly_rate = 0.07 / 12
        pv_factor = (1 - (1 + monthly_rate) ** -84) / monthly_rate
        needed_monthly = financed_needed / pv_factor  # ~$1,682
        
        result_high_monthly = check_vehicle_affordability(
            vehicle_price=vehicle_price,
            down_payment=20000,
            monthly_payment=needed_monthly
        )
        
        assert result_high_monthly["can_afford"] is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
