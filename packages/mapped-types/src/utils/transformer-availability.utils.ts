/**
 * @function isClassTransformerAvailable
 * @description Checks if the class-transformer package is available in the project.
 * This is used to gracefully handle cases where class-transformer is not installed.
 *
 * @returns {boolean} True if class-transformer is available, false otherwise
 *
 * @example
 * if (isClassTransformerAvailable()) {
 *   // Use class-transformer features
 * } else {
 *   // Fallback behavior
 * }
 */
export function isClassTransformerAvailable() {
  try {
    // Attempt to require class-transformer
    // Using require for dynamic runtime checks is acceptable here
    // as we're checking for package availability
    require("class-transformer");
    return true;
  } catch {
    // Return false if class-transformer is not available
    return false;
  }
}
