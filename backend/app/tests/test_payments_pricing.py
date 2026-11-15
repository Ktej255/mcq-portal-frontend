"""Hermetic regressions for the server-side plan pricing engine.

The backend must charge exactly what the pricing page advertises. Monthly
plans are their own base price; rounding a 0% cycle to the nearest 10 charged
₹400 for a ₹399 plan, so these cases pin both the monthlies and the rounded
discounted cycles.
"""
import pytest

from app.core.payments.pricing import (
    BILLING_CYCLES,
    PLAN_BASES,
    compute_plan_amount,
)

EXPECTED_AMOUNTS = {
    ("foundation", "monthly"): 399,
    ("foundation", "yearly"): 4070,
    ("foundation", "two-year"): 7180,
    ("foundation", "three-year"): 9340,
    ("plus", "monthly"): 699,
    ("plus", "yearly"): 7130,
    ("plus", "two-year"): 12580,
    ("plus", "three-year"): 16360,
    ("pro", "monthly"): 999,
    ("pro", "yearly"): 10190,
    ("pro", "two-year"): 17980,
    ("pro", "three-year"): 23380,
    ("ultimate", "monthly"): 1299,
    ("ultimate", "yearly"): 13250,
    ("ultimate", "two-year"): 23380,
    ("ultimate", "three-year"): 30400,
}


@pytest.mark.parametrize(("tier", "cycle"), sorted(EXPECTED_AMOUNTS))
def test_compute_plan_amount_matches_advertised_price(tier: str, cycle: str) -> None:
    amount = compute_plan_amount(tier, cycle)
    list_price = PLAN_BASES[tier] * BILLING_CYCLES[cycle]["months"]

    assert amount == EXPECTED_AMOUNTS[(tier, cycle)]
    assert amount <= list_price


@pytest.mark.parametrize("tier", sorted(PLAN_BASES))
def test_monthly_plan_charges_the_base_price(tier: str) -> None:
    assert compute_plan_amount(tier, "monthly") == PLAN_BASES[tier]


def test_invalid_tier_and_cycle_are_rejected() -> None:
    with pytest.raises(ValueError):
        compute_plan_amount("platinum", "monthly")
    with pytest.raises(ValueError):
        compute_plan_amount("foundation", "weekly")
