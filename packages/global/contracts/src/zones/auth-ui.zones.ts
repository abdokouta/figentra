/**
 * @file auth-ui.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by
 *   `@stackra/auth-ui`.
 *
 *   Every `<Zone id="auth-ui.*">` + every `IZoneContribution.zone`
 *   targeting an auth-ui zone MUST import from this file per
 *   `.kiro/steering/zones-catalog.md` §Rule 1. Full injection intent
 *   lives in `.kiro/plans/zones-workspace-inventory.md` §9.
 */

/**
 * Canonical zone identifiers owned by `@stackra/auth-ui`.
 */
export const AUTH_UI_ZONES = {
  /**
   * Auth layout header — start slot. Consumers register brand
   * mark, back-to-marketing link, or a tenant switcher pill.
   *
   * When empty, `<AuthLayoutHeader>` renders its default brand
   * (config-driven `appName` + optional `logo`). Register a
   * contribution with `position: "replace"` anchored to the
   * intrinsic `brand-mark` child to swap the default entirely.
   *
   * Emitter: `<AuthLayoutHeader>`.
   * Contributions: (open — apps compose brand).
   * Context params: `{}`.
   */
  LAYOUT_HEADER_START: "auth-ui.layout.header.start",

  /**
   * Auth layout header — center slot. Empty by default. Consumers
   * register a page title, breadcrumb trail, or a workspace switcher.
   *
   * Emitter: `<AuthLayoutHeader>`.
   * Contributions: (open).
   * Context params: `{}`.
   */
  LAYOUT_HEADER_CENTER: "auth-ui.layout.header.center",

  /**
   * Auth layout header — end slot. Consumers register theme
   * switcher, language toggle, help affordance, tenant switcher.
   *
   * Emitter: `<AuthLayoutHeader>` (`auth-layout-header.component.tsx`).
   * Contributions: theme-switcher (`@stackra/theming`), language-
   * toggle (`@stackra/i18n`) via workspace zones since 1.2.0.
   * Context params: `{}`.
   */
  LAYOUT_HEADER_END: "auth-ui.layout.header.end",

  /**
   * Auth layout footer — start slot. Consumers register legal
   * links, support link, version chip.
   *
   * Emitter: `<AuthLayoutFooter>`.
   * Contributions: (open — apps inject as needed).
   * Context params: `{}`.
   */
  LAYOUT_FOOTER_START: "auth-ui.layout.footer.start",

  /**
   * Auth layout footer — end slot. Consumers register locale
   * label, region indicator, secondary language toggle.
   *
   * Emitter: `<AuthLayoutFooter>`.
   * Contributions: (open — apps inject as needed).
   * Context params: `{}`.
   */
  LAYOUT_FOOTER_END: "auth-ui.layout.footer.end",

  /**
   * Split-variant side panel — the right column in `<AuthSplitShell>`.
   * Consumers register marketing content, testimonials, feature
   * highlights, an image carousel, tips, or a video.
   *
   * When at least one contribution renders, it replaces the
   * default gradient/background image. When empty, the panel
   * falls back to the visual config's `content`, `backgroundImage`
   * or gradient in that order.
   *
   * Emitter: `<AuthSplitShell>` right column.
   * Contributions: (open — apps compose brand content).
   * Context params: `{}`.
   */
  SPLIT_SIDE_PANEL: "auth-ui.split.side-panel",
  /**
   * Brand mark rendered ABOVE the auth form title inside the
   * variant shell's main content column. Distinct from
   * `LAYOUT_HEADER_START` — that slot lives in the app-chrome
   * header row (small mark, aligned with theme + language toggles);
   * this slot lives inside the form's own visual rhythm (larger
   * mark, aligned with the "Welcome back" title + description).
   *
   * When empty, the shell renders its default brand — an inline
   * SVG placeholder + `config.appName`, wrapped in a home `<Link>`.
   * Consumers register a `position: "replace"` contribution
   * anchored to the intrinsic `default-content-brand-mark` child
   * to swap the default for their own wordmark or logo lockup.
   *
   * Emitter: `<AuthMinimalShell>` (and any future variant that
   * carries its own top-of-content brand).
   * Contributions: (open — apps compose brand).
   * Context params: `{}`.
   */
  CONTENT_BRAND_MARK: "auth-ui.content.brand-mark",

  /**
   * Above the sign-in form. Slot for SSO buttons, promo banners,
   * tenant selector.
   *
   * Emitter: sign-in component in
   * `packages/frontend/auth-ui/src/react/components/`.
   * Contributions: (v1.1 — SSO providers inject here).
   * Context params: `{ tenantSlug?, applicationId? }`.
   */
  SIGN_IN_BEFORE_FORM: "auth-ui.sign-in.before-form",

  /**
   * Below the sign-in form. Slot for legal footer, forgot-password
   * link, "no account? sign up" callout.
   *
   * Emitter: sign-in component.
   * Contributions: (v1.1).
   * Context params: `{ tenantSlug?, applicationId? }`.
   */
  SIGN_IN_AFTER_FORM: "auth-ui.sign-in.after-form",

  /**
   * Inside the sign-in form footer — remember-me, tenant selector.
   *
   * Emitter: sign-in component footer.
   * Contributions: (v1.1).
   * Context params: `{ tenantSlug? }`.
   */
  SIGN_IN_FORM_FOOTER: "auth-ui.sign-in.form.footer",

  /**
   * Above the sign-up form. Slot for plan selector, promo,
   * marketing consent.
   *
   * Emitter: sign-up component.
   * Contributions: (v1.1).
   * Context params: `{ tenantSlug?, applicationId?, invitationToken? }`.
   */
  SIGN_UP_BEFORE_FORM: "auth-ui.sign-up.before-form",

  /**
   * Below the sign-up form. Slot for ToS, marketing opt-in.
   *
   * Emitter: sign-up component.
   * Contributions: (v1.1).
   * Context params: `{ tenantSlug?, applicationId? }`.
   */
  SIGN_UP_AFTER_FORM: "auth-ui.sign-up.after-form",

  /**
   * Below the MFA challenge code-input. Slot for recovery-code
   * fallback link.
   *
   * Emitter: MFA challenge component.
   * Contributions: (v1.1).
   * Context params: `{ mfaChallengeId }`.
   */
  MFA_CHALLENGE_AFTER_CODE_INPUT: "auth-ui.mfa-challenge.after-code-input",

  /**
   * Above the password-reset form.
   *
   * Emitter: password-reset component.
   * Contributions: (v1.1).
   * Context params: `{ resetToken? }`.
   */
  PASSWORD_RESET_BEFORE_FORM: "auth-ui.password-reset.before-form",

  /**
   * Below the password-reset form.
   *
   * Emitter: password-reset component.
   * Contributions: (v1.1).
   * Context params: `{ resetToken? }`.
   */
  PASSWORD_RESET_AFTER_FORM: "auth-ui.password-reset.after-form",
} as const;

/** Union of every zone identifier owned by `@stackra/auth-ui`. */
export type AuthUiZoneId = (typeof AUTH_UI_ZONES)[keyof typeof AUTH_UI_ZONES];
