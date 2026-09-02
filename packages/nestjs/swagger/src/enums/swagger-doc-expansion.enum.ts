/**
 * Swagger Documentation Expansion Enum
 *
 * Defines the initial expansion state of API operations and tags in Swagger UI.
 * Controls how much detail is displayed when the documentation page first loads.
 *
 * @enum {string}
 * @since 1.0.0
 */
export enum SwaggerDocExpansion {
  /**
   * Show only operation names (most compact)
   * Operations are collapsed, showing only their summary/title
   * Users must click to expand and see details
   */
  LIST = "list",

  /**
   * Expand all operations and show full details
   * All operations are fully expanded showing parameters, responses, etc.
   * Provides complete overview but requires more scrolling
   */
  FULL = "full",

  /**
   * Collapse all operations (show only tags)
   * Most compact view, showing only tag groups
   * Users must expand tags first, then operations
   */
  NONE = "none",
}
