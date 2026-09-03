import { IBaseMarkup } from '@markup/schemas';

/**
 * Base Markup Builder
 *
 * Abstract base class for all markup builders
 *
 * @abstract
 * @class BaseMarkupBuilder
 */
export abstract class BaseMarkupBuilder<T extends IBaseMarkup> {
  /**
   * JSON-LD context
   */
  protected context = 'http://schema.org';

  /**
   * Builds the JSON-LD markup
   *
   * @returns The complete JSON-LD markup object
   */
  abstract build(): T;

  /**
   * Converts the markup to JSON string
   *
   * @returns JSON string representation
   */
  toJSON(): string {
    return JSON.stringify(this.build(), null, 2);
  }

  /**
   * Generates the HTML script tag for email embedding
   *
   * @returns HTML script tag with JSON-LD markup
   */
  toScriptTag(): string {
    return `<script type="application/ld+json">\n${this.toJSON()}\n</script>`;
  }
}
