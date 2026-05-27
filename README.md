# Project Flow — Collaborative Project Management Tool

A full-stack collaborative project management tool inspired by Trello and Asana. Features real-time board updates via WebSockets, team collaboration with comments and mentions, file attachments, role-based access control, and a notification system — all built with TypeScript from frontend to database.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Monorepo (npm workspaces)                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  apps/web             │  │  apps/api                    │ │
│  │  React 18 + Vite 5   │  │  Express 4 + Prisma 5        │ │
│  │  React Query +       │  │  Socket.IO + JWT Auth        │ │
│  │  Zustand + Socket.IO │  │  Zod Validation + Redis      │ │
│  └──────────┬───────────┘  └──────────┬───────────────────┘ │
│             │                          │                     │
│             │     HTTP / WebSocket     │                     │
│             └──────────────────────────┘                     │
│                        │                                     │
│              ┌─────────┴──────────┐                          │
│              │  PostgreSQL 16     │                          │
│              │  (Primary Store)   │                          │
│              └────────────────────┘                          │
│              ┌────────────────────┐                          │
│              │  Redis 7           │                          │
│              │  (Cache + Pub-Sub) │                          │
│              └────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Authentication & Users
- Register, login, logout with JWT (access + refresh tokens)
- Refresh token rotation with session management
- Profile management: update display name, change password
- Avatar upload support

### Projects & Teams
- Create, update, delete projects
- Invite team members by email
- Role-based access: Owner, Admin, Member
- Remove members or change roles

### Boards & Columns
- Multiple boards per project with tab switcher
- Custom columns per board (e.g. To Do, In Progress, Done)
- Create, rename, delete columns
- Reorderable columns

### Tasks
- Full CRUD with title, description, priority, due dates
- Drag between columns (via column move)
- Assign multiple team members
- Priority levels: Low, Medium, High, Urgent
- Search tasks across the entire project with filters (assignee, column, due date range)

### Comments & Mentions
- Threaded comments on tasks
- @username mention parsing with notification generation
- Delete own comments

### File Attachments
- Upload files to tasks (configurable size limit)
- Download linked files
- Remove attachments

### Real-Time Updates
- Socket.IO with per-project rooms
- Live board updates when tasks/comments change
- Redis adapter for multi-instance pub-sub scaling

### Notifications
- In-app notification list with read/unread state
- Mark individual or all notifications as read
- Per-type notification preferences (tasks, mentions, comments, invites, etc.)
- Real-time delivery via WebSocket

### Rate Limiting
- Redis-based sliding window rate limiter (configurable)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Build** | Vite 5 | Dev server and bundler |
| **Routing** | React Router v6 | Client-side routing |
| **Server State** | TanStack React Query v5 | Data fetching, caching, mutations |
| **Client State** | Zustand v4 | UI state (sidebar, mobile) |
| **Real-Time** | Socket.IO v4 | WebSocket updates |
| **Backend** | Express 4 + TypeScript | HTTP API server |
| **Database** | PostgreSQL 16 | Primary relational store |
| **ORM** | Prisma 5 | Type-safe queries, migrations |
| **Cache** | Redis 7 | Session cache, pub-sub, rate limiting |
| **Auth** | jsonwebtoken + bcryptjs | JWT access/refresh tokens |
| **Validation** | Zod | Request body validation |
| **File Uploads** | Multer | Multipart file handling |
| **Infrastructure** | Docker Compose | PostgreSQL, Redis, full stack |

## Project Structure

```
├── .dockerignore
├── .env.example
├── .github/copilot-instructions.md
├── .gitignore
├── .kiro/specs/project-management-tool/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── docker-compose.yml          # PostgreSQL + Redis + API + Web
├── package.json                # Root monorepo config
├── tsconfig.base.json          # Shared TS config
├── apps/
│   ├── api/                    # Backend
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   └── schema.prisma   # 14 models
│   │   └── src/
│   │       ├── server.ts       # Entry point
│   │       ├── app.ts          # Express app setup
│   │       ├── config/env.ts   # Environment config
│   │       ├── lib/
│   │       │   ├── prisma.ts   # Prisma client
│   │       │   └── redis.ts    # Redis client + session cache
│   │       ├── middleware/
│   │       │   ├── auth.ts     # JWT auth
│   │       │   ├── error.ts    # Global error handler
│   │       │   └── rateLimit.ts # Redis rate limiter
│   │       ├── routes/
│   │       │   ├── auth.ts           # /api/auth
│   │       │   ├── users.ts          # /api/users
│   │       │   ├── projects.ts       # /api/projects
│   │       │   ├── boards.ts         # /api/boards
│   │       │   ├── columns.ts        # /api/columns
│   │       │   ├── tasks.ts          # /api/tasks
│   │       │   ├── comments.ts       # /api/comments
│   │       │   └── notifications.ts  # /api/notifications
│   │       ├── realtime/socket.ts    # Socket.IO + Redis adapter
│   │       ├── types/express.d.ts    # Request augmentation
│   │       └── utils/
│   │           ├── jwt.ts, password.ts, tokens.ts
│   │           ├── duration.ts, mentions.ts
│   │           ├── uploads.ts, users.ts
│   └── web/                    # Frontend
│       ├── Dockerfile
│       ├── nginx.conf           # Nginx config for production
│       └── src/
│           ├── main.tsx         # Entry point
│           ├── App.tsx          # Routes + AuthProvider
│           ├── styles.css       # Complete design system (700+ lines)
│           ├── context/
│           │   └── AuthContext.tsx
│           ├── store/
│           │   └── ui.ts        # Zustand sidebar/mobile state
│           ├── lib/
│           │   └── api.ts       # Fetch wrapper with JWT + auto-refresh
│           ├── pages/
│           │   ├── Login.tsx
│           │   ├── Register.tsx
│           │   ├── Dashboard.tsx         # Project grid + invitations
│           │   ├── ProjectBoard.tsx      # Kanban board + team + search
│           │   └── Profile.tsx           # Avatar, name, password
│           └── components/
│               ├── Layout.tsx            # Dark sidebar + topbar
│               ├── TaskModal.tsx         # Task detail/edit modal
│               └── NotificationsPanel.tsx # Notifications + preferences
```

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **Docker** and **Docker Compose** (for PostgreSQL and Redis)
- **npm** 9+

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd project-management-tool
npm install
```

### 2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d redis postgres
```

### 4. Run database migrations

```bash
npm run db:migrate -w @pmt/api
```

### 5. Start development servers

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000/api/health

### 6. (Optional) Seed sample data

```bash
# Connect to psql and explore:
docker compose exec postgres psql -U pmt -d pmt
```

## Running with Docker (Full Stack)

To run the entire application (including API and Web) in Docker containers:

```bash
docker compose up --build
```

- **Web App**: http://localhost:80
- **API**: http://localhost:4000

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | `5432` | PostgreSQL 16 database |
| `redis` | `6380` (host) → `6379` (container) | Redis 7 cache / pub-sub |
| `api` | `4000` | Express API server |
| `web` | `80` | Nginx serving built frontend + API proxy |

## Environment Variables

### API (`apps/api/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | API server port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | `dev_secret` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | `dev_refresh` | Secret for signing refresh tokens |
| `TOKEN_EXPIRES_IN` | `15m` | Access token TTL |
| `REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `UPLOAD_DIR` | `uploads` | File upload directory |
| `UPLOAD_MAX_SIZE_MB` | `10` | Max upload size in MB |
| `REDIS_URL` | `redis://localhost:6380` | Redis connection URL |

### Web (`apps/web/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:4000` | API base URL |

## API Overview

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout (clears session) |
| `POST` | `/api/auth/refresh` | Refresh access token |

### Users
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users/me` | Get current user |
| `PATCH` | `/api/users/me` | Update profile |
| `POST` | `/api/users/me/avatar` | Upload avatar |
| `PATCH` | `/api/users/me/password` | Change password |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects` | List user's projects |
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects/:id` | Get project with boards, columns, tasks, members |
| `PATCH` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `POST` | `/api/projects/:id/invitations` | Invite member by email |
| `GET` | `/api/projects/invitations/pending` | List user's pending invitations |
| `POST` | `/api/projects/invitations/:id/accept` | Accept invitation |
| `DELETE` | `/api/projects/:id/members/:userId` | Remove member |
| `PATCH` | `/api/projects/:id/members/:userId/role` | Change member role |
| `GET` | `/api/projects/:id/tasks/search?q=` | Search tasks across project |

### Boards
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/boards/:id` | Get board with columns and tasks |
| `PATCH` | `/api/boards/:id` | Update board |
| `DELETE` | `/api/boards/:id` | Delete board |
| `POST` | `/api/boards/:id/columns` | Create column |
| `PATCH` | `/api/boards/:id/columns/reorder` | Reorder columns |

### Columns
| Method | Path | Description |
|--------|------|-------------|
| `PATCH` | `/api/columns/:id` | Rename column |
| `DELETE` | `/api/columns/:id` | Delete column |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tasks/:id` | Get task details with assignees, comments, attachments |
| `PATCH` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `PATCH` | `/api/tasks/:id/move` | Move task to another column |
| `PATCH` | `/api/tasks/:id/assignees` | Update assignees |
| `POST` | `/api/tasks/:id/comments` | Add comment |
| `POST` | `/api/tasks/:id/attachments` | Upload file attachment |
| `DELETE` | `/api/tasks/:id/attachments/:attId` | Remove attachment |

### Comments
| Method | Path | Description |
|--------|------|-------------|
| `PATCH` | `/api/comments/:id` | Update comment |
| `DELETE` | `/api/comments/:id` | Delete comment |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications` | List user's notifications |
| `PATCH` | `/api/notifications/read-all` | Mark all as read |
| `PATCH` | `/api/notifications/:id/read` | Mark one as read |
| `GET` | `/api/notifications/preferences` | Get notification preferences |
| `PATCH` | `/api/notifications/preferences` | Update notification preferences |

## Real-Time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `project:join` | Client → Server | Join a project room |
| `project:leave` | Client → Server | Leave a project room |
| `task:created` | Server → Client | New task added |
| `task:updated` | Server → Client | Task edited |
| `task:moved` | Server → Client | Task moved between columns |
| `task:deleted` | Server → Client | Task removed |
| `comment:created` | Server → Client | New comment added |
| `notification:new` | Server → Client | New notification |
| `member:joined` | Server → Client | Member joined project |
| `member:left` | Server → Client | Member removed from project |

## Database Schema

14 models: `User`, `Session`, `Project`, `ProjectMember`, `Invitation`, `Board`, `Column`, `Task`, `TaskAssignee`, `Attachment`, `Comment`, `Mention`, `Notification`, `NotificationPreference`.

### Key relationships

- **User** 1→* Session, Project (owner), ProjectMember, Task (creator), Comment, Notification
- **Project** 1→* Board, ProjectMember, Invitation
- **Board** 1→* Column
- **Column** 1→* Task
- **Task** 1→* TaskAssignee, Comment, Attachment
- **Comment** 1→* Mention

Browse the schema with Prisma Studio:

```bash
npx prisma studio --schema=apps/api/prisma/schema.prisma
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both API and web in dev mode |
| `npm run build` | Build both apps for production |
| `npm run lint` | Lint both apps |
| `npm run format` | Format all files with Prettier |
| `npm run db:migrate -w @pmt/api` | Run database migrations |
| `npm run db:generate -w @pmt/api` | Regenerate Prisma client |

## Redis Usage

Redis is used for three purposes:

1. **Session Cache** — Session data is cached after DB creation to speed up token refresh lookups. Falls back to PostgreSQL if Redis is unavailable.
2. **Socket.IO Pub-Sub** — The `@socket.io/redis-adapter` enables multi-instance message broadcasting. When the app scales to multiple API servers, events published on one instance are forwarded to all others.
3. **Rate Limiting** — A sliding-window rate limiter (100 requests/min per IP) using Redis `INCR` + `PEXPIRE`.

All Redis operations are wrapped in try/catch and degrade gracefully if Redis is down.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 4000 already in use | Stop the Docker API container: `docker compose stop api` |
| Redis connection refused | Start Redis: `docker compose up -d redis` |
| Prisma engine not found on Alpine | `binaryTargets` in `schema.prisma` must include `linux-musl-openssl-3.0.x` |
| WebSocket not connecting | Ensure `VITE_API_URL` matches the API server URL |
| File uploads failing | Check `UPLOAD_DIR` exists and is writable |

## Design Decisions

- **Monorepo with npm workspaces** — Shared TypeScript config, single `node_modules`, unified scripts
- **React Query + Zustand** — Server state (API data) handled by React Query; client-only UI state (sidebar) by Zustand
- **Socket.IO with Redis adapter** — Enables horizontal scaling; without Redis, Socket.IO falls back to in-process broadcast
- **JWT with refresh token rotation** — Each refresh invalidates the previous token; sessions stored in DB with optional Redis cache
- **Plain CSS with custom properties** — Zero-dependency styling; all variables in `:root` for easy theming

## License

MIT
