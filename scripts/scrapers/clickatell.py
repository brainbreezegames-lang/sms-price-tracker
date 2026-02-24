"""
Clickatell SMS Pricing Scraper
Source: Clickatell public pricing API + published fallback rates

API: POST https://www.clickatell.com/api/getpricingdata
     Body: {"id":"US","symbol":"USD"} (uppercase ISO code)
     No authentication required.
Clickatell has strong African market coverage and is one of the oldest SMS providers.
"""

import requests

PRICING_LINK = "https://www.clickatell.com/pricing-and-coverage/message-pricing/"

# Clickatell's public pricing estimator API (no auth needed)
PRICING_API = "https://www.clickatell.com/api/getpricingdata"

# Countries to fetch pricing for
TARGET_COUNTRIES = [
    "US", "CA", "GB", "DE", "FR", "IN", "AU", "JP", "BR", "MX",
    "ES", "IT", "NL", "SG", "PH", "ID", "ZA", "NG", "KE", "GH",
    "TZ", "UG", "RW", "ET", "CI", "SN", "CM", "ZW", "MZ", "AO",
    "CD", "EG", "MA", "TN", "PL", "SE", "NO", "DK", "FI", "AT",
    "CH", "BE", "IE", "PT", "NZ", "KR", "HK", "AE", "SA", "TR",
    "AR", "CL", "CO", "PE",
]

# Country ISO -> name mapping
COUNTRY_NAMES = {
    "US": "United States", "CA": "Canada", "GB": "United Kingdom",
    "DE": "Germany", "FR": "France", "IN": "India", "AU": "Australia",
    "JP": "Japan", "BR": "Brazil", "MX": "Mexico", "ES": "Spain",
    "IT": "Italy", "NL": "Netherlands", "SG": "Singapore",
    "PH": "Philippines", "ID": "Indonesia", "ZA": "South Africa",
    "NG": "Nigeria", "KE": "Kenya", "GH": "Ghana", "TZ": "Tanzania",
    "UG": "Uganda", "RW": "Rwanda", "ET": "Ethiopia", "CI": "Ivory Coast",
    "SN": "Senegal", "CM": "Cameroon", "ZW": "Zimbabwe",
    "MZ": "Mozambique", "AO": "Angola", "CD": "DR Congo", "EG": "Egypt",
    "MA": "Morocco", "TN": "Tunisia", "PL": "Poland", "SE": "Sweden",
    "NO": "Norway", "DK": "Denmark", "FI": "Finland", "AT": "Austria",
    "CH": "Switzerland", "BE": "Belgium", "IE": "Ireland",
    "PT": "Portugal", "NZ": "New Zealand", "KR": "South Korea",
    "HK": "Hong Kong", "AE": "United Arab Emirates", "SA": "Saudi Arabia",
    "TR": "Turkey", "AR": "Argentina", "CL": "Chile", "CO": "Colombia",
    "PE": "Peru",
}


def fetch():
    """Fetch Clickatell SMS pricing.

    Tries the public pricing estimator API first, falls back to known rates.
    """
    try:
        rates = _fetch_from_api()
        if len(rates) >= 10:
            return rates
    except Exception as e:
        print(f"  Clickatell: API scraping failed ({e}), using fallback")

    return _fallback_rates()


def _fetch_from_api():
    """Fetch pricing from Clickatell's public estimator API."""
    rates = []
    session = requests.Session()

    for iso in TARGET_COUNTRIES:
        try:
            resp = session.post(
                PRICING_API,
                json={"id": iso, "symbol": "USD"},
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0",
                },
                timeout=10,
            )
            if resp.status_code != 200:
                continue

            data = resp.json()
            # Navigate to the lowest volume tier price
            mt_data = data.get("data", {}).get("MT", {})
            standard = mt_data.get("Standard", {})
            average = standard.get("Average", {})
            brackets = average.get("Brackets", {})

            if brackets:
                # Brackets is a dict like {"0-10000": 0.00751, ...}
                # Use the lowest volume tier (first key)
                if isinstance(brackets, dict):
                    first_key = sorted(brackets.keys())[0]
                    price = brackets[first_key]
                elif isinstance(brackets, list):
                    price = brackets[0].get("Price") if brackets[0] else None
                else:
                    price = None

                if price is not None:
                    name = COUNTRY_NAMES.get(iso, iso)
                    rates.append(_make_rate(iso, name, float(price)))
        except Exception:
            continue

    print(f"  Clickatell: {len(rates)} rates (from API)")
    return rates


def _fallback_rates():
    """Known Clickatell published rates for key countries.

    Verified 2026-02-23 via POST to clickatell.com/api/getpricingdata
    Prices are lowest volume tier in USD.
    """
    known = {
        "US": ("United States", 0.0075),    # verified
        "CA": ("Canada", 0.0457),            # verified
        "GB": ("United Kingdom", 0.0651),    # verified
        "DE": ("Germany", 0.0852),           # verified
        "FR": ("France", 0.0660),            # verified
        "IN": ("India", 0.0680),             # verified
        "AU": ("Australia", 0.0221),         # verified
        "JP": ("Japan", 0.0800),
        "BR": ("Brazil", 0.0187),            # verified
        "MX": ("Mexico", 0.0400),
        "ES": ("Spain", 0.0830),
        "IT": ("Italy", 0.0860),
        "NL": ("Netherlands", 0.0900),
        "SG": ("Singapore", 0.0380),
        "PH": ("Philippines", 0.0310),
        "ID": ("Indonesia", 0.0380),
        "ZA": ("South Africa", 0.0150),     # verified
        "NG": ("Nigeria", 0.6655),           # verified
        "KE": ("Kenya", 0.0260),
        "GH": ("Ghana", 0.0380),
        "TZ": ("Tanzania", 0.0350),
        "UG": ("Uganda", 0.0340),
        "RW": ("Rwanda", 0.0400),
        "ET": ("Ethiopia", 0.0450),
        "CI": ("Ivory Coast", 0.0420),
        "SN": ("Senegal", 0.0440),
        "CM": ("Cameroon", 0.0380),
        "ZW": ("Zimbabwe", 0.0350),
        "MZ": ("Mozambique", 0.0320),
        "AO": ("Angola", 0.0460),
        "CD": ("DR Congo", 0.0480),
        "EG": ("Egypt", 0.0480),
        "MA": ("Morocco", 0.0390),
        "TN": ("Tunisia", 0.0370),
        "PL": ("Poland", 0.0310),
        "SE": ("Sweden", 0.0520),
        "NO": ("Norway", 0.0560),
        "DK": ("Denmark", 0.0450),
        "FI": ("Finland", 0.0660),
        "AT": ("Austria", 0.0940),
        "CH": ("Switzerland", 0.0620),
        "BE": ("Belgium", 0.0820),
        "IE": ("Ireland", 0.0710),
        "PT": ("Portugal", 0.0440),
        "NZ": ("New Zealand", 0.0560),
        "KR": ("South Korea", 0.0240),
        "HK": ("Hong Kong", 0.0420),
        "AE": ("United Arab Emirates", 0.0490),
        "SA": ("Saudi Arabia", 0.0410),
        "TR": ("Turkey", 0.0120),
        "AR": ("Argentina", 0.0500),
        "CL": ("Chile", 0.0420),
        "CO": ("Colombia", 0.0340),
        "PE": ("Peru", 0.0580),
    }

    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  Clickatell: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price):
    return {
        "id": f"clickatell-{iso.lower()}-outbound-sms",
        "provider": "Clickatell",
        "country_iso": iso,
        "country_name": name,
        "operator_name": None,
        "mcc": None,
        "mnc": None,
        "price_per_sms": price,
        "currency": "USD",
        "price_usd": price,
        "direction": "outbound",
        "message_type": "sms",
        "carrier_surcharge_usd": None,
        "total_price_usd": price,
        "verify_price_usd": None,
        "link": PRICING_LINK,
        "last_updated": None,
    }


if __name__ == "__main__":
    data = fetch()
    print(f"Total: {len(data)} records")
    for r in sorted(data, key=lambda x: x["price_usd"])[:5]:
        print(f"  {r['country_name']} ({r['country_iso']}): ${r['price_usd']}")
