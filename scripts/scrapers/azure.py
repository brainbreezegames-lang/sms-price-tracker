"""
Azure Communication Services SMS Pricing
Source: Microsoft Learn docs (structured pricing tables)
https://learn.microsoft.com/en-us/azure/communication-services/concepts/sms-pricing

Azure has limited SMS coverage (US, CA, PR + 22 European countries via alphanumeric sender).
Data extracted directly from their published docs.
Also provides authoritative US carrier surcharge data used across all providers.
"""

PRICING_LINK = "https://azure.microsoft.com/en-us/pricing/details/communication-services/"

# US carrier surcharges — published by Azure, applies industry-wide
US_CARRIER_SURCHARGES = {
    "AT&T": 0.0020,
    "T-Mobile": 0.0030,
    "Sprint": 0.0030,  # merged with T-Mobile
    "Verizon": 0.0030,
    "US Cellular": 0.0050,
    "TextNow": 0.0020,
}

# Average surcharge across major US carriers (weighted rough estimate)
US_AVG_SURCHARGE = 0.003


def fetch():
    """Return Azure SMS pricing from their published docs.

    Returns a list of dicts matching the SMSRate schema.
    """
    rates = []

    # --- Toll-free SMS (US, CA, PR) ---
    toll_free = [
        {"iso": "US", "name": "United States", "send": 0.0075, "recv": 0.0075},
        {"iso": "CA", "name": "Canada",        "send": 0.0075, "recv": 0.0075},
        {"iso": "PR", "name": "Puerto Rico",   "send": 0.0400, "recv": 0.0075},
    ]
    for r in toll_free:
        for direction, price in [("outbound", r["send"]), ("inbound", r["recv"])]:
            rates.append(_make_rate(r["iso"], r["name"], direction, price, "toll-free"))

    # --- 10DLC SMS (US only) ---
    rates.append(_make_rate("US", "United States", "outbound", 0.0075, "10dlc"))
    rates.append(_make_rate("US", "United States", "inbound", 0.0075, "10dlc"))

    # --- Short Code SMS ---
    short_code = [
        {"iso": "US", "name": "United States", "send": 0.0075, "recv": 0.0075},
        {"iso": "CA", "name": "Canada",        "send": 0.0268, "recv": 0.0061},
        {"iso": "GB", "name": "United Kingdom", "send": 0.0400, "recv": 0.0075},
    ]
    for r in short_code:
        for direction, price in [("outbound", r["send"]), ("inbound", r["recv"])]:
            rates.append(_make_rate(r["iso"], r["name"], direction, price, "short-code"))

    # --- Alphanumeric sender ID (outbound only, 22 European countries + AU) ---
    alpha_rates = {
        "AU": ("Australia", 0.049),
        "AT": ("Austria", 0.0932),
        "CZ": ("Czech Republic", 0.0490),
        "DK": ("Denmark", 0.0499),
        "EE": ("Estonia", 0.0845),
        "FI": ("Finland", 0.0820),
        "FR": ("France", 0.076),
        "DE": ("Germany", 0.0895),
        "IE": ("Ireland", 0.07),
        "IT": ("Italy", 0.0833),
        "LT": ("Lithuania", 0.041),
        "LV": ("Latvia", 0.065),
        "NL": ("Netherlands", 0.092),
        "NO": ("Norway", 0.0620),
        "PL": ("Poland", 0.041),
        "PT": ("Portugal", 0.045),
        "SK": ("Slovakia", 0.0650),
        "SI": ("Slovenia", 0.0470),
        "ES": ("Spain", 0.0833),
        "SE": ("Sweden", 0.055),
        "CH": ("Switzerland", 0.069),
        "GB": ("United Kingdom", 0.04),
    }
    for iso, (name, price) in alpha_rates.items():
        rates.append(_make_rate(iso, name, "outbound", price, "alphanumeric"))

    # --- Mobile numbers (10 countries, send + receive) ---
    mobile_rates = [
        {"iso": "AU", "name": "Australia",      "send": 0.049, "recv": 0.0075},
        {"iso": "BE", "name": "Belgium",         "send": 0.105, "recv": 0.0075},
        {"iso": "DK", "name": "Denmark",         "send": 0.0499, "recv": 0.0075},
        {"iso": "FI", "name": "Finland",         "send": 0.082, "recv": 0.0075},
        {"iso": "IE", "name": "Ireland",         "send": 0.070, "recv": 0.0075},
        {"iso": "LV", "name": "Latvia",          "send": 0.065, "recv": 0.0062},
        {"iso": "NL", "name": "Netherlands",     "send": 0.092, "recv": 0.0075},
        {"iso": "PL", "name": "Poland",          "send": 0.041, "recv": 0.0075},
        {"iso": "SE", "name": "Sweden",          "send": 0.055, "recv": 0.0075},
        {"iso": "GB", "name": "United Kingdom",  "send": 0.040, "recv": 0.0075},
    ]
    for r in mobile_rates:
        for direction, price in [("outbound", r["send"]), ("inbound", r["recv"])]:
            rates.append(_make_rate(r["iso"], r["name"], direction, price, "mobile"))

    # Deduplicate: keep cheapest per country+direction (since Azure has multiple number types)
    best = {}
    for r in rates:
        key = f"{r['country_iso']}-{r['direction']}"
        if key not in best or r["price_usd"] < best[key]["price_usd"]:
            best[key] = r

    result = list(best.values())
    print(f"  Azure: {len(result)} rates (from published docs)")
    return result


def _make_rate(iso, name, direction, price, number_type):
    return {
        "id": f"azure-{iso.lower()}-{direction}-sms-{number_type}",
        "provider": "Azure",
        "country_iso": iso,
        "country_name": name,
        "operator_name": f"{number_type} number",
        "mcc": None,
        "mnc": None,
        "price_per_sms": price,
        "currency": "USD",
        "price_usd": price,
        "direction": direction,
        "message_type": "sms",
        "carrier_surcharge_usd": US_AVG_SURCHARGE if iso == "US" and direction == "outbound" else None,
        "total_price_usd": price + (US_AVG_SURCHARGE if iso == "US" and direction == "outbound" else 0),
        "verify_price_usd": None,
        "link": PRICING_LINK,
        "last_updated": None,
    }


def get_us_carrier_surcharges():
    """Return per-carrier US surcharge data (industry-wide, from Azure docs)."""
    return US_CARRIER_SURCHARGES


if __name__ == "__main__":
    data = fetch()
    print(f"Total: {len(data)} records")
    for r in data[:10]:
        print(f"  {r['country_name']} ({r['country_iso']}) {r['direction']}: ${r['price_usd']}")
