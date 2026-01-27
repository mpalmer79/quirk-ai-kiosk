"""
Tests for Payment Calculator Service
Validates payment math, term options, and affordability calculations.
"""

import pytest
from app.services.payment_calculator import PaymentCalculator, get_payment_calculator


class TestPaymentCalculator:
    """Tests for the PaymentCalculator service"""
    
    @pytest.fixture
    def calculator(self):
        """Get calculator instance"""
        return get_payment_calculator()
    
    # =========================================================================
    # BASIC PAYMENT CALCULATION TESTS
    # =========================================================================
    
    def test_calculate_payment_standard(self, calculator):
        """Standard payment calculation: $35,000 financed @ 7% for 72 months"""
        result = calculator.calculate_payment(
            principal=35000,
            apr=7.0,
            term_months=72
        )
        
        # Payment should be around $532/month
        assert 525 < result.monthly_payment < 540
        assert result.principal == 35000
        assert result.apr == 7.0
        assert result.term_months == 72
        assert result.total_of_payments > 35000  # More than principal due to interest
        assert result.total_interest > 0
    
    def test_calculate_payment_zero_apr(self, calculator):
        """Zero APR promotional financing"""
        result = calculator.calculate_payment(
            principal=42000,
            apr=0.0,
            term_months=84
        )
        
        # Simple division: $42,000 / 84 = $500
        assert result.monthly_payment == 500.0
        assert result.total_interest == 0.0
        assert result.total_of_payments == 42000.0
    
    def test_calculate_payment_high_apr(self, calculator):
        """High APR calculation"""
        result = calculator.calculate_payment(
            principal=30000,
            apr=15.0,
            term_months=60
        )
        
        # Higher APR = higher payment
        assert result.monthly_payment > 700
        assert result.total_interest > 10000  # Significant interest
    
    def test_calculate_payment_short_term(self, calculator):
        """Short term (48 months) - higher payment, less interest"""
        result_short = calculator.calculate_payment(
            principal=30000,
            apr=7.0,
            term_months=48
        )
        
        result_long = calculator.calculate_payment(
            principal=30000,
            apr=7.0,
            term_months=84
        )
        
        # Shorter term = higher payment but less total interest
        assert result_short.monthly_payment > result_long.monthly_payment
        assert result_short.total_interest < result_long.total_interest
    
    # =========================================================================
    # MAX AFFORDABLE CALCULATION TESTS
    # =========================================================================
    
    def test_calculate_max_affordable(self, calculator):
        """Calculate max affordable from monthly payment"""
        result = calculator.calculate_max_affordable(
            monthly_payment=600,
            apr=7.0,
            term_months=84
        )
        
        # $600/month @ 7% for 84 months ≈ $39,459 max financed
        assert 39000 < result < 40000
    
    def test_calculate_max_affordable_zero_apr(self, calculator):
        """Max affordable with 0% APR"""
        result = calculator.calculate_max_affordable(
            monthly_payment=500,
            apr=0.0,
            term_months=84
        )
        
        # Simple: $500 * 84 = $42,000
        assert result == 42000.0
    
    def test_max_affordable_round_trip(self, calculator):
        """Verify max affordable matches payment calculation"""
        target_payment = 700
        
        # Get max affordable
        max_finance = calculator.calculate_max_affordable(
            monthly_payment=target_payment,
            apr=7.0,
            term_months=72
        )
        
        # Calculate payment for that amount
        result = calculator.calculate_payment(
            principal=max_finance,
            apr=7.0,
            term_months=72
        )
        
        # Should match original target (within rounding)
        assert abs(result.monthly_payment - target_payment) < 1
    
    # =========================================================================
    # VEHICLE AFFORDABILITY CHECK TESTS
    # =========================================================================
    
    def test_check_affordability_within_budget(self, calculator):
        """Vehicle within budget"""
        result = calculator.check_vehicle_affordability(
            vehicle_price=35000,
            down_payment=10000,
            monthly_payment=600,
            apr=7.0,
            term_months=84
        )
        
        assert result["can_afford"] is True
        assert result["difference"] > 0
        assert result["actual_monthly"] < 600
    
    def test_check_affordability_over_budget(self, calculator):
        """Vehicle over budget - the Corvette 3LZ test case"""
        result = calculator.check_vehicle_affordability(
            vehicle_price=130575,
            down_payment=20000,
            monthly_payment=1000,
            apr=7.0,
            term_months=84
        )
        
        assert result["can_afford"] is False
        assert result["difference"] < 0
        assert abs(result["difference"]) > 44000  # ~$44,810 over
        assert result["actual_monthly"] > 1000
    
    def test_check_affordability_exactly_at_budget(self, calculator):
        """Vehicle exactly at max affordable"""
        # First calculate what they can afford
        max_finance = calculator.calculate_max_affordable(500, 7.0, 84)
        max_price = 5000 + max_finance  # With $5000 down
        
        result = calculator.check_vehicle_affordability(
            vehicle_price=max_price,
            down_payment=5000,
            monthly_payment=500,
            apr=7.0,
            term_months=84
        )
        
        assert result["can_afford"] is True
        assert abs(result["difference"]) < 10  # Essentially zero
    
    def test_check_affordability_1lt_vs_3lz(self, calculator):
        """Compare 1LT ($77,865) vs 3LZ ($130,575) affordability"""
        down = 20000
        monthly = 1000
        
        result_1lt = calculator.check_vehicle_affordability(
            vehicle_price=77865,
            down_payment=down,
            monthly_payment=monthly
        )
        
        result_3lz = calculator.check_vehicle_affordability(
            vehicle_price=130575,
            down_payment=down,
            monthly_payment=monthly
        )
        
        # 1LT affordable, 3LZ not
        assert result_1lt["can_afford"] is True
        assert result_3lz["can_afford"] is False
        
        # Same max affordable (same budget)
        assert result_1lt["max_affordable"] == result_3lz["max_affordable"]
    
    # =========================================================================
    # TERM OPTIONS GENERATION TESTS
    # =========================================================================
    
    def test_generate_term_options(self, calculator):
        """Generate standard term options"""
        options = calculator.generate_term_options(principal=40000)
        
        # Should have 3 options (60, 72, 84 months)
        assert len(options) == 3
        
        terms = [opt.term_months for opt in options]
        assert 60 in terms
        assert 72 in terms
        assert 84 in terms
        
        # Longer term = lower payment
        payments = {opt.term_months: opt.monthly_payment for opt in options}
        assert payments[60] > payments[72] > payments[84]
        
        # Shorter term = less total interest
        interest = {opt.term_months: opt.total_interest for opt in options}
        assert interest[60] < interest[72] < interest[84]
    
    def test_generate_term_options_custom_rates(self, calculator):
        """Term options use correct APR for each term"""
        options = calculator.generate_term_options(principal=30000)
        
        for opt in options:
            if opt.term_months == 60:
                assert opt.apr == 6.49
            elif opt.term_months == 72:
                assert opt.apr == 6.99
            elif opt.term_months == 84:
                assert opt.apr == 7.49
    
    # =========================================================================
    # TOTAL DUE AT SIGNING TESTS
    # =========================================================================
    
    def test_total_due_at_signing_basic(self, calculator):
        """Basic due at signing calculation"""
        total = calculator.calculate_total_due_at_signing(
            down_payment=5000,
            doc_fee=599,
            title_fee=25
        )
        
        assert total == 5624  # 5000 + 599 + 25
    
    def test_total_due_at_signing_with_registration(self, calculator):
        """Due at signing with registration estimate"""
        total = calculator.calculate_total_due_at_signing(
            down_payment=10000,
            doc_fee=599,
            title_fee=25,
            registration_estimate=150
        )
        
        assert total == 10774  # 10000 + 599 + 25 + 150
    
    def test_total_due_at_signing_with_first_payment(self, calculator):
        """Due at signing including first payment"""
        total = calculator.calculate_total_due_at_signing(
            down_payment=5000,
            doc_fee=599,
            title_fee=25,
            first_payment=500
        )
        
        assert total == 6124  # 5000 + 599 + 25 + 500
    
    # =========================================================================
    # TRADE-IN CALCULATION TESTS
    # =========================================================================
    
    def test_calculate_with_trade_positive_equity(self, calculator):
        """Trade with positive equity reduces amount financed"""
        result = calculator.calculate_with_trade(
            vehicle_price=45000,
            down_payment=5000,
            trade_value=15000,
            trade_payoff=10000,  # $5000 equity
            apr=7.0,
            term_months=72
        )
        
        # Trade equity of $5000 reduces financing
        # Financed = 45000 - 5000 down - 5000 equity = 35000
        assert result["trade_equity"] == 5000
        assert result["amount_financed"] == 35000
        assert result["payment_result"].principal == 35000
    
    def test_calculate_with_trade_negative_equity(self, calculator):
        """Trade with negative equity increases amount financed"""
        result = calculator.calculate_with_trade(
            vehicle_price=45000,
            down_payment=5000,
            trade_value=10000,
            trade_payoff=15000,  # -$5000 equity (underwater)
            apr=7.0,
            term_months=72
        )
        
        # Negative equity adds to financing
        # Financed = 45000 - 5000 down + 5000 negative equity = 45000
        assert result["trade_equity"] == -5000
        assert result["amount_financed"] == 45000
    
    def test_calculate_with_trade_no_payoff(self, calculator):
        """Trade with no payoff (owned outright)"""
        result = calculator.calculate_with_trade(
            vehicle_price=40000,
            down_payment=5000,
            trade_value=12000,
            trade_payoff=0,
            apr=7.0,
            term_months=72
        )
        
        # Full trade value is equity
        assert result["trade_equity"] == 12000
        assert result["amount_financed"] == 23000  # 40000 - 5000 - 12000
    
    # =========================================================================
    # WHAT IT TAKES CALCULATION TESTS
    # =========================================================================
    
    def test_what_it_takes_corvette_3lz(self, calculator):
        """Calculate what it takes to afford Corvette 3LZ"""
        result = calculator.calculate_what_it_takes(
            vehicle_price=130575,
            current_down=20000,
            current_monthly=1000,
            apr=7.0,
            term_months=84
        )
        
        assert result["can_afford"] is False
        assert result["gap"] > 44000
        
        # Check alternatives
        assert result["needed_down_for_target_monthly"] > 60000  # Need ~$65K down
        assert result["needed_monthly_for_current_down"] > 1600  # Need ~$1,682/mo
    
    def test_what_it_takes_already_affordable(self, calculator):
        """What it takes for already affordable vehicle"""
        result = calculator.calculate_what_it_takes(
            vehicle_price=35000,
            current_down=10000,
            current_monthly=600,
            apr=7.0,
            term_months=84
        )
        
        assert result["can_afford"] is True
        assert result["gap"] == 0
        assert result["headroom"] > 0
    
    # =========================================================================
    # SINGLETON TESTS
    # =========================================================================
    
    def test_singleton_instance(self):
        """Verify singleton pattern works"""
        calc1 = get_payment_calculator()
        calc2 = get_payment_calculator()
        
        assert calc1 is calc2
    
    # =========================================================================
    # EDGE CASES
    # =========================================================================
    
    def test_very_small_principal(self, calculator):
        """Very small loan amount"""
        result = calculator.calculate_payment(
            principal=1000,
            apr=7.0,
            term_months=12
        )
        
        assert result.monthly_payment > 80
        assert result.monthly_payment < 90
    
    def test_very_large_principal(self, calculator):
        """Very large loan amount (luxury vehicle)"""
        result = calculator.calculate_payment(
            principal=150000,
            apr=7.0,
            term_months=84
        )
        
        assert result.monthly_payment > 2200
        assert result.monthly_payment < 2400
    
    def test_zero_down_payment_affordability(self, calculator):
        """Affordability check with zero down"""
        result = calculator.check_vehicle_affordability(
            vehicle_price=40000,
            down_payment=0,
            monthly_payment=600,
            apr=7.0,
            term_months=84
        )
        
        # Max affordable is just the financed amount
        assert result["max_affordable"] < 40000
        assert result["can_afford"] is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
