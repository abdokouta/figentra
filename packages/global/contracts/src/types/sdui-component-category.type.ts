/**
 * @file sdui-component-category.type.ts
 * @module @stackra/contracts/types
 * @description Closed-enum type for SDUI component categorisation.
 *
 *   The set is closed by design — every new category needs an
 *   explicit addition here plus a matching entry in every source
 *   registry that would use it. The one escape hatch is `"custom"`,
 *   reserved for consumer-supplied overrides that don't belong to
 *   any framework-owned category.
 */

/**
 * Closed set of SDUI component categories.
 *
 * ## Semantics
 *
 * - `"primitive"` — layout scaffolding shipped by
 *   {@link ISduiComponentSource} implementations with the lowest
 *   priority band (`WebPrimitivesRegistry` / `NativePrimitivesRegistry`).
 *   Box, Stack, Grid, Section, Text, Heading, Image, Screen.
 * - `"layout"` — scene-template shells keyed by
 *   {@link SduiViewKind} (List, Show, Create, Edit, Analytics,
 *   Overview).
 * - `"heroui"` — every `@heroui/react` (OSS) root + compound
 *   registered by `HeroUiRegistry` on web and
 *   `HeroUiNativeRegistry` on native.
 * - `"heroui-pro"` — every `@heroui-pro/react` root + compound
 *   registered by `HeroUiProRegistry` on web and
 *   `HeroUiNativeProRegistry` on native.
 * - `"marketing"` — landing-surface sections from
 *   `@stackra/ui/marketing` (Hero, PageHeader, FeatureGrid, …)
 *   registered by `StackraMarketingRegistry`.
 * - `"ecommerce"` — shopping-surface sections from
 *   `@stackra/ui/ecommerce` (ProductCard, CartSummary, …)
 *   registered by `StackraEcommerceRegistry`.
 * - `"zone"` — the extensibility `<Zone>` type registered by
 *   `ZoneRegistry`, driving the slot / contribution system in
 *   `@stackra/zones`.
 * - `"custom"` — the escape hatch for consumer-supplied overrides
 *   passed through `SduiModule.forRoot({ components })` or
 *   `SduiModule.forFeature({ components })`. Anything that doesn't
 *   belong to a framework category is `"custom"`.
 */
export type SduiComponentCategory =
  | "primitive"
  | "layout"
  | "heroui"
  | "heroui-pro"
  | "marketing"
  | "ecommerce"
  | "zone"
  | "custom";
