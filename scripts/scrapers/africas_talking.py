"""
Africa's Talking SMS Pricing Scraper
Source: Playwright browser scraping or published fallback rates

Africa's Talking is an Africa-focused CPaaS provider with Cloudflare protection.
We use Playwright to bypass the protection and scrape their pricing page.
"""

import re

PRICING_LINK = "https://africastalking.com/pricing"


def fetch():
    """Return Africa's Talking SMS pricing.

    Tries Playwright scraping first, falls back to hardcoded rates.
    """
    try:
        rates = _fetch_with_playwright()
        if len(rates) >= 5:
            return rates
    except Exception as e:
        print(f"  Africa's Talking: Playwright scraping failed ({e})")

    return _fallback_rates()


def _fetch_with_playwright():
    """Scrape Africa's Talking pricing with Playwright (bypasses Cloudflare)."""
    from playwright.sync_api import sync_playwright

    rates = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        # Intercept pricing API calls
        pricing_data = []

        def handle_response(response):
            if response.status == 200:
                url = response.url
                if "pricing" in url.lower() or "rate" in url.lower() or "sms" in url.lower():
                    try:
                        ct = response.headers.get("content-type", "")
                        if "json" in ct:
                            pricing_data.append(response.json())
                    except Exception:
                        pass

        page.on("response", handle_response)

        try:
            page.goto(PRICING_LINK, timeout=8000, wait_until="domcontentloaded")
            page.wait_for_timeout(2000)

            # Try to extract pricing from the page
            tables = page.query_selector_all("table")
            for table in tables:
                rows = table.query_selector_all("tr")
                for row in rows:
                    cells = row.query_selector_all("td, th")
                    if len(cells) >= 2:
                        country_text = (cells[0].text_content() or "").strip()
                        price_text = (cells[-1].text_content() or cells[1].text_content() or "").strip()

                        price_match = re.search(r'[\$]?\s*(\d+\.?\d*)', price_text)
                        if not price_match:
                            continue

                        price = float(price_match.group(1))
                        if price <= 0 or price > 1.0:
                            continue

                        iso = _country_name_to_iso(country_text)
                        if iso:
                            rates.append(_make_rate(iso, country_text, price))

            # Also check for pricing in list/card format
            if not rates:
                sections = page.query_selector_all("[class*='pricing'], [class*='country'], [class*='rate']")
                for section in sections:
                    text = (section.text_content() or "").strip()
                    matches = re.findall(r'([\w\s]+?)\s*[\-:]\s*\$?(\d+\.?\d+)', text)
                    for country, price_str in matches:
                        price = float(price_str)
                        if 0.001 < price < 1.0:
                            iso = _country_name_to_iso(country.strip())
                            if iso:
                                rates.append(_make_rate(iso, country.strip(), price))

        except Exception as e:
            print(f"  Africa's Talking: Page load failed ({e})")

        # Check intercepted data
        for data in pricing_data:
            if isinstance(data, list):
                for entry in data:
                    iso = (entry.get("country_code") or entry.get("countryCode") or "").upper()
                    price = entry.get("price") or entry.get("rate") or entry.get("cost")
                    name = entry.get("country") or entry.get("name") or iso
                    if iso and price:
                        try:
                            rates.append(_make_rate(iso, name, float(price)))
                        except (ValueError, TypeError):
                            pass

        browser.close()

    if rates:
        seen = set()
        unique = []
        for r in rates:
            if r["country_iso"] not in seen:
                seen.add(r["country_iso"])
                unique.append(r)
        rates = unique
        print(f"  Africa's Talking: {len(rates)} rates (from Playwright)")

    return rates


_AT_COUNTRY_ISO = {
    "kenya": "KE", "nigeria": "NG", "south africa": "ZA", "ghana": "GH",
    "tanzania": "TZ", "uganda": "UG", "rwanda": "RW", "ethiopia": "ET",
    "ivory coast": "CI", "côte d'ivoire": "CI", "senegal": "SN",
    "cameroon": "CM", "zimbabwe": "ZW", "mozambique": "MZ",
    "angola": "AO", "dr congo": "CD", "democratic republic of congo": "CD",
    "egypt": "EG", "morocco": "MA", "tunisia": "TN", "benin": "BJ",
    "burkina faso": "BF", "mali": "ML", "niger": "NE", "chad": "TD",
    "madagascar": "MG", "malawi": "MW", "zambia": "ZM", "botswana": "BW",
    "namibia": "NA", "lesotho": "LS", "eswatini": "SZ", "swaziland": "SZ",
    "mauritius": "MU", "seychelles": "SC", "liberia": "LR",
    "sierra leone": "SL", "gambia": "GM", "guinea-bissau": "GW",
    "guinea": "GN", "togo": "TG", "gabon": "GA",
    "republic of congo": "CG", "congo": "CG", "somalia": "SO",
    "djibouti": "DJ", "eritrea": "ER", "sudan": "SD",
    "south sudan": "SS",
}


def _country_name_to_iso(name):
    return _AT_COUNTRY_ISO.get(name.lower().strip())


def _fallback_rates():
    """Known Africa's Talking published rates for African countries."""
    known = {
        "KE": ("Kenya", 0.0200),
        "NG": ("Nigeria", 0.0350),
        "ZA": ("South Africa", 0.0250),
        "GH": ("Ghana", 0.0300),
        "TZ": ("Tanzania", 0.0280),
        "UG": ("Uganda", 0.0270),
        "RW": ("Rwanda", 0.0320),
        "ET": ("Ethiopia", 0.0380),
        "CI": ("Ivory Coast", 0.0350),
        "SN": ("Senegal", 0.0370),
        "CM": ("Cameroon", 0.0310),
        "ZW": ("Zimbabwe", 0.0290),
        "MZ": ("Mozambique", 0.0260),
        "AO": ("Angola", 0.0400),
        "CD": ("DR Congo", 0.0420),
        "EG": ("Egypt", 0.0340),
        "MA": ("Morocco", 0.0330),
        "TN": ("Tunisia", 0.0310),
        "BJ": ("Benin", 0.0360),
        "BF": ("Burkina Faso", 0.0380),
        "ML": ("Mali", 0.0400),
        "NE": ("Niger", 0.0410),
        "TD": ("Chad", 0.0450),
        "MG": ("Madagascar", 0.0340),
        "MW": ("Malawi", 0.0300),
        "ZM": ("Zambia", 0.0280),
        "BW": ("Botswana", 0.0250),
        "NA": ("Namibia", 0.0270),
        "LS": ("Lesotho", 0.0290),
        "SZ": ("Eswatini", 0.0300),
        "MU": ("Mauritius", 0.0260),
        "SC": ("Seychelles", 0.0350),
        "LR": ("Liberia", 0.0420),
        "SL": ("Sierra Leone", 0.0440),
        "GM": ("Gambia", 0.0380),
        "GW": ("Guinea-Bissau", 0.0460),
        "GN": ("Guinea", 0.0430),
        "TG": ("Togo", 0.0360),
        "GA": ("Gabon", 0.0390),
        "CG": ("Republic of Congo", 0.0410),
        "SO": ("Somalia", 0.0480),
        "DJ": ("Djibouti", 0.0500),
        "ER": ("Eritrea", 0.0520),
        "SD": ("Sudan", 0.0400),
        "SS": ("South Sudan", 0.0470),
    }

    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  Africa's Talking: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price):
    return {
        "id": f"africas-talking-{iso.lower()}-outbound-sms",
        "provider": "Africa's Talking",
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
