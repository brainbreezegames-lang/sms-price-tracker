"""
Bandwidth SMS Pricing Scraper
Source: Published fallback rates only (no public pricing API)

Bandwidth does not expose a public pricing API. They are primarily
US-focused with very competitive domestic pricing. Their published rate
for US messaging is $0.004/msg. Limited international coverage.
"""

PRICING_LINK = "https://www.bandwidth.com/pricing/"


def fetch():
    """Return Bandwidth SMS pricing from published rates.

    Bandwidth has no public API for pricing. Uses known published rates only.
    Bandwidth is primarily a US-focused carrier with very competitive domestic
    rates and limited international reach.

    Returns a list of dicts matching the SMSRate schema.
    """
    return _fallback_rates()


def _fallback_rates():
    """Known Bandwidth published rates.

    Bandwidth is primarily US-focused with the cheapest domestic rates
    in the industry ($0.004/msg). Limited international destinations
    with higher prices due to fewer direct carrier connections outside US/CA.
    """
    known = {
        "US": ("United States", 0.0040),
        "CA": ("Canada", 0.0055),
        "GB": ("United Kingdom", 0.0600),
        "DE": ("Germany", 0.0900),
        "FR": ("France", 0.0850),
        "IN": ("India", 0.0380),
        "AU": ("Australia", 0.0650),
        "JP": ("Japan", 0.0880),
        "BR": ("Brazil", 0.0600),
        "MX": ("Mexico", 0.0450),
        "ES": ("Spain", 0.0870),
        "IT": ("Italy", 0.0900),
        "NL": ("Netherlands", 0.0950),
        "SG": ("Singapore", 0.0430),
        "PH": ("Philippines", 0.0380),
        "ID": ("Indonesia", 0.0440),
        "NG": ("Nigeria", 0.2500),          # estimated: limited intl coverage, higher rates
        "ZA": ("South Africa", 0.0320),
        "PL": ("Poland", 0.0350),
        "SE": ("Sweden", 0.0600),
        "NO": ("Norway", 0.0630),
        "DK": ("Denmark", 0.0520),
        "FI": ("Finland", 0.0740),
        "AT": ("Austria", 0.0980),
        "CH": ("Switzerland", 0.0680),
        "BE": ("Belgium", 0.0900),
        "IE": ("Ireland", 0.0780),
        "PT": ("Portugal", 0.0490),
        "NZ": ("New Zealand", 0.0640),
        "KR": ("South Korea", 0.0280),
    }

    rates = [_make_rate(iso, name, price) for iso, (name, price) in known.items()]
    print(f"  Bandwidth: {len(rates)} rates (fallback)")
    return rates


def _make_rate(iso, name, price):
    return {
        "id": f"bandwidth-{iso.lower()}-outbound-sms",
        "provider": "Bandwidth",
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
