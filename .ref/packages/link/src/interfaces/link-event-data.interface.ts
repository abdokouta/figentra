/**
 * @file link-event-data.interface.ts
 * @module @stackra/link/src/interfaces
 * @description ILinkEventData interface.
 */

/**
 * Event data payload emitted on link operations.
 *
 * This is the `data` field of the published `IPubSubMessage`.
 * The full envelope follows the `IPubSubMessage<LinkEventData>` shape
 * from `@stackra/contracts`.
 */
export interface ILinkEventData {
  /** The link name (e.g., 'RolePermission'). */
  linkName: string;
  /** The source entity ID involved. */
  sourceId?: string;
  /** The target entity IDs involved. */
  targetIds?: string[];
  /** The affected pivot records (serialized). */
  records?: any[];
}
