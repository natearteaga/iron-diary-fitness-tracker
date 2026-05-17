# Iron Diary API

Express + Prisma backend for Iron Diary.

## Quick start

1. Copy `.env.example` to `.env`.
2. Install deps from repo root: `npm install`.
3. Generate Prisma client: `npm run prisma:generate --workspace @irondiary/api`.
4. Run migrations: `npm run prisma:migrate --workspace @irondiary/api`.
5. Start dev server: `npm run dev:api`.

## API base

- `http://localhost:4000/api/v1`

Use header `x-user-id` for user context during local development.
