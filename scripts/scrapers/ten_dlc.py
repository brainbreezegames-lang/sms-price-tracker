"""
10DLC Registration Fees — Published rates from provider documentation.

10DLC (10-Digit Long Code) is a US regulation for A2P SMS.
Requires brand registration + campaign registration.

Sources:
- Twilio: https://www.twilio.com/en-us/a2p-10dlc
- Azure: published in their SMS pricing docs
- Others: published pricing pages
"""


def fetch():
    """Return 10DLC fee data for US providers."""
    fees = [
        {
            "provider": "Twilio",
            "brand_registration_usd": 4,
            "campaign_registration_usd": 15,
            "monthly_campaign_fee_usd": 10,
            "link": "https://www.twilio.com/en-us/a2p-10dlc",
        },
        {
            "provider": "Azure",
            "brand_registration_usd": 4,
            "campaign_registration_usd": 5,
            "monthly_campaign_fee_usd": 1.50,
            "link": "https://learn.microsoft.com/en-us/azure/communication-services/concepts/sms-pricing",
        },
        {
            "provider": "Vonage",
            "brand_registration_usd": 4,
            "campaign_registration_usd": 15,
            "monthly_campaign_fee_usd": 10,
            "link": "https://www.vonage.com/communications-apis/sms/pricing/",
        },
        {
            "provider": "Telnyx",
            "brand_registration_usd": 4,
            "campaign_registration_usd": 15,
            "monthly_campaign_fee_usd": 10,
            "link": "https://telnyx.com/pricing/messaging",
        },
        {
            "provider": "Plivo",
            "brand_registration_usd": 4,
            "campaign_registration_usd": 15,
            "monthly_campaign_fee_usd": 10,
            "link": "https://www.plivo.com/sms/pricing/",
        },
        {
            "provider": "Sinch",
            "brand_registration_usd": 4,
            "campaign_registration_usd": 15,
            "monthly_campaign_fee_usd": 10,
            "link": "https://sinch.com/pricing/sms/",
        },
        {
            "provider": "Bandwidth",
            "brand_registration_usd": 4,
            "campaign_registration_usd": 10,
            "monthly_campaign_fee_usd": 3,
            "link": "https://www.bandwidth.com/pricing/",
        },
        {
            "provider": "Amazon SNS",
            "brand_registration_usd": 4,
            "campaign_registration_usd": 10,
            "monthly_campaign_fee_usd": 2,
            "link": "https://aws.amazon.com/sns/sms-pricing/",
        },
    ]

    print(f"  10DLC fees: {len(fees)} providers")
    return fees
