"""
Phone Number Pricing — Published rates from provider documentation.

Sources:
- Twilio: https://www.twilio.com/en-us/phone-numbers/pricing
- Azure: https://learn.microsoft.com/en-us/azure/communication-services/concepts/sms-pricing
- Telnyx, Plivo, Vonage: published pricing pages
"""


def fetch():
    """Return phone number pricing data."""
    numbers = []
    _id = 0

    def add(provider, iso, name, ntype, monthly, setup=0, sms=True, mms=False, link=""):
        nonlocal _id
        _id += 1
        numbers.append({
            "id": f"pn-{_id}",
            "provider": provider,
            "country_iso": iso,
            "country_name": name,
            "number_type": ntype,
            "monthly_cost_usd": monthly,
            "setup_fee_usd": setup,
            "sms_enabled": sms,
            "mms_enabled": mms,
            "link": link,
        })

    # ── Twilio ──
    tw = "https://www.twilio.com/en-us/phone-numbers/pricing"
    add("Twilio", "US", "United States", "local", 1.15, 0, True, True, tw)
    add("Twilio", "US", "United States", "toll-free", 2.15, 0, True, True, tw)
    add("Twilio", "US", "United States", "short-code", 1000, 650, True, False, tw)
    add("Twilio", "US", "United States", "10dlc", 1.15, 0, True, True, tw)
    add("Twilio", "GB", "United Kingdom", "local", 1.15, 0, True, False, tw)
    add("Twilio", "CA", "Canada", "local", 1.15, 0, True, True, tw)
    add("Twilio", "CA", "Canada", "toll-free", 2.15, 0, True, True, tw)
    add("Twilio", "AU", "Australia", "local", 4.50, 0, True, True, tw)
    add("Twilio", "DE", "Germany", "local", 1.15, 0, True, False, tw)

    # ── Azure ──
    az = "https://azure.microsoft.com/en-us/pricing/details/communication-services/"
    add("Azure", "US", "United States", "toll-free", 2, 0, True, False, az)
    add("Azure", "US", "United States", "10dlc", 1, 0, True, False, az)
    add("Azure", "US", "United States", "short-code", 1000, 650, True, False, az)
    add("Azure", "CA", "Canada", "toll-free", 2, 0, True, False, az)
    add("Azure", "GB", "United Kingdom", "local", 1.15, 0, True, False, az)
    add("Azure", "AU", "Australia", "local", 6.50, 0, True, False, az)
    add("Azure", "NL", "Netherlands", "local", 6, 0, True, False, az)
    add("Azure", "SE", "Sweden", "local", 3, 0, True, False, az)
    add("Azure", "PL", "Poland", "local", 4, 0, True, False, az)

    # ── Telnyx ──
    tx = "https://telnyx.com/pricing/numbers"
    add("Telnyx", "US", "United States", "local", 1, 0, True, True, tx)
    add("Telnyx", "US", "United States", "toll-free", 2, 0, True, True, tx)
    add("Telnyx", "GB", "United Kingdom", "local", 1.50, 0, True, False, tx)
    add("Telnyx", "CA", "Canada", "local", 1, 0, True, True, tx)
    add("Telnyx", "AU", "Australia", "local", 5, 0, True, False, tx)
    add("Telnyx", "DE", "Germany", "local", 2, 0, True, False, tx)

    # ── Plivo ──
    pl = "https://www.plivo.com/sms/pricing/"
    add("Plivo", "US", "United States", "local", 0.80, 0, True, True, pl)
    add("Plivo", "US", "United States", "toll-free", 1.50, 0, True, True, pl)
    add("Plivo", "GB", "United Kingdom", "local", 1, 0, True, False, pl)
    add("Plivo", "CA", "Canada", "local", 0.80, 0, True, True, pl)

    # ── Vonage ──
    vn = "https://www.vonage.com/communications-apis/sms/pricing/"
    add("Vonage", "US", "United States", "local", 1, 0, True, True, vn)
    add("Vonage", "US", "United States", "toll-free", 2, 0, True, False, vn)
    add("Vonage", "GB", "United Kingdom", "local", 1, 0, True, False, vn)

    # ── Bandwidth ──
    bw = "https://www.bandwidth.com/pricing/"
    add("Bandwidth", "US", "United States", "local", 0.35, 0, True, True, bw)
    add("Bandwidth", "US", "United States", "toll-free", 1, 0, True, True, bw)

    # ── Sinch ──
    si = "https://sinch.com/pricing/sms/"
    add("Sinch", "US", "United States", "local", 1, 0, True, True, si)
    add("Sinch", "US", "United States", "toll-free", 2, 0, True, True, si)

    print(f"  Phone numbers: {len(numbers)} entries")
    return numbers
