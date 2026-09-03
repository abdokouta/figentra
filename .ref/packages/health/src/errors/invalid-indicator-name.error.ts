/**
 * @file invalid-indicator-name.error.ts
 * @module @stackra/nestjs-health/errors
 * @description Error thrown when a health indicator has an invalid name.
 */

/**
 * Thrown during bootstrap when a @HealthIndicator() decorated class
 * has an invalid name.
 *
 * Valid names: 1–64 characters, only [a-zA-Z0-9_-].
 */
export class InvalidIndicatorNameError extends Error {
  public readonly name = 'InvalidIndicatorNameError';

  /**
   * @param indicatorName - The invalid name that triggered the error
   * @param className - The class name of the indicator
   */
  public constructor(indicatorName: string, className?: string) {
    const context = className ? ` on class "${className}"` : '';
    super(
      `Invalid health indicator name "${indicatorName}"${context}. ` +
        'Names must be 1–64 characters containing only alphanumeric characters, hyphens, and underscores.'
    );
  }
}
