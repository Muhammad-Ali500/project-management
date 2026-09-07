# Project Manager — 3-Tier DevOps Practice App

A deliberately "textbook" 3-tier application for practicing DevOps workflows: containerization,
local orchestration, CI pipelines, and (as a next step) cloud deployment to GCP.

Track **Projects → Initiatives → Tasks** — start a project, break it into initiatives, and track
tasks to completion.

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Presentation    │      │   Application     │      │      Data       │
│  React + Vite    │ ───> │   FastAPI         │ ───> │    MongoDB      │
│  served by nginx │ HTTP │   (Beanie ODM)    │ TCP  │                 │
│  :3000 -> :8080  │      │   :8000           │      │   :27017        │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

- **Presentation tier**: React + TypeScript SPA, built with Vite, served as static files by nginx.
  Nginx also reverse-proxies `/api/*` to the backend so the browser only ever talks to one origin.
- **Application tier**: FastAPI, async, using Beanie (ODM on top of Motor) for MongoDB access.
  Exposes a REST API for projects, initiatives, and tasks, plus a `/health` endpoint.
- **Data tier**: MongoDB, storing projects/initiatives/tasks as separate collections referenced
  by id.

## Tech stack

| Layer       | Choice                                  |
|-------------|------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, nginx (runtime) |
| Backend     | Python 3.12, FastAPI, Beanie/Motor, Pydantic v2 |
| Database    | MongoDB 7                               |
| Container   | Docker (multi-stage builds, non-root users, healthchecks) |
| Local orchestration | Docker Compose                   |
| CI/CD       | GitHub Actions (lint, test, build)       |

## DevOps practices applied

- **Multi-stage Docker builds** for both tiers — build tooling never ships in the runtime image.
- **Non-root containers** — backend runs as `appuser` (uid 1000), frontend nginx runs as an
  unprivileged user on port 8080.
- **Container healthchecks** on every service (`/health` for the API, mongosh ping for the DB,
  nginx root for the frontend), wired into Compose `depends_on: condition: service_healthy`.
- **12-factor config** — all environment-specific values (Mongo URI, DB name, CORS origins, API
  base URL) come from env vars / `.env` files, never hardcoded. `.env.example` files document
  what's required without committing secrets.
- **Small, pinned base images** — `python:3.12-slim`, `node:20-alpine`, `nginx:1.27-alpine`.
- **Separation of concerns** — schemas (API contracts) are separate from documents (persistence
  models), so the API can evolve independently of storage.
- **Automated CI** — every push/PR runs backend lint (ruff) + tests (pytest against an in-memory
  Mongo mock, so no external DB is needed in CI), frontend lint (eslint) + type-checked build, and
  a Docker build of both images.
- **`.dockerignore` / `.gitignore`** tuned per tier to keep images and commits lean.

## Running locally

```bash
git init   # if you want to track this as its own repo
docker compose up --build
```

- Frontend: http://localhost:3001
- Backend API docs (Swagger): http://localhost:8010/docs
- Backend health: http://localhost:8010/health

> Ports 3001/8010 are used (instead of the more common 3000/8000) because another local project
> was already bound to those ports on this machine. Feel free to change them back in
> `docker-compose.yml` if that's no longer the case for you.

Stop and remove containers (keep the Mongo volume):

```bash
docker compose down
```

Wipe the database too:

```bash
docker compose down -v
```

## Running the backend without Docker

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8010
```

Requires a local MongoDB instance (or point `MONGO_URI` in `backend/.env` at one).

## Running the frontend without Docker

```bash
cd frontend
npm install
npm run dev
```

Vite's dev server runs on port 3001 and proxies `/api` to `http://localhost:8010` (see
`vite.config.ts`), so run the backend alongside it on the same port.

## Running tests

```bash
cd backend
pytest -v          # unit/integration tests against an in-memory Mongo mock
ruff check .        # lint
```

```bash
cd frontend
npm run lint
npm run build       # type-checks + production build
```

## API overview

| Method | Path                                      | Description            |
|--------|--------------------------------------------|-------------------------|
| GET    | `/health`                                  | Liveness/readiness probe |
| GET/POST | `/api/projects`                          | List / create projects |
| GET/PUT/DELETE | `/api/projects/{id}`               | Read / update / delete a project |
| GET/POST | `/api/projects/{project_id}/initiatives` | List / create initiatives for a project |
| GET/PUT/DELETE | `/api/initiatives/{id}`            | Read / update / delete an initiative |
| GET/POST | `/api/initiatives/{initiative_id}/tasks` | List / create tasks for an initiative |
| GET/PUT/DELETE | `/api/tasks/{id}`                  | Read / update / delete a task |

## Project structure

```
gcp-main-project/
├── backend/            FastAPI application
│   ├── app/
│   │   ├── models/     Beanie documents (persistence)
│   │   ├── schemas/    Pydantic request/response contracts
│   │   ├── routers/    API route handlers
│   │   ├── config.py   Settings via pydantic-settings
│   │   ├── database.py Mongo connection lifecycle
│   │   └── main.py     FastAPI app + lifespan wiring
│   ├── tests/          pytest suite (mongomock-based)
│   └── Dockerfile
├── frontend/           React + Vite SPA
│   ├── src/
│   │   ├── api/        fetch-based API client
│   │   ├── components/ Project/Initiative/Task panels
│   │   └── types/      Shared TypeScript interfaces
│   ├── nginx.conf       SPA + API reverse proxy config
│   └── Dockerfile
├── docker-compose.yml  Local 3-tier orchestration
└── .github/workflows/ci.yml   Lint/test/build pipeline
```

## Suggested next steps for extending the DevOps practice

These were deliberately scoped out to start, but are natural next exercises:

1. **Kubernetes** — write Deployment/Service/Ingress manifests (or a Helm chart) and deploy to GKE.
2. **Terraform** — provision GKE cluster, Artifact Registry, and a managed MongoDB (Atlas) or
   Cloud SQL (if migrating to a relational model) as IaC.
3. **CD** — extend the GitHub Actions workflow to push images to Artifact Registry and deploy to
   GKE on merge to `main`.
4. **Observability** — structured logging + a `/metrics` endpoint (Prometheus), and a Grafana
   dashboard.
5. **Secrets management** — move from `.env` files to Secret Manager / Kubernetes Secrets.
