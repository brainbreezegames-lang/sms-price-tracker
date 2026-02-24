"""
Telnyx SMS Pricing Scraper
Source: telnyx.com/pricing/messaging (JS-rendered page)

Telnyx doesn't have a public pricing API. Their pricing page loads data via JS.
We scrape the underlying JSON endpoint that the page calls.
"""

import re
import requests

PRICING_LINK = "https://telnyx.com/pricing/messaging"

# Telnyx's pricing page fetches from this API
PRICING_API = "https://telnyx.com/api/pricing/messaging"


def fetch():
    """Attempt to fetch Telnyx SMS pricing.

    First tries the internal API, falls back to scraping the page,
    then falls back to known published rates.
    """

    # Try the internal pricing API
    try:
        resp = requests.get(
            PRICING_API,
            headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            return _parse_api_response(data)
    except Exception:
        pass

    # Try scraping the page for embedded JSON
    try:
        resp = requests.get(
            PRICING_LINK,
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15,
        )
        if resp.status_code == 200:
            # Look for __NEXT_DATA__ or similar embedded JSON
            match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', resp.text, re.DOTALL)
            if match:
                import json
                data = json.loads(match.group(1))
                rates = _extract_from_next_data(data)
                if rates:
                    return rates
    except Exception:
        pass

    # Fallback: use known published base rates
    print("  Telnyx: using published fallback rates")
    return _fallback_rates()


def _parse_api_response(data):
    """Parse the Telnyx pricing API response."""
    rates = []
    # Structure varies — adapt based on what we get
    if isinstance(data, list):
        for item in data:
            iso = item.get("country_code", "").upper()
            price = item.get("price") or item.get("rate")
            if iso and price:
                rates.append(_make_rate(iso, item.get("country", iso), float(price)))
    elif isinstance(data, dict):
        for iso, info in data.items():
            if isinstance(info, dict):
                price = info.get("price") or info.get("rate") or info.get("outbound")
                name = info.get("country") or info.get("name") or iso
                if price:
                    rates.append(_make_rate(iso.upper(), name, float(price)))

    print(f"  Telnyx: {len(rates)} rates (from API)")
    return rates


def _extract_from_next_data(data):
    """Try to extract pricing from Next.js page data."""
    # Walk the data structure looking for pricing arrays
    rates = []

    def walk(obj, depth=0):
        if depth > 10:
            return
        if isinstance(obj, dict):
            # Look for pricing data patterns
            if "country_code" in obj and ("price" in obj or "rate" in obj):
                iso = obj["country_code"].upper()
                price = obj.get("price") or obj.get("rate")
                if price:
                    rates.append(_make_rate(iso, obj.get("country", iso), float(price)))
            for v in obj.values():
                walk(v, depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                walk(item, depth + 1)

    walk(data)
    if rates:
        print(f"  Telnyx: {len(rates)} rates (from page data)")
    return rates


def _fallback_rates():
    """Known Telnyx published rates for key countries."""
    # From telnyx.com/pricing/messaging — verified 2026-02-23 via React Server Action
    # Prices use Alphanumeric Sender ID where local is unavailable
    known = {
        "US": ("United States", 0.0040),   # local number, +carrier fees
        "CA": ("Canada", 0.0025),           # local number (verified)
        "GB": ("United Kingdom", 0.0550),   # local number (verified)
        "DE": ("Germany", 0.1100),          # alphanumeric only (verified)
        "FR": ("France", 0.0710),           # alphanumeric only (verified)
        "IN": ("India", 0.0680),            # alphanumeric only (verified)
        "AU": ("Australia", 0.0700),        # local number (verified)
        "JP": ("Japan", 0.0770),            # alphanumeric only (verified)
        "BR": ("Brazil", 0.0800),           # local number (verified)
        "MX": ("Mexico", 0.0350),
        "ES": ("Spain", 0.0700),
        "IT": ("Italy", 0.0700),
        "NL": ("Netherlands", 0.0800),
        "SG": ("Singapore", 0.0350),
        "PH": ("Philippines", 0.0300),
        "ID": ("Indonesia", 0.0350),
        "NG": ("Nigeria", 0.3700),          # alphanumeric only (verified)
        "ZA": ("South Africa", 0.0250),
        "PL": ("Poland", 0.0280),
        "SE": ("Sweden", 0.0500),
        "NO": ("Norway", 0.0520),
        "DK": ("Denmark", 0.0420),
        "FI": ("Finland", 0.0600),
        "AT": ("Austria", 0.0850),
        "CH": ("Switzerland", 0.0550),
        "BE": ("Belgium", 0.0750),
        "IE": ("Ireland", 0.0650),
        "PT": ("Portugal", 0.0400),
        "NZ": ("New Zealand", 0.0550),
        "KR": ("South Korea", 0.0200),
        "HK": ("Hong Kong", 0.0380),
        "TW": ("Taiwan", 0.0320),
        "MY": ("Malaysia", 0.0340),
        "TH": ("Thailand", 0.0250),
        "AE": ("United Arab Emirates", 0.0430),
        "SA": ("Saudi Arabia", 0.0370),
        "IL": ("Israel", 0.0540),
        "TR": ("Turkey", 0.0100),
        "CO": ("Colombia", 0.0310),
        "CL": ("Chile", 0.0380),
        "AR": ("Argentina", 0.0450),
        "PE": ("Peru", 0.0550),
        "KE": ("Kenya", 0.0240),
        "EG": ("Egypt", 0.0440),
    }

    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  Telnyx: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price):
    return {
        "id": f"telnyx-{iso.lower()}-outbound-sms",
        "provider": "Telnyx",
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
        print(f"  {r['country_name']}: ${r['price_usd']}")
