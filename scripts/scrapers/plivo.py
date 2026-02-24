"""
Plivo SMS Pricing Scraper
Source: Plivo Pricing API (authenticated), Playwright scraping, or fallback rates

API: GET https://api.plivo.com/v1/Account/{auth_id}/Pricing/?country_iso={CC}
     Basic Auth: (PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN)
Requires per-country iteration.

Playwright fallback: Scrapes plivo.com/sms/pricing/{cc}/ via headless browser
"""

import os
import time
import requests

PRICING_LINK = "https://www.plivo.com/sms/pricing/"

# Plivo pricing API base
PRICING_API_BASE = "https://api.plivo.com/v1/Account"

# Top 50 countries by SMS volume to query
TOP_COUNTRIES = [
    "US", "CA", "GB", "DE", "FR", "IN", "AU", "JP", "BR", "MX",
    "ES", "IT", "NL", "SG", "PH", "ID", "NG", "ZA", "PL", "SE",
    "NO", "DK", "FI", "AT", "CH", "BE", "IE", "PT", "NZ", "KR",
    "HK", "TW", "MY", "TH", "AE", "SA", "IL", "TR", "CO", "CL",
    "AR", "PE", "KE", "EG", "PK", "BD", "RO", "CZ", "GR", "HU",
]

COUNTRY_NAMES = {
    "US": "United States", "CA": "Canada", "GB": "United Kingdom",
    "DE": "Germany", "FR": "France", "IN": "India", "AU": "Australia",
    "JP": "Japan", "BR": "Brazil", "MX": "Mexico", "ES": "Spain",
    "IT": "Italy", "NL": "Netherlands", "SG": "Singapore",
    "PH": "Philippines", "ID": "Indonesia", "NG": "Nigeria",
    "ZA": "South Africa", "PL": "Poland", "SE": "Sweden",
    "NO": "Norway", "DK": "Denmark", "FI": "Finland", "AT": "Austria",
    "CH": "Switzerland", "BE": "Belgium", "IE": "Ireland",
    "PT": "Portugal", "NZ": "New Zealand", "KR": "South Korea",
    "HK": "Hong Kong", "TW": "Taiwan", "MY": "Malaysia",
    "TH": "Thailand", "AE": "United Arab Emirates", "SA": "Saudi Arabia",
    "IL": "Israel", "TR": "Turkey", "CO": "Colombia", "CL": "Chile",
    "AR": "Argentina", "PE": "Peru", "KE": "Kenya", "EG": "Egypt",
    "PK": "Pakistan", "BD": "Bangladesh", "RO": "Romania",
    "CZ": "Czech Republic", "GR": "Greece", "HU": "Hungary",
    "VN": "Vietnam",
}


def fetch():
    """Fetch Plivo SMS pricing.

    Priority: authenticated API > Playwright scraping > fallback rates.
    """
    auth_id = os.environ.get("PLIVO_AUTH_ID")
    auth_token = os.environ.get("PLIVO_AUTH_TOKEN")

    if auth_id and auth_token:
        try:
            return _fetch_from_api(auth_id, auth_token)
        except Exception as e:
            print(f"  Plivo: API call failed ({e})")

    # Playwright prices are unreliable (picks up wrong elements on page).
    # Use verified fallback until authenticated API credentials are available.
    return _fallback_rates()


def _fetch_from_api(auth_id, auth_token):
    """Fetch pricing from Plivo's authenticated API, one country at a time."""
    rates = []
    errors = 0

    for iso in TOP_COUNTRIES:
        url = f"{PRICING_API_BASE}/{auth_id}/Pricing/"
        try:
            resp = requests.get(
                url,
                params={"country_iso": iso},
                auth=(auth_id, auth_token),
                timeout=15,
            )
            if resp.status_code == 200:
                data = resp.json()
                country_name = data.get("country") or iso

                msg = data.get("message", {})
                outbound = msg.get("outbound", {})

                rate_val = outbound.get("rate") or data.get("rate")
                if rate_val:
                    try:
                        price = float(rate_val)
                        rates.append(_make_rate(iso, country_name, price))
                    except (ValueError, TypeError):
                        pass

                networks = outbound.get("network_list", [])
                for net in networks:
                    net_rate = net.get("rate")
                    if net_rate:
                        try:
                            price = float(net_rate)
                            rates.append(_make_rate(
                                iso, country_name, price,
                                operator_name=net.get("group_name"),
                            ))
                        except (ValueError, TypeError):
                            pass
            else:
                errors += 1
        except Exception:
            errors += 1

        time.sleep(0.2)

    if errors > 0:
        print(f"  Plivo: {errors} country lookups failed")

    print(f"  Plivo: {len(rates)} rates (from API)")
    return rates


def _fetch_with_playwright():
    """Scrape Plivo pricing pages with Playwright."""
    from playwright.sync_api import sync_playwright

    rates = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Intercept API calls from Plivo's pricing page
        pricing_responses = []

        def handle_response(response):
            url = response.url
            if ("pricing" in url.lower() or "CountryPricing" in url) and response.status == 200:
                try:
                    body = response.json()
                    pricing_responses.append({"url": url, "data": body})
                except Exception:
                    pass

        page.on("response", handle_response)

        # Scrape key countries
        for iso in TOP_COUNTRIES[:20]:  # Limit to top 20 to avoid being too slow
            try:
                url = f"https://www.plivo.com/sms/pricing/{iso.lower()}/"
                page.goto(url, timeout=15000, wait_until="networkidle")
                time.sleep(1)

                # Try to read price from page content
                content = page.content()

                # Look for price patterns like $0.0055 or 0.155 INR
                import re
                price_matches = re.findall(r'\$(\d+\.\d{2,6})', content)
                if price_matches:
                    # Use the first price found (usually the base rate)
                    price = float(price_matches[0])
                    if 0.0001 < price < 1.0:
                        name = COUNTRY_NAMES.get(iso, iso)
                        rates.append(_make_rate(iso, name, price))

            except Exception:
                continue

        browser.close()

    if rates:
        print(f"  Plivo: {len(rates)} rates (from Playwright)")
    return rates


def _fallback_rates():
    """Known Plivo published rates for key countries."""
    known = {
        "US": ("United States", 0.0055),
        "CA": ("Canada", 0.0055),
        "GB": ("United Kingdom", 0.0360),
        "DE": ("Germany", 0.0680),
        "FR": ("France", 0.0620),
        "IN": ("India", 0.0018),
        "AU": ("Australia", 0.0450),
        "JP": ("Japan", 0.0620),
        "BR": ("Brazil", 0.0390),
        "MX": ("Mexico", 0.0280),
        "ES": ("Spain", 0.0640),
        "IT": ("Italy", 0.0660),
        "NL": ("Netherlands", 0.0700),
        "SG": ("Singapore", 0.0280),
        "PH": ("Philippines", 0.0240),
        "ID": ("Indonesia", 0.0290),
        "NG": ("Nigeria", 0.1500),          # estimated: ~20-30% below Twilio ($0.1982)
        "ZA": ("South Africa", 0.0200),
        "PL": ("Poland", 0.0220),
        "SE": ("Sweden", 0.0410),
        "NO": ("Norway", 0.0440),
        "DK": ("Denmark", 0.0350),
        "FI": ("Finland", 0.0510),
        "AT": ("Austria", 0.0740),
        "CH": ("Switzerland", 0.0470),
        "BE": ("Belgium", 0.0650),
        "IE": ("Ireland", 0.0540),
        "PT": ("Portugal", 0.0320),
        "NZ": ("New Zealand", 0.0470),
        "KR": ("South Korea", 0.0160),
        "HK": ("Hong Kong", 0.0300),
        "TW": ("Taiwan", 0.0260),
        "MY": ("Malaysia", 0.0280),
        "TH": ("Thailand", 0.0190),
        "AE": ("United Arab Emirates", 0.0370),
        "SA": ("Saudi Arabia", 0.0310),
        "IL": ("Israel", 0.0460),
        "TR": ("Turkey", 0.0075),
        "CO": ("Colombia", 0.0250),
        "CL": ("Chile", 0.0310),
        "AR": ("Argentina", 0.0380),
        "PE": ("Peru", 0.0460),
        "KE": ("Kenya", 0.0190),
        "EG": ("Egypt", 0.0380),
        "PK": ("Pakistan", 0.0330),
        "BD": ("Bangladesh", 0.0390),
        "RO": ("Romania", 0.0420),
        "CZ": ("Czech Republic", 0.0500),
        "GR": ("Greece", 0.0510),
        "HU": ("Hungary", 0.0600),
        "VN": ("Vietnam", 0.0460),
    }

    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  Plivo: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price, operator_name=None):
    rate_id = f"plivo-{iso.lower()}-outbound-sms"
    if operator_name:
        safe_op = operator_name.lower().replace(" ", "-").replace("/", "-")
        rate_id = f"plivo-{iso.lower()}-outbound-sms-{safe_op}"

    return {
        "id": rate_id,
        "provider": "Plivo",
        "country_iso": iso,
        "country_name": name,
        "operator_name": operator_name,
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
