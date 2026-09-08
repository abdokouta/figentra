# Search — Jobs and Scheduling

Jobs: projection catch-up, dead-letter replay, index rebuild/backfill, alias validation, synonym refresh and orphan cleanup. Scheduled jobs use the platform scheduler. Rebuilds are asynchronous and cancellable. No hidden workers; API, consumer, worker and scheduler roles come from the same NestJS source tree.