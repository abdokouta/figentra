/**
 * @function isClassValidatorAvailable
 * @description Checks if the class-validator package is available in the project.
 * This is used to gracefully handle cases where class-validator is not installed.
 *
 * @returns {boolean} True if class-validator is available, false otherwise
 *
 * @example
 * if (isClassValidatorAvailable()) {
 *   // Use class-validator features
 * } else {
 *   // Fallback behavior
 * }
 */
export function isClassValidatorAvailable() {
  try {
    // Attempt to require class-validator
    // Using require for dynamic runtime checks is acceptable here
    // as we're checking for package availability
    require("class-validator");
    return true;
  } catch {
    // Return false if class-validator is not available
    return false;
  }
}
