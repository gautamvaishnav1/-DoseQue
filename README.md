# DoseQue — Task Management REST API

A complete task management application: **Node.js + Express + MongoDB + Redis** backend with a **React + Vite + Tailwind CSS** frontend, fully containerized with **Docker Compose**.

## Features

- Full CRUD REST API for tasks (`create`, `read list`, `read one`, `update`, `delete`)
- Pagination (`page`, `limit`) and status filtering (`?status=Pending`) that work together
- Request validation with clear error messages (invalid title, status, priority, pagination, MongoDB IDs)
- Centralized error handling with consistent JSON responses
- **Real Redis caching** (60 s TTL) for task lists and single tasks, with automatic cache invalidation on every write
- Graceful fallback: if Redis is down, the API keeps serving data from MongoDB
- Responsive React dashboard: create, edit, delete (with confirmation), filter, paginate, with loading/empty/error states and success/error feedback
- Docker Compose stack: frontend, backend, MongoDB (named volume), Redis — with health checks

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Node.js 24, Express 4, Mongoose 8, ioredis 5, express-validator 7, helmet, cors, morgan, dotenv |
| Database  | MongoDB 7 (Docker), Redis 7 (Docker) |
| Frontend  | React 19, Vite 8, Tailwind CSS **v4**, native `fetch` |
| Tooling   | Docker / Docker Compose, nodemon (dev) |

## Folder Structure

```
root/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # MongoDB connection
│   │   │   └── redis.js         # Redis client (failure-tolerant settings)
│   │   ├── models/
│   │   │   └── task.js          # Mongoose Task schema
│   │   ├── controllers/
│   │   │   └── taskController.js# CRUD logic + cache read/write/invalidation
│   │   ├── routes/
│   │   │   └── taskRoutes.js    # Endpoint definitions + validation rules
│   │   ├── middleware/
│   │   │   ├── validate.js      # Runs express-validator results
│   │   │   └── errorHandler.js  # Centralized error handler
│   │   ├── services/
│   │   │   └── cache.js         # All Redis get/set/del + key builders
│   │   ├── app.js               # Express app (middleware + routes)
│   │   └── server.js            # Startup: env vars → DB connect → listen
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskForm.jsx     # Create/edit form
│   │   │   ├── TaskItem.jsx     # Task card with badges + actions
│   │   │   └── Pagination.jsx   # Prev/Next controls
│   │   ├── pages/
│   │   │   └── TasksPage.jsx    # All list state + CRUD orchestration
│   │   ├── services/
│   │   │   └── api.js           # Every API call (fetch wrapper)
│   │   ├── App.jsx              # Page shell (header)
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Theme CSS variables + reusable classes
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf               # Serves build + proxies /api → backend
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Prerequisites

- **Node.js ≥ 20** (tested with v24) and npm
- **Docker Desktop** with Docker Compose (tested with Docker 29 / Compose v5)
- A REST client for manual API testing (optional): Postman, Bruno, or `curl`

## Environment Variables

Backend (`backend/.env` — copy from `backend/.env.example`):

| Variable      | Local development value            | Docker Compose value            | Purpose |
|---------------|------------------------------------|--------------------------------|---------|
| `PORT`        | `5000`                             | `5000`                         | API port |
| `NODE_ENV`    | `development`                      | `production`                   | Environment mode |
| `MONGODB_URI` | `mongodb://127.0.0.1:27018/doseque`| `mongodb://mongodb:27017/doseque` | Mongo connection (Docker uses the **service name**) |
| `REDIS_URL`   | `redis://127.0.0.1:6380`           | `redis://redis:6379`           | Redis connection (Docker uses the **service name**) |
| `FRONTEND_URL`| `http://localhost:5173`            | `http://localhost:5173`        | Allowed origin for CORS |

Frontend (`frontend/.env` — copy from `frontend/.env.example`):

| Variable       | Local development value            | Docker build value | Purpose |
|----------------|------------------------------------|--------------------|---------|
| `VITE_API_URL` | `http://localhost:5000/api`        | `/api`             | Backend base URL (baked into the build) |

> **Note on ports:** MongoDB (host **27018**) and Redis (host **6380**) are published on non-default host ports so they do not collide with other local projects that may already use 27017/6379. Inside the Docker network the services still talk on the standard ports 27017/6379 using the service names `mongodb` and `redis`. No real credentials are stored anywhere — `.env` files are git-ignored.

## Local Setup (development)

```bash
# 1. Start MongoDB + Redis only
docker compose up -d mongodb redis

# 2. Backend
cd backend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run dev                 # nodemon, http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # Vite, http://localhost:5173
```

Open **http://localhost:5173**. The frontend calls the API directly at `http://localhost:5000/api` (CORS allows `FRONTEND_URL`).

## Docker Setup (full stack)

```bash
# Build and start everything
docker compose up --build

# Run in the background instead
docker compose up --build -d

# Check status / health
docker compose ps

# Watch logs (all services, Ctrl+C to stop following)
docker compose logs -f
docker compose logs -f backend   # one service only

# Stop everything (keep the database volume)
docker compose down

# Stop AND delete stored MongoDB data
docker compose down -v
```

Then open:

| Service  | URL | Port mapping |
|----------|-----|--------------|
| Frontend | http://localhost:5173 | `5173 → 80` (nginx) |
| Backend API | http://localhost:5000 | `5000 → 5000` |
| MongoDB | `127.0.0.1:27018` | host-only |
| Redis | `127.0.0.1:6380` | host-only |

**How the services connect:** the backend runs inside the Compose network, so it uses `mongodb://mongodb:27017/...` and `redis://redis:6379` — Docker's built-in DNS resolves the service names to container IPs. The frontend container is built with `VITE_API_URL=/api`, so the browser requests the same origin (`localhost:5173/api/...`) and nginx proxies `/api/` to `http://backend:5000` (see `frontend/nginx.conf`). Compose waits for MongoDB and Redis to pass their health checks before starting the backend.

**Ports used:** 5173 (frontend), 5000 (backend), 27018 (MongoDB), 6380 (Redis) — none overlap with the other local projects on this machine.

## Task Schema

```json
{
  "_id": "6a1b2c3d4e5f6a7b8c9d0e1f",
  "title": "Finish assignment report",
  "description": "Optional free text",
  "status": "Pending | In Progress | Completed",
  "priority": "Low | Medium | High",
  "createdAt": "2026-11-07T10:00:00.000Z",
  "updatedAt": "2026-11-07T10:00:00.000Z"
}
```

- `title` — required string (trimmed, max 200 chars)
- `description` — optional string (max 2000 chars, defaults to `""`)
- `status` — enum, default `Pending`
- `priority` — enum, default `Medium`
- `createdAt` / `updatedAt` — generated and maintained by Mongoose `{ timestamps: true }`

## API Documentation

Base URL: `http://localhost:5000/api`

**Response shape (success):** `{ "success": true, "message": "...", "data": ... }`  
**Response shape (error):** `{ "success": false, "message": "...", "errors": [{ "field", "message" }] }`

### `GET /api/health`

Health check. → `200 { "success": true, "message": "DoseQue API is running" }`

### `POST /api/tasks` — create a task

Request body:

```json
{ "title": "Finish assignment report", "description": "Chapters 3-5", "status": "In Progress", "priority": "High" }
```

Only `title` is required; `status`/`priority` fall back to their defaults.

`201` response:

```json
{
  "success": true,
  "message": "Task created",
  "data": { "_id": "6a1b...", "title": "Finish assignment report", "description": "Chapters 3-5", "status": "In Progress", "priority": "High", "createdAt": "...", "updatedAt": "..." }
}
```

`400` if the title is missing/blank, or status/priority/status values are invalid.

### `GET /api/tasks` — list tasks (pagination + filter)

| Query parameter | Values | Default | Rules |
|-----------------|--------|---------|-------|
| `page` | integer ≥ 1 | `1` | invalid values → `400` |
| `limit` | integer 1–100 | `10` | max **100**; invalid → `400` |
| `status` | `Pending`, `In Progress`, `Completed` | (no filter) | anything else → `400` |

Example: `GET /api/tasks?page=2&limit=5&status=In%20Progress`

```json
{
  "success": true,
  "data": [ { "_id": "...", "title": "...", "status": "In Progress", ... } ],
  "meta": { "currentPage": 2, "totalPages": 3, "totalTasks": 12, "limit": 5 }
}
```

Sorted **newest first** (`createdAt` descending). `skip = (page - 1) * limit` + `limit`, with `countDocuments` on the same filter.

### `GET /api/tasks/:id` — one task

- `200` → `{ "success": true, "data": { ... } }`
- `400` for an invalid ObjectId (e.g. `/api/tasks/not-an-id`)
- `404 { "success": false, "message": "Task not found" }` for a valid-but-missing id

### `PUT /api/tasks/:id` — update a task

Partial updates are allowed — send only the fields you want to change:

```json
{ "status": "Completed", "priority": "High" }
```

→ `200` with the updated document; `400` invalid id/field values; `404` missing task. `updatedAt` is refreshed automatically.

### `DELETE /api/tasks/:id`

→ `200 { "success": true, "message": "Task deleted", "data": { ... } }`; `400` invalid id; `404` missing task.

### Error summary

| Status | When |
|--------|------|
| `400` | validation failed, invalid ObjectId, invalid query params |
| `404` | task not found, unknown route |
| `409` | duplicate key (reserved for unique fields) |
| `500` | unexpected server error (details hidden in production) |

## Redis Caching (how and why)

**What is cached**

1. **Task list responses** — every distinct combination of `page`, `limit` and `status` becomes its own Redis key, so different filters/pages can never receive each other's cached data:
   ```
   tasks:list:page=1:limit=5:status=all          (no status filter)
   tasks:list:page=2:limit=5:status=all
   tasks:list:page=1:limit=50:status=Completed
   ```
2. **Single task responses** — `task:<id>`. Decision: we **do** cache individual tasks, because `GET /api/tasks/:id` follows the same read-heavy pattern, and the invalidation cost is tiny (delete one known key on update/delete).

**Key terms**

- **Cache MISS** — the key does not exist (or Redis is unreachable); the controller queries MongoDB, stores the JSON response in Redis, then answers. Logged as `[Cache] MISS`.
- **Cache HIT** — the key exists; the cached JSON is returned immediately **without touching MongoDB**. Logged as `[Cache] HIT`.
- **TTL (time to live)** — each key is set with `SET key value EX 60`, so Redis deletes it automatically after **60 seconds**. This is a safety net: even if some write path forgot to invalidate, stale data can live at most 60 s.
- **Invalidation** — deleting keys the moment data changes:
  - **create / update / delete** → delete **all** list keys (`KEYS tasks:list:*` then `DEL`), because any write can shift any page (a new task moves page 1, a deletion moves page 2, a status change moves filtered pages).
  - **update / delete** → also delete the exact `task:<id>` key, since that document is now stale.

  *(Why delete ALL list keys instead of being clever? It is the simple, obviously-correct approach for this scale. `KEYS` is O(N) and blocks Redis briefly — acceptable for a small project; a high-traffic system would use `SCAN` or maintain a key index. No Pub/Sub or distributed locking is needed because a single Express process owns invalidation.)*

**Graceful fallback** — every Redis operation in `backend/src/services/cache.js` is wrapped in `try/catch`. The client is configured with `enableOfflineQueue: false` and `maxRetriesPerRequest: 1` so commands fail **immediately** when Redis is down instead of hanging requests. On failure the code logs `[Cache] ... falling back to MongoDB` and continues: reads are served from MongoDB (just uncached), writes still persist and simply cannot invalidate keys they cannot reach. The client keeps reconnecting in the background, so caching resumes automatically when Redis returns — no restart needed.

**Verified behavior** (see "Testing & Verification" below): distinct keys per filter/page, TTL ≈ 60 s, HIT on repeat requests, invalidation after every create/update/delete, and the API answering `200` while the Redis container is stopped.

## Screenshots

No screenshots are included yet. To add them:

1. Start the app (`docker compose up --build` or local dev).
2. Open http://localhost:5173 and capture:
   - `screenshots/01-task-list.png` — dashboard with tasks, badges and pagination
   - `screenshots/02-create-task.png` — the create form filled in
   - `screenshots/03-filter-status.png` — status filter applied
   - `screenshots/04-edit-delete-confirm.png` — edit form / delete confirmation dialog
   - `screenshots/05-docker-compose.png` — terminal showing `docker compose ps` with all services healthy
   - `screenshots/06-redis-cache-logs.png` — backend terminal showing `[Cache] MISS` followed by `[Cache] HIT`
3. Save them in a `screenshots/` folder and link them here:

```markdown
![Task list](screenshots/01-task-list.png)
```

## Testing & Verification

Automated checks were run against the live stack (temporary scripts, not committed):

- **30/30 API tests passed**: create (+defaults+timestamps), list (metadata, newest-first, non-overlapping pages), status filter (`Pending`, `In Progress`), filter×pagination together, invalid `page`/`limit`/`status` rejected with `400`, single GET, malformed id `400`, missing id `404`, partial update + persistence, delete + subsequent `404`, unknown route `404`.
- **Cache tests**: MISS→HIT on repeat request (verified in server logs), separate Redis keys per `page`/`limit`/`status`, TTL ≤ 60 s, single-task key with TTL, all list keys removed on create/update/delete, `task:<id>` removed on update/delete, API still returns `200/201` with the Redis container **stopped** (fallback logged), automatic reconnection and caching resumption after `docker start`.
- **Frontend**: production build compiles (`npm run build`), and CRUD/filter/pagination flows were exercised in the browser against the running API.
- **Docker**: `docker compose up --build` starts frontend, backend, MongoDB and Redis; the backend reaches MongoDB/Redis via service names.

## Known Limitations

- **No authentication/authorization** — intentionally out of scope for this assignment; anyone with API access can modify any task.
- **`npm audit` reports 2 moderate vulnerabilities** in `minimatch` (transitive dependency of `nodemon`, a **development-only** tool). There is no non-breaking fix published yet; production code does not ship `nodemon` (Docker image uses `npm ci --omit=dev`).
- **Cache invalidation deletes all list keys with `KEYS`** — simple and correct for this scale, but `SCAN` would be preferable at high traffic (documented trade-off).
- **Single backend instance** — no horizontal scaling story (would need shared invalidation across instances).
- **`PUT` replaces nothing; it merges** — standard partial-update semantics via `findByIdAndUpdate`.
