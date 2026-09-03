/**
 * List Item Interface.
 *
 * @module interfaces/list
 */

/**
 * Simple list item structure (numbered list).
 */
export interface ListItem {
  /**
   * Item number.
   */
  number: number;

  /**
   * Item title/heading.
   */
  title: string;

  /**
   * Item description.
   */
  description: string;
}
