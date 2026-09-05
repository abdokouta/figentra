# Realtime, Streaming and Files

## WebSocket

Gateway upgrades only routes explicitly marked as WebSocket-capable. Authenticate before upgrade, authorize the route at the service, propagate connection/request context, enforce idle/max lifetime and apply connection limits.

## SSE

Forward streaming responses without buffering. Enforce authenticated route policy, heartbeat/idle timeout and connection limits. Do not cache authenticated streams.

## HTTP streaming

Use streaming bodies for large downloads/uploads where route metadata permits. Do not load unbounded bodies into Worker memory.

## Files

Gateway handles transport limits, content type, upload/download routing and security headers. Files service owns object storage, metadata, authorization and lifecycle. Gateway never becomes the file database.

## Backpressure

Apply explicit stream timeout, maximum connection count and upstream cancellation. Abort upstream work when the client disconnects where Worker runtime semantics permit.

## Realtime authorization

Gateway admission is coarse; channel/resource authorization remains with the owning service/realtime capability. No client-supplied channel may bypass service authorization.
