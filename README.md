# ZOOMX Digital — API Server

The backend API for **ZOOMX Digital**, a Bangladeshi e-commerce platform. A
modular Express + TypeScript service backed by MongoDB, with role-based access
control, Cloudflare R2 media storage, realtime notifications and email.

It serves both the public **storefront** (Next.js) and the **admin panel**
(React) over one REST API mounted at `/api`.

---

## Tech stack

| Area | Choice |
|------|--------|
| Runtime | Node.js + **TypeScript** |
| Framework | Express 4 |
| Database | MongoDB via **Mongoose** |
| Auth | JWT (access + refresh) + bcrypt |
| Validation | **Zod** |
| Access control | Custom RBAC middleware (`checkPermission`) |
| Media | Cloudflare **R2** (S3-compatible) + **Sharp** image optimisation |
| Realtime | **Socket.IO** (admin notifications) |
| Email | Nodemailer + Handlebars templates |
| Cache | Redis (**ioredis**) |

---

## Project structure

```
src/
├── server.ts                 # entry — connects Mongo, starts HTTP + Socket.IO
├── app.ts                    # express app, middleware, /api routes
└── app/
    ├── config/               # env config
    ├── middleware/           # auth, permission (RBAC), validate, upload, logging
    ├── routes/index.ts       # mounts every module under /api
    ├── modules/              # ~30 feature modules (one folder each)
    │   └── <module>/         #   route · controller · service · model · validation
    ├── db/                   # seed + migration scripts
    └── utils/                # slug, r2, sendResponse, catchAsync, …
```

Each **module** is self-contained (`*.route.ts`, `*.controller.ts`,
`*.service.ts`, `*.model.ts`, `*.validation.ts`). Scaffold a new one with:

```bash
npm run create-module
```

Modules cover Auth/Users, Employees/Roles/Permissions, Products, Categories,
Orders, Shipping Methods, Product Reviews, Brands, Media Library, Blog,
Comments, Dynamic Content, Inquiries, Notifications, Dashboard, Page Views, and
Action/Error Logs.

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment

Create `.env` (or `.env.development`) in the project root:

```ini
NODE_ENV=development
PORT=5005
SERVER_URL=http://localhost:5005

# Database
DB_URL=mongodb://127.0.0.1:27017/zoomx-digital

# Auth
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=change-me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me
JWT_REFRESH_EXPIRES_IN=365d
JWT_OTP_SECRET=change-me
JWT_PASS_RESET_SECRET=change-me
JWT_PASS_RESET_EXPIRES_IN=10m

# Cloudflare R2 (media storage)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# Cache (optional)
REDIS_URL=redis://127.0.0.1:6379

# Email (password reset, inquiry replies)
SENDER_EMAIL=
SENDER_APP_PASS=

# First super-admin (created by the seed script)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
ADMIN_NAME=Super Admin
```

### 3. Seed the super admin

```bash
npm run seed:user
```

### 4. Run

```bash
npm run dev      # ts-node-dev, hot reload  →  http://localhost:5005/api
```

---

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start with hot reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (`node dist/server.js`) |
| `npm run seed:user` | Create the first super-admin |
| `npm run seed:media` | Seed media library records |
| `npm run create-module` | Scaffold a new feature module |
| `npx ts-node src/app/db/fixProductSlugs.ts` | One-off: regenerate URL-safe product slugs |

---

## Conventions & behaviour

- **API base:** everything is under `/api` (e.g. `POST /api/auth/login`).
- **RBAC:** write routes are gated by `checkPermission("<Module>", "<action>")`.
  SUPER_ADMIN bypasses every check and is a protected account (can't be listed,
  deleted, or have its role/status changed).
- **Order numbers** are sequential per month: `SF-<YYYYMM>-<n>` (atomic counter).
- **Media deletes** are soft (Media Bin); purging from the bin removes the R2
  object permanently.
- **Log retention:** Action & Error logs auto-expire after 30 days via a
  MongoDB TTL index.
- **Responses** share one envelope: `{ success, message, data, meta }`.
