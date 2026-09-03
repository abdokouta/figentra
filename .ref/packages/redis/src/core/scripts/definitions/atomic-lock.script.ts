/**
 * @file atomic-lock.script.ts
 * @module @stackra/ts-redis/scripts/definitions
 * @description Lua scripts for atomic distributed lock acquire and release.
 *   Uses compare-and-set (CAS) semantics with fencing tokens.
 */

/**
 * Lua script: Lock Acquire.
 *
 * KEYS[1] = lock key (e.g., "lock:resource-name")
 * ARGV[1] = fencing token (UUID)
 * ARGV[2] = TTL in milliseconds
 * Returns: "OK" if acquired, nil if already held
 *
 * Uses SET NX PX for atomic acquire with TTL.
 */
export const LOCK_ACQUIRE_SCRIPT = `
return redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2])
`;

/**
 * Lua script: Lock Release.
 *
 * KEYS[1] = lock key
 * ARGV[1] = fencing token (must match current holder)
 * Returns: 1 if released, 0 if token mismatch
 *
 * Atomic compare-and-delete: only releases if the token matches.
 */
export const LOCK_RELEASE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end
`;

/**
 * Lua script: Lock Extend.
 *
 * KEYS[1] = lock key
 * ARGV[1] = fencing token (must match current holder)
 * ARGV[2] = new TTL in milliseconds
 * Returns: 1 if extended, 0 if token mismatch or key absent
 *
 * Atomic compare-and-extend: only extends if the token matches.
 */
export const LOCK_EXTEND_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('PEXPIRE', KEYS[1], ARGV[2])
else
  return 0
end
`;
