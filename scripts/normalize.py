"""
Normalizes raw scraper output into the final SMSRate schema.
Handles deduplication, validation, and carrier surcharge application.
"""

from datetime import datetime, timezone

# ISO 3166-1 alpha-2 to country name mapping (subset for validation)
COUNTRY_NAMES = {
    "US": "United States", "GB": "United Kingdom", "CA": "Canada",
    "AU": "Australia", "DE": "Germany", "FR": "France", "IN": "India",
    "JP": "Japan", "BR": "Brazil", "MX": "Mexico", "ES": "Spain",
    "IT": "Italy", "NL": "Netherlands", "SG": "Singapore", "KR": "South Korea",
    "PH": "Philippines", "ID": "Indonesia", "TH": "Thailand", "NG": "Nigeria",
    "ZA": "South Africa", "AE": "United Arab Emirates", "SA": "Saudi Arabia",
    "PL": "Poland", "SE": "Sweden", "NO": "Norway", "DK": "Denmark",
    "FI": "Finland", "AT": "Austria", "CH": "Switzerland", "BE": "Belgium",
    "IE": "Ireland", "PT": "Portugal", "CL": "Chile", "CO": "Colombia",
    "AR": "Argentina", "PE": "Peru", "MY": "Malaysia", "VN": "Vietnam",
    "TW": "Taiwan", "HK": "Hong Kong", "IL": "Israel", "TR": "Turkey",
    "EG": "Egypt", "KE": "Kenya", "PK": "Pakistan", "BD": "Bangladesh",
    "RO": "Romania", "CZ": "Czech Republic", "GR": "Greece", "HU": "Hungary",
    "NZ": "New Zealand", "PR": "Puerto Rico", "RU": "Russia", "UA": "Ukraine",
    "CN": "China", "SK": "Slovakia", "SI": "Slovenia", "HR": "Croatia",
    "BG": "Bulgaria", "RS": "Serbia", "LT": "Lithuania", "LV": "Latvia",
    "EE": "Estonia", "IS": "Iceland", "LU": "Luxembourg", "MT": "Malta",
    "CY": "Cyprus",
}

# Average US carrier surcharge (weighted estimate from Azure data)
US_AVG_CARRIER_SURCHARGE = 0.003

# Price sanity bounds
MIN_PRICE = 0.0001   # $0.0001 per message
MAX_PRICE = 2.00     # $2.00 per message (some markets like PH via Clickatell reach $1.17+)


def normalize(all_rates, apply_surcharges=True):
    """Normalize, validate, deduplicate, and apply surcharges to raw rates.

    Args:
        all_rates: Combined list from all scrapers
        apply_surcharges: Whether to apply US carrier surcharges

    Returns:
        Clean list of SMSRate dicts ready for JSON output
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    cleaned = []
    warnings = []

    for rate in all_rates:
        # Required fields
        if not rate.get("provider") or not rate.get("country_iso") or rate.get("price_usd") is None:
            continue

        iso = rate["country_iso"].upper().strip()
        if len(iso) != 2:
            continue

        price = rate["price_usd"]

        # Validate price bounds
        if price < MIN_PRICE:
            warnings.append(f"  WARN: {rate['provider']} {iso} price too low: ${price}")
            continue
        if price > MAX_PRICE:
            warnings.append(f"  WARN: {rate['provider']} {iso} price too high: ${price}")
            continue

        # Normalize country name
        country_name = rate.get("country_name") or COUNTRY_NAMES.get(iso, iso)

        # Apply US carrier surcharge if not already set
        surcharge = rate.get("carrier_surcharge_usd")
        if apply_surcharges and iso == "US" and rate.get("direction") == "outbound" and surcharge is None:
            surcharge = US_AVG_CARRIER_SURCHARGE

        total = price + (surcharge or 0)

        cleaned.append({
            "id": rate.get("id", f"{rate['provider'].lower()}-{iso}-{rate.get('direction','outbound')}-{rate.get('message_type','sms')}"),
            "provider": rate["provider"],
            "country_iso": iso,
            "country_name": country_name,
            "operator_name": rate.get("operator_name"),
            "mcc": rate.get("mcc"),
            "mnc": rate.get("mnc"),
            "price_per_sms": price,
            "currency": "USD",
            "price_usd": price,
            "direction": rate.get("direction", "outbound"),
            "message_type": rate.get("message_type", "sms"),
            "carrier_surcharge_usd": surcharge,
            "total_price_usd": round(total, 6),
            "verify_price_usd": rate.get("verify_price_usd"),
            "link": rate.get("link", ""),
            "last_updated": now,
        })

    if warnings:
        for w in warnings[:20]:
            print(w)
        if len(warnings) > 20:
            print(f"  ... and {len(warnings) - 20} more warnings")

    # Deduplicate: for same provider+country+direction+channel+operator, keep cheapest
    seen = {}
    for rate in cleaned:
        key = (
            rate["provider"],
            rate["country_iso"],
            rate["direction"],
            rate["message_type"],
            rate.get("operator_name") or "",
        )
        if key not in seen or rate["total_price_usd"] < seen[key]["total_price_usd"]:
            seen[key] = rate

    result = list(seen.values())
    result.sort(key=lambda r: (r["country_iso"], r["total_price_usd"]))

    print(f"  Normalized: {len(result)} unique rates (from {len(all_rates)} raw)")
    return result


def build_package(rates):
    """Build the final SMSDataPackage JSON structure."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    providers = set(r["provider"] for r in rates)
    countries = set(r["country_iso"] for r in rates)

    return {
        "lastUpdated": now,
        "count": len(rates),
        "providerCount": len(providers),
        "countryCount": len(countries),
        "data": rates,
        "phoneNumbers": [],   # Populated separately
        "volumeTiers": [],    # Populated separately
        "tenDlcFees": [],     # Populated separately
    }
