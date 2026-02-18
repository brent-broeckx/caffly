# Developer Chat App

Monorepo bootstrap for the MVP.

## Workspace Layout

- `apps/frontend` — web UI foundation
- `apps/backend` — API foundation
- `apps/electron` — desktop shell foundation

## Commands

- `npm run lint` — lint all workspaces
- `npm run test` — run tests in all workspaces
- `npm run build` — build all workspaces

## Run Locally (UI + Backend)

- Install dependencies: `npm install`
- Start backend + frontend together: `npm run dev`
- Frontend URL: `http://localhost:5173`
- Backend URL: `http://localhost:4000`

### Optional Single-Service Commands

- Backend only: `npm run dev:backend`
- Frontend only: `npm run dev:frontend`

## Environment Strategy (dev/staging/prod)

- Backend loads `.env` and then `.env.{APP_ENV}` (`development` by default).
- Prisma uses the same strategy through `apps/backend/prisma.config.ts`.
- Use these example files as templates:
	- `apps/backend/.env.example`
	- `apps/backend/.env.development.example`
	- `apps/backend/.env.staging.example`
	- `apps/backend/.env.production.example`
	- `apps/frontend/.env.example`
	- `apps/electron/.env.example`
- Set `APP_ENV` to one of: `development`, `staging`, `production`.
