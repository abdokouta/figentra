/**
 * @file validate-indicator-name.util.ts
 * @module @stackra/nestjs-health/utils
 * @description Validates indicator names against naming rules.
 */

import { MAX_INDICATOR_NAME_LENGTH, INDICATOR_NAME_PATTERN } from '../constants';

/**
 * Validate an indicator name.
 *
 * Rules:
 * - 1 to 64 characters
 * - Only alphanumeric characters, hyphens, and underscores
 *
 * @param name - The indicator name to validate
 * @returns `true` if valid, `false` otherwise
 */
export function isValidIndicatorName(name: string): boolean {
  if (!name || name.length === 0) {
    return false;
  }
  if (name.length > MAX_INDICATOR_NAME_LENGTH) {
    return false;
  }
  return INDICATOR_NAME_PATTERN.test(name);
}
