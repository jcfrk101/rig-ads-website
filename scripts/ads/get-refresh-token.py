#!/usr/bin/env python3
"""One-time Google Ads API refresh-token generator.

Prereqs (see scripts/ads/README.md):
  1. OAuth client of type "Desktop app" created in the Cloud Console;
     its JSON downloaded to scripts/ads/client_secret.json (gitignored).
  2. pip3 install google-auth-oauthlib

Run:  python3 scripts/ads/get-refresh-token.py

Opens a browser for Google sign-in (use the account that can access the
Ads account), then writes ~/google-ads.yaml with the refresh token filled
in. Nothing is printed to the terminal or sent anywhere else.
"""
import json
import os
import sys

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:
    sys.exit("Missing dependency — run: pip3 install google-auth-oauthlib")

HERE = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRET = os.path.join(HERE, "client_secret.json")
OUT = os.path.expanduser("~/google-ads.yaml")
SCOPE = ["https://www.googleapis.com/auth/adwords"]

if not os.path.exists(CLIENT_SECRET):
    sys.exit(f"Put your OAuth client JSON at {CLIENT_SECRET} first (Desktop app type).")

flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, scopes=SCOPE)
creds = flow.run_local_server(port=0, prompt="consent")

with open(CLIENT_SECRET) as f:
    cs = json.load(f)["installed"]

dev_token = os.environ.get("ADS_DEVELOPER_TOKEN", "PASTE_DEVELOPER_TOKEN_HERE")
login_cid = os.environ.get("ADS_LOGIN_CUSTOMER_ID", "PASTE_MCC_ID_NO_DASHES")

with open(OUT, "w") as f:
    f.write(
        f"""# Google Ads API config — created by scripts/ads/get-refresh-token.py
# Docs: https://developers.google.com/google-ads/api/docs/client-libs/python/configuration
developer_token: {dev_token}
client_id: {cs['client_id']}
client_secret: {cs['client_secret']}
refresh_token: {creds.refresh_token}
# Manager (MCC) account id, digits only — the account that issued the developer token
login_customer_id: {login_cid}
use_proto_plus: True
"""
    )
os.chmod(OUT, 0o600)
print(f"Wrote {OUT} (chmod 600).")
if "PASTE" in dev_token or "PASTE" in login_cid:
    print("Now edit that file and fill in developer_token / login_customer_id.")
