/**
 * @file expression-payload-filter.ts
 * @module @stackra/nestjs-webhook/filters
 * @description Payload filter evaluator supporting MongoDB-style query operators.
 *   Evaluates filter expressions against event payloads to determine whether
 *   a subscription should receive the event. Supports nested path access via
 *   dot notation and AND logic across all conditions.
 */

import { IInjectable } from '@nestjs/common';

import type { IPayloadFilter } from '../interfaces';

// ============================================================================
// Service
// ============================================================================

/**
 * Expression-based payload filter evaluator.
 *
 * Evaluates a JSON filter expression against an event payload to determine
 * whether a subscription should receive the event. Supports:
 *
 * - **`$eq`** (equality): `{ "status": { "$eq": "active" } }`
 * - **`$ne`** (not equal): `{ "status": { "$ne": "cancelled" } }`
 * - **`$exists`** (field existence): `{ "metadata": { "$exists": true } }`
 * - **`$in`** (array contains): `{ "tags": { "$in": ["vip", "premium"] } }`
 * - **`$gt`** (greater than): `{ "amount": { "$gt": 100 } }`
 * - **`$lt`** (less than): `{ "amount": { "$lt": 1000 } }`
 * - **Implicit equality**: `{ "status": "active" }` (shorthand for `$eq`)
 * - **Nested paths**: `{ "order.total": { "$gt": 100 } }` (dot notation)
 *
 * All conditions in the filter are ANDed — all must match for the filter to pass.
 *
 * @example
 * ```typescript
 * const filter = {
 *   'order.status': 'completed',
 *   'order.total': { '$gt': 100 },
 *   'customer.tier': { '$in': ['gold', 'platinum'] },
 * };
 * const payload = {
 *   order: { status: 'completed', total: 250 },
 *   customer: { tier: 'gold' },
 * };
 * payloadFilter.evaluate(filter, payload); // true
 * ```
 */
@IInjectable()
export class ExpressionPayloadFilter implements IPayloadFilter {
  /**
   * Evaluate a filter expression against an event payload.
   *
   * Returns true if ALL filter conditions match (AND logic).
   * An empty or null filter always matches (pass-through).
   *
   * @param filter - The JSON filter expression (object with field conditions).
   * @param payload - The event payload to evaluate against.
   * @returns True if the payload matches all filter conditions, false otherwise.
   */
  public evaluate(filter: Record<string, unknown>, payload: Record<string, unknown>): boolean {
    if (!filter || typeof filter !== 'object') {
      return true;
    }

    for (const [path, condition] of Object.entries(filter)) {
      const value = this.getNestedValue(payload, path);

      if (!this.evaluateCondition(value, condition)) {
        return false;
      }
    }

    return true;
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Evaluate a single condition against a resolved value.
   *
   * If the condition is an operator object (contains keys starting with `$`),
   * each operator is evaluated independently and all must pass. If the
   * condition is a primitive, implicit equality is used.
   *
   * @param value - The resolved value from the payload.
   * @param condition - The condition to evaluate (primitive or operator object).
   * @returns True if the condition is satisfied.
   */
  private evaluateCondition(value: unknown, condition: unknown): boolean {
    // Operator object: { $eq: ..., $exists: true, $in: [...] }
    if (condition !== null && typeof condition === 'object' && !Array.isArray(condition)) {
      const operators = condition as Record<string, unknown>;
      const keys = Object.keys(operators);

      // Only treat as operator object if at least one key starts with $
      const hasOperators = keys.some((key) => key.indexOf('$') === 0);
      if (!hasOperators) {
        // Plain object equality (deep compare not supported — use $eq for primitives)
        return value === condition;
      }

      // $eq operator (explicit equality)
      if ('$eq' in operators) {
        if (value !== operators.$eq) {
          return false;
        }
      }

      // $ne operator (not equal)
      if ('$ne' in operators) {
        if (value === operators.$ne) {
          return false;
        }
      }

      // $exists operator (field existence)
      if ('$exists' in operators) {
        const shouldExist = Boolean(operators.$exists);
        const exists = value !== undefined && value !== null;
        if (shouldExist !== exists) {
          return false;
        }
      }

      // $in operator (value must be one of the array elements)
      if ('$in' in operators) {
        const allowedValues = operators.$in;
        if (Array.isArray(allowedValues)) {
          if (!allowedValues.includes(value)) {
            return false;
          }
        }
      }

      // $gt operator (greater than)
      if ('$gt' in operators) {
        if (typeof value !== 'number' || value <= (operators.$gt as number)) {
          return false;
        }
      }

      // $lt operator (less than)
      if ('$lt' in operators) {
        if (typeof value !== 'number' || value >= (operators.$lt as number)) {
          return false;
        }
      }

      return true;
    }

    // Primitive equality check (implicit $eq)
    return value === condition;
  }

  /**
   * Resolve a nested value from an object using dot notation.
   *
   * Traverses the object following each segment of the dot-separated path.
   * Returns undefined if any segment along the path does not exist.
   *
   * @param obj - The source object to traverse.
   * @param path - Dot-separated path (e.g., 'order.customer.email').
   * @returns The resolved value, or undefined if the path doesn't exist.
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const segments = path.split('.');
    let current: unknown = obj;

    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }
}
