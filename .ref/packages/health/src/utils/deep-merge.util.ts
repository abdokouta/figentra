/**
 * @file deep-merge.util.ts
 * @module @stackra/nestjs-health/utils
 * @description Deep merge utility for configuration objects.
 */

/**
 * Deep merge a partial source into a target object.
 *
 * Only plain objects are recursively merged. Arrays and non-object values
 * from source replace the target value entirely.
 *
 * @param target - The default/base object
 * @param source - The partial override object
 * @returns A new object with merged values
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue === undefined) {
      continue;
    }

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Check if a value is a plain object (not array, null, or class instance).
 *
 * @param value - The value to check
 * @returns Whether the value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
