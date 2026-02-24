"""
MessageBird (Bird) SMS Pricing Scraper
Source: Bird CDN Pricing API (public, no auth) or authenticated REST API

Primary: GET https://pricing.p.mbirdcdn.net/default/sms/USD
         No authentication required. Returns 221 countries, ~492 entries.
         Includes outbound/inbound rates and carrier fees by originator type.

Fallback: GET https://rest.messagebird.com/pricing/sms/outbound
          Header: Authorization: AccessKey {key}
          Requires MESSAGEBIRD_ACCESS_KEY environment variable.
"""

import os
import requests

PRICING_LINK = "https://bird.com/en-us/pricing/sms"

# Bird CDN pricing API (public, no auth needed)
CDN_PRICING_API = "https://pricing.p.mbirdcdn.net/default/sms/USD"

# MessageBird authenticated pricing API (fallback)
AUTH_PRICING_API = "https://rest.messagebird.com/pricing/sms/outbound"

# ISO -> country name mapping for CDN API (which only returns country codes)
COUNTRY_NAMES = {
    "US": "United States", "CA": "Canada", "GB": "United Kingdom",
    "DE": "Germany", "FR": "France", "IN": "India", "AU": "Australia",
    "JP": "Japan", "BR": "Brazil", "MX": "Mexico", "ES": "Spain",
    "IT": "Italy", "NL": "Netherlands", "SG": "Singapore",
    "PH": "Philippines", "ID": "Indonesia", "ZA": "South Africa",
    "NG": "Nigeria", "KE": "Kenya", "GH": "Ghana", "TZ": "Tanzania",
    "UG": "Uganda", "RW": "Rwanda", "ET": "Ethiopia", "EG": "Egypt",
    "MA": "Morocco", "TN": "Tunisia", "PL": "Poland", "SE": "Sweden",
    "NO": "Norway", "DK": "Denmark", "FI": "Finland", "AT": "Austria",
    "CH": "Switzerland", "BE": "Belgium", "IE": "Ireland",
    "PT": "Portugal", "NZ": "New Zealand", "KR": "South Korea",
    "HK": "Hong Kong", "TW": "Taiwan", "MY": "Malaysia",
    "TH": "Thailand", "AE": "United Arab Emirates", "SA": "Saudi Arabia",
    "IL": "Israel", "TR": "Turkey", "CO": "Colombia", "CL": "Chile",
    "AR": "Argentina", "PE": "Peru", "PK": "Pakistan", "BD": "Bangladesh",
    "RO": "Romania", "CZ": "Czech Republic", "GR": "Greece",
    "HU": "Hungary", "VN": "Vietnam", "RU": "Russia", "UA": "Ukraine",
    "CN": "China", "HR": "Croatia", "RS": "Serbia", "BG": "Bulgaria",
    "LT": "Lithuania", "LV": "Latvia", "EE": "Estonia", "IS": "Iceland",
    "LU": "Luxembourg", "MT": "Malta", "CY": "Cyprus", "SK": "Slovakia",
    "SI": "Slovenia", "BA": "Bosnia and Herzegovina",
    "CI": "Ivory Coast", "SN": "Senegal", "CM": "Cameroon",
    "CD": "DR Congo", "AO": "Angola", "MZ": "Mozambique",
    "ZW": "Zimbabwe", "BW": "Botswana", "NA": "Namibia",
    "MU": "Mauritius", "LK": "Sri Lanka", "MM": "Myanmar",
    "KH": "Cambodia", "LA": "Laos", "NP": "Nepal", "QA": "Qatar",
    "KW": "Kuwait", "BH": "Bahrain", "OM": "Oman", "JO": "Jordan",
    "LB": "Lebanon", "IQ": "Iraq", "IR": "Iran", "AF": "Afghanistan",
    "PR": "Puerto Rico", "DO": "Dominican Republic", "CR": "Costa Rica",
    "PA": "Panama", "GT": "Guatemala", "EC": "Ecuador", "VE": "Venezuela",
    "UY": "Uruguay", "PY": "Paraguay", "BO": "Bolivia", "HN": "Honduras",
    "SV": "El Salvador", "NI": "Nicaragua", "CU": "Cuba", "JM": "Jamaica",
    "TT": "Trinidad and Tobago", "HT": "Haiti",
}


def fetch():
    """Fetch MessageBird SMS pricing.

    Tries the public CDN API first (no auth, 221 countries).
    Falls back to authenticated API if CDN fails.
    Last resort: hardcoded fallback rates.
    """
    # Try public CDN API first (best option — no auth, all countries)
    try:
        rates = _fetch_from_cdn()
        if len(rates) >= 50:
            return rates
    except Exception as e:
        print(f"  MessageBird: CDN API failed ({e})")

    # Try authenticated API
    access_key = os.environ.get("MESSAGEBIRD_ACCESS_KEY")
    if access_key:
        try:
            return _fetch_from_auth_api(access_key)
        except Exception as e:
            print(f"  MessageBird: Auth API failed ({e})")

    return _fallback_rates()


def _fetch_from_cdn():
    """Fetch pricing from Bird's public CDN API (no auth needed)."""
    import time as _time
    last_exc = None
    for attempt in range(3):
        try:
            resp = requests.get(
                CDN_PRICING_API,
                headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
                timeout=15,
            )
            resp.raise_for_status()
            break
        except Exception as e:
            last_exc = e
            if attempt < 2:
                _time.sleep(2)
    else:
        raise last_exc
    data = resp.json()

    dimensions = data.get("dimensions", [])
    rates = []
    seen = {}  # Track best outbound rate per country

    for entry in dimensions:
        iso = (entry.get("countryCode") or "").upper()
        unit = entry.get("unit", "")

        # Only outbound SMS rates
        if not iso or unit != "sms-outbound":
            continue

        tier = entry.get("infiniteTier", {})
        rate_str = tier.get("stringRate")
        if not rate_str:
            continue

        try:
            price = float(rate_str)
        except (ValueError, TypeError):
            continue

        if price <= 0:
            continue

        # Get originator type
        conditions = entry.get("pricingRule", {}).get("conditions", [])
        originator = None
        for cond in conditions:
            if cond.get("key") == "originatorType":
                originator = cond.get("value")

        # Keep cheapest outbound rate per country (prefer 1way/local over shortcode)
        if iso not in seen or price < seen[iso]["price"]:
            name = COUNTRY_NAMES.get(iso, iso)
            seen[iso] = {"price": price, "name": name, "originator": originator}

    for iso, info in seen.items():
        rates.append(_make_rate(iso, info["name"], info["price"]))

    print(f"  MessageBird: {len(rates)} rates (from CDN API)")
    return rates


def _fetch_from_auth_api(access_key):
    """Fetch pricing from MessageBird's authenticated API."""
    resp = requests.get(
        AUTH_PRICING_API,
        headers={
            "Authorization": f"AccessKey {access_key}",
            "Accept": "application/json",
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    rates = []
    prices = data.get("prices", [])
    for entry in prices:
        iso = (entry.get("countryIsoCode") or "").upper()
        if not iso:
            continue

        price_val = entry.get("price")
        if price_val is None:
            continue

        try:
            price = float(price_val)
        except (ValueError, TypeError):
            continue

        operator = entry.get("operatorName")
        mcc = entry.get("mcc")
        mnc = entry.get("mnc")
        country_name = entry.get("countryName") or iso

        rates.append(_make_rate(
            iso, country_name, price,
            operator_name=operator,
            mcc=mcc,
            mnc=mnc,
        ))

    print(f"  MessageBird: {len(rates)} rates (from auth API)")
    return rates


def _fallback_rates():
    """Hardcoded fallback — only used if both APIs fail."""
    known = {
        "US": ("United States", 0.0075),
        "CA": ("Canada", 0.0077),
        "GB": ("United Kingdom", 0.0512),
        "DE": ("Germany", 0.1025),
        "FR": ("France", 0.0792),
        "IN": ("India", 0.0837),
        "AU": ("Australia", 0.0511),
        "JP": ("Japan", 0.0785),
        "BR": ("Brazil", 0.0594),
        "MX": ("Mexico", 0.0310),
        "ES": ("Spain", 0.0680),
        "IT": ("Italy", 0.0710),
        "NL": ("Netherlands", 0.0993),
        "SG": ("Singapore", 0.0310),
        "PH": ("Philippines", 0.0260),
        "ID": ("Indonesia", 0.0320),
        "NG": ("Nigeria", 0.3732),
        "ZA": ("South Africa", 0.0988),
        "PL": ("Poland", 0.0240),
        "SE": ("Sweden", 0.0440),
        "NO": ("Norway", 0.0470),
        "DK": ("Denmark", 0.0370),
        "FI": ("Finland", 0.0550),
        "AT": ("Austria", 0.0790),
        "CH": ("Switzerland", 0.0500),
        "BE": ("Belgium", 0.0680),
        "IE": ("Ireland", 0.0580),
        "PT": ("Portugal", 0.0350),
        "NZ": ("New Zealand", 0.0500),
        "KR": ("South Korea", 0.0180),
        "HK": ("Hong Kong", 0.0340),
        "TW": ("Taiwan", 0.0280),
        "MY": ("Malaysia", 0.0300),
        "TH": ("Thailand", 0.0210),
        "AE": ("United Arab Emirates", 0.0390),
        "SA": ("Saudi Arabia", 0.0330),
        "IL": ("Israel", 0.0490),
        "TR": ("Turkey", 0.0085),
        "CO": ("Colombia", 0.0270),
        "CL": ("Chile", 0.0340),
        "AR": ("Argentina", 0.0410),
        "PE": ("Peru", 0.0500),
        "KE": ("Kenya", 0.2117),
        "EG": ("Egypt", 0.0400),
        "PK": ("Pakistan", 0.0360),
        "BD": ("Bangladesh", 0.0420),
        "RO": ("Romania", 0.0460),
        "CZ": ("Czech Republic", 0.0540),
        "GR": ("Greece", 0.0540),
        "HU": ("Hungary", 0.0640),
        "VN": ("Vietnam", 0.0490),
    }
    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  MessageBird: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price, operator_name=None, mcc=None, mnc=None):
    rate_id = f"messagebird-{iso.lower()}-outbound-sms"
    if operator_name:
        safe_op = operator_name.lower().replace(" ", "-").replace("/", "-")
        rate_id = f"messagebird-{iso.lower()}-outbound-sms-{safe_op}"

    return {
        "id": rate_id,
        "provider": "MessageBird",
        "country_iso": iso,
        "country_name": name,
        "operator_name": operator_name,
        "mcc": mcc,
        "mnc": mnc,
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
