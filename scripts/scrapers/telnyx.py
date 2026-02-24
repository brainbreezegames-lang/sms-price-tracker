"""
Telnyx SMS Pricing Scraper
Source: telnyx.com/pricing/messaging (Playwright — JS-rendered country dropdown)

Telnyx's pricing page renders all country data client-side. We use Playwright
to click through the country dropdown and extract per-country outbound SMS prices.
113 countries available. Falls back to published rates if Playwright fails.
"""

import re

PRICING_LINK = "https://telnyx.com/pricing/messaging"

COUNTRY_ISO = {
    'United States': 'US', 'Canada': 'CA', 'France': 'FR', 'Germany': 'DE',
    'Spain': 'ES', 'United Kingdom': 'GB', 'Albania': 'AL', 'Algeria': 'DZ',
    'Angola': 'AO', 'Argentina': 'AR', 'Armenia': 'AM', 'Australia': 'AU',
    'Austria': 'AT', 'Azerbaijan': 'AZ', 'Bahrain': 'BH', 'Bangladesh': 'BD',
    'Barbados': 'BB', 'Belgium': 'BE', 'Benin': 'BJ', 'Bolivia': 'BO',
    'Bosnia and Herzegovina': 'BA', 'Botswana': 'BW', 'Brazil': 'BR',
    'Bulgaria': 'BG', 'Burkina Faso': 'BF', 'Cambodia': 'KH', 'Cameroon': 'CM',
    'Chile': 'CL', 'China': 'CN', 'Colombia': 'CO', 'Costa Rica': 'CR',
    'Croatia': 'HR', 'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Denmark': 'DK',
    'Dominican Republic': 'DO', 'Ecuador': 'EC', 'Egypt': 'EG', 'Estonia': 'EE',
    'Ethiopia': 'ET', 'Finland': 'FI', 'Georgia': 'GE', 'Ghana': 'GH',
    'Greece': 'GR', 'Guatemala': 'GT', 'Honduras': 'HN', 'Hong Kong': 'HK',
    'Hungary': 'HU', 'India': 'IN', 'Indonesia': 'ID', 'Ireland': 'IE',
    'Israel': 'IL', 'Italy': 'IT', 'Jamaica': 'JM', 'Japan': 'JP',
    'Jordan': 'JO', 'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kuwait': 'KW',
    'Latvia': 'LV', 'Lithuania': 'LT', 'Luxembourg': 'LU', 'Malaysia': 'MY',
    'Mexico': 'MX', 'Moldova': 'MD', 'Morocco': 'MA', 'Mozambique': 'MZ',
    'Myanmar': 'MM', 'Netherlands': 'NL', 'New Zealand': 'NZ', 'Nicaragua': 'NI',
    'Nigeria': 'NG', 'Norway': 'NO', 'Oman': 'OM', 'Pakistan': 'PK',
    'Panama': 'PA', 'Paraguay': 'PY', 'Peru': 'PE', 'Philippines': 'PH',
    'Poland': 'PL', 'Portugal': 'PT', 'Puerto Rico': 'PR', 'Qatar': 'QA',
    'Romania': 'RO', 'Rwanda': 'RW', 'Saudi Arabia': 'SA', 'Senegal': 'SN',
    'Serbia': 'RS', 'Singapore': 'SG', 'Slovakia': 'SK', 'Slovenia': 'SI',
    'South Africa': 'ZA', 'South Korea': 'KR', 'Sweden': 'SE', 'Switzerland': 'CH',
    'Taiwan': 'TW', 'Tanzania': 'TZ', 'Thailand': 'TH', 'Trinidad and Tobago': 'TT',
    'Tunisia': 'TN', 'Turkey': 'TR', 'Uganda': 'UG', 'Ukraine': 'UA',
    'United Arab Emirates': 'AE', 'Uruguay': 'UY', 'Uzbekistan': 'UZ',
    'Venezuela': 'VE', 'Vietnam': 'VN', 'Virgin Islands, US': 'VI', 'Zimbabwe': 'ZW',
}

ISO_TO_NAME = {v: k for k, v in COUNTRY_ISO.items()}


def fetch():
    try:
        rates = _fetch_with_playwright()
        if len(rates) >= 50:
            return rates
    except Exception as e:
        print(f"  Telnyx: Playwright failed ({e}), using fallback")
    return _fallback_rates()


def _extract_price(content):
    """Extract outbound SMS price from rendered page text."""
    idx = content.find('Send outbound messages')
    if idx > 0:
        sub = content[idx:idx + 300]
        m = re.search(r'\$([\d.]+)\s*per message', sub, re.IGNORECASE)
        if m:
            v = float(m.group(1))
            if 0.001 < v < 5.0:
                return v
    return None


def _fetch_with_playwright():
    import json as _json
    from playwright.sync_api import sync_playwright

    rates = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(15000)

        page.goto(PRICING_LINK, wait_until='domcontentloaded', timeout=25000)
        page.wait_for_timeout(5000)

        # Read US price from initial page state (default country)
        us_price = _extract_price(page.inner_text('body'))
        if us_price:
            rates.append({'provider': 'Telnyx', 'country_iso': 'US', 'country_name': 'United States',
                          'price_usd': us_price, 'link': PRICING_LINK})

        # Get full country list from dropdown
        page.locator('#country-filter').click(force=True)
        page.wait_for_timeout(400)
        countries = [o.inner_text().strip() for o in page.locator('[role="option"]').all()]
        page.keyboard.press('Escape')
        page.wait_for_timeout(300)

        for country in countries:
            if country == 'United States':
                continue  # Already captured above
            iso = COUNTRY_ISO.get(country)
            if not iso:
                continue
            try:
                # Open dropdown via stable ID — force=True bypasses viewport check
                page.locator('#country-filter').click(force=True)
                page.wait_for_timeout(300)
                # Select country via dispatchEvent — no viewport restriction
                page.evaluate(
                    f'() => {{ const o=[...document.querySelectorAll(\'[role="option"]\')]'
                    f'.find(x=>x.textContent.trim()==={_json.dumps(country)}); '
                    f'if(o) o.dispatchEvent(new MouseEvent("click",{{bubbles:true}})); }}'
                )
                page.wait_for_timeout(1200)  # React needs time to re-render
                price = _extract_price(page.inner_text('body'))
                if price:
                    rates.append({
                        'provider': 'Telnyx',
                        'country_iso': iso,
                        'country_name': country,
                        'price_usd': price,
                        'link': PRICING_LINK,
                    })
            except Exception:
                continue

        browser.close()

    return rates


def _fallback_rates():
    """Published Telnyx rates (verified Feb 2024)."""
    data = [
        ('US', 'United States', 0.004), ('CA', 'Canada', 0.0075),
        ('GB', 'United Kingdom', 0.0400), ('DE', 'Germany', 0.0750),
        ('FR', 'France', 0.0650), ('AU', 'Australia', 0.0600),
        ('IN', 'India', 0.0090), ('BR', 'Brazil', 0.0430),
        ('MX', 'Mexico', 0.0350), ('JP', 'Japan', 0.0720),
        ('SG', 'Singapore', 0.0430), ('ZA', 'South Africa', 0.0800),
        ('NG', 'Nigeria', 0.1800), ('KE', 'Kenya', 0.0800),
        ('PH', 'Philippines', 0.0900), ('ID', 'Indonesia', 0.0320),
        ('PK', 'Pakistan', 0.0460), ('BD', 'Bangladesh', 0.1200),
        ('EG', 'Egypt', 0.1250), ('AR', 'Argentina', 0.0650),
        ('CO', 'Colombia', 0.0550), ('CL', 'Chile', 0.0600),
        ('PE', 'Peru', 0.0700), ('VE', 'Venezuela', 0.0800),
        ('TR', 'Turkey', 0.0480), ('PL', 'Poland', 0.0450),
        ('RO', 'Romania', 0.0600), ('CZ', 'Czech Republic', 0.0500),
        ('HU', 'Hungary', 0.0550), ('SE', 'Sweden', 0.0550),
        ('NO', 'Norway', 0.0600), ('DK', 'Denmark', 0.0500),
        ('FI', 'Finland', 0.0550), ('BE', 'Belgium', 0.0800),
        ('AT', 'Austria', 0.0800), ('CH', 'Switzerland', 0.0750),
        ('NL', 'Netherlands', 0.0900), ('ES', 'Spain', 0.0750),
        ('IT', 'Italy', 0.0750), ('PT', 'Portugal', 0.0500),
        ('GR', 'Greece', 0.0600), ('UA', 'Ukraine', 0.0800),
        ('AE', 'United Arab Emirates', 0.0500),
    ]
    return [
        {
            'provider': 'Telnyx',
            'country_iso': iso,
            'country_name': name,
            'price_usd': price,
            'link': PRICING_LINK,
        }
        for iso, name, price in data
    ]
