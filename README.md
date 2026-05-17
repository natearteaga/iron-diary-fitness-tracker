# Iron Diary

Iron Diary combines meal tracking, lift logging, recovery signals, and AI coaching into one system.

This repo now contains:

- A multi-screen UI prototype (`index.html`, `styles.css`, `app.js`)
- A production backend scaffold (`apps/api`) with Prisma schema and API routes
- Architecture and execution docs in `docs/`

## Repository structure

- `index.html`, `styles.css`, `app.js`: browser prototype for fast UX iteration
- `apps/api`: Express + TypeScript + Prisma backend
- `docs/roadmap.md`: phased build plan
- `docs/apple-health-sync.md`: Apple Health integration design
- `docs/api-v1.md`: v1 endpoint map

## Run the UI prototype (web)

1. Open `/Users/jackedlatino/Documents/IronDiary(the beginning)/index.html`.
2. Click **Load Reference Demo** for sample data.
3. Navigate into `Meal Log`, `Lift Log`, `Recovery`, and `Iron Coach`.

### UX direction in this prototype

- Nutrition flow is structured like a diary by meal slot (MyFitnessPal-inspired).
- Lift logging uses a live session board with set-by-set inputs and previous-set context (Hevy-inspired).
- Coach screen explains performance deltas with drivers and recommendation history.

## Start the API scaffold

1. Install dependencies from repo root: `npm install`
2. Copy env file: `cp apps/api/.env.example apps/api/.env`
3. Generate Prisma client: `npm run prisma:generate`
4. Run migrations: `npm run prisma:migrate`
5. Start API: `npm run dev:api`

Base API URL: `http://localhost:4000/api/v1`

Temporary auth for local dev uses header `x-user-id`.

## Run the Expo iOS app

Prerequisites:

- Xcode installed (for iOS Simulator)
- Node/npm installed

From repo root:

1. Install dependencies: `npm install`
2. Start Expo iOS simulator: `npm run ios:mobile`

Or run from mobile app directory:

1. `cd apps/mobile`
2. `npm run ios`
