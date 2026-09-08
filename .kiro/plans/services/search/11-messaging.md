# Search — Messaging

Consume versioned resource events from the platform event backbone. Use durable consumer groups, retry with bounded backoff, dead-letter handling and replay. Projection handlers must be idempotent. Search never publishes provider-specific events; it may publish `SearchProjectionUpdated` and `SearchIndexRebuilt` platform events where required.