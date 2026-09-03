# Cloudflare Worker Example

This example demonstrates the intended architecture:

```text
Cloudflare Worker
  ↓
WorkerFactory
  ↓
RequestContext
  ↓
Stackra DI
  ↓
Request-scoped Handler
  ↓
Application Services
```

The Worker runtime remains the HTTP/runtime boundary. `@stackra/container/worker` only bridges runtime values into DI.
