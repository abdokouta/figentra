/**
 * Swagger Tag Configuration
 *
 * Groups endpoints by functionality in Swagger UI.
 * Tags help organize API documentation into logical sections.
 *
 * @interface SwaggerTag
 * @author Nesvel
 * @since 1.0.0
 */
export interface SwaggerTag {
  /**
   * Unique tag identifier
   * Used to group related endpoints together
   * @example 'users', 'auth', 'admin'
   */
  name: string;

  /**
   * Human-readable description of the tag
   * Explains the purpose of endpoints in this group
   * @example 'User management and profile endpoints'
   */
  description: string;
}
