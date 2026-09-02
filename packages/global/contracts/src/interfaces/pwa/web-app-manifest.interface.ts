/**
 * @file web-app-manifest.interface.ts
 * @module @stackra/contracts/interfaces/pwa
 * @description Web App Manifest contract — the full shape a
 *   `.webmanifest` file may carry, typed for authoring +
 *   validation + tenant-brand overrides.
 *
 *   Members are grouped into four blocks so consumers can tell at
 *   a glance which are stable W3C fields, which enable installed
 *   Web App APIs, and which are browser-specific:
 *
 *   1. **Core W3C Manifest** — every field standardised by
 *      https://www.w3.org/TR/appmanifest/. Safe to rely on.
 *   2. **Installed Web App APIs** — configured through the manifest
 *      but standardised in separate specs (File Handling API, Share
 *      Target, Launch Handler, etc.). Feature-detect before relying
 *      on any single one.
 *   3. **Chromium Extensions** — supported on Chromium-based
 *      browsers only. Graceful degradation on Safari / Firefox.
 *   4. **Non-standard but common** — `version` / `author` / other
 *      tooling metadata. Browsers ignore these; useful for authoring
 *      pipelines + tenant-brand admins.
 *
 *   Every sub-shape (`IManifestIcon`, `IManifestScreenshot`, …)
 *   lives in this same file per `code-standards.md`'s composite-
 *   family grouping exception — the sub-interfaces exist only in
 *   service of `IWebAppManifest` and are never imported
 *   independently.
 *
 *   Consumers:
 *   - The vite-template's static `public/manifest.webmanifest` is
 *     validated against this shape via a co-located helper.
 *   - `@stackra/pwa`'s (future) manifest generator produces
 *     `manifest.webmanifest` from a typed builder that returns
 *     `IWebAppManifest`.
 *   - Tenant-brand admin CRUD uses the shape for authoring +
 *     validation.
 */

// ════════════════════════════════════════════════════════════════════
// Sub-shape — Icon
// ════════════════════════════════════════════════════════════════════

/**
 * A single icon entry. `sizes` is a whitespace-separated
 * `WxH` list (e.g. `"192x192"` or `"192x192 256x256"`). The
 * `purpose` field can be either a single token (`"maskable"`)
 * or a whitespace-separated combination.
 */
export interface IManifestIcon {
  /** Icon path — absolute or relative to the manifest URL. */
  readonly src: string;
  /**
   * Whitespace-separated `WxH` size list, or `"any"` for a
   * scalable icon.
   */
  readonly sizes?: string;
  /** MIME type — `"image/png"` / `"image/svg+xml"` / etc. */
  readonly type?: string;
  /**
   * Icon purpose. Space-separated combination of the W3C-defined
   * tokens:
   *
   *  - `"any"` — the default icon.
   *  - `"maskable"` — icons designed with a safe zone that OS
   *    launchers may mask / clip.
   *  - `"monochrome"` — icons rendered in the OS accent colour.
   *
   * Typed as `string` because the spec allows multiple values in
   * one field (e.g. `"any maskable"`). See MDN's Manifest icons
   * documentation for the current list.
   */
  readonly purpose?: string;
  /**
   * Platform this icon targets (e.g. `"play"` for Google Play
   * Store icons). Non-standard but recognised by build tooling.
   */
  readonly platform?: string;
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — Screenshot
// ════════════════════════════════════════════════════════════════════

/**
 * Screenshot metadata used by browser install UI (store-style
 * previews on Android's install prompt, Windows Store, etc.).
 */
export interface IManifestScreenshot {
  /** Screenshot image path. */
  readonly src: string;
  /** `WxH` size (single entry, not a list). */
  readonly sizes?: string;
  /** MIME type — `"image/png"` / `"image/webp"` / etc. */
  readonly type?: string;
  /**
   * Optional caption shown alongside the image in install UI.
   */
  readonly label?: string;
  /**
   * Target form factor. `"narrow"` = phone, `"wide"` = tablet /
   * desktop. Browsers use this to pick the right screenshots for
   * the surface the install prompt is showing on.
   */
  readonly form_factor?: "narrow" | "wide";
  /**
   * Target platform (`"windows"` / `"chromeos"` / `"ios"` / …).
   * Rarely used — most authors omit and let the browser pick.
   */
  readonly platform?: string;
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — Shortcut (long-press launcher menu)
// ════════════════════════════════════════════════════════════════════

/**
 * A shortcut surfaced in the OS launcher's long-press menu +
 * jumplists (Windows) / dock context menus (macOS).
 */
export interface IManifestShortcut {
  /** Visible label. */
  readonly name: string;
  /** Short label used when space is constrained. */
  readonly short_name?: string;
  /** Optional description shown in some launchers. */
  readonly description?: string;
  /** URL to navigate to (must be same-scope as the app). */
  readonly url: string;
  /** Icon list for the shortcut entry. */
  readonly icons?: readonly IManifestIcon[];
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — Related application (store listings)
// ════════════════════════════════════════════════════════════════════

/**
 * A related native application entry. Paired with
 * `prefer_related_applications: true` when the OS should recommend
 * the native app over the web PWA (rare — usually the reverse).
 */
export interface IRelatedApplication {
  /**
   * Platform token. Common values: `"play"` (Google Play),
   * `"itunes"` (App Store), `"windows"` (Microsoft Store),
   * `"webapp"` (nested web app).
   */
  readonly platform: string;
  /** Store URL for the native app. */
  readonly url?: string;
  /** Store id (e.g. Apple app id, Play bundle id). */
  readonly id?: string;
  /** Minimum supported version. */
  readonly min_version?: string;
  /**
   * Fingerprints for platforms that verify install lineage
   * (Google Play's Digital Asset Links, etc.).
   */
  readonly fingerprints?: readonly {
    readonly type: string;
    readonly value: string;
  }[];
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — Localized manifests
// ════════════════════════════════════════════════════════════════════

/**
 * Per-locale manifest overrides. Every field is optional; browsers
 * fall back to the top-level manifest value when a locale-scoped
 * field is missing.
 */
export interface IManifestTranslation {
  readonly name?: string;
  readonly short_name?: string;
  readonly description?: string;
  readonly icons?: readonly IManifestIcon[];
  readonly screenshots?: readonly IManifestScreenshot[];
  readonly shortcuts?: readonly IManifestShortcut[];
  readonly categories?: readonly string[];
  readonly dir?: "ltr" | "rtl" | "auto";
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — Share Target API
// ════════════════════════════════════════════════════════════════════

/**
 * Register the app as a share target. Content shared FROM another
 * app (link, text, file) is routed to `action` with the fields
 * mapped as `params` describes.
 */
export interface IShareTarget {
  /** URL that receives the shared payload. */
  readonly action: string;
  /**
   * HTTP method — `"GET"` for query-string encoding, `"POST"` for
   * multipart form data. Files can only be shared over `"POST"`.
   */
  readonly method?: "GET" | "POST";
  /**
   * Encoding type for POST. `"application/x-www-form-urlencoded"`
   * is the plain-form default; `"multipart/form-data"` is required
   * when `files` is set.
   */
  readonly enctype?:
    "application/x-www-form-urlencoded" | "multipart/form-data";
  /** Field-name mapping of the shared payload. */
  readonly params: {
    /** Field that receives the shared title. */
    readonly title?: string;
    /** Field that receives the shared text. */
    readonly text?: string;
    /** Field that receives the shared URL. */
    readonly url?: string;
    /** File field mappings — POST + multipart only. */
    readonly files?: readonly {
      readonly name: string;
      readonly accept: readonly string[] | string;
    }[];
  };
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — File Handling API
// ════════════════════════════════════════════════════════════════════

/**
 * Register the app as a handler for one or more file types. The OS
 * launcher lists the app as an "Open with…" option; when picked, the
 * launched URL receives a `launchQueue` payload with the file(s).
 */
export interface IFileHandler {
  /** URL the app opens when a file is passed to it. */
  readonly action: string;
  /**
   * Accept map — MIME type → file extensions. `"text/csv": [".csv"]`
   * registers as the CSV handler.
   */
  readonly accept: Readonly<Record<string, readonly string[] | string>>;
  /** Icon list for the file-picker "Open with…" entry. */
  readonly icons?: readonly IManifestIcon[];
  /** Human-readable name shown alongside the icon. */
  readonly name?: string;
  /**
   * How the OS should behave when multiple files are opened at
   * once. `"single-client"` reuses one app instance; `"multiple-
   * clients"` opens one instance per file.
   */
  readonly launch_type?: "single-client" | "multiple-clients";
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — Protocol Handling API
// ════════════════════════════════════════════════════════════════════

/**
 * Register the app as a handler for a URL scheme (`web+stackra:`,
 * `mailto:`, `bitcoin:`, …). Custom schemes must be prefixed with
 * `web+` per the spec.
 */
export interface IProtocolHandler {
  /**
   * Protocol scheme without the trailing colon. Common: `"mailto"`,
   * `"tel"`, `"sms"`. Custom: `"web+stackra"`.
   */
  readonly protocol: string;
  /**
   * URL the app opens. `%s` is replaced with the incoming URL
   * (percent-encoded).
   */
  readonly url: string;
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — URL Handling API (Chromium)
// ════════════════════════════════════════════════════════════════════

/**
 * Register the app as a handler for URLs outside its own scope.
 * Chromium-only + gated behind an origin-verification step. Rarely
 * used in production PWAs.
 */
export interface IUrlHandler {
  /** Origin the app can handle URLs from. */
  readonly origin: string;
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — Launch Handler
// ════════════════════════════════════════════════════════════════════

/**
 * Control how the app behaves when it's launched while an instance
 * is already running (deep-link navigation, share-target payload,
 * OS re-launch).
 */
export interface ILaunchHandler {
  /**
   * `"auto"` — browser decides. `"focus-existing"` — activate the
   * open instance without navigating. `"navigate-existing"` —
   * navigate the open instance to the launch URL.
   * `"navigate-new"` — open a fresh instance every time.
   */
  readonly client_mode?:
    | "auto"
    | "focus-existing"
    | "navigate-existing"
    | "navigate-new"
    | readonly (
        "auto" | "focus-existing" | "navigate-existing" | "navigate-new"
      )[];
}

// ════════════════════════════════════════════════════════════════════
// Sub-shape — Widget (Chromium widgets API)
// ════════════════════════════════════════════════════════════════════

/**
 * A widget entry — a small ambient view of the app that lives on
 * the OS home screen / lock screen. Chromium-only + experimental.
 */
export interface IManifestWidget {
  /** Widget label. */
  readonly name: string;
  /** Widget description. */
  readonly description?: string;
  /** Stable widget identifier (tag). */
  readonly tag: string;
  /** URL rendered inside the widget. */
  readonly template?: string;
  /** JSON schema location for the widget's data payload. */
  readonly ms_ac_template?: string;
  /** Data URL for the widget's initial state. */
  readonly data?: string;
  /**
   * Widget icons — smaller size variants than the main app icons.
   */
  readonly icons?: readonly IManifestIcon[];
  /** Screenshots for widget preview in the install UI. */
  readonly screenshots?: readonly IManifestScreenshot[];
  /** Auto-refresh cadence in seconds. */
  readonly update?: number;
  /** Whether the OS may show multiple copies of the widget. */
  readonly multiple?: boolean;
  /** Whether the widget needs the app's auth context to render. */
  readonly auth?: boolean;
  /** Whether the widget stays live on the background thread. */
  readonly backgroundable?: boolean;
}

// ════════════════════════════════════════════════════════════════════
// The main manifest interface
// ════════════════════════════════════════════════════════════════════

/**
 * Web App Manifest shape — every field a `.webmanifest` file may
 * carry.
 *
 * Members are grouped by standardisation status: core W3C fields
 * (rely-safely), Installed Web App API fields (feature-detect),
 * Chromium extensions (graceful degradation on Safari / Firefox),
 * and non-standard tooling fields (browsers ignore; useful in
 * pipelines).
 *
 * @example
 * ```typescript
 * import type { IWebAppManifest } from "@stackra/contracts";
 *
 * const manifest: IWebAppManifest = {
 *   name: "Your App",
 *   short_name: "App",
 *   start_url: "/",
 *   display: "standalone",
 *   background_color: "#ffffff",
 *   theme_color: "#0b0b0b",
 *   icons: [
 *     { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
 *     { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
 *   ],
 * };
 * ```
 */
export interface IWebAppManifest {
  // ────────────────────────────────────────────────────────────────
  // 1. Core W3C Manifest — identity
  // ────────────────────────────────────────────────────────────────

  /** Full application name. */
  readonly name: string;
  /** Short application name (used when space is constrained). */
  readonly short_name?: string;
  /** Application description shown in install UI. */
  readonly description?: string;
  /**
   * Stable manifest identifier — recommended per spec. Must be a
   * same-origin URL relative to the manifest. Browsers use it to
   * detect that two manifests describe the same app when
   * `start_url` / `scope` change over time.
   */
  readonly id?: string;

  // ────────────────────────────────────────────────────────────────
  // 1. Core W3C Manifest — localization
  // ────────────────────────────────────────────────────────────────

  /** BCP-47 language tag (e.g. `"en"` / `"ar"` / `"pt-BR"`). */
  readonly lang?: string;
  /** Base text direction. */
  readonly dir?: "ltr" | "rtl" | "auto";
  /**
   * Per-locale manifest overrides. Browsers merge the matching
   * locale over the top-level fields at install time.
   */
  readonly translations?: Readonly<Record<string, IManifestTranslation>>;

  // ────────────────────────────────────────────────────────────────
  // 1. Core W3C Manifest — navigation
  // ────────────────────────────────────────────────────────────────

  /** URL loaded when the app is launched. Defaults to `/`. */
  readonly start_url?: string;
  /** URL prefix the manifest applies to. */
  readonly scope?: string;

  // ────────────────────────────────────────────────────────────────
  // 1. Core W3C Manifest — display
  // ────────────────────────────────────────────────────────────────

  /** Primary display mode. */
  readonly display?:
    | "fullscreen"
    | "standalone"
    | "minimal-ui"
    | "browser"
    | "window-controls-overlay";
  /**
   * Ordered fallback list. Browsers pick the first supported mode.
   * Chromium extension over the plain `display` field.
   */
  readonly display_override?: readonly (
    | "window-controls-overlay"
    | "fullscreen"
    | "standalone"
    | "minimal-ui"
    | "browser"
    | "tabbed"
  )[];
  /** Default orientation. */
  readonly orientation?:
    | "any"
    | "natural"
    | "landscape"
    | "landscape-primary"
    | "landscape-secondary"
    | "portrait"
    | "portrait-primary"
    | "portrait-secondary";

  // ────────────────────────────────────────────────────────────────
  // 1. Core W3C Manifest — colours
  // ────────────────────────────────────────────────────────────────

  /**
   * Colour applied to the browser chrome / OS status bar when the
   * app is running.
   */
  readonly theme_color?: string;
  /**
   * Colour rendered behind the splash screen while the app loads.
   */
  readonly background_color?: string;

  // ────────────────────────────────────────────────────────────────
  // 1. Core W3C Manifest — appearance
  // ────────────────────────────────────────────────────────────────

  /** Icons available to the OS launcher + install UI. */
  readonly icons?: readonly IManifestIcon[];
  /** Store-style previews shown in install UI. */
  readonly screenshots?: readonly IManifestScreenshot[];
  /** Long-press launcher / jumplist shortcuts. */
  readonly shortcuts?: readonly IManifestShortcut[];
  /** Category tags (e.g. `"productivity"` / `"education"`). */
  readonly categories?: readonly string[];
  /**
   * Search keywords — non-standard but consumed by some app stores
   * (Windows Store, PWABuilder).
   */
  readonly keywords?: readonly string[];

  // ────────────────────────────────────────────────────────────────
  // 1. Core W3C Manifest — installation
  // ────────────────────────────────────────────────────────────────

  /**
   * When true, the OS should prefer offering the native app in
   * `related_applications` over the PWA.
   */
  readonly prefer_related_applications?: boolean;
  /** Related native apps recognised by the OS's install UI. */
  readonly related_applications?: readonly IRelatedApplication[];

  // ────────────────────────────────────────────────────────────────
  // 2. Installed Web App APIs
  // ────────────────────────────────────────────────────────────────

  /** Launch Handler API — control multi-instance launch behaviour. */
  readonly launch_handler?: ILaunchHandler;
  /** File Handling API — register as an "Open with…" target. */
  readonly file_handlers?: readonly IFileHandler[];
  /** Protocol Handling API — register a `web+*:` scheme. */
  readonly protocol_handlers?: readonly IProtocolHandler[];
  /** URL Handling API (Chromium) — handle URLs outside `scope`. */
  readonly url_handlers?: readonly IUrlHandler[];
  /** Web Share Target API — receive share payloads from other apps. */
  readonly share_target?: IShareTarget;
  /**
   * Note-taking API — register as a target for OS quick-note
   * shortcuts (Chromebook stylus button, etc.).
   */
  readonly note_taking?: { readonly new_note_url: string };
  /** Widgets API (Chromium) — publish home-screen widget definitions. */
  readonly widgets?: readonly IManifestWidget[];

  // ────────────────────────────────────────────────────────────────
  // 3. Chromium Extensions
  // ────────────────────────────────────────────────────────────────

  /**
   * How the browser should handle a same-origin link that matches
   * the app's `scope` when the user opens it from another page.
   */
  readonly capture_links?: "none" | "new-client" | "existing-client";
  /**
   * How the OS should handle links whose `origin` matches the
   * app's `scope_extensions`. `"auto"` lets the browser decide;
   * `"preferred"` opts into the PWA-first behaviour.
   */
  readonly handle_links?: "auto" | "preferred" | "not-preferred";
  /**
   * Additional origins the manifest's `scope` extends to — lets
   * the app claim URLs from a partner domain.
   */
  readonly scope_extensions?: readonly ({ readonly origin: string } | string)[];
  /** Edge-only side-panel preferences. */
  readonly edge_side_panel?: { readonly preferred_width?: number };
  /** Tab strip API — pinned "home" tab for tab-strip PWAs. */
  readonly tab_strip?: {
    readonly home_tab?: {
      readonly icons?: readonly IManifestIcon[];
      readonly scope_patterns?: readonly string[];
    };
  };
  /**
   * Launch queue (experimental) — placeholder for the corresponding
   * API's manifest binding. Left as `unknown` until stabilised.
   */
  readonly launch_queue?: unknown;
  /** Experimental permissions declaration. */
  readonly permissions?: readonly string[];

  // ────────────────────────────────────────────────────────────────
  // 4. Non-standard but common (tooling metadata)
  // ────────────────────────────────────────────────────────────────

  /** Manifest version (author's version, not the spec's). */
  readonly version?: string;
  /** Author string. */
  readonly author?: string;
  /** Source repository URL. */
  readonly repository?: string;
  /** Homepage URL. */
  readonly homepage?: string;
  /** License identifier or URL. */
  readonly license?: string;
  /** Bug tracker URL. */
  readonly bugs?: string;

  // ────────────────────────────────────────────────────────────────
  // Escape hatch — vendor extensions
  // ────────────────────────────────────────────────────────────────

  /**
   * Vendor-specific fields the workspace hasn't typed yet. Every
   * entry here should be reviewed for promotion into a typed
   * category when a stable spec exists.
   */
  readonly [vendorKey: string]: unknown;
}
