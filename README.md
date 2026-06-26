# StartupForge — Backend API

A production-ready, scalable REST API for **StartupForge**, a platform that connects startup founders with collaborators. Built with Node.js, Express, MongoDB, JWT auth (HTTPOnly cookies), Stripe payments, and ImgBB image uploads.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Reference](#api-reference)
- [Authentication & Authorization](#authentication--authorization)
- [Business Rules](#business-rules)
- [Stripe Payments](#stripe-payments)
- [Image Upload (ImgBB)](#image-upload-imgbb)
- [Security](#security)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Logging](#logging)
- [Testing](#testing)
- [Deployment Notes](#deployment-notes)
- [Architectural Decisions](#architectural-decisions)

---

## Overview

StartupForge has three roles:

| Role | Capabilities |
|------|-------------|
| **Founder** | Creates **one** startup, posts opportunities (3 free / unlimited with premium), reviews applications, buys premium via Stripe |
| **Collaborator** | Browses startups & opportunities, applies, tracks applications, manages profile |
| **Admin** | Manages users (block/unblock), approves/rejects startups, views all transactions, sees platform analytics |

The API is layered (routes → controllers → services → models), validates all input, centralizes error handling, and returns a consistent JSON envelope.

---

## Tech Stack

- **Runtime:** Node.js ≥ 18
- **Framework:** Express 4
- **Database:** MongoDB + Mongoose 8
- **Auth:** JWT in HTTPOnly cookies (7-day expiry), bcrypt (12 salt rounds)
- **Payments:** Stripe Checkout + webhooks
- **Uploads:** ImgBB API (via Axios + multer)
- **Security:** Helmet, CORS, `express-mongo-sanitize`, `express-rate-limit`
- **Validation:** `express-validator`
- **Logging:** Winston + Morgan
- **HTTP test:** REST Client (`.http`)

---

## Features

- ✅ Credential + Google OAuth (simulated) authentication
- ✅ Role-Based Access Control (founder / collaborator / admin)
- ✅ Full CRUD for startups, opportunities, applications
- ✅ Search, filter and pagination for opportunities (`$regex`, `$in`)
- ✅ Premium tier enforced (max 3 opportunities for free founders)
- ✅ Stripe Checkout + signed webhook → premium activation
- ✅ ImgBB image upload with size/type validation
- ✅ Global error handler with a consistent response envelope
- ✅ Request logging, security headers, NoSQL-injection protection, rate limiting

---

## Project Structure

```
server/
├── src/
│   ├── config/        # database, cors, stripe
│   ├── models/        # Mongoose schemas
│   ├── controllers/   # HTTP layer (thin)
│   ├── services/      # business logic
│   ├── routes/        # Express routers + index
│   ├── middlewares/   # auth, rbac, errorHandler, validation, upload
│   ├── validators/    # express-validator chains
│   ├── utils/         # ApiError, ApiResponse, jwt, logger, pagination, asyncHandler
│   ├── app.js         # express app factory
│   └── server.js      # entrypoint (DB connect + listen + graceful shutdown)
├── test.http          # REST Client examples for every endpoint
├── .env.example
├── .gitignore
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 16
- A MongoDB instance (Atlas or local)
- (Optional) Stripe account + ImgBB API key for payments & uploads

### Install

```bash
git clone <your-repo-url> startupforge-backend
cd startupforge-backend
npm install
```

### Configure

```bash
cp .env.example .env
# Edit .env with your real values (Mongo URI, JWT secret, Stripe, ImgBB, etc.)
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | Full MongoDB connection string |
| `DB_NAME` | Database name (default `startupforge`) |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRE` | Token expiry (default `7d`) |
| `JWT_COOKIE_EXPIRE` | Cookie lifetime in days (default `7`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (if used) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `PREMIUM_PRICE_ID` | Optional pre-created Stripe Price id |
| `IMGBB_API_KEY` | ImgBB API key |
| `CLIENT_URL` | Frontend origin (CORS + redirect URLs) |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |

---

## Running the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Health check:

```bash
curl http://localhost:5000/api/health
# { "success": true, "message": "StartupForge API is up.", ... }
```

---

## API Reference

Base URL: `/api`

### Auth (`/api/auth`)
| Method | Path | Access |
|--------|------|--------|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/logout` | Public |
| GET | `/me` | Authenticated |
| PUT | `/update-profile` | Authenticated |

### Startups (`/api/startups`)
| Method | Path | Access |
|--------|------|--------|
| GET | `/` | Public |
| GET | `/:id` | Public |
| GET | `/my-startup` | Founder |
| POST | `/` | Founder |
| PUT | `/:id` | Founder (owner) |
| DELETE | `/:id` | Founder (owner) |

### Opportunities (`/api/opportunities`)
| Method | Path | Access |
|--------|------|--------|
| GET | `/` | Public (search/filter/paginate) |
| GET | `/:id` | Public |
| GET | `/my-opportunities` | Founder |
| POST | `/` | Founder |
| PUT | `/:id` | Founder (owner) |
| DELETE | `/:id` | Founder (owner) |

**Query params for `GET /`:** `page`, `limit`, `search`, `work_type` (csv), `commitment_level` (csv), `skills` (csv), `industry` (csv).

### Applications (`/api/applications`)
| Method | Path | Access |
|--------|------|--------|
| POST | `/` | Collaborator |
| GET | `/my-applications` | Collaborator |
| GET | `/opportunity/:id` | Founder (owner) |
| PUT | `/:id/status` | Founder (owner) |
| DELETE | `/:id` | Collaborator (applicant) |

### Payments (`/api/payments`)
| Method | Path | Access |
|--------|------|--------|
| POST | `/create-checkout-session` | Founder |
| POST | `/webhook` | Stripe (raw body) |
| GET | `/verify-premium` | Founder |
| GET | `/my-transactions` | Founder |

### Admin (`/api/admin`)
| Method | Path | Access |
|--------|------|--------|
| GET | `/users` | Admin |
| PUT | `/users/:id/block` | Admin |
| PUT | `/users/:id/unblock` | Admin |
| GET | `/startups` | Admin |
| PUT | `/startups/:id/approve` | Admin |
| PUT | `/startups/:id/reject` | Admin |
| DELETE | `/startups/:id` | Admin |
| GET | `/transactions` | Admin |
| GET | `/analytics` | Admin |

### Upload (`/api/upload`)
| Method | Path | Access |
|--------|------|--------|
| POST | `/image` | Authenticated |

### Response Envelope

```jsonc
// Success
{ "success": true, "message": "...", "data": { /* ... */ } }

// Paginated
{ "success": true, "message": "...", "data": [ /* ... */ ],
  "pagination": { "current": 1, "total": 15, "count": 145, "limit": 10,
                  "hasNext": true, "hasPrev": false } }

// Error
{ "success": false, "message": "...", "errors": [ /* optional */ ],
  "stack": "..." /* dev only */ }
```

---

## Authentication & Authorization

- On successful **register** or **login**, the server signs a JWT and sets it in an **HTTPOnly** cookie (`token`). The token is also returned in the response body for non-browser clients.
- `protect` middleware verifies the cookie (or `Authorization: Bearer` header) and attaches `req.user`.
- `authorize(...roles)` (and the `isFounder`/`isCollaborator`/`isAdmin` wrappers) enforce role checks.
- Blocked users are rejected with `403`.
- Password requirements: **min 6 chars, ≥1 uppercase, ≥1 lowercase**; hashed with bcrypt (12 rounds).

---

## Business Rules

### Startups
- A founder may create **exactly one** startup (unique index on `founder_email`).
- New startups default to `pending`; only `approved` startups appear publicly and can host opportunities.

### Opportunities
- The founder's startup **must be approved** to post opportunities.
- **Free** founders: max **3** opportunities. **Premium**: unlimited.
- Exceeding the free limit returns `403 Upgrade to premium to post more than 3 opportunities`.

### Applications
- A collaborator can apply once per opportunity (unique index + service check).
- Cannot apply to inactive opportunities or past deadlines.
- Founders **cannot** apply to their own opportunities.
- When a founder **accepts** an application, `startup.team_size` is incremented and `reviewed_at` is stamped.

---

## Stripe Payments

**Premium Founder** — $29.00 one-time / 30-day premium activation.

1. `POST /api/payments/create-checkout-session` → returns a Stripe Checkout `url`.
2. User completes payment on Stripe.
3. Stripe sends `checkout.session.completed` to `POST /api/payments/webhook`.
4. The webhook verifies the signature with `STRIPE_WEBHOOK_SECRET`, marks the user `isPremium = true` (30-day expiry), and records a `Payment` document (idempotent on the Stripe session id).

**Local webhook testing:**

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

> The webhook route uses `express.raw({ type: 'application/json' })` *before* the main JSON parser so the raw body is available for signature verification.

---

## Image Upload (ImgBB)

`POST /api/upload/image` — `multipart/form-data` with field name **`image`**.

- Max size: **5 MB**
- Allowed types: `jpg`, `jpeg`, `png`, `gif`, `webp`
- Returns `{ success: true, data: { url, delete_url, width, height } }`

---

## Security

- **Helmet** for secure HTTP headers.
- **CORS** restricted to `CLIENT_URL` + `ALLOWED_ORIGINS`.
- **HTTPOnly + SameSite cookies** for JWT (Secure in production).
- **bcrypt** password hashing (12 rounds).
- **express-mongo-sanitize** strips `$`/`.` from inputs (NoSQL injection defense).
- **express-rate-limit**: 100 requests / 15 minutes / IP on `/api`.
- **Input validation** on every mutating endpoint.
- All secrets via environment variables (`.env` is git-ignored).

---

## Error Handling

A single global error handler converts thrown errors into the documented envelope:

| Source | Status |
|--------|--------|
| `ApiError` (operational) | its own code |
| Mongoose `ValidationError` | 400 |
| Duplicate key (11000) | 409 |
| `CastError` (bad ObjectId) | 400 |
| JWT invalid/expired | 401 |
| Stripe errors | Stripe's status |
| Anything else | 500 (stack hidden in production) |

---

## Pagination

All list endpoints accept `?page=N&limit=M` (limit capped at 100) and return a `pagination` object with `current`, `total`, `count`, `limit`, `hasNext`, `hasPrev`.

---

## Logging

- **Winston** writes `error.log`, `combined.log`, plus `exceptions.log` / `rejections.log`.
- **Morgan** HTTP logs are piped through Winston.
- In development, logs also print to the console (colorized, with stack traces).

---

## Testing

Open `test.http` in VS Code with the **REST Client** extension and use **Send Request** on each block. It covers:

- All authentication flows (credential + Google)
- CRUD for startups, opportunities, applications
- Search / filter / pagination
- Premium checkout + webhook
- Admin endpoints
- Validation, duplicate, auth, and RBAC error scenarios

Example flow:

```bash
# 1. Register/login to get a token (also set as cookie)
POST /api/auth/login  -> { data: { token } }

# 2. Use the token
GET /api/auth/me
Authorization: Bearer <token>
```

---

## Deployment Notes

- `server.js` sets `trust proxy` so secure `SameSite=None` cookies work behind load balancers (Render, Railway, Heroku, etc.).
- Set `NODE_ENV=production`, a strong `JWT_SECRET`, and a real MongoDB URI.
- Configure the **Stripe webhook** in the Stripe dashboard to point at your deployed `/api/payments/webhook`.
- CORS origins must include your deployed frontend domain.

### Google OAuth on Vercel (fix)

Google sign-in (`/api/auth/sign-in/social/google`) requires these env vars to be set correctly in the **Vercel dashboard** (not `.env`, which is only used locally):

| Variable | Production value |
|----------|-----------------|
| `BETTER_AUTH_URL` | `https://<your-vercel-domain>` e.g. `https://startforge-backend.vercel.app` |
| `NODE_ENV` | `production` |
| `TRUSTED_ORIGINS` | `https://<your-frontend-domain>` |
| `CLIENT_URL` | `https://<your-frontend-domain>` |

You must also add the callback URI in **Google Cloud Console → APIs & Services → Credentials → Authorized redirect URIs**:

```
https://startforge-backend.vercel.app/api/auth/callback/google
```

Without `BETTER_AUTH_URL` pointing to the production domain, Better Auth constructs the OAuth redirect URI as `http://localhost:5000/...`, which Google rejects.

---

## Architectural Decisions

1. **Layered architecture** (routes → controllers → services → models) keeps HTTP concerns out of business rules, making the code testable and DRY.
2. **`ApiError` + `asyncHandler` + global error handler** centralize error handling; controllers stay focused on the happy path.
3. **Email as a cross-collection reference** (per the spec) for `founder_email`, `applicant_email`, `user_email`, with unique indexes where uniqueness matters (one startup per founder, one application per user per opportunity).
4. **Mongoose indexes** on hot query paths (`status`, `industry`, `work_type`, `commitment_level`, `startup_id`, `applicant_email`) for fast filtering.
5. **HTTPOnly cookie + Bearer fallback**: browsers use the cookie (XSS-safe); API clients (mobile, CLI) use the Bearer header.
6. **Webhook idempotency** keyed on the Stripe session id prevents double-processing on retry.
7. **Graceful shutdown** (SIGINT/SIGTERM) drains the HTTP server and closes the Mongo connection cleanly.
8. **Validation at the edge** (express-validator) means business logic never has to re-check primitive shapes.

---

Built with ❤️ for founders and collaborators.
