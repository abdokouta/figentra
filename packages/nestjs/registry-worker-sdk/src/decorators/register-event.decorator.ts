/**
 * @file register-event.decorator.ts
 * @description Annotates a Nest class as an event contract in the application manifest.
 *
 * Events declared here represent NATS topics the application produces or consumes.
 * This decorator is interoperable with `@figentra/events` via the shared
 * `figentra:event` global reflection key.
 *
 * @example
 * ```ts
 * \@RegisterEvent({ key: 'audit.log.created', direction: 'produces', topic: 'audit.log.created', version: '1' })
 * \@Injectable()
 * export class AuditEventPublisher {}
 * ```
 */

import type { EventManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares an event contract (produce or consume) in the application manifest.
 * @param value - Event descriptor.
 */
export function RegisterEvent(value: EventManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "event", value);
}

/** @deprecated Use {@link RegisterEvent} instead. */
export const RegistryEvent = RegisterEvent;
