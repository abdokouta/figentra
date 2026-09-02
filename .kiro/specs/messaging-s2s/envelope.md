# Event Envelope

```ts
interface FigentraEventEnvelope<T> {
  id: string;
  specVersion: string;
  type: string;
  version: number;
  source: string;
  subject?: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  tenantId?: string;
  actor?: { id: string; type: string };
  payload: T;
}
```
