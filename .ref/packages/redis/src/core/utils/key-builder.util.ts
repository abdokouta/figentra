/**
 * @file key-builder.util.ts
 * @module @stackra/ts-redis/utils
 * @description Redis key builder utility. Constructs keys from templates
 *   with `{placeholder}` substitution for consistent naming conventions.
 */

import { RedisConfigError } from '../errors';

/**
 * Build a Redis key from a template with placeholder substitution.
 *
 * Replaces `{placeholder}` tokens in the template with values from
 * the context map. Throws if a placeholder has no corresponding value.
 *
 * @param template - Key template with `{placeholder}` syntax.
 * @param context - Map of placeholder names to values.
 * @param options - Optional prefix and separator configuration.
 * @returns The resolved key string.
 * @throws {RedisConfigError} When a placeholder has no value in context.
 *
 * @example
 * ```typescript
 * const key = buildKey('{tenant}:{domain}:{id}', {
 *   tenant: 'acme',
 *   domain: 'orders',
 *   id: '123',
 * });
 * // Result: 'acme:orders:123'
 * ```
 */
export function buildKey(
  template: string,
  context: Record<string, string>,
  options?: IKeyBuilderOptions
): string {
  const resolved = template.replace(/\{(\w+)\}/g, (_match, placeholder: string) => {
    const value = context[placeholder];
    if (value === undefined || value === null) {
      throw new RedisConfigError(
        `Key builder: missing value for placeholder "{${placeholder}}" in template "${template}".`
      );
    }
    return value;
  });

  if (options?.prefix) {
    const separator = options.separator ?? ':';
    return `${options.prefix}${separator}${resolved}`;
  }

  return resolved;
}
