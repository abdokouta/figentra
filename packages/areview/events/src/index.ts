export type { FigentraEventEnvelope } from './interfaces/event-envelope.interface.js';
export type { EventVersion } from './types/event-version.type.js';
export { FIGENTRA_EVENT_TYPES, type FigentraEventType } from './constants/event-type.constant.js';
export { AuditRecordedEventSchema, type AuditRecordedEvent } from './schemas/audit-recorded-event.schema.js';
export { Event, EVENT_METADATA, type EventMetadata } from './decorators.js';
