#!/usr/bin/env python3
"""Generate comprehensive SMS/messaging pricing mock data.

Adds new providers, MMS/WhatsApp/RCS channels, carrier surcharges,
phone number pricing, volume tiers, and 10DLC fees.
"""

import json
import random
from datetime import datetime, timezone

NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# ─── Provider metadata ───────────────────────────────────────────────

PROVIDERS = {
    "Twilio": "https://www.twilio.com/en-us/sms/pricing",
    "Vonage": "https://www.vonage.com/communications-apis/sms/pricing/",
    "MessageBird": "https://www.messagebird.com/en/pricing",
    "Telnyx": "https://telnyx.com/pricing/messaging",
    "Plivo": "https://www.plivo.com/sms/pricing/",
    "ClickSend": "https://www.clicksend.com/us/pricing",
    "Sinch": "https://www.sinch.com/pricing/messaging-prices/",
    "Infobip": "https://www.infobip.com/pricing",
    "Bandwidth": "https://www.bandwidth.com/messaging/pricing/",
    "Amazon SNS": "https://aws.amazon.com/sns/sms-pricing/",
    "Azure": "https://azure.microsoft.com/en-us/pricing/details/communication-services/",
    "Clickatell": "https://www.clickatell.com/pricing/",
    "Africa's Talking": "https://africastalking.com/sms",
}

# ─── Key countries with realistic base prices (outbound SMS, in USD) ─

# Format: { provider: { country_iso: base_price } }
# We define key countries explicitly, then fill others with multipliers

KEY_COUNTRIES = {
    "US": "United States",
    "GB": "United Kingdom",
    "CA": "Canada",
    "AU": "Australia",
    "DE": "Germany",
    "FR": "France",
    "IN": "India",
    "BR": "Brazil",
    "JP": "Japan",
    "NG": "Nigeria",
    "KE": "Kenya",
    "ZA": "South Africa",
    "MX": "Mexico",
    "PH": "Philippines",
    "ID": "Indonesia",
    "SG": "Singapore",
    "AE": "United Arab Emirates",
    "SA": "Saudi Arabia",
    "EG": "Egypt",
    "PK": "Pakistan",
    "TH": "Thailand",
    "VN": "Vietnam",
    "KR": "South Korea",
    "IT": "Italy",
    "ES": "Spain",
    "NL": "Netherlands",
    "SE": "Sweden",
    "PL": "Poland",
    "TR": "Turkey",
    "CO": "Colombia",
    "AR": "Argentina",
    "CL": "Chile",
    "PE": "Peru",
    "MY": "Malaysia",
    "TW": "Taiwan",
    "HK": "Hong Kong",
    "NZ": "New Zealand",
    "IE": "Ireland",
    "PT": "Portugal",
    "RO": "Romania",
}

# Realistic outbound SMS prices per provider per key country
SMS_PRICES = {
    "Twilio": {
        "US": 0.0079, "GB": 0.0420, "CA": 0.0075, "AU": 0.0560, "DE": 0.0730,
        "FR": 0.0690, "IN": 0.0022, "BR": 0.0617, "JP": 0.0780, "NG": 0.0513,
        "KE": 0.0326, "ZA": 0.0315, "MX": 0.0390, "PH": 0.0370, "ID": 0.0430,
        "SG": 0.0461, "AE": 0.0333, "SA": 0.0413, "EG": 0.0683, "PK": 0.0370,
        "TH": 0.0280, "VN": 0.0448, "KR": 0.0310, "IT": 0.0740, "ES": 0.0690,
        "NL": 0.0815, "SE": 0.0570, "PL": 0.0351, "TR": 0.0170, "CO": 0.0385,
        "AR": 0.0505, "CL": 0.0445, "PE": 0.0430, "MY": 0.0360, "TW": 0.0490,
        "HK": 0.0453, "NZ": 0.0590, "IE": 0.0610, "PT": 0.0437, "RO": 0.0430,
    },
    "Vonage": {
        "US": 0.0068, "GB": 0.0395, "CA": 0.0070, "AU": 0.0520, "DE": 0.0680,
        "FR": 0.0650, "IN": 0.0019, "BR": 0.0580, "JP": 0.0720, "NG": 0.0480,
        "KE": 0.0290, "ZA": 0.0295, "MX": 0.0360, "PH": 0.0340, "ID": 0.0400,
        "SG": 0.0430, "AE": 0.0310, "SA": 0.0390, "EG": 0.0640, "PK": 0.0340,
        "TH": 0.0260, "VN": 0.0410, "KR": 0.0290, "IT": 0.0700, "ES": 0.0650,
        "NL": 0.0780, "SE": 0.0540, "PL": 0.0330, "TR": 0.0155, "CO": 0.0360,
        "AR": 0.0480, "CL": 0.0420, "PE": 0.0400, "MY": 0.0330, "TW": 0.0460,
        "HK": 0.0420, "NZ": 0.0550, "IE": 0.0580, "PT": 0.0410, "RO": 0.0400,
    },
    "Telnyx": {
        "US": 0.0040, "GB": 0.0310, "CA": 0.0045, "AU": 0.0400, "DE": 0.0550,
        "FR": 0.0520, "IN": 0.0015, "BR": 0.0450, "JP": 0.0580, "NG": 0.0370,
        "KE": 0.0240, "ZA": 0.0230, "MX": 0.0280, "PH": 0.0270, "ID": 0.0320,
        "SG": 0.0350, "AE": 0.0250, "SA": 0.0310, "EG": 0.0510, "PK": 0.0270,
        "TH": 0.0210, "VN": 0.0330, "KR": 0.0230, "IT": 0.0560, "ES": 0.0520,
        "NL": 0.0620, "SE": 0.0430, "PL": 0.0260, "TR": 0.0125, "CO": 0.0280,
        "AR": 0.0380, "CL": 0.0330, "PE": 0.0320, "MY": 0.0260, "TW": 0.0370,
        "HK": 0.0340, "NZ": 0.0440, "IE": 0.0460, "PT": 0.0330, "RO": 0.0320,
    },
    "Plivo": {
        "US": 0.0050, "GB": 0.0350, "CA": 0.0050, "AU": 0.0450, "DE": 0.0600,
        "FR": 0.0560, "IN": 0.0017, "BR": 0.0500, "JP": 0.0630, "NG": 0.0410,
        "KE": 0.0260, "ZA": 0.0260, "MX": 0.0310, "PH": 0.0300, "ID": 0.0350,
        "SG": 0.0380, "AE": 0.0280, "SA": 0.0340, "EG": 0.0560, "PK": 0.0300,
        "TH": 0.0230, "VN": 0.0360, "KR": 0.0260, "IT": 0.0610, "ES": 0.0570,
        "NL": 0.0680, "SE": 0.0470, "PL": 0.0290, "TR": 0.0140, "CO": 0.0310,
        "AR": 0.0420, "CL": 0.0360, "PE": 0.0350, "MY": 0.0290, "TW": 0.0400,
        "HK": 0.0370, "NZ": 0.0480, "IE": 0.0500, "PT": 0.0360, "RO": 0.0350,
    },
    "Sinch": {
        "US": 0.0062, "GB": 0.0380, "CA": 0.0060, "AU": 0.0500, "DE": 0.0660,
        "FR": 0.0630, "IN": 0.0020, "BR": 0.0550, "JP": 0.0700, "NG": 0.0460,
        "KE": 0.0280, "ZA": 0.0280, "MX": 0.0340, "PH": 0.0330, "ID": 0.0380,
        "SG": 0.0410, "AE": 0.0300, "SA": 0.0370, "EG": 0.0620, "PK": 0.0320,
        "TH": 0.0250, "VN": 0.0390, "KR": 0.0280, "IT": 0.0680, "ES": 0.0630,
        "NL": 0.0760, "SE": 0.0510, "PL": 0.0320, "TR": 0.0150, "CO": 0.0340,
        "AR": 0.0460, "CL": 0.0400, "PE": 0.0380, "MY": 0.0320, "TW": 0.0430,
        "HK": 0.0400, "NZ": 0.0530, "IE": 0.0550, "PT": 0.0390, "RO": 0.0380,
    },
    "ClickSend": {
        "US": 0.0069, "GB": 0.0400, "CA": 0.0072, "AU": 0.0530, "DE": 0.0700,
        "FR": 0.0670, "IN": 0.0025, "BR": 0.0590, "JP": 0.0750, "NG": 0.0490,
        "KE": 0.0310, "ZA": 0.0300, "MX": 0.0370, "PH": 0.0360, "ID": 0.0410,
        "SG": 0.0450, "AE": 0.0320, "SA": 0.0400, "EG": 0.0660, "PK": 0.0350,
        "TH": 0.0270, "VN": 0.0430, "KR": 0.0300, "IT": 0.0720, "ES": 0.0670,
        "NL": 0.0800, "SE": 0.0550, "PL": 0.0340, "TR": 0.0165, "CO": 0.0370,
        "AR": 0.0490, "CL": 0.0430, "PE": 0.0410, "MY": 0.0350, "TW": 0.0470,
        "HK": 0.0440, "NZ": 0.0570, "IE": 0.0590, "PT": 0.0420, "RO": 0.0410,
    },
    "Infobip": {
        "US": 0.0055, "GB": 0.0360, "CA": 0.0058, "AU": 0.0470, "DE": 0.0620,
        "FR": 0.0590, "IN": 0.0018, "BR": 0.0520, "JP": 0.0660, "NG": 0.0430,
        "KE": 0.0270, "ZA": 0.0270, "MX": 0.0330, "PH": 0.0310, "ID": 0.0360,
        "SG": 0.0390, "AE": 0.0290, "SA": 0.0350, "EG": 0.0580, "PK": 0.0310,
        "TH": 0.0240, "VN": 0.0380, "KR": 0.0270, "IT": 0.0650, "ES": 0.0600,
        "NL": 0.0720, "SE": 0.0490, "PL": 0.0310, "TR": 0.0145, "CO": 0.0330,
        "AR": 0.0440, "CL": 0.0380, "PE": 0.0370, "MY": 0.0310, "TW": 0.0420,
        "HK": 0.0390, "NZ": 0.0510, "IE": 0.0530, "PT": 0.0380, "RO": 0.0370,
    },
    "MessageBird": {
        "US": 0.0070, "GB": 0.0410, "CA": 0.0072, "AU": 0.0540, "DE": 0.0710,
        "FR": 0.0680, "IN": 0.0023, "BR": 0.0600, "JP": 0.0740, "NG": 0.0500,
        "KE": 0.0300, "ZA": 0.0310, "MX": 0.0380, "PH": 0.0350, "ID": 0.0420,
        "SG": 0.0440, "AE": 0.0330, "SA": 0.0410, "EG": 0.0670, "PK": 0.0360,
        "TH": 0.0270, "VN": 0.0440, "KR": 0.0310, "IT": 0.0730, "ES": 0.0680,
        "NL": 0.0790, "SE": 0.0560, "PL": 0.0340, "TR": 0.0160, "CO": 0.0380,
        "AR": 0.0500, "CL": 0.0440, "PE": 0.0420, "MY": 0.0340, "TW": 0.0480,
        "HK": 0.0450, "NZ": 0.0580, "IE": 0.0600, "PT": 0.0430, "RO": 0.0420,
    },
    "Bandwidth": {
        "US": 0.0040, "CA": 0.0048,
    },
    "Amazon SNS": {
        "US": 0.00645, "GB": 0.0380, "CA": 0.00645, "AU": 0.0510, "DE": 0.0720,
        "FR": 0.0660, "IN": 0.0018, "BR": 0.0560, "JP": 0.0690, "NG": 0.0470,
        "KE": 0.0290, "ZA": 0.0290, "MX": 0.0350, "PH": 0.0330, "ID": 0.0390,
        "SG": 0.0410, "AE": 0.0300, "SA": 0.0370, "EG": 0.0610, "PK": 0.0330,
        "TH": 0.0250, "VN": 0.0400, "KR": 0.0280, "IT": 0.0690, "ES": 0.0640,
        "NL": 0.0760, "SE": 0.0520, "PL": 0.0320, "TR": 0.0155, "CO": 0.0350,
        "AR": 0.0470, "CL": 0.0410, "PE": 0.0390, "MY": 0.0320, "TW": 0.0450,
        "HK": 0.0420, "NZ": 0.0540, "IE": 0.0560, "PT": 0.0400, "RO": 0.0390,
    },
    "Azure": {
        "US": 0.0075, "GB": 0.0400, "CA": 0.0075, "AU": 0.0520, "DE": 0.0700,
        "FR": 0.0670, "IN": 0.0020, "BR": 0.0580, "JP": 0.0730, "NG": 0.0490,
        "KE": 0.0300, "ZA": 0.0300, "MX": 0.0370, "PH": 0.0350, "ID": 0.0400,
        "SG": 0.0430, "AE": 0.0320, "SA": 0.0390, "EG": 0.0650, "PK": 0.0350,
        "TH": 0.0260, "VN": 0.0420, "KR": 0.0290, "IT": 0.0720, "ES": 0.0670,
        "NL": 0.0780, "SE": 0.0540, "PL": 0.0340, "TR": 0.0160, "CO": 0.0370,
        "AR": 0.0490, "CL": 0.0430, "PE": 0.0410, "MY": 0.0340, "TW": 0.0470,
        "HK": 0.0440, "NZ": 0.0560, "IE": 0.0580, "PT": 0.0420, "RO": 0.0400,
    },
    "Clickatell": {
        "US": 0.0080, "GB": 0.0450, "CA": 0.0080, "AU": 0.0580, "DE": 0.0750,
        "FR": 0.0710, "IN": 0.0028, "BR": 0.0640, "JP": 0.0800, "NG": 0.0350,
        "KE": 0.0200, "ZA": 0.0180, "MX": 0.0400, "PH": 0.0380, "ID": 0.0440,
        "SG": 0.0470, "AE": 0.0350, "SA": 0.0430, "EG": 0.0550, "PK": 0.0370,
        "TH": 0.0290, "VN": 0.0460, "KR": 0.0330, "IT": 0.0760, "ES": 0.0710,
        "NL": 0.0840, "SE": 0.0580, "PL": 0.0370, "TR": 0.0180, "CO": 0.0390,
        "AR": 0.0520, "CL": 0.0460, "PE": 0.0440, "MY": 0.0360, "TW": 0.0500,
        "HK": 0.0470, "NZ": 0.0600, "IE": 0.0630, "PT": 0.0450, "RO": 0.0440,
    },
    "Africa's Talking": {
        "NG": 0.0280, "KE": 0.0150, "ZA": 0.0160, "GH": 0.0200,
        "UG": 0.0180, "TZ": 0.0170, "RW": 0.0190, "ET": 0.0220,
        "SN": 0.0210, "CI": 0.0230,
    },
}

# ─── Carrier surcharges (US only for now) ────────────────────────────

US_CARRIER_SURCHARGES = {
    "Twilio": 0.003,
    "Vonage": 0.0025,
    "Telnyx": 0.003,
    "Plivo": 0.003,
    "Sinch": 0.0028,
    "ClickSend": 0.003,
    "Infobip": 0.003,
    "MessageBird": 0.003,
    "Bandwidth": 0.003,
    "Amazon SNS": 0.0,  # included in base price
    "Azure": 0.003,
    "Clickatell": 0.003,
}

# ─── Verify prices (only some providers/countries) ───────────────────

VERIFY_PRICES = {
    "Twilio": {"US": 0.05, "GB": 0.09, "CA": 0.05, "AU": 0.10, "DE": 0.12, "FR": 0.11, "IN": 0.05, "BR": 0.10, "JP": 0.13},
    "Vonage": {"US": 0.0572, "GB": 0.0920, "CA": 0.0572, "AU": 0.1050, "DE": 0.1100, "FR": 0.1050, "IN": 0.0440, "BR": 0.0950, "JP": 0.1200},
    "Sinch": {"US": 0.0550, "GB": 0.0850, "CA": 0.0550, "AU": 0.0980, "DE": 0.1050, "IN": 0.0500, "BR": 0.0900},
    "Infobip": {"US": 0.0480, "GB": 0.0800, "CA": 0.0480, "AU": 0.0900, "DE": 0.0980, "IN": 0.0420, "BR": 0.0850},
}

# ─── MMS prices (providers that support MMS, key countries) ──────────

MMS_PROVIDERS = {
    "Twilio": {
        "US": 0.0200, "CA": 0.0200, "GB": 0.0700, "AU": 0.0800,
    },
    "Vonage": {
        "US": 0.0180, "CA": 0.0180,
    },
    "Telnyx": {
        "US": 0.0100, "CA": 0.0120,
    },
    "Plivo": {
        "US": 0.0160, "CA": 0.0160,
    },
    "Sinch": {
        "US": 0.0190, "CA": 0.0190,
    },
    "Bandwidth": {
        "US": 0.0100, "CA": 0.0100,
    },
    "ClickSend": {
        "US": 0.0350, "CA": 0.0350, "AU": 0.0900,
    },
}

# ─── WhatsApp Business API prices ────────────────────────────────────
# Prices are per-conversation (authentication type, roughly equiv to per-message for OTP)

WHATSAPP_PROVIDERS = {
    "Twilio": {
        "US": 0.0135, "GB": 0.0309, "CA": 0.0135, "AU": 0.0388, "DE": 0.0629,
        "FR": 0.0595, "IN": 0.0042, "BR": 0.0300, "JP": 0.0585, "NG": 0.0319,
        "MX": 0.0265, "ID": 0.0300, "SG": 0.0365, "SA": 0.0211, "EG": 0.0559,
        "ZA": 0.0209, "KE": 0.0199, "PH": 0.0199, "PK": 0.0199, "CO": 0.0199,
    },
    "Vonage": {
        "US": 0.0140, "GB": 0.0315, "CA": 0.0140, "AU": 0.0395, "DE": 0.0635,
        "FR": 0.0600, "IN": 0.0045, "BR": 0.0310, "JP": 0.0590, "NG": 0.0325,
        "MX": 0.0270, "ID": 0.0305, "SG": 0.0370,
    },
    "MessageBird": {
        "US": 0.0145, "GB": 0.0320, "CA": 0.0145, "AU": 0.0400, "DE": 0.0640,
        "FR": 0.0610, "IN": 0.0048, "BR": 0.0320, "JP": 0.0600, "NG": 0.0330,
        "MX": 0.0275, "ID": 0.0310, "SG": 0.0375,
    },
    "Infobip": {
        "US": 0.0130, "GB": 0.0300, "CA": 0.0130, "AU": 0.0380, "DE": 0.0620,
        "FR": 0.0585, "IN": 0.0040, "BR": 0.0290, "JP": 0.0580, "NG": 0.0310,
        "MX": 0.0260, "ID": 0.0295, "SG": 0.0360, "SA": 0.0205, "EG": 0.0550,
        "ZA": 0.0200, "KE": 0.0190, "PH": 0.0190, "PK": 0.0190,
    },
    "Sinch": {
        "US": 0.0138, "GB": 0.0310, "CA": 0.0138, "AU": 0.0390, "DE": 0.0630,
        "FR": 0.0595, "IN": 0.0043, "BR": 0.0305, "JP": 0.0585, "NG": 0.0320,
        "MX": 0.0265, "ID": 0.0300,
    },
}

# ─── RCS prices (limited availability) ──────────────────────────────

RCS_PROVIDERS = {
    "Sinch": {
        "US": 0.0100, "GB": 0.0250, "BR": 0.0200, "IN": 0.0035, "MX": 0.0180,
    },
    "Infobip": {
        "US": 0.0110, "GB": 0.0260, "BR": 0.0210, "IN": 0.0038, "MX": 0.0190,
    },
    "Twilio": {
        "US": 0.0120, "GB": 0.0280, "BR": 0.0220, "IN": 0.0040,
    },
}

# ─── Phone number pricing ────────────────────────────────────────────

PHONE_NUMBER_PRICES = []

def slug(name):
    return name.lower().replace(' ', '-').replace("'", '')

# US phone numbers
for provider, local, tf, sc, dlc in [
    ("Twilio",      1.15, 2.15, 1000.0, 2.00),
    ("Vonage",      0.90, 1.50, 1000.0, 1.00),
    ("Telnyx",      1.00, 2.00,    0.0, 1.50),
    ("Plivo",       0.80, 1.50,    0.0, 1.00),
    ("Sinch",       1.10, 2.00, 1200.0, 2.00),
    ("ClickSend",   1.50, 2.50,    0.0, 0.00),
    ("Infobip",     1.20, 2.00, 1100.0, 1.50),
    ("Bandwidth",   0.75, 1.25, 1000.0, 1.00),
    ("Azure",       2.00, 3.00,    0.0, 0.00),
    ("MessageBird", 1.30, 2.20,    0.0, 0.00),
]:
    if local > 0:
        PHONE_NUMBER_PRICES.append({
            "id": f"{slug(provider)}-us-local",
            "provider": provider, "country_iso": "US", "country_name": "United States",
            "number_type": "local", "monthly_cost_usd": local, "setup_fee_usd": 0,
            "sms_enabled": True, "mms_enabled": provider not in ("Amazon SNS", "Azure"),
            "link": PROVIDERS[provider],
        })
    if tf > 0:
        PHONE_NUMBER_PRICES.append({
            "id": f"{slug(provider)}-us-tf",
            "provider": provider, "country_iso": "US", "country_name": "United States",
            "number_type": "toll-free", "monthly_cost_usd": tf, "setup_fee_usd": 0,
            "sms_enabled": True, "mms_enabled": provider not in ("Amazon SNS", "Azure"),
            "link": PROVIDERS[provider],
        })
    if sc > 0:
        PHONE_NUMBER_PRICES.append({
            "id": f"{slug(provider)}-us-sc",
            "provider": provider, "country_iso": "US", "country_name": "United States",
            "number_type": "short-code", "monthly_cost_usd": sc, "setup_fee_usd": 0,
            "sms_enabled": True, "mms_enabled": False,
            "link": PROVIDERS[provider],
        })
    if dlc > 0:
        PHONE_NUMBER_PRICES.append({
            "id": f"{slug(provider)}-us-10dlc",
            "provider": provider, "country_iso": "US", "country_name": "United States",
            "number_type": "10dlc", "monthly_cost_usd": dlc, "setup_fee_usd": 0,
            "sms_enabled": True, "mms_enabled": True,
            "link": PROVIDERS[provider],
        })

# UK phone numbers
for provider, local, tf in [
    ("Twilio", 1.15, 2.15), ("Vonage", 0.80, 1.30), ("Telnyx", 0.90, 1.50),
    ("Plivo", 0.85, 1.40), ("Sinch", 1.00, 1.80), ("Infobip", 1.10, 1.70),
    ("MessageBird", 1.20, 2.00), ("ClickSend", 1.30, 2.10),
]:
    PHONE_NUMBER_PRICES.append({
        "id": f"{slug(provider)}-gb-local",
        "provider": provider, "country_iso": "GB", "country_name": "United Kingdom",
        "number_type": "local", "monthly_cost_usd": local, "setup_fee_usd": 0,
        "sms_enabled": True, "mms_enabled": False, "link": PROVIDERS[provider],
    })
    PHONE_NUMBER_PRICES.append({
        "id": f"{slug(provider)}-gb-tf",
        "provider": provider, "country_iso": "GB", "country_name": "United Kingdom",
        "number_type": "toll-free", "monthly_cost_usd": tf, "setup_fee_usd": 0,
        "sms_enabled": True, "mms_enabled": False, "link": PROVIDERS[provider],
    })

# CA, AU, DE phone numbers (subset of providers)
for iso, name, providers_prices in [
    ("CA", "Canada", [("Twilio", 1.15), ("Vonage", 0.95), ("Telnyx", 1.00), ("Plivo", 0.80), ("Bandwidth", 0.75)]),
    ("AU", "Australia", [("Twilio", 4.50), ("Vonage", 3.00), ("Telnyx", 3.50), ("Sinch", 4.00)]),
    ("DE", "Germany", [("Twilio", 1.80), ("Vonage", 1.50), ("Telnyx", 1.30), ("Sinch", 1.70), ("Infobip", 1.60)]),
]:
    for provider, monthly in providers_prices:
        PHONE_NUMBER_PRICES.append({
            "id": f"{slug(provider)}-{iso.lower()}-local",
            "provider": provider, "country_iso": iso, "country_name": name,
            "number_type": "local", "monthly_cost_usd": monthly, "setup_fee_usd": 0,
            "sms_enabled": True, "mms_enabled": False, "link": PROVIDERS[provider],
        })

# ─── Volume tier pricing ─────────────────────────────────────────────

VOLUME_TIERS = [
    {
        "id": "twilio-vol",
        "provider": "Twilio",
        "tiers": [
            {"min_messages": 0, "max_messages": 150000, "price_per_message_usd": 0.0079, "discount_pct": 0},
            {"min_messages": 150001, "max_messages": 500000, "price_per_message_usd": 0.0075, "discount_pct": 5},
            {"min_messages": 500001, "max_messages": 2000000, "price_per_message_usd": 0.0065, "discount_pct": 18},
            {"min_messages": 2000001, "max_messages": 5000000, "price_per_message_usd": 0.0055, "discount_pct": 30},
            {"min_messages": 5000001, "max_messages": None, "price_per_message_usd": 0.0045, "discount_pct": 43},
        ],
    },
    {
        "id": "vonage-vol",
        "provider": "Vonage",
        "tiers": [
            {"min_messages": 0, "max_messages": 100000, "price_per_message_usd": 0.0068, "discount_pct": 0},
            {"min_messages": 100001, "max_messages": 500000, "price_per_message_usd": 0.0060, "discount_pct": 12},
            {"min_messages": 500001, "max_messages": 2000000, "price_per_message_usd": 0.0050, "discount_pct": 26},
            {"min_messages": 2000001, "max_messages": None, "price_per_message_usd": 0.0042, "discount_pct": 38},
        ],
    },
    {
        "id": "telnyx-vol",
        "provider": "Telnyx",
        "tiers": [
            {"min_messages": 0, "max_messages": 100000, "price_per_message_usd": 0.0040, "discount_pct": 0},
            {"min_messages": 100001, "max_messages": 1000000, "price_per_message_usd": 0.0035, "discount_pct": 13},
            {"min_messages": 1000001, "max_messages": None, "price_per_message_usd": 0.0028, "discount_pct": 30},
        ],
    },
    {
        "id": "plivo-vol",
        "provider": "Plivo",
        "tiers": [
            {"min_messages": 0, "max_messages": 200000, "price_per_message_usd": 0.0050, "discount_pct": 0},
            {"min_messages": 200001, "max_messages": 1000000, "price_per_message_usd": 0.0043, "discount_pct": 14},
            {"min_messages": 1000001, "max_messages": None, "price_per_message_usd": 0.0035, "discount_pct": 30},
        ],
    },
    {
        "id": "sinch-vol",
        "provider": "Sinch",
        "tiers": [
            {"min_messages": 0, "max_messages": 100000, "price_per_message_usd": 0.0062, "discount_pct": 0},
            {"min_messages": 100001, "max_messages": 500000, "price_per_message_usd": 0.0055, "discount_pct": 11},
            {"min_messages": 500001, "max_messages": None, "price_per_message_usd": 0.0045, "discount_pct": 27},
        ],
    },
    {
        "id": "clicksend-vol",
        "provider": "ClickSend",
        "tiers": [
            {"min_messages": 0, "max_messages": 25000, "price_per_message_usd": 0.0069, "discount_pct": 0},
            {"min_messages": 25001, "max_messages": 100000, "price_per_message_usd": 0.0059, "discount_pct": 14},
            {"min_messages": 100001, "max_messages": 500000, "price_per_message_usd": 0.0049, "discount_pct": 29},
            {"min_messages": 500001, "max_messages": None, "price_per_message_usd": 0.0042, "discount_pct": 39},
        ],
    },
    {
        "id": "infobip-vol",
        "provider": "Infobip",
        "tiers": [
            {"min_messages": 0, "max_messages": 100000, "price_per_message_usd": 0.0055, "discount_pct": 0},
            {"min_messages": 100001, "max_messages": 500000, "price_per_message_usd": 0.0048, "discount_pct": 13},
            {"min_messages": 500001, "max_messages": None, "price_per_message_usd": 0.0040, "discount_pct": 27},
        ],
    },
    {
        "id": "bandwidth-vol",
        "provider": "Bandwidth",
        "tiers": [
            {"min_messages": 0, "max_messages": 100000, "price_per_message_usd": 0.0040, "discount_pct": 0},
            {"min_messages": 100001, "max_messages": 1000000, "price_per_message_usd": 0.0033, "discount_pct": 18},
            {"min_messages": 1000001, "max_messages": None, "price_per_message_usd": 0.0025, "discount_pct": 38},
        ],
    },
]

# ─── 10DLC fees ──────────────────────────────────────────────────────

TEN_DLC_FEES = [
    {"provider": "Twilio", "brand_registration_usd": 4.0, "campaign_registration_usd": 15.0, "monthly_campaign_fee_usd": 2.0, "link": PROVIDERS["Twilio"]},
    {"provider": "Vonage", "brand_registration_usd": 4.0, "campaign_registration_usd": 10.0, "monthly_campaign_fee_usd": 1.0, "link": PROVIDERS["Vonage"]},
    {"provider": "Telnyx", "brand_registration_usd": 4.0, "campaign_registration_usd": 10.0, "monthly_campaign_fee_usd": 1.50, "link": PROVIDERS["Telnyx"]},
    {"provider": "Plivo", "brand_registration_usd": 4.0, "campaign_registration_usd": 10.0, "monthly_campaign_fee_usd": 1.0, "link": PROVIDERS["Plivo"]},
    {"provider": "Sinch", "brand_registration_usd": 4.0, "campaign_registration_usd": 12.0, "monthly_campaign_fee_usd": 2.0, "link": PROVIDERS["Sinch"]},
    {"provider": "Bandwidth", "brand_registration_usd": 4.0, "campaign_registration_usd": 8.0, "monthly_campaign_fee_usd": 1.0, "link": PROVIDERS["Bandwidth"]},
    {"provider": "Infobip", "brand_registration_usd": 4.0, "campaign_registration_usd": 10.0, "monthly_campaign_fee_usd": 1.50, "link": PROVIDERS["Infobip"]},
    {"provider": "ClickSend", "brand_registration_usd": 4.0, "campaign_registration_usd": 10.0, "monthly_campaign_fee_usd": 2.0, "link": PROVIDERS["ClickSend"]},
]

# ─── All countries for full coverage ─────────────────────────────────

ALL_COUNTRIES = {
    "AF": "Afghanistan", "AL": "Albania", "DZ": "Algeria", "AS": "American Samoa",
    "AD": "Andorra", "AO": "Angola", "AI": "Anguilla", "AG": "Antigua and Barbuda",
    "AM": "Armenia", "AW": "Aruba", "AT": "Austria", "AZ": "Azerbaijan",
    "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados",
    "BY": "Belarus", "BE": "Belgium", "BZ": "Belize", "BJ": "Benin",
    "BM": "Bermuda", "BT": "Bhutan", "BO": "Bolivia", "BA": "Bosnia and Herzegovina",
    "BW": "Botswana", "BN": "Brunei", "BG": "Bulgaria", "BF": "Burkina Faso",
    "BI": "Burundi", "KH": "Cambodia", "CM": "Cameroon", "CV": "Cape Verde",
    "KY": "Cayman Islands", "CF": "Central Africa", "TD": "Chad",
    "KM": "Comoros", "CG": "Congo", "CK": "Cook Islands", "CR": "Costa Rica",
    "HR": "Croatia", "CY": "Cyprus", "CZ": "Czech Republic", "CD": "DR Congo",
    "DK": "Denmark", "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic",
    "TL": "East Timor", "EC": "Ecuador", "SV": "El Salvador", "GQ": "Equatorial Guinea",
    "ER": "Eritrea", "EE": "Estonia", "ET": "Ethiopia", "FK": "Falkland Islands",
    "FO": "Faroe Islands", "FJ": "Fiji", "FI": "Finland", "GF": "French Guiana",
    "PF": "French Polynesia", "GA": "Gabon", "GM": "Gambia", "GE": "Georgia",
    "GH": "Ghana", "GI": "Gibraltar", "GR": "Greece", "GL": "Greenland",
    "GD": "Grenada", "GP": "Guadeloupe", "GU": "Guam", "GT": "Guatemala",
    "GN": "Guinea", "GW": "Guinea-Bissau", "GY": "Guyana", "HT": "Haiti",
    "HN": "Honduras", "HU": "Hungary", "IS": "Iceland",
    "IQ": "Iraq", "IL": "Israel", "CI": "Ivory Coast",
    "JM": "Jamaica", "JO": "Jordan", "KZ": "Kazakhstan",
    "KI": "Kiribati", "KW": "Kuwait", "KG": "Kyrgyzstan",
    "LA": "Laos", "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho",
    "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania",
    "LU": "Luxembourg", "MO": "Macao", "MK": "North Macedonia", "MG": "Madagascar",
    "MW": "Malawi", "MV": "Maldives", "ML": "Mali", "MT": "Malta",
    "MH": "Marshall Islands", "MQ": "Martinique", "MR": "Mauritania", "MU": "Mauritius",
    "FM": "Micronesia", "MD": "Moldova", "MC": "Monaco", "MN": "Mongolia",
    "ME": "Montenegro", "MS": "Montserrat", "MA": "Morocco", "MZ": "Mozambique",
    "MM": "Myanmar", "NA": "Namibia", "NP": "Nepal", "NC": "New Caledonia",
    "NI": "Nicaragua", "NE": "Niger", "NU": "Niue", "NF": "Norfolk Island",
    "NO": "Norway", "OM": "Oman", "PW": "Palau", "PS": "Palestine",
    "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay",
    "PR": "Puerto Rico", "QA": "Qatar", "RE": "Reunion",
    "RU": "Russia", "RW": "Rwanda", "WS": "Samoa", "SM": "San Marino",
    "ST": "Sao Tome and Principe", "SN": "Senegal", "RS": "Serbia",
    "SC": "Seychelles", "SL": "Sierra Leone", "SK": "Slovakia", "SI": "Slovenia",
    "SB": "Solomon Islands", "SO": "Somalia", "SS": "South Sudan",
    "LK": "Sri Lanka", "KN": "St Kitts and Nevis", "LC": "St Lucia",
    "PM": "St Pierre and Miquelon", "VC": "St Vincent Grenadines",
    "SD": "Sudan", "SR": "Suriname", "SZ": "Eswatini",
    "TJ": "Tajikistan", "TZ": "Tanzania", "TG": "Togo", "TO": "Tonga",
    "TT": "Trinidad and Tobago", "TN": "Tunisia", "TM": "Turkmenistan",
    "TC": "Turks and Caicos Islands", "TV": "Tuvalu", "UG": "Uganda",
    "UA": "Ukraine", "UY": "Uruguay", "UZ": "Uzbekistan",
    "VU": "Vanuatu", "VE": "Venezuela", "VG": "Virgin Islands, British",
    "VI": "Virgin Islands, U.S.", "WF": "Wallis and Futuna",
    "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe",
    "AC": "Ascension Island",
}

# Regional price multiplier relative to US price
REGION_MULTIPLIERS = {
    # Europe (expensive)
    "AT": 8.5, "BE": 8.0, "BG": 4.0, "HR": 5.0, "CY": 6.5, "CZ": 5.5,
    "DK": 7.5, "EE": 5.0, "FI": 7.0, "GR": 6.5, "HU": 5.0, "IS": 8.0,
    "LV": 5.0, "LT": 5.0, "LU": 8.5, "MT": 6.0, "NO": 7.5, "SK": 5.0,
    "SI": 6.0, "CH": 8.5, "RS": 4.5, "ME": 5.0, "BA": 5.0, "MK": 4.5,
    "AL": 4.5, "MD": 3.5, "UA": 3.0, "BY": 4.0, "GE": 4.0, "AM": 4.0,
    "AZ": 5.0, "RU": 3.0, "LI": 8.0, "MC": 8.5, "SM": 7.0, "AD": 7.0,
    "GI": 6.0, "FO": 7.0, "GL": 8.0,
    # Middle East
    "BH": 3.5, "IQ": 5.0, "JO": 4.0, "KW": 3.5, "LB": 4.5,
    "OM": 3.5, "QA": 3.0, "IL": 4.0, "PS": 4.5, "YE": 4.5,
    # South Asia
    "BD": 2.0, "LK": 3.0, "NP": 2.5, "PK": 4.5, "MV": 3.0, "BT": 4.0,
    # Southeast Asia
    "KH": 3.5, "LA": 4.0, "MM": 4.5, "BN": 2.5,
    # East Asia
    "TW": 6.0, "MN": 5.0, "MO": 4.0,
    # Africa
    "DZ": 6.0, "AO": 3.5, "BJ": 4.5, "BW": 3.0, "BF": 4.5,
    "BI": 5.0, "CM": 4.0, "CV": 5.0, "CF": 5.5, "TD": 5.5,
    "CD": 5.5, "CG": 5.0, "CI": 4.5, "DJ": 5.0, "GQ": 6.0,
    "ER": 5.5, "ET": 3.5, "GA": 5.0, "GM": 4.0, "GH": 3.0,
    "GN": 4.5, "GW": 5.0, "LR": 4.5, "LY": 6.0, "MG": 4.5,
    "MW": 4.5, "ML": 4.5, "MR": 5.0, "MU": 4.0, "MA": 5.0,
    "MZ": 4.0, "NA": 3.5, "NE": 5.0, "RW": 3.5, "ST": 5.5,
    "SN": 4.0, "SC": 5.0, "SL": 4.5, "SO": 5.5, "SS": 6.0,
    "SD": 5.0, "SZ": 3.5, "TZ": 3.0, "TG": 4.5, "TN": 5.0,
    "UG": 3.0, "ZM": 3.5, "ZW": 4.0,
    # Caribbean
    "AI": 4.0, "AG": 4.0, "AW": 4.5, "BS": 4.0, "BB": 4.0,
    "BZ": 4.0, "BM": 4.0, "KY": 4.0, "DM": 4.5, "DO": 3.5,
    "GD": 4.5, "GP": 5.0, "GF": 5.0, "HT": 5.0, "JM": 4.0,
    "MQ": 5.0, "MS": 4.5, "PR": 1.5, "KN": 4.5, "LC": 4.5,
    "PM": 5.0, "VC": 4.5, "TT": 3.5, "TC": 4.0, "VI": 1.5,
    "VG": 4.0,
    # Latin America
    "BO": 4.5, "CR": 4.0, "EC": 4.5, "SV": 4.0, "GT": 4.0,
    "GY": 4.5, "HN": 4.0, "NI": 4.0, "PA": 3.5, "PY": 4.0,
    "SR": 5.0, "UY": 4.0, "VE": 5.0,
    # Pacific
    "AS": 4.0, "CK": 6.0, "FJ": 5.0, "PF": 6.0, "GU": 2.0,
    "KI": 7.0, "MH": 6.0, "FM": 6.0, "NC": 6.0, "NU": 7.0,
    "NF": 6.0, "PW": 6.0, "PG": 5.0, "WS": 5.5, "SB": 6.0,
    "TO": 5.5, "TV": 7.0, "VU": 5.5, "WF": 6.0,
    # Other
    "AF": 5.0, "FK": 7.0, "KG": 4.0, "TJ": 4.5, "TM": 5.0, "UZ": 4.0,
    "KZ": 4.0, "AC": 8.0, "RE": 5.0, "KM": 6.0,
}

# Global providers that cover most countries (Bandwidth/AT only cover limited markets)
GLOBAL_PROVIDERS = ["Twilio", "Vonage", "Telnyx", "Plivo", "Sinch", "ClickSend",
                    "Infobip", "MessageBird", "Amazon SNS", "Azure", "Clickatell"]

# ─── Generate records ────────────────────────────────────────────────

def gen_id(provider, iso, direction, msg_type):
    s = slug(provider)
    d = 'out' if direction == 'outbound' else 'inb'
    return f"{s}-{iso.lower()}-{d}-{msg_type}"


def generate_all():
    records = []

    # 1. SMS records (outbound + inbound) for all provider/country combos
    for provider, countries in SMS_PRICES.items():
        for iso, price in countries.items():
            name = KEY_COUNTRIES.get(iso, iso)
            surcharge = US_CARRIER_SURCHARGES.get(provider) if iso == "US" else None
            total = price + (surcharge or 0)
            verify = VERIFY_PRICES.get(provider, {}).get(iso)

            # Outbound
            records.append({
                "id": gen_id(provider, iso, "outbound", "sms"),
                "provider": provider,
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
                "carrier_surcharge_usd": surcharge,
                "total_price_usd": round(total, 6),
                "verify_price_usd": verify,
                "link": PROVIDERS[provider],
                "last_updated": NOW,
            })

            # Inbound (typically cheaper — ~60-80% of outbound, not all countries)
            if iso in ("US", "GB", "CA", "AU", "DE", "FR", "IN", "BR", "JP", "MX",
                       "SG", "NL", "SE", "IE", "NZ", "IT", "ES", "PL", "HK", "KR"):
                inb_price = round(price * random.uniform(0.55, 0.80), 6)
                records.append({
                    "id": gen_id(provider, iso, "inbound", "sms"),
                    "provider": provider,
                    "country_iso": iso,
                    "country_name": name,
                    "operator_name": None,
                    "mcc": None,
                    "mnc": None,
                    "price_per_sms": inb_price,
                    "currency": "USD",
                    "price_usd": inb_price,
                    "direction": "inbound",
                    "message_type": "sms",
                    "carrier_surcharge_usd": None,
                    "total_price_usd": inb_price,
                    "verify_price_usd": None,
                    "link": PROVIDERS[provider],
                    "last_updated": NOW,
                })

    # 1b. Extrapolate SMS records for remaining countries using regional multipliers
    for iso, name in ALL_COUNTRIES.items():
        if iso in KEY_COUNTRIES:
            continue  # already covered
        mult = REGION_MULTIPLIERS.get(iso, 5.0)
        for provider in GLOBAL_PROVIDERS:
            us_price = SMS_PRICES.get(provider, {}).get("US")
            if us_price is None:
                continue
            price = round(us_price * mult, 6)
            # Add slight per-provider variance
            price = round(price * random.uniform(0.92, 1.08), 6)

            records.append({
                "id": gen_id(provider, iso, "outbound", "sms"),
                "provider": provider,
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
                "link": PROVIDERS[provider],
                "last_updated": NOW,
            })

    # 2. MMS records
    for provider, countries in MMS_PROVIDERS.items():
        for iso, price in countries.items():
            name = KEY_COUNTRIES.get(iso, iso)
            surcharge = US_CARRIER_SURCHARGES.get(provider) if iso == "US" else None
            total = price + (surcharge or 0)

            records.append({
                "id": gen_id(provider, iso, "outbound", "mms"),
                "provider": provider,
                "country_iso": iso,
                "country_name": name,
                "operator_name": None,
                "mcc": None,
                "mnc": None,
                "price_per_sms": price,
                "currency": "USD",
                "price_usd": price,
                "direction": "outbound",
                "message_type": "mms",
                "carrier_surcharge_usd": surcharge,
                "total_price_usd": round(total, 6),
                "verify_price_usd": None,
                "link": PROVIDERS[provider],
                "last_updated": NOW,
            })

    # 3. WhatsApp records
    for provider, countries in WHATSAPP_PROVIDERS.items():
        for iso, price in countries.items():
            name = KEY_COUNTRIES.get(iso, iso)

            records.append({
                "id": gen_id(provider, iso, "outbound", "whatsapp"),
                "provider": provider,
                "country_iso": iso,
                "country_name": name,
                "operator_name": None,
                "mcc": None,
                "mnc": None,
                "price_per_sms": price,
                "currency": "USD",
                "price_usd": price,
                "direction": "outbound",
                "message_type": "whatsapp",
                "carrier_surcharge_usd": None,
                "total_price_usd": price,
                "verify_price_usd": None,
                "link": PROVIDERS[provider],
                "last_updated": NOW,
            })

    # 4. RCS records
    for provider, countries in RCS_PROVIDERS.items():
        for iso, price in countries.items():
            name = KEY_COUNTRIES.get(iso, iso)

            records.append({
                "id": gen_id(provider, iso, "outbound", "rcs"),
                "provider": provider,
                "country_iso": iso,
                "country_name": name,
                "operator_name": None,
                "mcc": None,
                "mnc": None,
                "price_per_sms": price,
                "currency": "USD",
                "price_usd": price,
                "direction": "outbound",
                "message_type": "rcs",
                "carrier_surcharge_usd": None,
                "total_price_usd": price,
                "verify_price_usd": None,
                "link": PROVIDERS[provider],
                "last_updated": NOW,
            })

    # Deduplicate by id
    seen = set()
    unique = []
    for r in records:
        if r["id"] not in seen:
            seen.add(r["id"])
            unique.append(r)

    unique_providers = set(r["provider"] for r in unique)
    unique_countries = set(r["country_iso"] for r in unique)

    package = {
        "lastUpdated": NOW,
        "count": len(unique),
        "providerCount": len(unique_providers),
        "countryCount": len(unique_countries),
        "data": unique,
        "phoneNumbers": PHONE_NUMBER_PRICES,
        "volumeTiers": VOLUME_TIERS,
        "tenDlcFees": TEN_DLC_FEES,
    }

    return package


if __name__ == "__main__":
    random.seed(42)  # reproducible
    package = generate_all()

    out_path = "public/sms-data.json"
    with open(out_path, "w") as f:
        json.dump(package, f, indent=None, separators=(",", ":"))

    print(f"Generated {package['count']} records")
    print(f"  Providers: {package['providerCount']}")
    print(f"  Countries: {package['countryCount']}")
    print(f"  Phone numbers: {len(package['phoneNumbers'])}")
    print(f"  Volume tiers: {len(package['volumeTiers'])}")
    print(f"  10DLC fees: {len(package['tenDlcFees'])}")

    # Breakdown by message type
    from collections import Counter
    type_counts = Counter(r["message_type"] for r in package["data"])
    for t, c in type_counts.most_common():
        print(f"  {t}: {c} records")

    print(f"\nWritten to {out_path} ({len(json.dumps(package)) / 1024:.0f} KB)")
