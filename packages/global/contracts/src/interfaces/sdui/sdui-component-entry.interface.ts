/**
 * @file sdui-component-entry.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Canonical shape of a single entry in the composite
 *   SDUI component registry. Extracted from
 *   `sdui-registry.interface.ts` for two reasons:
 *
 *   1. **Split by concern** — the entry shape is authored + read by
 *      every source registry (`HeroUiRegistry`, `HeroUiProRegistry`,
 *      `WebPrimitivesRegistry`, ...), the composite registry
 *      contract (`ISduiComponentRegistry`), the runtime renderer,
 *      the validator, and every future authoring UI. It deserves its
 *      own file per `code-standards.md` §"one export per file".
 *   2. **Room for authoring-UI metadata** — Phase 1 of the SDUI
 *      day-one spec introduces closed-enum categorisation +
 *      authoring metadata (`displayName`, `description`, `icon`,
 *      `tags`, `deprecated`, `replacedBy`). Landing that surface on
 *      a dedicated file keeps the diff scoped.
 *
 *   The runtime resolver only touches `component`; every other
 *   field is metadata authoring UIs iterate over.
 */

import type { SduiComponentCategory } from "../../types/sdui-component-category.type";
import type { SduiInteractionEvent } from "./sdui-node.interface";

/**
 * A single entry in the composite SDUI component registry.
 *
 * The registry is a `Map<string, ISduiComponentEntry>` keyed by
 * schema node `type` string. Dotted keys (`'Card.Header'`,
 * `'Accordion.Item'`) are permitted — the registry stores them as
 * flat map keys, and the schema references them with the same
 * dotted string.
 *
 * ## Runtime surface
 *
 * The renderer only uses the following fields at render time:
 *
 * - `component` — the React (or React Native) component to mount.
 * - `mapProps` — optional prop adapter run before mounting.
 * - `events` — optional prop-name aliases mapping schema events to
 *   the underlying component's prop.
 * - `acceptsChildren` — whether the renderer walks the node's
 *   children recursively.
 *
 * ## Authoring-UI metadata
 */
export interface ISduiComponentEntry {
  /**
   * The React component the schema resolves to.
   *
   * Typed as `unknown` at the contract layer because the shape lives
   * in different runtimes (React on web, React Native on native)
   * plus HeroUI/HeroUI-Pro compound overloads that TypeScript's
   * `ComponentType<any>` doesn't cleanly narrow. Concrete
   * implementations narrow it at their call sites.
   */
  readonly component: unknown;

  /**
   * Closed-enum categorisation for authoring-UI grouping.
   *
   * Sourced from {@link SduiComponentCategory} — an unknown value
   * fails typecheck at the source registry that authored the entry
   * (`replace("Alert", { category: "hreoui" })` → TS error).
   *
   * The renderer ignores this field. Every authoring UI groups the
   * composite catalogue by category to build its picker drawer.
   */
  readonly category: SduiComponentCategory;

  /**
   * When `false`, the renderer skips slot recursion. Defaults to
   * `true` — most components accept children.
   *
   * Load-bearing on leaf components (`Text`, `Heading`, `Input`,
   * `Kbd`, `Spinner`, `Divider`) where the schema doesn't recurse.
   */
  readonly acceptsChildren?: boolean;

  /**
   * Optional event-name mapping — logical SDUI event → underlying
   * prop name. Defaults to identity (`onPress` → `onPress`).
   *
   * Used when the schema-author vocabulary and the underlying
   * component's event props don't match verbatim (e.g. web's
   * `<button>` root wants `onClick`, native's `Pressable` wants
   * `onPress`, and the schema stays platform-agnostic with a single
   * `onPress` name).
   */
  readonly events?: Readonly<Partial<Record<SduiInteractionEvent, string>>>;

  /**
   * Optional prop adapter — the renderer runs this on the resolved
   * prop bag before passing it to the component. Useful for coercing
   * schema strings into React elements (`{ icon: "bell" }` →
   * `<BellIcon />` prop) or for synthesising derived props.
   *
   * @param props - The raw prop bag resolved from the schema node.
   * @returns The adapted prop bag passed to the component.
   */
  readonly mapProps?: (
    props: Record<string, unknown>,
  ) => Record<string, unknown>;

  // ── Authoring-UI metadata ─────────────────────────────────────

  /**
   * Human-readable name shown in authoring pickers. Defaults to the
   * registry key when absent (`"Card.Header"` → `"Card.Header"`).
   */
  readonly displayName?: string;

  /**
   * One-line description for authoring tooltips + docs.
   *
   * Sourced from the component's TSDoc when the extractor script
   * can read it; hand-authored otherwise.
   */
  readonly description?: string;

  /**
   * Iconify string for the picker thumbnail
   * (`"heroicons:squares-2x2"`, `"lucide:layout-grid"`, ...).
   *
   * Authoring UIs render this via `@iconify/react` — the contract
   * doesn't force a specific icon library.
   */
  readonly icon?: string;

  /**
   * Free-form tags for filtering / search in authoring UIs.
   *
   * Examples: `["landing", "conversion"]` for `Hero`,
   * `["form", "field"]` for `Input`, `["data", "table"]` for
   * `DataGrid`.
   */
  readonly tags?: readonly string[];

  /**
   * Marks the entry for authoring UIs so they can filter deprecated
   * components. The renderer still resolves the type — deprecation
   * is a display concern, not a runtime one.
   */
  readonly deprecated?: boolean;

  /**
   * When {@link deprecated}, points at the replacement type name.
   *
   * Authoring UIs surface this string as a "use X instead" hint in
   * the picker + on any existing schema that still references the
   * deprecated type.
   */
  readonly replacedBy?: string;
}
