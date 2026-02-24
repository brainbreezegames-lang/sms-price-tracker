#!/usr/bin/env python3
"""
SMS Price Tracker — Real Data Fetcher

Orchestrates all scrapers, normalizes data, and writes sms-data.json.
Run: python3 scripts/fetch_real_data.py

Scrapers are organized in tiers:
  Tier 1: Direct download (no auth) — always works
  Tier 2: API with free account key — works if env vars are set
  Tier 3: Web scraping — may break if page structure changes
  Tier 4: Static/manual — published base rates
"""

import json
import os
import sys
import traceback

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.scrapers import twilio, azure, aws_sns
from scripts.normalize import normalize, build_package


def main():
    all_rates = []
    errors = []

    print("=" * 60)
    print("SMS Price Tracker — Fetching Real Data")
    print("=" * 60)

    # ── Tier 1: Direct download (no auth) ──────────────────────
    print("\n── Tier 1: Direct downloads ──")

    try:
        all_rates.extend(twilio.fetch())
    except Exception as e:
        errors.append(f"Twilio: {e}")
        print(f"  ERROR Twilio: {e}")
        traceback.print_exc()

    try:
        all_rates.extend(azure.fetch())
    except Exception as e:
        errors.append(f"Azure: {e}")
        print(f"  ERROR Azure: {e}")

    try:
        all_rates.extend(aws_sns.fetch())
    except Exception as e:
        errors.append(f"Amazon SNS: {e}")
        print(f"  ERROR Amazon SNS: {e}")

    # ── Tier 2: API scrapers (use API if keys available, fallback otherwise) ──
    print("\n── Tier 2: API scrapers ──")

    scrapers_tier2 = ["vonage", "messagebird", "plivo", "clicksend"]
    for name in scrapers_tier2:
        try:
            mod = __import__(f"scripts.scrapers.{name}", fromlist=[name])
            all_rates.extend(mod.fetch())
        except ImportError:
            print(f"  {name}: scraper not yet implemented")
        except Exception as e:
            errors.append(f"{name}: {e}")
            print(f"  ERROR {name}: {e}")

    # ── Tier 3: Web scrapers ───────────────────────────────────
    print("\n── Tier 3: Web scrapers ──")

    scrapers_tier3 = ["telnyx", "clickatell", "sinch", "africas_talking"]
    for name in scrapers_tier3:
        try:
            mod = __import__(f"scripts.scrapers.{name}", fromlist=[name])
            all_rates.extend(mod.fetch())
        except ImportError:
            print(f"  {name}: scraper not yet implemented")
        except Exception as e:
            errors.append(f"{name}: {e}")
            print(f"  ERROR {name}: {e}")

    # ── Tier 4: Static fallbacks ───────────────────────────────
    print("\n── Tier 4: Static fallbacks ──")

    static_scrapers = ["infobip", "bandwidth"]
    for name in static_scrapers:
        try:
            mod = __import__(f"scripts.scrapers.{name}", fromlist=[name])
            all_rates.extend(mod.fetch())
        except ImportError:
            print(f"  {name}: scraper not yet implemented")
        except Exception as e:
            errors.append(f"{name}: {e}")
            print(f"  ERROR {name}: {e}")

    # ── Normalize and write ────────────────────────────────────
    print("\n── Normalizing ──")
    clean_rates = normalize(all_rates)

    # Build package
    package = build_package(clean_rates)

    # Add phone number pricing, volume tiers, 10DLC fees
    try:
        from scripts.scrapers import phone_numbers
        package["phoneNumbers"] = phone_numbers.fetch()
    except ImportError:
        print("  Phone numbers: not yet implemented")
    except Exception as e:
        print(f"  ERROR phone numbers: {e}")

    try:
        from scripts.scrapers import ten_dlc
        package["tenDlcFees"] = ten_dlc.fetch()
    except ImportError:
        print("  10DLC fees: not yet implemented")
    except Exception as e:
        print(f"  ERROR 10DLC fees: {e}")

    # Write output
    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "sms-data.json")
    with open(out_path, "w") as f:
        json.dump(package, f, separators=(",", ":"))

    file_size_kb = os.path.getsize(out_path) / 1024

    # ── Summary ────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print(f"DONE")
    print(f"  Rates:     {package['count']}")
    print(f"  Providers: {package['providerCount']}")
    print(f"  Countries: {package['countryCount']}")
    print(f"  File:      {out_path} ({file_size_kb:.0f} KB)")
    if errors:
        print(f"\n  ERRORS ({len(errors)}):")
        for e in errors:
            print(f"    - {e}")
    print("=" * 60)

    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
