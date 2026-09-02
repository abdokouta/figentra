/**
 * @file widget-renderer-context.interface.ts
 * @module @stackra/contracts/interfaces/dashboard
 * @description Runtime context passed to every widget renderer. The
 *   shell resolves scope + identity once per session and hands them to
 *   each renderer so a widget never has to `useGetIdentity` or
 *   `useScope` on its own.
 *
 *   Promoted from `@stackra/dashboard/core/interfaces` on 2026-07-27
 *   per `.kiro/steering/contracts-and-decorators-promotion.md` Test A —
 *   the interface is imported by every `@stackra/*` feature package
 *   that ships a `@Widget()` contribution (`@stackra/rbac`,
 *   `@stackra/notifications`). Keeping the type at the feature-package
 *   layer would force every widget-shipping package to declare
 *   `@stackra/dashboard` as a peer just to satisfy TypeScript — the
 *   same anti-pattern the @Widget decorator promotion resolved.
 *
 *   Owner: `@stackra/dashboard`'s runtime. The dashboard's
 *   `WidgetRenderer` compound calls each widget's `render(context)`
 *   with a `IWidgetRendererContext` instance; consumers implement
 *   `render(context: IWidgetRendererContext): ReactNode`.
 */

/**
 * Runtime context handed to every widget renderer.
 */
export interface IWidgetRendererContext {
  /**
   * The widget's persisted configuration. Widgets own the shape; the
   * shell only reads and writes it as an opaque record. Empty on
   * first render.
   */
  config: Record<string, unknown>;

  /**
   * Persist a new configuration for this widget instance. The shell
   * debounces to avoid thrashing the persistence layer during rapid
   * interactions.
   */
  onConfigChange: (next: Record<string, unknown>) => void;
}
