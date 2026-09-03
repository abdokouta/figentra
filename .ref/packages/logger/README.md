# @stackra/logger

Unified, channel-based logging system with three subpath exports: core (`.`),
React (`./react`), and NestJS (`./nestjs`).

## Installation

```bash
yarn add @stackra/logger
```

Peer dependencies:

- `@stackra/contracts` — shared interfaces, tokens, types
- `@stackra/ts-container` — DI container
- `@stackra/ts-support` — Manager base class

Optional peers (activate specific subpaths):

- `react` — for `@stackra/logger/react` hooks
- `@nestjs/common` + `@nestjs/core` — for `@stackra/logger/nestjs`
- `pino` — for PinoReporter in NestJS

## Quick Start

### Frontend (Browser / React Native)

```typescript
import { LoggerModule } from '@stackra/logger';
import { LogLevel } from '@stackra/contracts';

// In your root module
LoggerModule.forRoot({
  default: 'app',
  channels: {
    app: { level: LogLevel.DEBUG, reporters: ['console'], formatter: 'pretty' },
  },
});

// In a service
import { Logger } from '@stackra/logger';

class OrderService {
  private readonly logger = new Logger(OrderService.name);

  async create(dto: CreateOrderDto) {
    this.logger.info('Creating order', { sku: dto.sku });
  }
}
```

### NestJS Backend

```typescript
import {
  NestLoggerModule,
  NestLoggerServiceAdapter,
} from '@stackra/logger/nestjs';

@Module({
  imports: [
    NestLoggerModule.forRoot({
      default: 'app',
      channels: {
        app: { level: LogLevel.INFO, reporters: ['pino'] },
        audit: { level: LogLevel.INFO, reporters: ['json'] },
      },
      requestLogging: true,
      replaceNestLogger: true,
      globalContext: { service: 'api' },
      redact: { paths: ['password', 'token', '*.secret'] },
    }),
  ],
})
export class AppModule {}

// In main.ts
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(NestLoggerServiceAdapter));
```

### React Components

```tsx
import {
  useLogger,
  useLoggerChannel,
  LoggerErrorBoundary,
} from '@stackra/logger/react';

function Dashboard() {
  const logger = useLogger('Dashboard');

  useEffect(() => {
    logger.info('Dashboard mounted');
  }, []);

  return <div>...</div>;
}

// Audit-specific logging
function AuditLog() {
  const auditLogger = useLoggerChannel('AuditLog', 'audit');
  auditLogger.info('User action', { action: 'view' });
}

// Error boundary
function App() {
  return (
    <LoggerErrorBoundary fallback={<ErrorPage />} context="App">
      <Dashboard />
    </LoggerErrorBoundary>
  );
}
```

## Channel Configuration

Channels define independent log streams with their own level, reporters, and
formatter:

```typescript
LoggerModule.forRoot({
  default: 'app', // Default channel for Logger instances
  channels: {
    app: {
      level: LogLevel.DEBUG,
      reporters: ['console'],
      formatter: 'pretty',
    },
    audit: {
      level: LogLevel.INFO,
      reporters: ['json'],
      formatter: 'json',
    },
    performance: {
      level: LogLevel.INFO,
      reporters: ['json'],
    },
  },
});
```

## Custom Reporters

Implement `ILogReporter` and decorate with `@Reporter`:

```typescript
import { Reporter } from '@stackra/logger';
import { Injectable } from '@stackra/ts-container';
import type { ILogReporter, ILogEntry } from '@stackra/contracts';

@Reporter('datadog')
export class DatadogReporter implements ILogReporter {
  readonly name = 'datadog';

  write(entry: ILogEntry): void {
    // Send to Datadog
  }

  async flush(): Promise<void> {
    // Drain pending writes
  }
}
```

Register in your channel config: `reporters: ['datadog']`.

## Enrichment Pipeline

Enrichers transform entries before they reach reporters:

```typescript
import {
  LoggerModule,
  RedactionEnricher,
  SamplingEnricher,
} from '@stackra/logger';

LoggerModule.forRoot({
  default: 'app',
  channels: { app: { level: LogLevel.DEBUG, reporters: ['console'] } },
  // Built-in redaction
  redact: { paths: ['password', 'token', '*.secret'], mask: '[REDACTED]' },
  // Built-in sampling (keep 1 in 10 debug entries)
  sampling: { debug: 10 },
});
```

Custom enrichers:

```typescript
import type { ILogEnricher } from '@stackra/logger';
import type { ILogEntry } from '@stackra/contracts';

class EnvironmentEnricher implements ILogEnricher {
  enrich(entry: ILogEntry): ILogEntry {
    return {
      ...entry,
      meta: { ...entry.meta, env: process.env.NODE_ENV },
    };
  }
}

// Register at runtime
manager.addEnricher(new EnvironmentEnricher());
```

## Child Loggers

Add nested context metadata without creating new Logger instances:

```typescript
const logger = new Logger('OrderService');
const reqLogger = logger.child({ requestId: 'abc123' });
const orderLogger = reqLogger.child({ orderId: 'ord-456' });

orderLogger.info('Processing payment');
// Entry meta: { requestId: 'abc123', orderId: 'ord-456' }
```

## NestJS Integration

### Request Logging

When `requestLogging: true` (default), every HTTP request is automatically
logged:

```
→ POST /api/orders { method, url, userAgent, requestId }
← POST /api/orders 201 45ms { method, url, statusCode, durationMs, requestId }
```

### Context Propagation

`AsyncLocalStorage` automatically injects `requestId` and `traceId` from request
headers (`X-Request-Id`, `X-Trace-Id`) into every log entry within that request
scope.

### Buffered Reporter

For high-throughput scenarios:

```typescript
import { BufferedReporterWrapper } from '@stackra/logger';

const buffered = new BufferedReporterWrapper(jsonReporter, {
  bufferSize: 50, // Flush every 50 entries
  flushIntervalMs: 3000, // Or every 3 seconds
});

manager.registerReporter(buffered);
```

## API Reference

### LoggerManager

| Method                         | Description                          |
| ------------------------------ | ------------------------------------ |
| `create(context)`              | Create a Logger with default channel |
| `channel(context, channel)`    | Create a Logger for specific channel |
| `dispatch(entry, channel?)`    | Dispatch entry to channel reporters  |
| `setLevel(channel, level)`     | Change channel level at runtime      |
| `setGlobalContext(ctx)`        | Set global context for all entries   |
| `getGlobalContext()`           | Get current global context           |
| `addChannel(name, config)`     | Add a channel at runtime             |
| `registerReporter(reporter)`   | Register a reporter instance         |
| `registerFormatter(formatter)` | Register a formatter instance        |
| `addEnricher(enricher)`        | Append enricher to pipeline          |
| `prependEnricher(enricher)`    | Prepend enricher to pipeline         |
| `flush()`                      | Flush all reporter buffers           |

### Logger

| Method                          | Description                          |
| ------------------------------- | ------------------------------------ |
| `debug(message, meta?)`         | Log at DEBUG level                   |
| `info(message, meta?)`          | Log at INFO level                    |
| `warn(message, meta?)`          | Log at WARN level                    |
| `error(message, error?, meta?)` | Log at ERROR level                   |
| `fatal(message, error?, meta?)` | Log at FATAL level                   |
| `child(meta)`                   | Create child logger with merged meta |

### Built-in Reporters

| Reporter                  | Description                             |
| ------------------------- | --------------------------------------- |
| `ConsoleReporter`         | Formatted console output via consola    |
| `JsonReporter`            | Single-line JSON to stdout              |
| `SilentReporter`          | No-op (testing)                         |
| `PinoReporter`            | Pino-backed structured logging (NestJS) |
| `BufferedReporterWrapper` | Batches writes for performance          |

### Built-in Formatters

| Formatter         | Description                           |
| ----------------- | ------------------------------------- |
| `PrettyFormatter` | Colored, human-readable (development) |
| `JsonFormatter`   | Single-line JSON (production)         |

### Built-in Enrichers

| Enricher            | Description                       |
| ------------------- | --------------------------------- |
| `RedactionEnricher` | Mask sensitive fields in meta     |
| `SamplingEnricher`  | Drop entries by configurable rate |
