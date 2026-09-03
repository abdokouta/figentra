/**
 * @file rate-limit-event-name.type.ts
 * @module @stackra/rate-limit/src/types
 * @description RateLimitEventName type.
 */

/** Union type of all rate limit event channel names. */
export type RateLimitEventName = (typeof RATE_LIMIT_EVENTS)[keyof typeof RATE_LIMIT_EVENTS];
