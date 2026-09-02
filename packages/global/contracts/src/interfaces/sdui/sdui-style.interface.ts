/**
 * @file sdui-style.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Section-styling wire contract for SDUI screens —
 *   background colours + gradients + images + overlays, spacing,
 *   radius, border, shadow, scheme, text alignment, bleed.
 *
 *   Every field is DECLARATIVE (tokens, primitives, structured
 *   stops) so the payload survives a JSON round-trip. The runtime
 *   `resolveSduiStyle(style)` utility in `@stackra/sdui/react/style/`
 *   (web) and `@stackra/sdui/native/style/` (native) maps this shape
 *   to CSS on web and to a stacked-layer `ViewStyle` list on native.
 *
 *   Design.md §3.6 locks every field name + type here — deviations
 *   require updating the spec first.
 *
 *   Multiple interfaces + one union live in this file per the
 *   composite-family exception in `.kiro/steering/code-standards.md`
 *   — every child shape (`ISduiGradient`, `ISduiImageBackground`,
 *   ...) is only ever consumed as a part of `ISduiSectionStyle`.
 */

// ════════════════════════════════════════════════════════════════════
// Colour primitives
// ════════════════════════════════════════════════════════════════════

/**
 * Declarative colour value — either a HeroUI design-token reference
 * or an explicit hex / rgb / oklch string. The resolver validates
 * hex / rgb / oklch inputs against strict regexes and drops (with a
 * `console.warn`) anything else. Tokens resolve to CSS custom-
 * properties on web (`hsl(var(--heroui-<name>))`) and to a lookup
 * table on native.
 *
 * @example Token reference
 * ```ts
 * const c: SduiColor = { token: "primary" };
 * ```
 *
 * @example Explicit hex
 * ```ts
 * const c: SduiColor = { hex: "#ffcc00" };
 * ```
 */
export type SduiColor =
  | {
      /**
       * HeroUI design-token name. The resolver maps this to the
       * matching CSS custom-property on web and to a hard-coded
       * theme value on native.
       */
      readonly token:
        | "primary"
        | "secondary"
        | "success"
        | "warning"
        | "danger"
        | "background"
        | "foreground"
        | "muted"
        | "accent"
        | "content1"
        | "content2"
        | "content3"
        | "content4";
    }
  | {
      /**
       * Hex string. Validated against
       * `/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i` at the
       * resolver; invalid values are dropped with a warning.
       */
      readonly hex: string;
    }
  | {
      /**
       * CSS `rgb(...)` / `rgba(...)` string. Validated against a
       * `^rgba?\\(...\\)$` regex at the resolver.
       */
      readonly rgb: string;
    }
  | {
      /**
       * CSS `oklch(...)` string. Validated against a
       * `^oklch\\(...\\)$` regex at the resolver.
       */
      readonly oklch: string;
    };

// ════════════════════════════════════════════════════════════════════
// Gradients
// ════════════════════════════════════════════════════════════════════

/**
 * One colour stop inside an `ISduiGradient`.
 *
 * `at` is the percentage position along the gradient (0-100).
 */
export interface ISduiGradientStop {
  /** Percentage position along the gradient (0-100). */
  readonly at: number;

  /** Colour at that position — resolved through the same validator. */
  readonly color: SduiColor;
}

/**
 * Structured gradient definition — the resolver composes this into
 * a single `linear-gradient(...)` or `radial-gradient(...)` CSS
 * declaration on web, or into a `LinearGradient` from
 * `expo-linear-gradient` on native.
 */
export interface ISduiGradient {
  /** Which gradient shape to emit. */
  readonly kind: "linear" | "radial";

  /**
   * Rotation in degrees (0-360). Linear gradients only. Defaults to
   * `180` (top → bottom). Ignored for `"radial"`.
   */
  readonly angle?: number;

  /**
   * Ordered stops that define the gradient. Every stop's `at`
   * SHOULD be strictly monotonic; the resolver renders whatever it
   * receives without re-sorting.
   */
  readonly stops: readonly ISduiGradientStop[];
}

// ════════════════════════════════════════════════════════════════════
// Image + overlay
// ════════════════════════════════════════════════════════════════════

/**
 * A translucent colour overlay stacked on top of an
 * `ISduiImageBackground` — useful for tinting a hero photo or
 * darkening the background so foreground text stays legible.
 */
export interface ISduiImageOverlay {
  /** The overlay colour. */
  readonly color: SduiColor;

  /**
   * Overlay opacity (0-1). `0` renders no overlay; `1` is fully
   * opaque and hides the image entirely.
   */
  readonly opacity: number;
}

/**
 * Image-background definition. Every field maps directly to a CSS
 * `background-*` property on web; native maps the equivalents to
 * `ImageBackground` props from `react-native`.
 */
export interface ISduiImageBackground {
  /** Image URL. The browser's `img-src` CSP decides what loads. */
  readonly url: string;

  /**
   * CSS `background-position`. Defaults to `"center"` on web.
   */
  readonly position?:
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

  /**
   * CSS `background-size`. Maps to `resizeMode` on native
   * (`"cover"`, `"contain"`; `"auto"` degrades to `"cover"` on
   * native).
   */
  readonly size?: "cover" | "contain" | "auto";

  /**
   * CSS `background-repeat`. Ignored on native (native `ImageBackground`
   * doesn't tile out of the box).
   */
  readonly repeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";

  /**
   * Optional translucent overlay stacked on top of the image.
   */
  readonly overlay?: ISduiImageOverlay;

  /**
   * Screen-reader alternative text. Set to `""` (empty string) when
   * the image is decorative; set to a descriptive string when the
   * image conveys content.
   */
  readonly alt?: string;
}

// ════════════════════════════════════════════════════════════════════
// Composite background
// ════════════════════════════════════════════════════════════════════

/**
 * Composite background — any combination of a solid `color`, a
 * structured `gradient`, and a raster `image` (with optional
 * overlay). The resolver stacks these in the order:
 * solid → image → gradient → overlay (design.md §9.2).
 */
export interface ISduiBackground {
  /** Solid fill colour. */
  readonly color?: SduiColor;

  /** Gradient layer stacked on top of the solid fill. */
  readonly gradient?: ISduiGradient;

  /**
   * Raster image layer stacked on top of the gradient. Overlay (if
   * declared) stacks on top of the image.
   */
  readonly image?: ISduiImageBackground;
}

// ════════════════════════════════════════════════════════════════════
// Spacing + border + section wrapper
// ════════════════════════════════════════════════════════════════════

/**
 * Spacing steps — mapped to Tailwind classes on web
 * (`p-1`, `p-2`, `p-4`, `p-6`, `p-8`, `p-12`, `p-16`, `p-24`) and to
 * pixel values on native.
 */
export type SduiSpacingStep =
  "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/**
 * Directional spacing definition — matches CSS padding / margin
 * shorthand. `all` wins over the directional fields; when `all` is
 * absent, the resolver falls through to the more specific fields.
 */
export interface ISduiSpacing {
  /** Uniform spacing on every side. Overrides directional fields. */
  readonly all?: SduiSpacingStep;

  /** Horizontal spacing (left + right). */
  readonly x?: SduiSpacingStep;

  /** Vertical spacing (top + bottom). */
  readonly y?: SduiSpacingStep;

  /** Top-side spacing. Overrides `y`. */
  readonly top?: SduiSpacingStep;

  /** Right-side spacing. Overrides `x`. */
  readonly right?: SduiSpacingStep;

  /** Bottom-side spacing. Overrides `y`. */
  readonly bottom?: SduiSpacingStep;

  /** Left-side spacing. Overrides `x`. */
  readonly left?: SduiSpacingStep;
}

/**
 * Border definition. The resolver emits Tailwind border classes on
 * web and a native `borderWidth`/`borderColor` style triple on RN.
 */
export interface ISduiBorder {
  /** Border width in pixels. Only 1/2/4 are supported by the wire. */
  readonly width?: 1 | 2 | 4;

  /** Border colour — resolved through the same colour validator. */
  readonly color?: SduiColor;

  /**
   * Which sides carry the border. Omit for every side. `["top"]`
   * renders a top-only border; `["top", "bottom"]` renders top +
   * bottom, etc.
   */
  readonly sides?: readonly ("top" | "right" | "bottom" | "left")[];
}

/**
 * Root section-styling shape — every marketing-section component
 * accepts this as an optional `style?` prop and calls
 * `resolveSduiStyle(style)` at render time to produce the wrapper
 * class name / inline style (web) or containerProps + layers (native).
 *
 * @example
 * ```json
 * {
 *   "background": {
 *     "gradient": {
 *       "kind": "linear",
 *       "angle": 180,
 *       "stops": [
 *         { "at": 0,   "color": { "token": "primary" } },
 *         { "at": 100, "color": { "hex": "#ffcc00" } }
 *       ]
 *     },
 *     "image": {
 *       "url": "https://cdn.example/hero.jpg",
 *       "size": "cover",
 *       "overlay": { "color": { "token": "background" }, "opacity": 0.4 }
 *     }
 *   },
 *   "padding": { "y": "2xl" },
 *   "radius": "xl",
 *   "scheme": "dark",
 *   "textAlign": "center"
 * }
 * ```
 */
export interface ISduiSectionStyle {
  /** Layered background — solid + gradient + image + overlay. */
  readonly background?: ISduiBackground;

  /** Inner spacing between the wrapper and the section content. */
  readonly padding?: ISduiSpacing;

  /** Outer spacing between the wrapper and its siblings. */
  readonly margin?: ISduiSpacing;

  /**
   * Corner radius token — mapped to Tailwind `rounded-*` classes on
   * web and to a `borderRadius` number on native.
   */
  readonly radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

  /** Border spec (width, colour, sides). */
  readonly border?: ISduiBorder;

  /**
   * Drop-shadow token — mapped to Tailwind `shadow-*` on web and to
   * a native `shadowColor`/`elevation` triple on RN.
   */
  readonly shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";

  /**
   * Minimum height. Either a spacing token OR a raw number
   * (interpreted as pixels).
   */
  readonly minHeight?: SduiSpacingStep | number;

  /**
   * Colour scheme override — flips the section into a dark or light
   * theme regardless of the page scheme. Emits
   * `data-scheme="dark"` on web + HeroUI dark-mode class chain.
   */
  readonly scheme?: "light" | "dark";

  /** Text alignment shortcut inside the section wrapper. */
  readonly textAlign?: "start" | "center" | "end";

  /** Text colour shortcut inside the section wrapper. */
  readonly textColor?: SduiColor;

  /**
   * Section bleed — `"full"` breaks out of the enclosing container
   * (edge-to-edge on web), `"contained"` respects the default
   * max-width. Host chooses the actual break-out mechanism from the
   * emitted `data-bleed` attribute.
   */
  readonly bleed?: "full" | "contained";
}
