# Reporting — Events

Consume versioned domain facts/events for reportable resources. Each event includes tenant, eventId, source type/id/version and occurredAt. Projection handlers are idempotent and ignore stale versions. Examples include invoice/payment, task/project, timesheet, visit and customer changes. Reporting may publish projection/rebuild lifecycle events.