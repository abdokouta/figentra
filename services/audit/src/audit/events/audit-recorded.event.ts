/**
 * @file audit-recorded.event.ts
 * @description Audit service event contract re-export.
 *
 * The canonical schema lives in @figentra/events so producers and consumers
 * validate exactly the same payload.
 */
export {
  AuditRecordedEventSchema,
  type AuditRecordedEvent,
} from "@figentra/events";
