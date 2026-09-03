/**
 * @file webhook.registry.ts
 * @module @stackra/nestjs-webhook/registries
 * @description IInjectable registry that catalogs all `@WebhookEvent()` decorated
 *   event classes and their wire-format names. Provides lookup by class reference,
 *   enumeration of all registered events, and name-based resolution.
 */

import { IInjectable, Logger } from '@nestjs/common';
import { getMetadata } from '@vivtel/metadata';

import { WEBHOOK_EVENT_METADATA_KEY } from '../decorators';
import type { IWebhookEventOptions } from '../decorators';

// ============================================================================
// Types
// ============================================================================

/**
 * Internal registry entry combining the event class with its metadata.
 */
interface IRegistryEntry {
  /** The decorated event class constructor. */
  eventClass: Function;

  /** Wire-format event name (e.g., 'order.created'). */
  name: string;

  /** Optional version string. */
  version?: string;

  /** Optional human-readable description. */
  description?: string;
}

// ============================================================================
// Service
// ============================================================================

/**
 * Registry of webhook-forwardable domain events.
 *
 * Collects all `@WebhookEvent()` decorated classes and provides lookup
 * methods for the dispatcher and subscription validation.
 *
 * @example
 * ```typescript
 * // Register an event class
 * registry.register(OrderCreatedEvent, 'order.created', '2024-01');
 *
 * // Resolve metadata for a class
 * const meta = registry.resolve(OrderCreatedEvent);
 * // { name: 'order.created', version: '2024-01' }
 *
 * // Check if an event name is registered
 * registry.has('order.created'); // true
 * ```
 */
@IInjectable()
export class WebhookRegistry {
  /** Scoped logger instance. */
  private readonly logger = new Logger(WebhookRegistry.name);

  /** Internal store keyed by event class reference. */
  private readonly entries: Map<Function, IRegistryEntry> = new Map();

  /** Reverse lookup: wire-format name → entry. */
  private readonly nameIndex: Map<string, IRegistryEntry> = new Map();

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Register an event class with its webhook metadata.
   *
   * Called at module initialization time for each discovered `@WebhookEvent()`
   * decorated class.
   *
   * @param eventClass - The decorated event class constructor.
   * @param name - Wire-format event name.
   * @param version - Optional version string.
   * @param description - Optional human-readable description.
   */
  public register(
    eventClass: Function,
    name: string,
    version?: string,
    description?: string
  ): void {
    const entry: IRegistryEntry = { eventClass, name, version, description };

    this.entries.set(eventClass, entry);
    this.nameIndex.set(name, entry);

    this.logger.log(`Registered webhook event: "${name}"${version ? ` (${version})` : ''}`);
  }

  /**
   * Resolve metadata for a given event class.
   *
   * Falls back to reading `@WebhookEvent()` decorator metadata if the class
   * was not explicitly registered via `register()`.
   *
   * @param eventClass - The event class constructor to look up.
   * @returns The event metadata, or null if not registered.
   */
  public resolve(eventClass: Function): IWebhookEventOptions | null {
    const entry = this.entries.get(eventClass);
    if (entry) {
      return { name: entry.name, version: entry.version, description: entry.description };
    }

    // Fallback: read decorator metadata directly
    const meta = getMetadata<IWebhookEventOptions>(WEBHOOK_EVENT_METADATA_KEY, eventClass);
    if (meta) {
      // Auto-register for future lookups
      this.register(eventClass, meta.name, meta.version, meta.description);
      return meta;
    }

    return null;
  }

  /**
   * Return all registered event entries.
   *
   * @returns Array of all registered event metadata with class references.
   */
  public all(): IRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Return all wire-format event names.
   *
   * Useful for subscription validation — ensures subscribers only
   * subscribe to events that actually exist.
   *
   * @returns Array of all registered event names.
   */
  public eventNames(): string[] {
    return Array.from(this.nameIndex.keys());
  }

  /**
   * Check if an event name is registered.
   *
   * @param name - Wire-format event name to check.
   * @returns True if the event name is registered.
   */
  public has(name: string): boolean {
    return this.nameIndex.has(name);
  }

  /**
   * Get the total number of registered events.
   *
   * @returns The count of registered events.
   */
  public size(): number {
    return this.entries.size;
  }
}
