/**
 * @file duration-acquire.script.ts
 * @module @stackra/ts-redis/scripts/definitions
 * @description Lua script for duration limiter (sliding window) acquisition.
 *   Uses a hash with start/end/count fields for atomic window management.
 *   Mirrors Laravel's DurationLimiter::luaScript().
 */

/**
 * Lua script: Duration Window Acquire.
 *
 * KEYS[1] = limiter key (e.g., "throttle:email-send")
 * ARGV[1] = current time in microseconds (for precision)
 * ARGV[2] = current time in seconds
 * ARGV[3] = window duration in seconds (decay)
 * ARGV[4] = maximum allowed attempts per window
 * Returns: {allowed (0|1), decaysAt (seconds), remaining (count)}
 *
 * Algorithm:
 * 1. If key doesn't exist → reset (new window)
 * 2. If current time is within the window → increment count, check limit
 * 3. If current time is past the window → reset (new window)
 */
export const DURATION_ACQUIRE_SCRIPT = `
local function reset()
  redis.call('HMSET', KEYS[1], 'start', ARGV[2], 'end', ARGV[2] + ARGV[3], 'count', 1)
  return redis.call('EXPIRE', KEYS[1], ARGV[3] * 2)
end

if redis.call('EXISTS', KEYS[1]) == 0 then
  return {reset(), ARGV[2] + ARGV[3], ARGV[4] - 1}
end

if ARGV[1] >= redis.call('HGET', KEYS[1], 'start') and ARGV[1] <= redis.call('HGET', KEYS[1], 'end') then
  return {
    tonumber(redis.call('HINCRBY', KEYS[1], 'count', 1)) <= tonumber(ARGV[4]),
    redis.call('HGET', KEYS[1], 'end'),
    ARGV[4] - redis.call('HGET', KEYS[1], 'count')
  }
end

return {reset(), ARGV[2] + ARGV[3], ARGV[4] - 1}
`;

/** Script name for registry registration. */
export const DURATION_ACQUIRE_SCRIPT_NAME = 'limiter:duration:acquire';
