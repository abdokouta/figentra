---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/scheduler'
---
# `@stackra/scheduler` — Durable Scheduling Primitives

## Boundary
Reusable scheduling contracts for services that need recurring or delayed work. It does not replace the owning service's scheduler role and does not own business schedules. Workflow owns workflow timers; Queue owns job execution; `@stackra/scheduler` owns schedule representation, timezone/next-occurrence calculation, claiming/leases and idempotent occurrence creation.

## Subpaths
```text
@stackra/scheduler
@stackra/scheduler/nestjs
@stackra/scheduler/cron
@stackra/scheduler/timezone
@stackra/scheduler/testing
```

## Public API
```ts
interface ScheduleDefinition { id:string; tenantId:string; expression:string; timezone:string; enabled:boolean; payloadRef:string; version:number; }
interface Scheduler {
  create(ctx:RequestContext,input:CreateScheduleInput):Promise<ScheduleView>;
  update(ctx:RequestContext,id:string,expectedVersion:number,input:UpdateScheduleInput):Promise<ScheduleView>;
  next(schedule:ScheduleDefinition,from:Date):Date | null;
  claimDue(limit:number,owner:string,now:Date):Promise<readonly ScheduleOccurrence[]>;
  complete(occurrenceId:string,result:ScheduleResult):Promise<void>;
}
```

## Execution
```text
schedule definition
 → due-time calculator
 → durable occurrence
 → scheduler service role claims lease
 → @stackra/queue job
 → owning handler
 → idempotent occurrence completion
```
No schedule fires business logic directly in a timer callback.

## Time semantics
IANA timezone identifiers are mandatory for user schedules. DST ambiguous/nonexistent local times are resolved by an explicit policy and covered by fixtures. Occurrence identity is `(scheduleId, scheduledAt, scheduleVersion)` and makes retries idempotent.

## Persistence contract
Host service owns `schedules`, `schedule_occurrences` and lease columns. Occurrences retain status, attempt, claimedBy, leaseUntil, nextAttemptAt and result metadata. State transitions are monotonic and optimistic/concurrency protected.

## Failure/recovery
Expired leases can be reclaimed. Clock skew is bounded by deployment policy. Malformed expressions are rejected at write time. Handler failure affects the queue job, not schedule state directly. Missed runs use explicit catch-up policy: skip, one catch-up, or bounded replay.

## Testing
Cron/timezone/DST fixtures, leap dates, missed-run policy, duplicate claims, lease expiration, optimistic races, occurrence idempotency and real NestJS scheduler integration.
