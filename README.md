# Project Management Tool

A collaborative project management tool with boards, tasks, comments, notifications, and realtime updates.

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

## Scripts

- `npm run dev` - Run API and web app in dev mode
- `npm run build` - Build both apps
- `npm run lint` - Lint both apps
- `npm run format` - Format all files
