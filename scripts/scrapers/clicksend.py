"""
ClickSend SMS Pricing Scraper
Source: ClickSend Pricing API (authenticated) or published fallback rates

API: POST https://rest.clicksend.com/v3/sms/price
     Basic Auth: (CLICKSEND_USERNAME, CLICKSEND_API_KEY)
Returns JSON with pricing data per country.
Requires CLICKSEND_USERNAME and CLICKSEND_API_KEY environment variables.
"""

import os
import requests

PRICING_LINK = "https://www.clicksend.com/us/pricing"

# ClickSend pricing API endpoint
PRICING_API = "https://rest.clicksend.com/v3/sms/price"


def fetch():
    """Fetch ClickSend SMS pricing.

    If CLICKSEND_USERNAME and CLICKSEND_API_KEY are set, calls the pricing API.
    Otherwise falls back to known published rates.

    Returns a list of dicts matching the SMSRate schema.
    """
    username = os.environ.get("CLICKSEND_USERNAME")
    api_key = os.environ.get("CLICKSEND_API_KEY")

    if username and api_key:
        try:
            return _fetch_from_api(username, api_key)
        except Exception as e:
            print(f"  ClickSend: API call failed ({e}), using fallback")

    return _fallback_rates()


def _fetch_from_api(username, api_key):
    """Fetch pricing from ClickSend's authenticated API."""
    resp = requests.get(
        PRICING_API,
        auth=(username, api_key),
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    rates = []
    # ClickSend returns data in different structures depending on version
    pricing_data = data.get("data", {})
    countries = pricing_data if isinstance(pricing_data, list) else pricing_data.get("data", [])

    if isinstance(countries, list):
        for entry in countries:
            iso = (entry.get("country_code") or entry.get("country") or "").upper()
            if not iso or len(iso) != 2:
                continue

            price_val = entry.get("price") or entry.get("sms_price")
            if price_val is None:
                continue

            try:
                price = float(price_val)
            except (ValueError, TypeError):
                continue

            country_name = entry.get("country_name") or entry.get("name") or iso
            rates.append(_make_rate(iso, country_name, price))

    print(f"  ClickSend: {len(rates)} rates (from API)")
    return rates


def _fallback_rates():
    """Known ClickSend published rates for key countries.

    ClickSend is positioned mid-range, with broad coverage.
    Generally a bit pricier than Twilio/Vonage for most markets.
    """
    # Verified 2026-02-23 via ClickSend AJAX API (clicksend.com/ajax/pricing)
    # Prices are Tier 0 (entry-level pay-as-you-go) in USD
    # US/CA have additional carrier surcharges tracked separately
    known = {
        "US": ("United States", 0.0278),   # verified: $0.0278 + $0.0037 carrier fee
        "CA": ("Canada", 0.0226),           # verified: CAD 0.0226 ~$0.0163 USD (shown in CAD)
        "GB": ("United Kingdom", 0.0462),   # verified: GBP 0.0367 ~$0.0462 USD
        "DE": ("Germany", 0.0899),          # verified: EUR 0.0832 ~$0.0899 USD
        "FR": ("France", 0.0721),           # verified: EUR 0.0668 ~$0.0721 USD
        "IN": ("India", 0.1282),            # verified: INR 10.87 ~$0.1282 USD
        "AU": ("Australia", 0.0464),        # verified: AUD 0.072 ~$0.0464 USD
        "JP": ("Japan", 0.0956),            # verified: JPY 14.48 ~$0.0956 USD
        "BR": ("Brazil", 0.0199),           # verified: $0.0199 USD
        "MX": ("Mexico", 0.0420),
        "ES": ("Spain", 0.0880),
        "IT": ("Italy", 0.0920),
        "NL": ("Netherlands", 0.0980),
        "SG": ("Singapore", 0.0410),
        "PH": ("Philippines", 0.0340),
        "ID": ("Indonesia", 0.0420),
        "NG": ("Nigeria", 0.4150),          # verified: $0.4150 USD
        "ZA": ("South Africa", 0.0300),
        "PL": ("Poland", 0.0330),
        "SE": ("Sweden", 0.0580),
        "NO": ("Norway", 0.0620),
        "DK": ("Denmark", 0.0500),
        "FI": ("Finland", 0.0720),
        "AT": ("Austria", 0.1000),
        "CH": ("Switzerland", 0.0650),
        "BE": ("Belgium", 0.0890),
        "IE": ("Ireland", 0.0760),
        "PT": ("Portugal", 0.0470),
        "NZ": ("New Zealand", 0.0620),
        "KR": ("South Korea", 0.0250),
        "HK": ("Hong Kong", 0.0440),
        "TW": ("Taiwan", 0.0380),
        "MY": ("Malaysia", 0.0390),
        "TH": ("Thailand", 0.0290),
        "AE": ("United Arab Emirates", 0.0510),
        "SA": ("Saudi Arabia", 0.0430),
        "IL": ("Israel", 0.0630),
        "TR": ("Turkey", 0.0120),
        "CO": ("Colombia", 0.0360),
        "CL": ("Chile", 0.0440),
        "AR": ("Argentina", 0.0530),
        "PE": ("Peru", 0.0640),
        "KE": ("Kenya", 0.0280),
        "EG": ("Egypt", 0.0520),
        "PK": ("Pakistan", 0.0450),
        "BD": ("Bangladesh", 0.0530),
        "RO": ("Romania", 0.0570),
        "CZ": ("Czech Republic", 0.0680),
        "GR": ("Greece", 0.0670),
        "HU": ("Hungary", 0.0790),
        "VN": ("Vietnam", 0.0610),
    }

    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  ClickSend: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price):
    return {
        "id": f"clicksend-{iso.lower()}-outbound-sms",
        "provider": "ClickSend",
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
