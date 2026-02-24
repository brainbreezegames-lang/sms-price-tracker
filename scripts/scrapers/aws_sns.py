"""
Amazon SNS / AWS End User Messaging SMS Pricing
Source: AWS pricing page (Playwright scraping) or published base rates

AWS loads pricing dynamically via JavaScript. We use Playwright to
download the SMS pricing CSV that AWS makes available on their page.
"""

import csv
import io
import re
import requests

PRICING_LINK = "https://aws.amazon.com/sns/sms-pricing/"


def fetch():
    """Fetch AWS SNS SMS pricing.

    Priority: Playwright CSV download > fallback rates.
    """
    try:
        rates = _fetch_with_playwright()
        if len(rates) >= 20:
            return rates
    except Exception as e:
        print(f"  Amazon SNS: Playwright scraping failed ({e})")

    return _fallback_rates()


def _fetch_with_playwright():
    """Use Playwright to download the SMS pricing CSV from AWS."""
    from playwright.sync_api import sync_playwright

    rates = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Intercept responses for pricing data
        csv_data = []

        def handle_response(response):
            url = response.url
            ct = response.headers.get("content-type", "")
            if response.status == 200:
                if "csv" in ct or url.endswith(".csv"):
                    try:
                        csv_data.append(response.text())
                    except Exception:
                        pass

        page.on("response", handle_response)

        page.goto(PRICING_LINK, timeout=15000, wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Try to find and click the CSV download link
        try:
            csv_links = page.query_selector_all("a[href*='.csv'], a[href*='csv'], button:has-text('CSV'), a:has-text('CSV')")
            for link in csv_links:
                href = link.get_attribute("href") or ""
                text = (link.text_content() or "").lower()
                if "csv" in href or "csv" in text or "download" in text:
                    if href.startswith("http"):
                        try:
                            resp = requests.get(href, timeout=15)
                            if resp.status_code == 200 and "," in resp.text:
                                csv_data.append(resp.text)
                        except Exception:
                            pass
                    else:
                        link.click()
                        page.wait_for_timeout(2000)
        except Exception:
            pass

        # Try to extract pricing from the page's table
        if not csv_data:
            try:
                tables = page.query_selector_all("table")
                for table in tables:
                    rows = table.query_selector_all("tr")
                    if len(rows) > 10:
                        for row in rows[1:]:
                            cells = row.query_selector_all("td, th")
                            if len(cells) >= 2:
                                country_text = (cells[0].text_content() or "").strip()
                                price_text = (cells[-1].text_content() or "").strip()
                                price_match = re.search(r'\$?(\d+\.?\d*)', price_text)
                                if country_text and price_match:
                                    price = float(price_match.group(1))
                                    iso = _country_name_to_iso(country_text)
                                    if iso and 0.0001 < price < 1.0:
                                        rates.append(_make_rate(iso, country_text, price))
            except Exception:
                pass

        # Parse any CSV data we got
        for text in csv_data:
            rates.extend(_parse_csv(text))

        browser.close()

    if rates:
        seen = set()
        unique = []
        for r in rates:
            if r["country_iso"] not in seen:
                seen.add(r["country_iso"])
                unique.append(r)
        rates = unique
        print(f"  Amazon SNS: {len(rates)} rates (from Playwright)")

    return rates


def _parse_csv(text):
    """Parse AWS SMS pricing CSV."""
    rates = []
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        iso = (row.get("Country Code") or row.get("country_code") or
               row.get("ISO") or row.get("iso") or "").upper().strip()
        country = (row.get("Country") or row.get("country") or
                   row.get("Country Name") or "").strip()

        price_str = (row.get("Price") or row.get("price") or
                     row.get("Transactional") or row.get("Rate") or "0")
        price_str = price_str.replace("$", "").strip()

        if not iso or len(iso) != 2:
            continue

        try:
            price = float(price_str)
        except (ValueError, TypeError):
            continue

        if 0.0001 < price < 1.0:
            rates.append(_make_rate(iso, country or iso, price))

    return rates


_COUNTRY_ISO_MAP = {
    "united states": "US", "canada": "CA", "united kingdom": "GB",
    "germany": "DE", "france": "FR", "india": "IN", "australia": "AU",
    "japan": "JP", "brazil": "BR", "mexico": "MX", "spain": "ES",
    "italy": "IT", "netherlands": "NL", "singapore": "SG",
    "south korea": "KR", "philippines": "PH", "indonesia": "ID",
    "thailand": "TH", "nigeria": "NG", "south africa": "ZA",
    "uae": "AE", "united arab emirates": "AE", "saudi arabia": "SA",
    "poland": "PL", "sweden": "SE", "norway": "NO", "denmark": "DK",
    "finland": "FI", "austria": "AT", "switzerland": "CH",
    "belgium": "BE", "ireland": "IE", "portugal": "PT",
    "new zealand": "NZ", "chile": "CL", "colombia": "CO",
    "argentina": "AR", "peru": "PE", "malaysia": "MY",
    "vietnam": "VN", "taiwan": "TW", "hong kong": "HK",
    "israel": "IL", "turkey": "TR", "egypt": "EG", "kenya": "KE",
    "pakistan": "PK", "bangladesh": "BD", "romania": "RO",
    "czech republic": "CZ", "greece": "GR", "hungary": "HU",
}


def _country_name_to_iso(name):
    return _COUNTRY_ISO_MAP.get(name.lower().strip())


def _fallback_rates():
    """Known AWS SNS published rates."""
    KNOWN_RATES = {
        "US": {"name": "United States", "transactional": 0.00581, "promotional": 0.00209},
        "CA": {"name": "Canada", "transactional": 0.00755, "promotional": 0.00755},
        "GB": {"name": "United Kingdom", "transactional": 0.04080, "promotional": 0.04080},
        "DE": {"name": "Germany", "transactional": 0.07865, "promotional": 0.07865},
        "FR": {"name": "France", "transactional": 0.06580, "promotional": 0.06580},
        "IN": {"name": "India", "transactional": 0.02574, "promotional": 0.01181},
        "AU": {"name": "Australia", "transactional": 0.06480, "promotional": 0.06480},
        "JP": {"name": "Japan", "transactional": 0.07608, "promotional": 0.07608},
        "BR": {"name": "Brazil", "transactional": 0.05970, "promotional": 0.02190},
        "MX": {"name": "Mexico", "transactional": 0.03460, "promotional": 0.03460},
        "ES": {"name": "Spain", "transactional": 0.07500, "promotional": 0.07500},
        "IT": {"name": "Italy", "transactional": 0.09220, "promotional": 0.09220},
        "NL": {"name": "Netherlands", "transactional": 0.08500, "promotional": 0.08500},
        "SG": {"name": "Singapore", "transactional": 0.03940, "promotional": 0.03940},
        "KR": {"name": "South Korea", "transactional": 0.02330, "promotional": 0.02330},
        "PH": {"name": "Philippines", "transactional": 0.03280, "promotional": 0.03280},
        "ID": {"name": "Indonesia", "transactional": 0.03750, "promotional": 0.03750},
        "TH": {"name": "Thailand", "transactional": 0.02640, "promotional": 0.02640},
        "NG": {"name": "Nigeria", "transactional": 0.2000, "promotional": 0.2000},
        "ZA": {"name": "South Africa", "transactional": 0.02700, "promotional": 0.02700},
        "AE": {"name": "United Arab Emirates", "transactional": 0.04780, "promotional": 0.04780},
        "SA": {"name": "Saudi Arabia", "transactional": 0.03930, "promotional": 0.03930},
        "PL": {"name": "Poland", "transactional": 0.03000, "promotional": 0.03000},
        "SE": {"name": "Sweden", "transactional": 0.05330, "promotional": 0.05330},
        "NO": {"name": "Norway", "transactional": 0.05550, "promotional": 0.05550},
        "DK": {"name": "Denmark", "transactional": 0.04470, "promotional": 0.04470},
        "FI": {"name": "Finland", "transactional": 0.06560, "promotional": 0.06560},
        "AT": {"name": "Austria", "transactional": 0.09310, "promotional": 0.09310},
        "CH": {"name": "Switzerland", "transactional": 0.05640, "promotional": 0.05640},
        "BE": {"name": "Belgium", "transactional": 0.08200, "promotional": 0.08200},
        "IE": {"name": "Ireland", "transactional": 0.06750, "promotional": 0.06750},
        "PT": {"name": "Portugal", "transactional": 0.04080, "promotional": 0.04080},
        "CL": {"name": "Chile", "transactional": 0.04190, "promotional": 0.04190},
        "CO": {"name": "Colombia", "transactional": 0.03330, "promotional": 0.03330},
        "AR": {"name": "Argentina", "transactional": 0.04940, "promotional": 0.04940},
        "PE": {"name": "Peru", "transactional": 0.06100, "promotional": 0.06100},
        "MY": {"name": "Malaysia", "transactional": 0.03700, "promotional": 0.03700},
        "VN": {"name": "Vietnam", "transactional": 0.05570, "promotional": 0.05570},
        "TW": {"name": "Taiwan", "transactional": 0.03450, "promotional": 0.03450},
        "HK": {"name": "Hong Kong", "transactional": 0.04200, "promotional": 0.04200},
        "IL": {"name": "Israel", "transactional": 0.05950, "promotional": 0.05950},
        "TR": {"name": "Turkey", "transactional": 0.01180, "promotional": 0.01180},
        "EG": {"name": "Egypt", "transactional": 0.04870, "promotional": 0.04870},
        "KE": {"name": "Kenya", "transactional": 0.02640, "promotional": 0.02640},
        "PK": {"name": "Pakistan", "transactional": 0.04060, "promotional": 0.04060},
        "BD": {"name": "Bangladesh", "transactional": 0.04670, "promotional": 0.04670},
        "RO": {"name": "Romania", "transactional": 0.05250, "promotional": 0.05250},
        "CZ": {"name": "Czech Republic", "transactional": 0.06280, "promotional": 0.06280},
        "GR": {"name": "Greece", "transactional": 0.06150, "promotional": 0.06150},
        "HU": {"name": "Hungary", "transactional": 0.07250, "promotional": 0.07250},
        "NZ": {"name": "New Zealand", "transactional": 0.06100, "promotional": 0.06100},
    }

    rates = []
    for iso, info in KNOWN_RATES.items():
        price = info["transactional"]
        rates.append(_make_rate(iso, info["name"], price))

    print(f"  Amazon SNS: {len(rates)} rates (from published docs)")
    return rates


def _make_rate(iso, name, price):
    return {
        "id": f"amazon-sns-{iso.lower()}-outbound-sms",
        "provider": "Amazon SNS",
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
    for r in data[:5]:
        print(f"  {r['country_name']} ({r['country_iso']}): ${r['price_usd']}")
