"""
Server-side pricing engine for Sarit Learn subscription plans.

Mirrors frontend buildPlan logic in frontend/src/lib/upsc/yearlyPlanner.ts exactly.
Discounted cycles: round(base * months * (1 - discount / 100) / 10) * 10.
Monthly cycles keep their list price: rounding 399 to the nearest 10 would
charge 400 for a plan advertised at 399.
"""

from typing import Dict

# Base monthly prices per plan tier (in INR)
PLAN_BASES: Dict[str, int] = {
    "foundation": 399,
    "plus": 699,
    "pro": 999,
    "ultimate": 1299,
}

# Billing cycle definitions: months and discount percentage
BILLING_CYCLES: Dict[str, Dict[str, int]] = {
    "monthly": {"months": 1, "discount_percent": 0},
    "yearly": {"months": 12, "discount_percent": 15},
    "two-year": {"months": 24, "discount_percent": 25},
    "three-year": {"months": 36, "discount_percent": 35},
}


def validate_plan_tier(tier: str) -> bool:
    """Check if the given tier is a valid plan tier."""
    return tier in PLAN_BASES


def validate_billing_cycle(cycle: str) -> bool:
    """Check if the given cycle is a valid billing cycle."""
    return cycle in BILLING_CYCLES


def compute_plan_amount(plan_tier: str, billing_cycle: str) -> int:
    """
    Compute payment amount for a plan tier and billing cycle.

    Mirrors the frontend buildPlan function exactly:
        listPrice = baseMonthlyPrice * months
        launchPrice = listPrice when discountPercent == 0
        launchPrice = round(listPrice * (1 - discountPercent / 100) / 10) * 10 otherwise

    Rounding a 0% monthly plan to the nearest 10 charged 400 for a 399 plan,
    so monthly orders must use the list price unchanged.

    Args:
        plan_tier: One of "foundation", "plus", "pro", "ultimate"
        billing_cycle: One of "monthly", "yearly", "two-year", "three-year"

    Returns:
        The launch price in whole INR, rounded to the nearest 10.

    Raises:
        ValueError: If plan_tier or billing_cycle is invalid.
    """
    if not validate_plan_tier(plan_tier):
        raise ValueError(
            f"Invalid plan_tier '{plan_tier}'. "
            f"Must be one of: {', '.join(PLAN_BASES.keys())}"
        )
    if not validate_billing_cycle(billing_cycle):
        raise ValueError(
            f"Invalid billing_cycle '{billing_cycle}'. "
            f"Must be one of: {', '.join(BILLING_CYCLES.keys())}"
        )

    base = PLAN_BASES[plan_tier]
    cycle = BILLING_CYCLES[billing_cycle]
    months = cycle["months"]
    discount_percent = cycle["discount_percent"]

    list_price = base * months
    discount_multiplier = 1 - discount_percent / 100
    launch_price = (
        list_price
        if discount_percent == 0
        else round((list_price * discount_multiplier) / 10) * 10
    )

    return launch_price
