/**
 * @function applyValidateIfDefinedDecorator
 * @description Applies the ValidateIf decorator from class-validator to a property of a class.
 * This makes the validation only run if the property is defined (not undefined).
 * If class-validator is not available, this function does nothing.
 *
 * @param targetClass - The class constructor to apply the decorator to
 * @param propertyKey - The name of the property to conditionally validate
 *
 * @example
 * class UserDto {
 *   @IsString()
 *   name: string;
 * }
 *
 * // Only validate the name property if it's defined
 * applyValidateIfDefinedDecorator(UserDto, 'name');
 */
export function applyValidateIfDefinedDecorator(targetClass: Function, propertyKey: string) {
  // Check if class-validator is available in the project
  if (!isClassValidatorAvailable()) {
    return;
  }

  // Import class-validator dynamically
  const classValidator: typeof import('class-validator') = require('class-validator');

  // Create the ValidateIf decorator factory that only validates if the value is not undefined
  const decoratorFactory = classValidator.ValidateIf((_, value) => value !== undefined);

  // Apply the decorator to the target class property
  decoratorFactory(targetClass.prototype, propertyKey);
}

/**
 * @function isClassValidatorAvailable
 * @description Checks if the class-validator package is available in the project.
 * This is used to gracefully handle cases where class-validator is not installed.
 *
 * @returns {boolean} True if class-validator is available, false otherwise
 *
 * @internal
 */
function isClassValidatorAvailable() {
  try {
    // Attempt to require class-validator
    require('class-validator');
    return true;
  } catch {
    // Return false if class-validator is not available
    return false;
  }
}
