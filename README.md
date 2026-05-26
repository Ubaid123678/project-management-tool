# Project Management Tool

A collaborative project management tool with boards, tasks, comments, notifications, file attachments, and realtime updates.

## Features

- Auth: register, login, logout
- Projects: create, update, delete, invite members
- Boards: multiple boards per project, columns, and tasks
- Tasks: details, priority, due dates, assignment, and search
- Comments: mentions with notifications
- Attachments: upload and download files
- Realtime: board updates and notifications via Socket.IO

## Prerequisites

- Node.js 18+
- Docker (for Postgres and Redis)

## Setup

1. Copy environment files:
   - `apps/api/.env.example` to `apps/api/.env`
   - `apps/web/.env.example` to `apps/web/.env`
2. Start dependencies:
   - `docker compose up -d`
3. Install dependencies:
   - `npm install`
4. Initialize the database:
   - `npm run db:migrate -w @pmt/api`
5. Run the app:
   - `npm run dev`

## Local URLs

- Web: `http://localhost:5173`
- API: `http://localhost:4000/api/health`
- Uploads: `http://localhost:4000/uploads/<file>`

## Database Access

- Connection string: `postgresql://pmt:pmt@localhost:5432/pmt?schema=public`
- Prisma Studio:
  - `npx prisma studio --schema=apps/api/prisma/schema.prisma`

## Environment Variables

API ([apps/api/.env.example](apps/api/.env.example)):

- `PORT` - API server port (default `4000`)
- `DATABASE_URL` - Postgres connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - auth secrets
- `TOKEN_EXPIRES_IN`, `REFRESH_EXPIRES_IN` - token durations
- `CORS_ORIGIN` - web app origin
- `UPLOAD_DIR` - upload folder (default `uploads`)
- `UPLOAD_MAX_SIZE_MB` - max upload size (default `10`)

Web ([apps/web/.env.example](apps/web/.env.example)):

- `VITE_API_URL` - API base URL

## Troubleshooting

- If port 4000 is already in use, stop the process or update `PORT` in `apps/api/.env`.
- Redis is mapped to host port `6380` in [docker-compose.yml](docker-compose.yml) to avoid conflicts with local Redis on 6379.
- If Prisma Studio complains about the schema path, run it from `apps/api` without `--schema`.

## Scripts

- `npm run dev` - Run API and web app in dev mode
- `npm run build` - Build both apps
- `npm run lint` - Lint both apps
- `npm run format` - Format all files
