# Project Overview & Deployment Guide

Full reference for this repo's architecture, local development, and the CD setup on Dokploy (hosted on a Contabo VPS). For a quick start, see the root [README.md](../README.md).

---

## 1. Architecture

This repository **is** the backend itself — there is no monorepo split. It's a single Node.js/Express/TypeScript service (`src/`), backed by MongoDB and Redis, that serves the separately-repo'd Next.js storefront and React admin panel over a REST API mounted at `/api`.

| Component | Path | Stack | Purpose |
|---|---|---|---|
| Backend | `src/` (repo root) | Node.js, Express, TypeScript, Mongoose | REST API |
| Database | — | MongoDB 7 (official image), standalone | Primary datastore |
| Cache | — | Redis 7 (official image) | Response caching, rate limiting |
| Media | — | Cloudflare R2 (external, S3-compatible) | Uploaded images/files |

- Entry point: `src/server.ts` → connects to MongoDB, connects to Redis, seeds the super-admin, then starts Express (`src/app.ts`) + Socket.IO.
- Root route `GET /` returns API status, uptime, and environment — used as the effective health check.
- Middleware: `helmet`-equivalent via `cors`, `cookie-parser`, JSON body parsing, centralized error handler.
- Config is read from environment variables via `src/app/config/index.ts`. Locally, `dotenv` loads `.env.<NODE_ENV>` (e.g. `.env.development`); in Docker/Dokploy these are injected directly as container environment variables and the file lookup is a harmless no-op.
- Scripts: `npm run dev` (ts-node-dev), `npm run build` (tsc → `dist/`), `npm start` (runs compiled `dist/server.js`).

### Docker image

Multi-stage `Dockerfile` at the repo root:

- `deps`/`build` stages run `npm ci` + `tsc`.
- `runtime` stage installs prod-only deps, copies `dist/`, and copies `src/templates/*.hbs` (Handlebars email templates are read from disk at runtime via `process.cwd()`, not compiled by `tsc`, so they must be copied separately).
- Final image runs `node dist/server.js`. The listening port comes from the `PORT` env var set by whichever compose file is used — `5005` in production, `5006` in staging (see [§3](#3-cd-dokploy-on-contabo)).

---

## 2. Local development

### Option A — run natively (fastest iteration)

```bash
cp .env.example .env.development   # fill in real values
npm install
npm run dev   # http://localhost:5005 (or whatever PORT is set in .env.development)
```

You'll need a local MongoDB and Redis instance, or point `DB_URL`/`REDIS_URL` at hosted ones (MongoDB Atlas, Upstash, etc).

### Option B — run via Docker Compose

```bash
cp .env.example .env.development   # fill in real values
docker compose up --build
```

This uses the root `docker-compose.yml`, which builds the backend from source plus MongoDB and Redis containers. It's for local development only — Dokploy uses separate compose files (below), with different ports.

| Service | URL |
|---|---|
| Backend | http://localhost:5005 |
| MongoDB | localhost:27018 (remapped from the container's internal `27017` to avoid clashing with other local Mongo instances — adjust if `27018` is also taken on your machine) |
| Redis | localhost:6379 |

---

## 3. CD (Dokploy on Contabo)

Dokploy builds directly from this Git repo on every push — no image registry involved. Each environment (staging, production) is a separate Dokploy **Compose** service, watching a different branch and using a different compose file:

```
git push origin develop                          git push origin main
        │                                                 │
        ▼                                                 ▼
Dokploy's GitHub App detects the push to `develop`  Dokploy's GitHub App detects the push to `main`
        │                                                 │
        ▼                                                 ▼
docker compose -f docker-compose.staging.yml        docker compose -f docker-compose.production.yml
  build && up -d                                       build && up -d
```

### One-time setup

1. **Install Dokploy** on the Contabo VPS (one-line install script), if not already running.
2. **Connect GitHub**: in Dokploy, install/authorize its GitHub App against this repo (Settings → Git Providers). Since the repo is private, this must be authorized explicitly per-repo (or org-wide).
3. **Create the production service**:
   - In Dokploy: **+ Create Service → Compose**.
   - Compose Type: `docker-compose`.
   - Source tab: Repository = this repo, **Branch = `main`**, **Compose Path = `./docker-compose.production.yml`**, Trigger Type = `On Push`.
   - Environment tab: set the variables listed in [§4](#4-environment-variables), with real production values.
   - Trigger the first deploy manually — a freshly-created service does **not** auto-build on creation (see gotcha below).
4. **Create the staging service**: repeat with **Branch = `develop`**, **Compose Path = `./docker-compose.staging.yml`**, and separate (different) secret values.

### Current URLs (no domain yet — IP:port only)

| Environment | Backend |
|---|---|
| Production (`main`) | `http://<server-ip>:5005` |
| Staging (`develop`) | `http://<server-ip>:5006` |

Once you have a domain, add it under the Dokploy service's **Domains** tab — Dokploy's built-in Traefik reverse proxy issues Let's Encrypt certificates and handles HTTPS automatically. At that point you can switch the compose file from a published `ports:` mapping to internal-only `expose:`, since Traefik will route to the container directly.

### Mongo runs standalone — no transactions in the app

`mongo` runs as a plain standalone instance, same as any single-container MongoDB setup. `loginUser` and `registerUser` (in `auth.service.ts` / `user.service.ts`) previously used MongoDB **transactions** (`session.startTransaction()`), which only work on a replica set or sharded cluster — a standalone `mongod` rejects them with `IllegalOperation: Transaction numbers are only allowed on a replica set member or mongos`. Rather than convert Mongo into a single-node replica set (extra moving parts — keyfile management, replica set init, oplog overhead — for no real redundancy benefit with only one node), the transaction usage was removed from both services; they now perform their reads/writes as plain sequential operations. `registerUser` creates a `User` then a `Customer` profile without transactional atomicity — an interrupted process between the two writes could in principle leave a `User` without a `Customer` profile, but this is treated as an acceptable, easily-recoverable edge case in exchange for keeping Mongo infrastructure simple.

---

## 4. Environment variables

Both `docker-compose.staging.yml` and `docker-compose.production.yml` define the same variable names; set them per-service in Dokploy's Environment tab with different secret values per environment.

| Variable | Purpose |
|---|---|
| `SERVER_URL` | Public base URL of this backend (e.g. `https://api.example.com` or `http://<ip>:5005` for production / `:5006` for staging) |
| `CORS_ORIGIN` | Comma-separated list of allowed origins, e.g. `https://zoomxdigital.com,https://admin.zoomxdigital.com`. **Do not use `*`** if you need cookies/auth headers to work — see note below. |
| `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD` | Mongo root credentials — used both to start the `mongo` container and to build `DB_URL` |
| `REDIS_PASSWORD` | Redis auth password — used both to start the `redis` container and to build `REDIS_URL` |
| `BCRYPT_SALT_ROUNDS` | Optional, defaults to `10` |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` | Access token signing (expiry defaults to `1d`) |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Refresh token signing (expiry defaults to `7d`) |
| `JWT_OTP_SECRET` | OTP token signing |
| `JWT_PASS_RESET_SECRET` / `JWT_PASS_RESET_EXPIRES_IN` | Password-reset token signing (expiry defaults to `1h`) |
| `SENDER_EMAIL` / `SENDER_APP_PASS` | Nodemailer sender account (Gmail app password or similar) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seeded super-admin account, created on first boot |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_URL` | Cloudflare R2 media storage |

Every JWT secret should be a long random string, **different per environment**, so a leaked staging secret can't forge production tokens. Generate one with e.g. `openssl rand -base64 48`. Treat `MONGO_ROOT_PASSWORD` and `REDIS_PASSWORD` the same way.

`DB_URL` and `REDIS_URL` themselves are **not** set directly — the compose files build them from the credentials above, pointing at the `mongo`/`redis` services on the compose network (`mongodb://<user>:<pass>@mongo:27017/...?authSource=admin`, `redis://:<pass>@redis:6379`).

**MongoDB authentication**: the `mongo` service only applies `MONGO_INITDB_ROOT_*` on a fresh, empty data volume — changing these env vars on an environment that already has data does nothing until you delete that environment's `mongo_data` volume in Dokploy and let it recreate empty on next deploy.

**`CORS_ORIGIN=*` and credentials don't mix**: the backend's `cors` middleware sets `credentials: true` (required for cookie-based auth). Per the CORS spec, browsers reject `Access-Control-Allow-Origin: *` combined with `Access-Control-Allow-Credentials: true` — the request looks like it "succeeds" (`204` on the preflight) but the browser blocks it client-side with `Reason: CORS header 'Access-Control-Allow-Origin' missing`, since the server can't legally send a literal `*` in that situation. `src/app.ts` handles `CORS_ORIGIN=*` by reflecting the request's own `Origin` header instead (works with credentials, but is effectively open to any site) — treat that as a temporary fallback for early development, not a production setting. Set real origins instead, e.g. `CORS_ORIGIN=https://zoomxdigital.com,https://admin.zoomxdigital.com`.

---

## 5. Gotchas

**1. Port 3000 is taken by Dokploy itself; port 5000+ is generally safe for this backend.**
Dokploy's own dashboard runs on host port `3000`, and it also occupies `80`/`443` via Traefik. If you ever hit "port is already allocated", SSH into the server and run `docker ps -a` to see what's already bound, then change the host-side port in the relevant compose file.

**2. Enabling "auto deploy" does not trigger an initial deploy.**
After configuring a new Compose service and enabling on-push deploys, nothing builds until the *next* push. Fix: after first configuring a service, manually click **Deploy** on the service's **General** tab to kick off the first build.

**3. "Connection refused" almost always means no container is listening, not a firewall issue.**
`curl` returning `Connection refused` (not a timeout) means the TCP stack responded but nothing was bound to that port — check `docker ps -a` on the server before suspecting network/firewall configuration.

**4. Handlebars email templates are read from disk at runtime, not bundled by `tsc`.**
`src/app/utils/emailHelper.ts` resolves template paths via `process.cwd() + "/src/templates/..."`. The `Dockerfile`'s runtime stage copies `src/templates/` alongside `dist/` for this reason — if you add a new template file, no code change is needed, but don't remove that `COPY` step.

**5. `X-Forwarded-For` behind Traefik requires `trust proxy`.**
Dokploy's Traefik reverse proxy sits directly in front of the container and sets `X-Forwarded-For`. Without `app.set("trust proxy", 1)` in `src/app.ts`, `express-rate-limit` throws `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` on every request (it refuses to trust a forwarded-for header it wasn't told to expect, since blindly trusting it would let a client spoof its own rate-limit identity). `trust proxy` is set to `1` (trust exactly one hop) rather than `true` (trust any number of hops), matching the real topology.

**6. Don't reintroduce MongoDB transactions without also reintroducing a replica set.**
`loginUser`/`registerUser` used to call `session.startTransaction()`, which only works on a replica set or sharded cluster — Mongo here runs standalone, so that threw `IllegalOperation: Transaction numbers are only allowed on a replica set member or mongos`. The transaction usage was removed (see [§3](#3-cd-dokploy-on-contabo)) rather than converting Mongo to a replica set, to keep the database infrastructure simple. If you add `session`/transaction usage back anywhere, you'll need to reintroduce replica-set configuration too, or it will fail the same way in staging/production.

---

## 6. Secrets hygiene

`.env.development`, `.env.production` etc. are environment-specific files with real secrets and are gitignored (`.env`, `.env.*`, except `.env.example`) — only commit `.env.example` with placeholder values. If real secrets were committed to this repo's history previously, rotate them (JWT secrets, admin password, DB/Redis credentials, R2 keys, email app password) since anyone with repo access could have read them from git history even after the files are removed going forward.
