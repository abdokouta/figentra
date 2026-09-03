/**
 * @file payload-filter.interface.ts
 * @module @stackra/nestjs-webhook/interfaces
 * @description Interface for payload filter evaluators.
 *   Implementations determine whether a subscription's filter expression
 *   matches a given event payload.
 */

// ============================================================================
// Interface
// ============================================================================

/**
 * Contract for payload filter evaluators.
 *
 * Evaluates a JSON filter expression against an event payload to determine
 * whether a subscription should receive the event.
 */
export interface IPayloadFilter {
  /**
   * Evaluate a filter expression against an event payload.
   *
   * @param filter - The JSON filter expression (subscription's filter field).
   * @param payload - The event payload to evaluate against.
   * @returns True if the payload matches the filter, false otherwise.
   */
  evaluate(filter: Record<string, any>, payload: Record<string, any>): boolean;
}
