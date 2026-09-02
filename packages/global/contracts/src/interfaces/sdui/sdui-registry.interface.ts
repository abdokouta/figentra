/**
 * @file sdui-registry.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Layout-registry entry shape.
 *
 *   The component-registry entry ({@link ISduiComponentEntry}) lives
 *   in its own file at `sdui-component-entry.interface.ts` — its
 *   surface grew large enough (closed-enum categorisation +
 *   authoring-UI metadata) that co-locating it with the layout entry
 *   would violate `code-standards.md` §"one export per file". Both
 *   entry shapes remain reachable through the sub-domain barrel.
 *
 *   Re-exports {@link ISduiComponentEntry} for back-compat — every
 *   consumer that imports it from this path continues to work.
 */

export type { ISduiComponentEntry } from "./sdui-component-entry.interface";

/**
 * A registered SDUI layout (scene template).
 *
 * `ISduiScreen.layout` matches on `key` — the renderer wraps the
 * screen's root tree in the layout's `component` before rendering.
 */
export interface ISduiLayoutEntry {
  /** Layout registry key (e.g. `'list'`, `'show'`, `'analytics'`). */
  readonly key: string;
  /** The React component that receives the tree in `children`. */
  readonly component: unknown;
}
