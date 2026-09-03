/**
 * Validation result interface.
 *
 * @interface ValidationResult
 */
export interface ValidationResult {
  /**
   * Whether validation passed.
   */
  valid: boolean;

  /**
   * Error message if validation failed.
   */
  error?: string;
}
