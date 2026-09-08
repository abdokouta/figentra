# Reporting — Jobs and Scheduling

Jobs: projection catch-up, index backfill/rebuild, report execution, large export generation, aggregate refresh, scheduled reports and cleanup. Event-driven work uses durable queues. Calendar schedules use the platform scheduler. Long reports are asynchronous and checkpointed.