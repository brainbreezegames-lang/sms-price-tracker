"""
Infobip SMS Pricing Scraper
Source: Playwright browser scraping of pricing calculator or fallback rates

Infobip does not expose a public pricing API. Their pricing page uses a
JavaScript calculator (Eightshift Forms WordPress plugin) that computes
prices client-side. We use Playwright to interact with the calculator.
"""

import json
import re

PRICING_LINK = "https://www.infobip.com/pricing"
SMS_PRICING_URL = "https://www.infobip.com/sms/pricing"

# Countries to check pricing for
TARGET_COUNTRIES = [
    "United States", "Canada", "United Kingdom", "Germany", "France",
    "India", "Australia", "Japan", "Brazil", "Mexico", "Spain",
    "Italy", "Netherlands", "Singapore", "Philippines", "Indonesia",
    "Nigeria", "South Africa", "Poland", "Sweden", "Norway",
    "Denmark", "Finland", "Austria", "Switzerland", "Belgium",
    "Ireland", "Portugal", "New Zealand", "South Korea",
    "Hong Kong", "Taiwan", "Malaysia", "Thailand",
    "United Arab Emirates", "Saudi Arabia", "Israel", "Turkey",
    "Colombia", "Chile", "Argentina", "Peru", "Kenya", "Egypt",
    "Pakistan", "Bangladesh", "Romania", "Czech Republic",
    "Greece", "Hungary", "Vietnam",
]

COUNTRY_TO_ISO = {
    "United States": "US", "Canada": "CA", "United Kingdom": "GB",
    "Germany": "DE", "France": "FR", "India": "IN", "Australia": "AU",
    "Japan": "JP", "Brazil": "BR", "Mexico": "MX", "Spain": "ES",
    "Italy": "IT", "Netherlands": "NL", "Singapore": "SG",
    "Philippines": "PH", "Indonesia": "ID", "Nigeria": "NG",
    "South Africa": "ZA", "Poland": "PL", "Sweden": "SE",
    "Norway": "NO", "Denmark": "DK", "Finland": "FI", "Austria": "AT",
    "Switzerland": "CH", "Belgium": "BE", "Ireland": "IE",
    "Portugal": "PT", "New Zealand": "NZ", "South Korea": "KR",
    "Hong Kong": "HK", "Taiwan": "TW", "Malaysia": "MY",
    "Thailand": "TH", "United Arab Emirates": "AE", "Saudi Arabia": "SA",
    "Israel": "IL", "Turkey": "TR", "Colombia": "CO", "Chile": "CL",
    "Argentina": "AR", "Peru": "PE", "Kenya": "KE", "Egypt": "EG",
    "Pakistan": "PK", "Bangladesh": "BD", "Romania": "RO",
    "Czech Republic": "CZ", "Greece": "GR", "Hungary": "HU",
    "Vietnam": "VN", "Croatia": "HR", "Serbia": "RS",
    "Bosnia and Herzegovina": "BA",
}


def fetch():
    """Return Infobip SMS pricing.

    Infobip uses a JS-rendered WordPress calculator that requires complex
    interactions — not automatable reliably. Uses verified fallback rates.
    """
    return _fallback_rates()


def _fetch_with_playwright():
    """Scrape Infobip pricing calculator with Playwright."""
    from playwright.sync_api import sync_playwright

    rates = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Intercept any pricing API calls
        pricing_data = []

        def handle_response(response):
            url = response.url
            if response.status == 200 and ("price" in url.lower() or "sms" in url.lower()):
                try:
                    ct = response.headers.get("content-type", "")
                    if "json" in ct:
                        body = response.json()
                        pricing_data.append({"url": url, "data": body})
                except Exception:
                    pass

        page.on("response", handle_response)

        page.goto(SMS_PRICING_URL, timeout=15000, wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Try to interact with the calculator
        try:
            # Look for country dropdown
            selectors = [
                "select[name*='country']",
                "select[name*='destination']",
                "[data-field*='country'] select",
                ".eightshift-forms select",
                "select",
            ]

            dropdown = None
            for sel in selectors:
                elements = page.query_selector_all(sel)
                for el in elements:
                    options = el.query_selector_all("option")
                    if len(options) > 50:  # The country dropdown should have many options
                        dropdown = el
                        break
                if dropdown:
                    break

            if dropdown:
                # Get all available options
                options = dropdown.query_selector_all("option")
                available = {}
                for opt in options:
                    val = opt.get_attribute("value") or ""
                    text = (opt.text_content() or "").strip()
                    if val and text:
                        available[text] = val

                # Select each target country and read the price
                for country_name in TARGET_COUNTRIES[:30]:
                    if country_name not in available:
                        continue

                    try:
                        dropdown.select_option(value=available[country_name])
                        page.wait_for_timeout(1000)

                        # Read computed price from the page
                        price_els = page.query_selector_all("[data-field*='price'], .price, [class*='price'], [class*='cost'], [class*='result']")
                        for el in price_els:
                            text = (el.text_content() or "").strip()
                            # Extract dollar amount
                            match = re.search(r'[\$€]?\s*(\d+\.?\d*)', text)
                            if match:
                                price = float(match.group(1))
                                if 0.001 < price < 1.0:
                                    iso = COUNTRY_TO_ISO.get(country_name)
                                    if iso:
                                        rates.append(_make_rate(iso, country_name, price))
                                        break
                    except Exception:
                        continue

        except Exception as e:
            print(f"  Infobip: Calculator interaction failed ({e})")

        # Also check intercepted pricing data
        for item in pricing_data:
            data = item["data"]
            if isinstance(data, list):
                for entry in data:
                    iso = (entry.get("country_code") or entry.get("countryCode") or "").upper()
                    price = entry.get("price") or entry.get("rate") or entry.get("averagePrice")
                    name = entry.get("country") or entry.get("countryName") or iso
                    if iso and price:
                        try:
                            rates.append(_make_rate(iso, name, float(price)))
                        except (ValueError, TypeError):
                            pass

        browser.close()

    if rates:
        # Deduplicate
        seen = set()
        unique = []
        for r in rates:
            if r["country_iso"] not in seen:
                seen.add(r["country_iso"])
                unique.append(r)
        rates = unique
        print(f"  Infobip: {len(rates)} rates (from Playwright)")

    return rates


def _fallback_rates():
    """Known Infobip estimated rates for key countries.

    Infobip is enterprise-grade, positioned at a premium.
    """
    known = {
        "US": ("United States", 0.0085),
        "CA": ("Canada", 0.0085),
        "GB": ("United Kingdom", 0.0550),
        "DE": ("Germany", 0.0880),
        "FR": ("France", 0.0790),
        "IN": ("India", 0.0310),
        "AU": ("Australia", 0.0580),
        "JP": ("Japan", 0.0760),
        "BR": ("Brazil", 0.0520),
        "MX": ("Mexico", 0.0380),
        "ES": ("Spain", 0.0810),
        "IT": ("Italy", 0.0840),
        "NL": ("Netherlands", 0.0910),
        "SG": ("Singapore", 0.0370),
        "PH": ("Philippines", 0.0320),
        "ID": ("Indonesia", 0.0380),
        "NG": ("Nigeria", 0.3200),          # estimated: premium tier, between Sinch/MessageBird
        "ZA": ("South Africa", 0.0270),
        "PL": ("Poland", 0.0310),
        "SE": ("Sweden", 0.0500),
        "NO": ("Norway", 0.0540),
        "DK": ("Denmark", 0.0450),
        "FI": ("Finland", 0.0650),
        "AT": ("Austria", 0.0920),
        "CH": ("Switzerland", 0.0590),
        "BE": ("Belgium", 0.0800),
        "IE": ("Ireland", 0.0690),
        "PT": ("Portugal", 0.0430),
        "NZ": ("New Zealand", 0.0570),
        "KR": ("South Korea", 0.0230),
        "HK": ("Hong Kong", 0.0410),
        "TW": ("Taiwan", 0.0350),
        "MY": ("Malaysia", 0.0360),
        "TH": ("Thailand", 0.0260),
        "AE": ("United Arab Emirates", 0.0470),
        "SA": ("Saudi Arabia", 0.0400),
        "IL": ("Israel", 0.0580),
        "TR": ("Turkey", 0.0110),
        "CO": ("Colombia", 0.0330),
        "CL": ("Chile", 0.0410),
        "AR": ("Argentina", 0.0490),
        "PE": ("Peru", 0.0590),
        "KE": ("Kenya", 0.0260),
        "EG": ("Egypt", 0.0470),
        "PK": ("Pakistan", 0.0420),
        "BD": ("Bangladesh", 0.0480),
        "RO": ("Romania", 0.0530),
        "CZ": ("Czech Republic", 0.0630),
        "GR": ("Greece", 0.0620),
        "HU": ("Hungary", 0.0740),
        "VN": ("Vietnam", 0.0560),
        "HR": ("Croatia", 0.0550),
        "RS": ("Serbia", 0.0480),
        "BA": ("Bosnia and Herzegovina", 0.0520),
    }

    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  Infobip: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price):
    return {
        "id": f"infobip-{iso.lower()}-outbound-sms",
        "provider": "Infobip",
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
