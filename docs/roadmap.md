# Iron Diary Roadmap (Execution)

## Phase 0: Foundation (Current)

- Monorepo workspace initialized.
- API scaffolded at `apps/api`.
- Prisma schema covers meals, lifts, recovery, coach insights, and Apple Health integration state.

## Phase 1: Core Product V1 (2-4 weeks)

1. Auth and user model hardening
- Replace `x-user-id` placeholder with production auth (Clerk/Firebase/Auth0).
- Add session middleware and user provisioning on first login.

2. Data quality and CRUD completeness
- Add update/delete endpoints for meal/lift/recovery/feedback entities.
- Add pagination and date range filters.
- Add validation boundaries per domain rule.

3. Insight service hardening
- Move insight computation to deterministic service layer tests.
- Store provenance per driver (which metrics influenced each explanation).
- Add confidence thresholds and fallback copy.

4. Client integration
- Replace static prototype with mobile app (Expo) consuming API.
- Add optimistic updates and offline queue for logs.

## Phase 2: Apple Health Sync (2-3 weeks)

1. iOS HealthKit bridge
- Request permissions for energy/macros/workouts/body weight.
- Implement pull + push adapters in React Native iOS layer.

2. Sync orchestration
- Add sync worker/queue processing `AppleHealthSyncEvent` jobs.
- Dedupe with `AppleHealthSampleMap` using HealthKit sample UUIDs.
- Handle retries + idempotency keys.

3. User controls
- Add per-data-type toggles (write calories only, include workouts, etc).
- Add “Sync now”, last sync status, and conflict notices.

## Phase 3: Reliability and Scale (ongoing)

- Add background jobs (BullMQ or cloud queue).
- Add error monitoring (Sentry), tracing, and usage analytics.
- Add backups and migration safety checks.
- Add privacy compliance workflows (export/delete account data).

## Immediate next sprint backlog

- Implement API endpoint tests for all v1 routes.
- Add migration files and local Docker Postgres setup.
- Build initial Expo app skeleton with Home, Meal Log, Lift Log, Recovery, Iron Coach screens.
