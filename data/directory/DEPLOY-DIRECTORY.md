# Deploying the directory service (rig-directory) — one-time GCP setup

> **Permissions note (learned the hard way):** a project *Editor* can run
> most of this but NOT any `*setIamPolicy` operation — those 403. The four
> IAM commands are collected in §0 for a project **Owner** to run once;
> everything else works as Editor. Project: `rig-production-337414`.

## 0. Owner-only block (run once by a project Owner)

```bash
export PROJECT_ID=rig-production-337414
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# (a) let Cloud Build read the export-token secret — bind BOTH service
# accounts builds may run as (classic Cloud Build SA and compute default,
# which newer triggers use):
for SA in "${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
          "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"; do
  gcloud secrets add-iam-policy-binding mechanics-export-token \
    --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor"
done

# (b) scheduler service account + permission to run builds (for §4)
gcloud iam service-accounts create directory-nightly-build \
  --display-name="Nightly directory rebuild"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:directory-nightly-build@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

# (c) make the rig-directory service public — run AFTER the service exists (§2):
gcloud run services add-iam-policy-binding rig-directory \
  --platform=managed --region=us-central1 \
  --member="allUsers" --role="roles/run.invoker"
```

Alternative: grant the person doing the setup `roles/owner` temporarily (or
`roles/secretmanager.admin` + `roles/run.admin` + project-level IAM admin)
and skip this split.

The repeatable pipeline is `cloudbuild-directory.yaml` (build → push →
deploy to Cloud Run service `rig-directory`, us-central1). This runbook is
the one-time setup around it. Run in Cloud Shell or anywhere gcloud is
authed against the production project; set `PROJECT_ID` first:

```bash
export PROJECT_ID=rig-production-337414
gcloud config set project $PROJECT_ID
```

## 1. Secret: mechanics export token

Get the bearer token for https://api.bigrig.app/directory-export/latest from
the Services owner, then:

```bash
printf '%s' '<TOKEN>' | gcloud secrets create mechanics-export-token \
  --replication-policy=automatic --data-file=-

# Cloud Build's service account must be able to read it
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding mechanics-export-token \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Rotating the token later = `gcloud secrets versions add mechanics-export-token --data-file=-`
(the build always reads `latest`). If the secret is missing or wrong the
build still succeeds — pages ship with the committed mechanics data.

## 2. Create the Cloud Run service (first deploy only)

`cloudbuild-directory.yaml` uses `gcloud run services update`, which needs
the service to exist. Bootstrap it once from any built image (the first
trigger run's image, or kick one manually):

```bash
# one manual pipeline run to get an image + create the service:
gcloud builds submit --config=cloudbuild-directory.yaml . || true  # build+push may succeed, deploy fails (no service yet)

gcloud run deploy rig-directory \
  --image=us.gcr.io/$PROJECT_ID/rig-ads-website/rig-directory:<COMMIT_SHA-from-the-build> \
  --region=us-central1 --platform=managed \
  --memory=512Mi --cpu=1 --min-instances=1
```

(No `--allow-unauthenticated` — that's a setIamPolicy op; an Owner runs
§0(c) once after the service exists to make it public.)

After this, the pipeline's update step works on every run.

## 3. Build trigger on the seo-directory branch

```bash
gcloud builds triggers create github \
  --name=rig-directory-deploy \
  --repo-owner=jcfrk101 --repo-name=rig-ads-website \
  --branch-pattern='^seo-directory$' \
  --build-config=cloudbuild-directory.yaml \
  --description="Deploy directory service on push to seo-directory"
```

(If the existing rig-ads-website trigger was made in the console, making
this one in the console with the same settings + `cloudbuild-directory.yaml`
is equivalent. The old trigger stays on main → old service, untouched.)

## 4. Nightly rebuild (fresh mechanics data daily)

Cloud Scheduler runs the same trigger every night at 03:30 Central (after
the Services export lands):

(The service account + its role were created in §0(b).)

```bash
TRIGGER_ID=$(gcloud builds triggers describe rig-directory-deploy --format='value(id)')
gcloud scheduler jobs create http rig-directory-nightly \
  --location=us-central1 \
  --schedule="30 3 * * *" --time-zone="America/Chicago" \
  --uri="https://cloudbuild.googleapis.com/v1/projects/$PROJECT_ID/triggers/${TRIGGER_ID}:run" \
  --http-method=POST \
  --message-body='{"branchName":"seo-directory"}' \
  --oauth-service-account-email="directory-nightly-build@$PROJECT_ID.iam.gserviceaccount.com"
```

(When the branch merges to main later, change `branchName` + the trigger's
branch pattern — one field each.)

## 5. Routing (separate task, LB config)

bigrig.app/semi-truck-repair/* → rig-directory via the load balancer /
edge proxy, www → apex 301, sitemap.xml ownership at the apex — tracked in
DUAL-RUN-PLAN.md's checklist; not part of this runbook.

## Verifying a deploy

- Build logs should show `fetched export from https://api.bigrig.app/...`
  (token working) or an explicit fallback line (token missing — build still
  green, data stale).
- `curl -s https://<rig-directory-run-url>/semi-truck-repair/tx/dallas/ | grep -c 'Request dispatch'`
  → non-zero.
- Spot-check a profile page and the sitemap URL count.
