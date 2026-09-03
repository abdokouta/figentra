/**
 * @file tag-invalidate.script.ts
 * @module @stackra/ts-redis/scripts/definitions
 * @description Lua script for atomic tag-based cache invalidation.
 *   Retrieves all keys in a tag set, deletes them, and removes the tag set.
 */

/**
 * Lua script: Tag Invalidation.
 *
 * KEYS[1] = tag set key (e.g., "tag:products")
 * Returns: number of keys deleted
 *
 * Algorithm:
 * 1. Get all members of the tag set (SMEMBERS)
 * 2. Delete all member keys (DEL)
 * 3. Delete the tag set itself (DEL)
 * 4. Return count of deleted keys
 */
export const TAG_INVALIDATE_SCRIPT = `
local members = redis.call('SMEMBERS', KEYS[1])
local count = 0
if #members > 0 then
  for i, key in ipairs(members) do
    if redis.call('EXISTS', key) == 1 then
      redis.call('DEL', key)
      count = count + 1
    end
  end
end
redis.call('DEL', KEYS[1])
return count
`;

/** Script name for registry registration. */
export const TAG_INVALIDATE_SCRIPT_NAME = 'tag:invalidate';
