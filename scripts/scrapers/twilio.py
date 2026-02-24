"""
Twilio SMS Pricing Scraper
Source: Public CSV — no authentication needed
URL: https://www.twilio.com/content/dam/twilio-com/pricing-data/en/csv/PMded94a0dae30eaaec0f115f22859bd38_SMSPricing.csv
"""

import csv
import io
import re
import requests

CSV_URL = (
    "https://www.twilio.com/content/dam/twilio-com/pricing-data/en/csv/"
    "PMded94a0dae30eaaec0f115f22859bd38_SMSPricing.csv"
)

PRICING_LINK = "https://www.twilio.com/en-us/sms/pricing"


def fetch():
    """Fetch and parse Twilio's public SMS pricing CSV.

    Returns a list of dicts matching the SMSRate schema.
    """
    resp = requests.get(CSV_URL, timeout=30)
    resp.raise_for_status()

    reader = csv.DictReader(io.StringIO(resp.text))
    rates = []

    for row in reader:
        iso = (row.get("ISO") or "").strip().upper()
        country = (row.get("Country") or "").strip()
        desc = (row.get("Description") or "").strip()
        price_str = (row.get("Price / msg") or "").strip()

        if not iso or not price_str:
            continue

        try:
            price = float(price_str)
        except ValueError:
            continue

        # Parse direction + operator from description
        # e.g. "UNITED STATES Outbound SMS - AT&T Mobility"
        direction = "outbound"
        operator = None

        desc_lower = desc.lower()
        if "inbound" in desc_lower:
            direction = "inbound"

        # Extract operator name after " - "
        if " - " in desc:
            operator = desc.split(" - ", 1)[1].strip()

        # Extract MMS from description
        message_type = "sms"
        if "mms" in desc_lower:
            message_type = "mms"

        rate_id = f"twilio-{iso}-{direction}-{message_type}-{(operator or 'default').lower().replace(' ', '-')}"
        # Make ID safe
        rate_id = re.sub(r"[^a-z0-9\-]", "", rate_id)

        rates.append({
            "id": rate_id,
            "provider": "Twilio",
            "country_iso": iso,
            "country_name": country,
            "operator_name": operator,
            "mcc": None,
            "mnc": None,
            "price_per_sms": price,
            "currency": "USD",
            "price_usd": price,
            "direction": direction,
            "message_type": message_type,
            "carrier_surcharge_usd": None,
            "total_price_usd": price,
            "verify_price_usd": None,
            "link": PRICING_LINK,
            "last_updated": None,  # Set by orchestrator
        })

    print(f"  Twilio: {len(rates)} rates fetched")
    return rates


if __name__ == "__main__":
    data = fetch()
    print(f"Total: {len(data)} records")
    # Print first 5 US outbound
    us = [r for r in data if r["country_iso"] == "US" and r["direction"] == "outbound"]
    for r in us[:5]:
        print(f"  {r['operator_name']}: ${r['price_usd']}")
