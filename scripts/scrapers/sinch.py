"""
Sinch SMS Pricing Scraper
Source: Live pricingData JS variable embedded in sinch.com/pricing/sms/

Sinch embeds a pricingData JS object in their pricing page with 241 countries.
The data is structured as {currencyList: {out: [{prices: [{keyNodeName, price}]}]}}
where keyNodeName '/US/' gives the country-level rate, and '/US/1234/' gives
per-carrier rates.

We use country-level rates as the primary price. For the US, we override with
the carrier-specific rate ($0.01) since US major carriers are much cheaper than
the catch-all country-level rate ($0.07).
"""

import re
import requests

PRICING_LINK = "https://sinch.com/pricing/sms/"

# Country ISO -> name mapping for countries not in pycountry
ISO_TO_NAME = {
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
    "AD": "Andorra", "AC": "Ascension Island", "AG": "Antigua and Barbuda",
    "AI": "Anguilla", "AL": "Albania", "AM": "Armenia", "AN": "Netherlands Antilles",
    "AS": "American Samoa", "AW": "Aruba", "AZ": "Azerbaijan",
    "BB": "Barbados", "BF": "Burkina Faso", "BJ": "Benin",
    "BN": "Brunei", "BY": "Belarus", "BZ": "Belize",
    "CF": "Central African Republic", "CG": "Republic of Congo",
    "CK": "Cook Islands", "CV": "Cape Verde", "DJ": "Djibouti",
    "DM": "Dominica", "DZ": "Algeria", "ER": "Eritrea",
    "FJ": "Fiji", "FM": "Micronesia", "GA": "Gabon",
    "GD": "Grenada", "GF": "French Guiana", "GM": "Gambia",
    "GN": "Guinea", "GP": "Guadeloupe", "GQ": "Equatorial Guinea",
    "GW": "Guinea-Bissau", "GY": "Guyana", "JE": "Jersey",
    "KG": "Kyrgyzstan", "KI": "Kiribati", "KM": "Comoros",
    "KP": "North Korea", "KZ": "Kazakhstan", "LC": "Saint Lucia",
    "LI": "Liechtenstein", "LR": "Liberia", "LS": "Lesotho",
    "LY": "Libya", "MC": "Monaco", "MD": "Moldova", "ME": "Montenegro",
    "MG": "Madagascar", "MH": "Marshall Islands", "MK": "North Macedonia",
    "ML": "Mali", "MN": "Mongolia", "MQ": "Martinique",
    "MR": "Mauritania", "MS": "Montserrat", "MW": "Malawi",
    "NC": "New Caledonia", "NE": "Niger", "NF": "Norfolk Island",
    "NR": "Nauru", "PF": "French Polynesia", "PG": "Papua New Guinea",
    "PM": "Saint Pierre and Miquelon", "PS": "Palestine", "PW": "Palau",
    "RE": "Reunion", "SB": "Solomon Islands", "SC": "Seychelles",
    "SD": "Sudan", "SH": "Saint Helena", "SL": "Sierra Leone",
    "SM": "San Marino", "SO": "Somalia", "SR": "Suriname",
    "SS": "South Sudan", "ST": "Sao Tome and Principe", "SZ": "Eswatini",
    "TC": "Turks and Caicos Islands", "TD": "Chad", "TG": "Togo",
    "TJ": "Tajikistan", "TK": "Tokelau", "TL": "Timor-Leste",
    "TM": "Turkmenistan", "TO": "Tonga", "TV": "Tuvalu",
    "TZ": "Tanzania", "UZ": "Uzbekistan", "VA": "Vatican City",
    "VC": "Saint Vincent and the Grenadines", "VG": "British Virgin Islands",
    "VI": "US Virgin Islands", "VU": "Vanuatu", "WF": "Wallis and Futuna",
    "WS": "Samoa", "YE": "Yemen", "YT": "Mayotte", "ZM": "Zambia",
}

# Countries where the country-level rate is misleading (too high vs actual)
# We override with the known accurate carrier-level rate
CARRIER_OVERRIDES = {
    "US": 0.0100,  # Major US carriers (AT&T, T-Mobile, Verizon) = $0.01
    "CA": 0.0200,  # Rogers, Bell, Telus = $0.02
    "IN": 0.0180,  # DLT routes for Airtel, Jio, Vodafone = $0.018
}


def fetch():
    """Fetch Sinch SMS pricing from their pricing page.

    Extracts the pricingData JS variable embedded in the page (241 countries).
    Falls back to known published rates for 51 key countries.
    """
    try:
        rates = _fetch_from_page()
        if len(rates) >= 100:
            return rates
    except Exception as e:
        print(f"  Sinch: Page scraping failed ({e})")

    return _fallback_rates()


def _fetch_from_page():
    """Extract pricing from the pricingData JS variable in sinch.com/pricing/sms/."""
    resp = requests.get(
        PRICING_LINK,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
        },
        timeout=20,
    )
    resp.raise_for_status()
    html = resp.text

    # Extract the pricingData JS object
    match = re.search(r"var pricingData = (\{.+?\});", html, re.DOTALL)
    if not match:
        raise ValueError("pricingData not found in page")

    import json
    data = json.loads(match.group(1))

    # Get the first USD outbound pricing entry
    out_entries = data.get("currencyList", {}).get("out", [])
    if not out_entries:
        raise ValueError("No outbound pricing entries found")

    prices = out_entries[0].get("prices", [])

    # Extract country-level rates (keyNodeName pattern: /XX/)
    country_rates = {}
    for p in prices:
        key = p.get("keyNodeName", "")
        country_match = re.match(r"^/([A-Z]{2})/$", key)
        if country_match:
            iso = country_match.group(1)
            try:
                price = float(p.get("price", 0))
                if price > 0:
                    country_rates[iso] = price
            except (ValueError, TypeError):
                pass

    if not country_rates:
        raise ValueError("No country rates extracted")

    rates = []
    for iso, price in country_rates.items():
        # Apply known carrier overrides where country-level is misleading
        actual_price = CARRIER_OVERRIDES.get(iso, price)
        name = ISO_TO_NAME.get(iso, iso)
        rates.append(_make_rate(iso, name, actual_price))

    print(f"  Sinch: {len(rates)} rates (from page)")
    return rates


def _fallback_rates():
    """Known Sinch published rates for key countries."""
    known = {
        "US": ("United States", 0.0100),
        "CA": ("Canada", 0.0200),
        "GB": ("United Kingdom", 0.0442),
        "DE": ("Germany", 0.0883),
        "FR": ("France", 0.0687),
        "IN": ("India", 0.0180),
        "AU": ("Australia", 0.0327),
        "JP": ("Japan", 0.0747),
        "BR": ("Brazil", 0.0327),
        "MX": ("Mexico", 0.0360),
        "ES": ("Spain", 0.0760),
        "IT": ("Italy", 0.0790),
        "NL": ("Netherlands", 0.0860),
        "SG": ("Singapore", 0.0350),
        "PH": ("Philippines", 0.0300),
        "ID": ("Indonesia", 0.0360),
        "NG": ("Nigeria", 0.3062),
        "ZA": ("South Africa", 0.0250),
        "PL": ("Poland", 0.0290),
        "SE": ("Sweden", 0.0460),
        "NO": ("Norway", 0.0510),
        "DK": ("Denmark", 0.0420),
        "FI": ("Finland", 0.0610),
        "AT": ("Austria", 0.0870),
        "CH": ("Switzerland", 0.0560),
        "BE": ("Belgium", 0.0760),
        "IE": ("Ireland", 0.0650),
        "PT": ("Portugal", 0.0400),
        "NZ": ("New Zealand", 0.0540),
        "KR": ("South Korea", 0.0210),
        "HK": ("Hong Kong", 0.0390),
        "TW": ("Taiwan", 0.0330),
        "MY": ("Malaysia", 0.0340),
        "TH": ("Thailand", 0.0240),
        "AE": ("United Arab Emirates", 0.0440),
        "SA": ("Saudi Arabia", 0.0380),
        "IL": ("Israel", 0.0550),
        "TR": ("Turkey", 0.0100),
        "CO": ("Colombia", 0.0310),
        "CL": ("Chile", 0.0390),
        "AR": ("Argentina", 0.0460),
        "PE": ("Peru", 0.0560),
        "KE": ("Kenya", 0.0240),
        "EG": ("Egypt", 0.0450),
        "PK": ("Pakistan", 0.0400),
        "BD": ("Bangladesh", 0.0460),
        "RO": ("Romania", 0.0500),
        "CZ": ("Czech Republic", 0.0600),
        "GR": ("Greece", 0.0590),
        "HU": ("Hungary", 0.0700),
        "VN": ("Vietnam", 0.0530),
    }

    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  Sinch: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price):
    return {
        "id": f"sinch-{iso.lower()}-outbound-sms",
        "provider": "Sinch",
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
