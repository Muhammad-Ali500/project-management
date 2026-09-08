# CI/CD on GCP — a beginner's guide for this app

This guide walks through taking this repo (currently: GitHub Actions runs lint/test/build on every
push, see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) all the way to a live
deployment on Google Cloud, with a pipeline that redeploys automatically on every merge to `main`.

It covers **two different hosting styles**, because the setup is genuinely different for each:

| | **Cloud Run** | **Compute Engine VM** |
|---|---|---|
| What it is | Serverless containers — GCP runs your image on demand | A regular Linux server you manage yourself |
| Scales to zero | Yes (pay only for requests) | No (you pay 24/7 while it's running) |
| Can it run MongoDB? | Not the persistent, stateful way this app needs — use **MongoDB Atlas** instead | Yes — runs in `docker-compose` exactly like local dev |
| You manage | Nothing below the container | OS patches, Docker, firewall, disk space |
| Best for | "I don't want to think about servers" | "I want full control / this is how a real ops team runs things" |

Read the concepts section once, then jump to whichever path matches what you're doing. You can also
do both — they don't conflict.

If you are brand new to GCP, do the **[Section 0](#section-0-one-time-gcp-account-setup)** setup
first regardless of which path you pick.

---

## Concepts you need before touching GCP

- **Project**: GCP's top-level container for billing + resources. You'll create one project for
  this app (e.g. `project-manager-prod`).
- **Artifact Registry**: GCP's private Docker image registry (replacement for the older
  "Container Registry"). CI builds your images and pushes them here; Cloud Run / your VM pulls
  from here.
- **Service account**: a non-human identity with an email like
  `deployer@my-project.iam.gserviceaccount.com`. You grant it specific IAM roles (permissions) and
  GitHub Actions "becomes" this identity to talk to GCP.
- **Workload Identity Federation (WIF)**: lets GitHub Actions authenticate to GCP *without* a
  downloadable JSON key sitting in your GitHub secrets forever. This is the modern, recommended
  approach and is what this guide uses. (The older approach — a long-lived service account key —
  is simpler to set up but is a standing secret that never expires until you revoke it; avoid it
  if you can.)
- **Secret Manager**: where real secrets (DB connection strings, etc.) live in GCP, instead of
  plain environment variables baked into a config file.
- **IAM role**: a bundle of permissions (e.g. `roles/run.admin` = "can deploy/manage Cloud Run
  services"). You attach roles to service accounts.

---

## Section 0: one-time GCP account setup

You only do this once, no matter which path you choose.

1. **Create a Google Cloud account** at https://console.cloud.google.com if you don't have one
   (new accounts get free trial credit).
2. **Install the `gcloud` CLI** on your machine: https://cloud.google.com/sdk/docs/install
3. **Log in and create a project:**
   ```bash
   gcloud auth login
   gcloud projects create project-manager-prod --name="Project Manager"
   gcloud config set project project-manager-prod
   ```
4. **Link a billing account** to the project (required even for free-tier usage) — do this in the
   console under *Billing*, since it needs a payment method on file.
5. **Enable the APIs you'll need:**
   ```bash
   gcloud services enable \
     artifactregistry.googleapis.com \
     run.googleapis.com \
     compute.googleapis.com \
     secretmanager.googleapis.com \
     iam.googleapis.com \
     iamcredentials.googleapis.com \
     cloudbuild.googleapis.com
   ```
6. **Create one Artifact Registry repo** for both images (used by both paths below):
   ```bash
   gcloud artifacts repositories create project-manager \
     --repository-format=docker \
     --location=us-central1 \
     --description="Project Manager app images"
   ```
   Pick any region close to you; use the same region everywhere below. Your image path will look
   like `us-central1-docker.pkg.dev/project-manager-prod/project-manager/backend`.

7. **Set up Workload Identity Federation so GitHub Actions can deploy without a key file:**
   ```bash
   PROJECT_ID=project-manager-prod
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
   GITHUB_REPO="your-github-username/gcp-main-project"   # <-- change this

   # A pool is a container for external identities (GitHub, in this case)
   gcloud iam workload-identity-pools create "github-pool" \
     --location="global" --display-name="GitHub Actions"

   # A provider tells GCP how to validate GitHub's OIDC tokens
   gcloud iam workload-identity-pools providers create-oidc "github-provider" \
     --location="global" \
     --workload-identity-pool="github-pool" \
     --display-name="GitHub provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
     --issuer-uri="https://token.actions.githubusercontent.com"

   # The service account GitHub Actions will impersonate
   gcloud iam service-accounts create gh-deployer \
     --display-name="GitHub Actions deployer"

   # Allow ONLY workflows running in your specific GitHub repo to impersonate it
   gcloud iam service-accounts add-iam-policy-binding \
     "gh-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${GITHUB_REPO}"
   ```
   Take note of the **Workload Identity Provider resource name** — you'll need it in the GitHub
   Actions YAML:
   ```bash
   gcloud iam workload-identity-pools providers describe "github-provider" \
     --location="global" --workload-identity-pool="github-pool" \
     --format="value(name)"
   # -> projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
   ```

8. **Grant `gh-deployer` the permissions it needs.** Which roles depend on which path you use —
   granted in each section below, so it's least-privilege rather than one giant grant up front.

---

## Path A: CI/CD to Cloud Run

### A.1 — Why MongoDB needs to move out of the container

Cloud Run runs stateless, ephemeral containers that can be killed and restarted on any host at
any time, and local disk writes don't persist across restarts. That's fine for the backend and
frontend (they don't store data on disk) but wrong for MongoDB. Use
**[MongoDB Atlas](https://www.mongodb.com/atlas)** (their free M0 tier is enough for this app):

1. Create a free Atlas account and an M0 cluster.
2. *Database Access* → create a DB user with a strong password.
3. *Network Access* → add `0.0.0.0/0` (Cloud Run's outbound IP isn't static, so allow-listing
   specific IPs isn't practical without a VPC connector + Cloud NAT — for a practice project,
   allowing all IPs but requiring username/password auth is the pragmatic tradeoff; for a real
   production system, put a VPC connector in front instead).
4. *Connect* → *Drivers* → copy the connection string, it looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### A.2 — Store the connection string in Secret Manager

```bash
echo -n "mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/project_manager?retryWrites=true&w=majority" | \
  gcloud secrets create mongo-uri --data-file=-
```

### A.3 — Grant the deploy service account what it needs for Cloud Run

```bash
PROJECT_ID=project-manager-prod
SA="gh-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/iam.serviceAccountUser"

# A separate, minimal-permission identity that the RUNNING Cloud Run services use
gcloud iam service-accounts create project-manager-runtime --display-name="Project Manager runtime"
gcloud secrets add-iam-policy-binding mongo-uri \
  --member="serviceAccount:project-manager-runtime@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### A.4 — The chicken-and-egg problem: frontend needs the backend's URL

The frontend is a static SPA that's built once and served by nginx — it doesn't proxy to a
backend container the way it does locally (`nginx.conf`'s `proxy_pass http://backend:8000` only
works because Docker Compose puts both containers on the same private network; two separate
Cloud Run services don't share one). So the frontend needs to know the backend's public URL
**at build time**, baked in via `VITE_API_URL`.

Fix: deploy the backend first, grab its URL, then build the frontend with that URL. The workflow
below does this in order automatically. The very first time, you'll want to deploy the backend
manually once to sanity-check it:

```bash
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/project-manager/backend:manual .
gcloud run deploy project-manager-backend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/project-manager/backend:manual \
  --region us-central1 \
  --service-account project-manager-runtime@${PROJECT_ID}.iam.gserviceaccount.com \
  --set-secrets=MONGO_URI=mongo-uri:latest \
  --set-env-vars=DB_NAME=project_manager \
  --allow-unauthenticated \
  --port 8000
```
Note the URL it prints (e.g. `https://project-manager-backend-xxxx-uc.a.run.app`) — set the
backend's `CORS_ORIGINS` once you know the frontend's URL too (chicken-and-egg again — it's fine
to redeploy the backend a second time with the real value once you have it):
```bash
gcloud run services update project-manager-backend --region us-central1 \
  --set-env-vars=CORS_ORIGINS='["https://project-manager-frontend-xxxx-uc.a.run.app"]'
```

### A.5 — GitHub Actions workflow

Add this as `.github/workflows/deploy-cloud-run.yml`. It runs after your existing `ci.yml` checks
would logically pass (you can also add a `needs:` dependency if you put it in the same file).

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write   # required for Workload Identity Federation

env:
  PROJECT_ID: project-manager-prod
  REGION: us-central1
  AR_REPO: us-central1-docker.pkg.dev/project-manager-prod/project-manager

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
          service_account: gh-deployer@project-manager-prod.iam.gserviceaccount.com

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build & push backend
        run: |
          docker build -t ${{ env.AR_REPO }}/backend:${{ github.sha }} ./backend
          docker push ${{ env.AR_REPO }}/backend:${{ github.sha }}

      - name: Deploy backend
        id: backend
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: project-manager-backend
          region: ${{ env.REGION }}
          image: ${{ env.AR_REPO }}/backend:${{ github.sha }}
          flags: --allow-unauthenticated --port=8000 --service-account=project-manager-runtime@project-manager-prod.iam.gserviceaccount.com
          secrets: |
            MONGO_URI=mongo-uri:latest
          env_vars: |
            DB_NAME=project_manager

      - name: Build & push frontend (baking in the backend URL)
        run: |
          docker build \
            --build-arg VITE_API_URL=${{ steps.backend.outputs.url }} \
            -t ${{ env.AR_REPO }}/frontend:${{ github.sha }} ./frontend
          docker push ${{ env.AR_REPO }}/frontend:${{ github.sha }}

      - name: Deploy frontend
        id: frontend
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: project-manager-frontend
          region: ${{ env.REGION }}
          image: ${{ env.AR_REPO }}/frontend:${{ github.sha }}
          flags: --allow-unauthenticated --port=8080

      - name: Update backend CORS to match the deployed frontend URL
        run: |
          gcloud run services update project-manager-backend --region ${{ env.REGION }} \
            --set-env-vars=CORS_ORIGINS='["${{ steps.frontend.outputs.url }}"]'
```

One thing to change before this works: replace the `workload_identity_provider` value with the
exact resource name you copied in Section 0.7.

(`frontend/Dockerfile` already accepts a `VITE_API_URL` build arg and bakes it into the Vite build;
`frontend/src/api/client.ts` reads it via `import.meta.env.VITE_API_URL`, falling back to the
same-origin `/api` proxy path when it's not set — which is exactly what local Docker Compose and
the VM path use, so nothing there needs to change for those two.)

### A.6 — What you get

- Push to `main` → GitHub Actions builds both images, pushes to Artifact Registry, deploys two
  Cloud Run services, and wires CORS between them automatically.
- Cloud Run keeps the last N revisions and lets you roll back instantly:
  `gcloud run services update-traffic project-manager-backend --to-revisions=REVISION=100`.
- Scales to zero when idle — you pay per request, not per hour.

---

## Path B: CI/CD when running on a GCP Compute Engine VM

This path keeps the architecture identical to local dev: one VM running `docker compose` with all
three containers, MongoDB included. GitHub Actions builds and pushes images (same as Path A); the
difference is the last mile — instead of `deploy-cloudrun`, CI connects to your VM and tells it to
pull the new images.

### B.1 — Create the VM

```bash
gcloud compute instances create project-manager-vm \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server

# Reserve the IP so it doesn't change on restart
gcloud compute addresses create project-manager-ip --region=us-central1
gcloud compute instances add-access-config project-manager-vm --zone=us-central1-a \
  --address=$(gcloud compute addresses describe project-manager-ip --region=us-central1 --format='value(address)')
```

Open only what's needed — HTTP/HTTPS in, SSH restricted to Identity-Aware Proxy (IAP) instead of
the whole internet:
```bash
gcloud compute firewall-rules create allow-http --allow=tcp:80,tcp:443 --target-tags=http-server,https-server
gcloud compute firewall-rules create allow-iap-ssh --allow=tcp:22 --source-ranges=35.235.240.0/20
```

### B.2 — Install Docker on the VM

SSH in (`gcloud compute ssh project-manager-vm --zone=us-central1-a --tunnel-through-iap`) and run:
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and back in for the group change to apply
```

### B.3 — First deploy (manual, to prove it works)

```bash
git clone https://github.com/your-username/gcp-main-project.git
cd gcp-main-project
cp backend/.env.example backend/.env   # edit CORS_ORIGINS to your VM's IP/domain
docker compose up -d --build
```
Visit `http://<vm-external-ip>:3001` — same as local. For real use you'll want to put this behind
port 80/443 with a domain (see B.6).

### B.4 — Let CI push images instead of building on the VM

Building on a small VM on every deploy is slow and competes with the running app for CPU/RAM.
Instead, CI builds and pushes to Artifact Registry (same registry as Path A), and the VM just
pulls. That's what `docker-compose.prod.yml` in this repo is for — it references
`${AR_REPO}/backend:${TAG}` instead of a local build context.

Grant the VM's own identity pull access to Artifact Registry, and grant `gh-deployer` permission to
SSH-execute commands on it:

```bash
PROJECT_ID=project-manager-prod
VM_SA=$(gcloud compute instances describe project-manager-vm --zone=us-central1-a --format='value(serviceAccounts[0].email)')

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$VM_SA" --role="roles/artifactregistry.reader"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gh-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/compute.osAdminLogin"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gh-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iap.tunnelResourceAccessor"
```

### B.5 — GitHub Actions workflow

Add `.github/workflows/deploy-vm.yml`:

```yaml
name: Deploy to Compute Engine VM

on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write

env:
  PROJECT_ID: project-manager-prod
  REGION: us-central1
  AR_REPO: us-central1-docker.pkg.dev/project-manager-prod/project-manager
  VM_NAME: project-manager-vm
  VM_ZONE: us-central1-a

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
          service_account: gh-deployer@project-manager-prod.iam.gserviceaccount.com

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build & push images
        run: |
          docker build -t ${{ env.AR_REPO }}/backend:${{ github.sha }} ./backend
          docker push ${{ env.AR_REPO }}/backend:${{ github.sha }}
          docker build -t ${{ env.AR_REPO }}/frontend:${{ github.sha }} ./frontend
          docker push ${{ env.AR_REPO }}/frontend:${{ github.sha }}

      - name: Deploy over SSH via IAP tunnel
        run: |
          gcloud compute ssh ${{ env.VM_NAME }} --zone=${{ env.VM_ZONE }} --tunnel-through-iap --command="
            cd gcp-main-project &&
            git pull &&
            gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev --quiet &&
            AR_REPO=${{ env.AR_REPO }} TAG=${{ github.sha }} docker compose -f docker-compose.prod.yml pull &&
            AR_REPO=${{ env.AR_REPO }} TAG=${{ github.sha }} docker compose -f docker-compose.prod.yml up -d &&
            docker image prune -f
          "
```

Replace the `workload_identity_provider` value the same way as Path A.

> **Simpler alternative for a learning project**: install a
> [self-hosted GitHub Actions runner](https://docs.github.com/en/actions/hosting-your-own-runners)
> directly on the VM. Your workflow's last job then just runs `git pull && docker compose up -d
> --build` with `runs-on: self-hosted` — no SSH keys, no IAP, no Workload Identity Federation for
> this half of the pipeline. The tradeoff: the runner has whatever access your GitHub repo/org
> grants it, running directly on your production box, which is a bigger blast radius if a
> malicious PR ever got that workflow to run. Fine to start with while learning; move to the
> SSH/IAP approach above before this holds anything you actually care about.

### B.6 — Putting it behind a real domain with HTTPS

The simplest option for a single VM: run [Caddy](https://caddyserver.com/) as one more container
that reverse-proxies to the frontend container and gets you free, auto-renewing TLS. Add to
`docker-compose.prod.yml`:
```yaml
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    networks:
      - app_net
```
with a `Caddyfile`:
```
your-domain.com {
    reverse_proxy frontend:8080
}
```
and point your domain's DNS `A` record at the VM's static IP. Caddy handles the Let's Encrypt
certificate automatically the first time it starts.

### B.7 — What you get

- Push to `main` → CI builds images, pushes to Artifact Registry, SSHes into the VM (through IAP,
  no public SSH exposure), and does a rolling `docker compose up -d` that only recreates
  containers whose image actually changed.
- MongoDB keeps running continuously on the VM's disk — no managed-database dependency.
- You're responsible for OS patches (`sudo apt update && sudo apt upgrade` periodically) and disk
  space (old Docker images/volumes — `docker system prune` occasionally).

---

## Choosing between them

- Start with **Cloud Run** if you want to stop thinking about servers and are OK moving MongoDB
  to Atlas. It's also the cheaper option for a low-traffic practice project (free tier covers a
  lot).
- Use the **VM** path if the point of this project is to practice "real" ops work — patching,
  systemd, firewalls, running your own database — which is a very reasonable thing to want out of
  a DevOps practice repo.
- Both paths reuse the same Artifact Registry and Workload Identity Federation setup from
  Section 0, so trying one doesn't lock you out of the other.

## Next steps once either pipeline is live

- **Observability**: Cloud Run ships logs to Cloud Logging automatically; on the VM, install the
  [Ops Agent](https://cloud.google.com/monitoring/agent/ops-agent) for logs + metrics.
- **Alerts**: a Cloud Monitoring uptime check against `/health` on whichever URL you end up with,
  with a notification channel (email/Slack) on failure.
- **Staging environment**: duplicate either path with a `develop` branch trigger and a `-staging`
  suffix on service/VM names, so `main` merges deploy to production only after a staging smoke
  test.
