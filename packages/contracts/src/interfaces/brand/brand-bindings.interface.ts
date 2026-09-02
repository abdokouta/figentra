/**
 * @file brand-bindings.interface.ts
 * @module @stackra/contracts/interfaces/brand
 * @description Platform-adapter contract for the brand subsystem.
 *
 *   Implemented by `WebBrandBindings` (DOM head-mutation) and
 *   `NativeBrandBindings` (React Navigation title updates + Expo
 *   task-bar). `BrandService` injects this contract, so the same
 *   orchestrator runs unchanged on both platforms.
 *
 *   Every method is fail-soft — `NullBrandBindings` (the default
 *   binding when no platform module is composed) throws in the
 *   headless / SSR case, and platform bindings guard on `typeof
 *   document === "undefined"` where the DOM is required.
 */

/**
 * Platform-specific brand adapter contract.
 */
export interface IBrandBindings {
  /**
   * Set the document title. On web this writes `document.title`.
   */
  applyDocumentTitle(title: string): void;

  /**
   * Set the description meta tag. On web this writes
   * `<meta name="description" content="…">`, creating the element
   * when absent.
   */
  applyDescription(description: string): void;

  /**
   * Set the favicon. On web this writes `<link rel="icon" href="…">`,
   * creating the element when absent.
   */
  applyFavicon(href: string): void;

  /**
   * Set a `<meta name="…" content="…">` tag. Creates the element
   * when absent. Idempotent — multiple calls with the same `name`
   * update the existing tag.
   */
  applyMetaTag(name: string, content: string): void;

  /**
   * Set a `<meta property="…" content="…">` tag. Same semantics as
   * `applyMetaTag` but for the `property` attribute (OG tags use
   * `property`, Twitter tags use `name`).
   */
  applyPropertyTag(property: string, content: string): void;

  /**
   * Inject a JSON-LD script tag with the given payload.
   * `id` uniquely identifies the tag so repeat calls replace the
   * existing block (idempotent). Writes `<script type=
   * "application/ld+json" id="{id}">JSON.stringify(payload)</script>`.
   */
  applyJsonLd(id: string, payload: object): void;

  /**
   * Remove the JSON-LD script tag with the given `id`.
   */
  removeJsonLd(id: string): void;
}
