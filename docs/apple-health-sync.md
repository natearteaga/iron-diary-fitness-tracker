# Apple Health Sync Design (V1)

## Goals

- Let users export Iron Diary nutrition/workout data to Apple Health.
- Optionally import selected Apple Health signals to enrich coach insights.
- Prevent duplicate samples and maintain auditability.

## Initial data contract

### Write to Apple Health
- Dietary Energy (kcal)
- Dietary Protein, Carbohydrates, Fat
- Workout sessions

### Read from Apple Health (optional)
- Active Energy Burned
- Body Weight
- Workout sessions recorded outside Iron Diary

## Data flow

1. User grants HealthKit permissions in iOS app.
2. App calls `POST /api/v1/apple-health/connect` with granted scopes.
3. App triggers `POST /api/v1/apple-health/sync` with direction.
4. Sync worker processes queued event:
- Pulls or pushes samples.
- Upserts `AppleHealthSampleMap` for each sample UUID.
- Marks event `SUCCEEDED` or `FAILED`.
5. App reads status/history for user feedback.

## Dedupe strategy

- Use HealthKit sample UUID as external id.
- Store unique `(userId, sampleUuid)` in `AppleHealthSampleMap`.
- For outbound writes, include metadata containing Iron Diary source id.
- Ignore re-import when sample UUID already mapped.

## Failure handling

- Retry failed sync events with exponential backoff.
- Preserve failure details in `AppleHealthSyncEvent.details`.
- Partial success should still commit successful mappings.

## Security and privacy

- Only sync with explicit user opt-in.
- Encrypt transport (HTTPS) and secure token/session auth.
- Provide user-visible disconnect and data delete controls.
- Log permission changes and sync attempts for auditing.

## Implementation note

This repo currently stores sync events only. Worker execution and iOS HealthKit bridge are next implementation steps.
