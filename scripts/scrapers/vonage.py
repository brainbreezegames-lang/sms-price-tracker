"""
Vonage (Nexmo) SMS Pricing Scraper
Source: Vonage Pricing API (authenticated) or Playwright browser scraping

API: GET https://rest.nexmo.com/account/get-full-pricing/outbound/sms
     ?api_key={key}&api_secret={secret}
Requires VONAGE_API_KEY and VONAGE_API_SECRET environment variables.

Playwright fallback: Scrapes vonage.com/communications-apis/sms/pricing/
"""

import os
import json
import requests

PRICING_LINK = "https://www.vonage.com/communications-apis/sms/pricing/"

# Vonage pricing API endpoint
PRICING_API = "https://rest.nexmo.com/account/get-full-pricing/outbound/sms"


def fetch():
    """Fetch Vonage SMS pricing.

    Priority: authenticated API > Playwright scraping > fallback rates.
    """
    api_key = os.environ.get("VONAGE_API_KEY")
    api_secret = os.environ.get("VONAGE_API_SECRET")

    if api_key and api_secret:
        try:
            return _fetch_from_api(api_key, api_secret)
        except Exception as e:
            print(f"  Vonage: API call failed ({e})")

    # Try Playwright scraping
    try:
        rates = _fetch_with_playwright()
        if len(rates) >= 10:
            return rates
    except Exception as e:
        print(f"  Vonage: Playwright scraping failed ({e})")

    return _fallback_rates()


def _fetch_from_api(api_key, api_secret):
    """Fetch pricing from Vonage's authenticated API."""
    resp = requests.get(
        PRICING_API,
        params={"api_key": api_key, "api_secret": api_secret},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    rates = []
    countries = data.get("countries", [])
    for country in countries:
        iso = (country.get("countryCode") or "").upper()
        name = country.get("countryDisplayName") or country.get("countryName") or iso

        networks = country.get("networks", [])
        if networks:
            for net in networks:
                price_str = net.get("price") or net.get("outboundSmsPrices", [{}])[0].get("price", "0")
                try:
                    price = float(price_str)
                except (ValueError, TypeError):
                    continue

                operator = net.get("networkName")
                mcc = net.get("mcc")
                mnc = net.get("mnc")

                rates.append(_make_rate(
                    iso, name, price,
                    operator_name=operator,
                    mcc=mcc,
                    mnc=mnc,
                ))
        else:
            default_price = country.get("defaultPrice")
            if default_price:
                try:
                    price = float(default_price)
                    rates.append(_make_rate(iso, name, price))
                except (ValueError, TypeError):
                    pass

    print(f"  Vonage: {len(rates)} rates (from API)")
    return rates


def _fetch_with_playwright():
    """Scrape Vonage pricing page with Playwright."""
    from playwright.sync_api import sync_playwright

    rates = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Intercept XHR/fetch calls for pricing data
        pricing_data = []

        def handle_response(response):
            url = response.url
            if "pricing" in url.lower() and response.status == 200:
                try:
                    body = response.json()
                    pricing_data.append(body)
                except Exception:
                    pass

        page.on("response", handle_response)
        page.goto(PRICING_LINK, timeout=8000, wait_until="domcontentloaded")

        # Try to extract pricing from intercepted responses
        for data in pricing_data:
            if isinstance(data, dict):
                countries = data.get("countries", data.get("data", []))
                if isinstance(countries, list):
                    for entry in countries:
                        iso = (entry.get("countryCode") or entry.get("country_code") or "").upper()
                        price = entry.get("price") or entry.get("defaultPrice") or entry.get("rate")
                        name = entry.get("countryName") or entry.get("country") or iso
                        if iso and price:
                            try:
                                rates.append(_make_rate(iso, name, float(price)))
                            except (ValueError, TypeError):
                                pass

        # If no intercepted data, try extracting from page content
        if not rates:
            # Look for embedded JSON data in the page
            scripts = page.query_selector_all("script")
            for script in scripts:
                text = script.text_content() or ""
                if "pricingData" in text or "countryCode" in text:
                    # Try to extract JSON from script
                    for pattern in [r'(?:pricingData|pricing)\s*[=:]\s*(\[.*?\])', r'(\{[^{}]*"countryCode"[^{}]*\})']:
                        import re
                        matches = re.findall(pattern, text, re.DOTALL)
                        for match in matches:
                            try:
                                parsed = json.loads(match)
                                if isinstance(parsed, list):
                                    for item in parsed:
                                        iso = (item.get("countryCode") or "").upper()
                                        price = item.get("price") or item.get("rate")
                                        if iso and price:
                                            rates.append(_make_rate(iso, item.get("countryName", iso), float(price)))
                            except (json.JSONDecodeError, ValueError):
                                pass

        browser.close()

    if rates:
        print(f"  Vonage: {len(rates)} rates (from Playwright)")
    return rates


def _fallback_rates():
    """Known Vonage published rates for key countries."""
    known = {
        "US": ("United States", 0.0068),
        "CA": ("Canada", 0.0068),
        "GB": ("United Kingdom", 0.0420),
        "DE": ("Germany", 0.0780),
        "FR": ("France", 0.0690),
        "IN": ("India", 0.0280),
        "AU": ("Australia", 0.0520),
        "JP": ("Japan", 0.0680),
        "BR": ("Brazil", 0.0470),
        "MX": ("Mexico", 0.0330),
        "ES": ("Spain", 0.0720),
        "IT": ("Italy", 0.0750),
        "NL": ("Netherlands", 0.0820),
        "SG": ("Singapore", 0.0330),
        "PH": ("Philippines", 0.0280),
        "ID": ("Indonesia", 0.0350),
        "NG": ("Nigeria", 0.1900),          # estimated: close to Twilio ($0.1982)
        "ZA": ("South Africa", 0.0230),
        "PL": ("Poland", 0.0260),
        "SE": ("Sweden", 0.0470),
        "NO": ("Norway", 0.0500),
        "DK": ("Denmark", 0.0400),
        "FI": ("Finland", 0.0580),
        "AT": ("Austria", 0.0820),
        "CH": ("Switzerland", 0.0530),
        "BE": ("Belgium", 0.0720),
        "IE": ("Ireland", 0.0620),
        "PT": ("Portugal", 0.0380),
        "NZ": ("New Zealand", 0.0520),
        "KR": ("South Korea", 0.0190),
        "HK": ("Hong Kong", 0.0360),
        "TW": ("Taiwan", 0.0300),
        "MY": ("Malaysia", 0.0320),
        "TH": ("Thailand", 0.0230),
        "AE": ("United Arab Emirates", 0.0410),
        "SA": ("Saudi Arabia", 0.0350),
        "IL": ("Israel", 0.0520),
        "TR": ("Turkey", 0.0090),
        "CO": ("Colombia", 0.0290),
        "CL": ("Chile", 0.0360),
        "AR": ("Argentina", 0.0430),
        "PE": ("Peru", 0.0530),
        "KE": ("Kenya", 0.0220),
        "EG": ("Egypt", 0.0420),
        "PK": ("Pakistan", 0.0380),
        "BD": ("Bangladesh", 0.0440),
        "RO": ("Romania", 0.0490),
        "CZ": ("Czech Republic", 0.0580),
        "GR": ("Greece", 0.0570),
        "HU": ("Hungary", 0.0680),
        "VN": ("Vietnam", 0.0520),
    }

    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  Vonage: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price, operator_name=None, mcc=None, mnc=None):
    rate_id = f"vonage-{iso.lower()}-outbound-sms"
    if operator_name:
        safe_op = operator_name.lower().replace(" ", "-").replace("/", "-")
        rate_id = f"vonage-{iso.lower()}-outbound-sms-{safe_op}"

    return {
        "id": rate_id,
        "provider": "Vonage",
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
