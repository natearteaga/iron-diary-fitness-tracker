# Iron Diary API V1 (Draft)

Base URL: `/api/v1`

All endpoints currently use header `x-user-id` as temporary auth.

## Health
- `GET /health`

## Auth placeholder
- `GET /auth/session`

## Meals
- `GET /meals`
- `POST /meals`

## Lifts
- `GET /lifts`
- `POST /lifts`

## Recovery
- `GET /recovery`
- `POST /recovery`
- `GET /recovery/feedback`
- `POST /recovery/feedback`

## Coach
- `POST /coach/insight`
- `GET /coach/insight/latest`

## Apple Health
- `GET /apple-health/status`
- `POST /apple-health/connect`
- `POST /apple-health/sync`
- `GET /apple-health/sync/history`
