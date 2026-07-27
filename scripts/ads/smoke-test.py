#!/usr/bin/env python3
"""Smoke test: list accessible Google Ads accounts using ~/google-ads.yaml."""
import sys

try:
    from google.ads.googleads.client import GoogleAdsClient
except ImportError:
    sys.exit("Missing dependency — run: pip3 install google-ads")

client = GoogleAdsClient.load_from_storage()
svc = client.get_service("CustomerService")
res = svc.list_accessible_customers()
print("Accessible accounts:")
for name in res.resource_names:
    print(" ", name)
print("\nOK — credentials work. (Test-access tokens only reach test accounts.)")
