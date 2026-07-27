# Google Ads API setup

Four credentials work together; two come from UIs only you can click through,
the rest is scripted here. Secrets never live in the repo — `client_secret.json`
here and `~/google-ads.yaml` in your home directory are both gitignored.

## 1. Developer token (Google Ads UI — you)

The token is issued to a **manager account (MCC)**, not a regular account.

- No MCC yet? Create one free at https://ads.google.com/home/tools/manager-accounts/
  (takes a minute), then link your existing account: MCC → Accounts → Link existing account
  → enter the customer id → accept the invite in the regular account.
- In the MCC: **Tools & Settings → Setup → API Center** → apply for access.
  You immediately get a token with **Test access** (can only hit test accounts);
  apply for **Basic access** on the same page (form, usually approved in 1–3 days)
  to use it against the real account. Reports + campaign edits at our volume fit
  Basic comfortably.

## 2. OAuth client (Cloud Console — you)

Project `rig-production-337414` → https://console.cloud.google.com/apis/credentials

- If prompted for an OAuth consent screen first: User type **Internal**
  (bigrig.app is a Workspace org, so no Google verification process), app name
  e.g. "RIG Ads Scripts", your email for the contacts. No scopes need adding here.
- **Create credentials → OAuth client ID → Desktop app**, name "rig-ads-cli".
- Download the JSON → save as `scripts/ads/client_secret.json`.

The Google Ads API also must be enabled on the project (scripted — or:
https://console.cloud.google.com/apis/library/googleads.googleapis.com → Enable).

## 3. Refresh token (scripted)

```bash
pip3 install google-auth-oauthlib google-ads
python3 scripts/ads/get-refresh-token.py
```

Signs you in via browser (use the account with Ads access) and writes
`~/google-ads.yaml`. Fill in `developer_token` and `login_customer_id`
(the MCC id, digits only) if the script didn't have them from env.

## 4. Smoke test

```bash
python3 scripts/ads/smoke-test.py
```

Lists the accounts the credentials can reach. With a Test-access token this
fails against the real account with an authorization error — expected until
Basic access is approved.
