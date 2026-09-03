/**
 * @file env-naming.mjs
 * @module scripts/_lib/env-naming
 * @description Machine-readable canonical map for the workspace's env var +
 *   secret naming convention.
 *
 *   Codifies ADR-0085 + `.kiro/steering/env-naming.md`. Every downstream
 *   audit / fixer / CI-gate script imports from here — there is exactly
 *   ONE source of truth for:
 *
 *     - The 4 brand prefixes.
 *     - The canonical vendor names + their rejected aliases.
 *     - The 5 mandated runtime prefixes.
 *     - The reserved <RESOURCE> vocabulary.
 *     - The initial Layer-1 rename map (workspace → canonical).
 *
 *   Wave 3 (audit) reads `RENAME_MAP` + `RESERVED_ALIASES` to flag drift.
 *   Wave 4 (fixer) reads `RENAME_MAP` + `LAYER2_STRIP_BRAND` to apply
 *   mechanical rewrites.
 *
 *   Modifying this file WITHOUT updating ADR-0085 + the steering doc is a
 *   review-blocking finding — the three artefacts move together.
 */

// ────────────────────────────────────────────────────────────────
// Brand prefixes (§Rule 1)
// ────────────────────────────────────────────────────────────────

/**
 * The four permitted `<BRAND>` slot values in Layer 1 keys.
 * Never invent a fifth — `SHARED`, `COMMON`, `GLOBAL` are review-blocking.
 */
export const BRAND_PREFIXES = /** @type {const} */ ([
  "FIGENTRA",
  "ACADEMORIX",
  "STACKRA",
  "WORKSPACE",
]);

/** @typedef {(typeof BRAND_PREFIXES)[number]} BrandPrefix */

// ────────────────────────────────────────────────────────────────
// Runtime prefixes (§Rule 3)
// ────────────────────────────────────────────────────────────────

/**
 * Framework-mandated runtime prefixes. Comes FIRST in the key stem;
 * the `<VENDOR>_<RESOURCE>` shape follows.
 *
 * Each entry: [prefix, runtime name, "where the prefix is imposed by the
 * runtime, not by workspace convention"].
 */
export const RUNTIME_PREFIXES = /** @type {const} */ ([
  {
    prefix: "VITE_",
    runtime: "Vite",
    role: "SPA build → client bundle inject",
  },
  {
    prefix: "EXPO_PUBLIC_",
    runtime: "Expo SDK 49+",
    role: "RN client bundle inject",
  },
  {
    prefix: "NEXT_PUBLIC_",
    runtime: "Next.js",
    role: "client bundle inject (reserved)",
  },
  {
    prefix: "TF_VAR_",
    runtime: "Terraform",
    role: "auto-load into var.<name>",
  },
  {
    prefix: "AWS_",
    runtime: "AWS SDKs (all languages)",
    role: "AWS_ACCESS_KEY_ID etc.",
  },
]);

/**
 * `PHP_*` is reserved by PHP for language-level tuning (php.ini overrides).
 * Blocked for app secrets.
 */
export const RESERVED_LANGUAGE_PREFIXES = /** @type {const} */ (["PHP_"]);

// ────────────────────────────────────────────────────────────────
// Vendor canonical names (§Rule 4)
// ────────────────────────────────────────────────────────────────

/**
 * One canonical spelling per vendor. Keys are canonical; values are the
 * rejected aliases (grep targets for the audit).
 *
 * Adding a vendor:
 *   1. Add row here.
 *   2. Add row to `.kiro/steering/env-naming.md` §Vendor catalog.
 *   3. Add row to `.docs/adr/0085-workspace-env-var-naming.md` §D3.
 *   4. Cite in commit.
 */
export const VENDOR_CANONICAL = /** @type {Record<string, string[]>} */ ({
  LARAVEL_CLOUD: ["CLOUD", "LC", "LARAVEL"],
  CLOUDFLARE: ["CF"],
  SENTRY: [],
  NIGHTWATCH: ["NW", "LARAVEL_NIGHTWATCH"],
  ONEUPTIME: ["1UPTIME", "OU"],
  DOPPLER: ["DOOPLER"],
  AWS: ["S3", "IAM", "KMS", "DYNAMODB"],
  GITLAB: ["GL"],
  GITHUB: ["GH"],
  SLACK: [],
  PAGERDUTY: ["PD"],
  BETTER_STACK: ["BS", "BETTERSTACK"],
  RESEND: [],
  EXPO: ["EAS"],
  APPLE: ["APPLE_ID", "ASC", "APP_STORE_CONNECT"],
  GOOGLE_PLAY: ["PLAY", "GPLAY"],
  GOOGLE_CLOUD: ["GCP", "GCLOUD"],
  FIREBASE: [],
  HEROUI: ["HERO_UI"],
  UNIWIND: [],
  TURBO: ["TURBOREPO", "VERCEL_TURBO"],
  POSTGRES: ["PG", "POSTGRESQL"],
  REDIS: [],
  VALKEY: [],
  MEILISEARCH: ["MEILI"],
  MAILPIT: [],
  STRIPE: [],
  PADDLE: [],
  OPENAI: ["OAI"],
  ANTHROPIC: [],
});

/**
 * Fast lookup: alias → canonical name.
 * Derived from VENDOR_CANONICAL at module-load time.
 */
export const ALIAS_TO_CANONICAL = (() => {
  /** @type {Record<string, string>} */
  const map = {};
  for (const [canonical, aliases] of Object.entries(VENDOR_CANONICAL)) {
    for (const alias of aliases) {
      map[alias] = canonical;
    }
  }
  return map;
})();

/**
 * All rejected aliases (flat list for grep).
 */
export const RESERVED_ALIASES = Object.values(VENDOR_CANONICAL).flat();

// ────────────────────────────────────────────────────────────────
// <RESOURCE> vocabulary (§Rule 1)
// ────────────────────────────────────────────────────────────────

/**
 * Reserved `<RESOURCE>` slot values. Extending the list requires an ADR
 * amendment (never grow the vocabulary casually).
 */
export const RESOURCE_KINDS = /** @type {const} */ ([
  "TOKEN",
  "API_KEY",
  "AUTH_TOKEN",
  "MANAGE_TOKEN",
  "DEPLOY_TOKEN",
  "DEPLOY_USER",
  "ACCOUNT_ID",
  "ACCOUNT_TOKEN",
  "ZONE_ID",
  "PROJECT_ID",
  "ORG_SLUG",
  "INTEGRATION_KEY",
  "WEBHOOK_URL",
  "DSN",
  "SIGNING_KEY",
  "BILLING_ID",
  "SERVICE_ACCOUNT_JSON_PATH",
  "EMAIL",
  "TEAM_ID",
  "APP_ID",
  "APP_SPECIFIC_PASSWORD",
  "ACCESS_KEY_ID",
  "SECRET_ACCESS_KEY",
  "REGION",
]);

// ────────────────────────────────────────────────────────────────
// Layer 2 Doppler-project catalog (§Rule 5)
// ────────────────────────────────────────────────────────────────

/**
 * Every per-deployable Doppler project. Adding a deployable adds a row
 * here + the ADR §D5 catalog + the steering §Rule 5 table.
 */
export const LAYER2_DOPPLER_PROJECTS = /** @type {const} */ ([
  {
    name: "figentra-identity-service",
    brand: "FIGENTRA",
    kind: "laravel-service",
  },
  {
    name: "figentra-commerce-service",
    brand: "FIGENTRA",
    kind: "laravel-service",
  },
  {
    name: "figentra-notifications-service",
    brand: "FIGENTRA",
    kind: "laravel-service",
  },
  {
    name: "figentra-observability-service",
    brand: "FIGENTRA",
    kind: "laravel-service",
  },
  {
    name: "figentra-platform-service",
    brand: "FIGENTRA",
    kind: "laravel-service",
  },
  { name: "academorix-api", brand: "ACADEMORIX", kind: "laravel-service" },
  { name: "academorix-ai", brand: "ACADEMORIX", kind: "fastapi-service" },
  { name: "figentra-landing", brand: "FIGENTRA", kind: "vite-spa" },
  { name: "academorix-dashboard", brand: "ACADEMORIX", kind: "vite-spa" },
  { name: "academorix-landing", brand: "ACADEMORIX", kind: "vite-spa" },
  { name: "academorix-mobile", brand: "ACADEMORIX", kind: "expo-rn" },
]);

/**
 * The Layer 1 Doppler project — workspace-tooling.
 */
export const LAYER1_DOPPLER_PROJECT = /** @type {const} */ ({
  name: "figentra-workspace",
  configs: ["dev"],
});

// ────────────────────────────────────────────────────────────────
// Layer 1 rename map — current → canonical (§ADR-0085 Wave 2)
// ────────────────────────────────────────────────────────────────

/**
 * The initial rename map applied to `figentra-workspace/dev` Doppler
 * during Wave 2 of the ADR. (The `.tmp/secrets/secrets.txt` local
 * mirror was retired 2026-08-09; every consumer now reads Doppler
 * directly via `doppler run --scope . -- ./scripts/remap-secrets.sh`
 * per ADR-0085 §Rule 6.)
 *
 * Every entry: `[old_key, new_key]`. Idempotent — running the fixer twice
 * is safe (already-renamed keys are absent from the map).
 *
 * Keys already-compliant with the convention are OMITTED from this map.
 * Example: `ACADEMORIX_LARAVEL_CLOUD_TOKEN` is already correct, so no
 * entry.
 */
export const RENAME_MAP = /** @type {Record<string, string>} */ ({
  // ── Cloudflare — brand ambiguity fix (split accounts) ──────────
  CLOUDFLARE_API_TOKEN: "FIGENTRA_CLOUDFLARE_API_TOKEN",
  CLOUDFLARE_ACCOUNT_ID: "FIGENTRA_CLOUDFLARE_ACCOUNT_ID",
  CLOUDFLARE_ZONE_ID_FIGENTRA: "FIGENTRA_CLOUDFLARE_ZONE_ID",
  CLOUDFLARE_ZONE_ID_ACADEMORIX: "ACADEMORIX_CLOUDFLARE_ZONE_ID",

  // ── Sentry — bare → brand-prefixed ──────────────────────────────
  SENTRY_AUTH_TOKEN: "FIGENTRA_SENTRY_AUTH_TOKEN",
  SENTRY_MANAGE_TOKEN: "FIGENTRA_SENTRY_MANAGE_TOKEN",
  SENTRY_ORG: "FIGENTRA_SENTRY_ORG_SLUG",

  // ── OneUptime — single project, shared → WORKSPACE ──────────────
  ONEUPTIME_API_KEY: "WORKSPACE_ONEUPTIME_API_KEY",
  ONEUPTIME_PROJECT_ID: "WORKSPACE_ONEUPTIME_PROJECT_ID",

  // ── Better Stack — single workspace → WORKSPACE ─────────────────
  BETTER_STACK_API_TOKEN: "WORKSPACE_BETTER_STACK_API_TOKEN",

  // ── PagerDuty — single account → WORKSPACE ──────────────────────
  PAGERDUTY_INTEGRATION_KEY_HIGH: "WORKSPACE_PAGERDUTY_INTEGRATION_KEY_HIGH",
  PAGERDUTY_INTEGRATION_KEY_MEDIUM: "WORKSPACE_PAGERDUTY_INTEGRATION_KEY_MEDIUM",
  PAGERDUTY_ONCALL_EMAIL: "WORKSPACE_PAGERDUTY_EMAIL",
  PAGERDUTY_REST_API_TOKEN: "WORKSPACE_PAGERDUTY_API_KEY",

  // ── Slack — single workspace → WORKSPACE ────────────────────────
  SLACK_WEBHOOK_URL_DEPLOYS: "WORKSPACE_SLACK_WEBHOOK_URL_DEPLOYS",
  SLACK_WEBHOOK_URL_DRIFT: "WORKSPACE_SLACK_WEBHOOK_URL_DRIFT",
  SLACK_WEBHOOK_URL_OBSERVABILITY: "WORKSPACE_SLACK_WEBHOOK_URL_OBSERVABILITY",
  SLACK_WEBHOOK_URL_TRIAGE: "WORKSPACE_SLACK_WEBHOOK_URL_TRIAGE",

  // ── AWS — single terraform-state backend → WORKSPACE ────────────
  AWS_ACCESS_KEY_ID: "WORKSPACE_AWS_ACCESS_KEY_ID",
  AWS_SECRET_ACCESS_KEY: "WORKSPACE_AWS_SECRET_ACCESS_KEY",
  AWS_REGION: "WORKSPACE_AWS_REGION",

  // ── GitLab — brand-explicit ─────────────────────────────────────
  GITLAB_TOKEN: "FIGENTRA_GITLAB_TOKEN",

  // ── Doppler typo fix ────────────────────────────────────────────
  FIGENTRA_DOOPLER_TOKEN: "FIGENTRA_DOPPLER_TOKEN",
  ACADEMORIX_DOOPLER_TOKEN: "ACADEMORIX_DOPPLER_TOKEN",

  // ── GCP alias → canonical ──────────────────────────────────────
  GCP_BILLING_ID: "WORKSPACE_GOOGLE_CLOUD_BILLING_ID",

  // ── Expo — mobile app is academorix ─────────────────────────────
  EXPO_TOKEN: "ACADEMORIX_EXPO_TOKEN",
  EXPO_ACCOUNT_NAME: "ACADEMORIX_EXPO_ORG_SLUG",

  // ── Apple — mobile app is academorix ────────────────────────────
  APPLE_ID_EMAIL: "ACADEMORIX_APPLE_EMAIL",
  APPLE_TEAM_ID: "ACADEMORIX_APPLE_TEAM_ID",
  APPLE_APP_SPECIFIC_PASSWORD: "ACADEMORIX_APPLE_APP_SPECIFIC_PASSWORD",
  COACH_ASC_APP_ID: "ACADEMORIX_APPLE_APP_ID_COACH",
  FAMILY_ASC_APP_ID: "ACADEMORIX_APPLE_APP_ID_FAMILY",

  // ── Google Play — mobile app is academorix ──────────────────────
  PLAY_SERVICE_ACCOUNT_JSON_PATH: "ACADEMORIX_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH",

  // ── HeroUI / Uniwind — framework tier → STACKRA ─────────────────
  UNIWIND_AUTH_TOKEN: "STACKRA_UNIWIND_AUTH_TOKEN",
  HEROUI_AUTH_TOKEN: "STACKRA_HEROUI_AUTH_TOKEN",
});

/**
 * Reverse lookup — canonical → old (used by the fixer to verify no key
 * was renamed to a same-shape sibling accidentally).
 */
export const REVERSE_RENAME_MAP = (() => {
  /** @type {Record<string, string>} */
  const reverse = {};
  for (const [oldKey, newKey] of Object.entries(RENAME_MAP)) {
    reverse[newKey] = oldKey;
  }
  return reverse;
})();

/**
 * Keys that are ALREADY compliant (documented explicitly so the audit
 * doesn't flag them as "unknown / potentially non-compliant").
 */
export const ALREADY_COMPLIANT = /** @type {const} */ ([
  "FIGENTRA_LARAVEL_CLOUD_TOKEN",
  "ACADEMORIX_LARAVEL_CLOUD_TOKEN",
  "FIGENTRA_RESEND_API_KEY",
  "ACADEMORIX_RESEND_API_KEY",
  "STACKRA_GITLAB_TOKEN",
  "STACKRA_COMPOSER_DEPLOY_TOKEN",
  "STACKRA_COMPOSER_DEPLOY_USER",
]);

// ────────────────────────────────────────────────────────────────
// Layer 2 — strip brand prefix inside per-deployable projects
// ────────────────────────────────────────────────────────────────

/**
 * When migrating a Layer 1 key INTO its per-deployable Layer 2 Doppler
 * project (e.g., `FIGENTRA_SENTRY_LARAVEL_DSN` → `figentra-identity-service/prd`
 * as `SENTRY_LARAVEL_DSN`), the brand prefix comes off.
 *
 * The fixer script uses this rule set to decide what to strip:
 *   - Strip `<BRAND>_` prefix when the target Doppler project's brand
 *     matches the key's brand.
 *   - Never rewrite a key where the runtime prefix (VITE_, EXPO_PUBLIC_)
 *     already leads.
 */
export const LAYER2_STRIP_BRAND = /** @type {const} */ (true);

// ────────────────────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────────────────────

/**
 * Parse a Layer 1 key into its 4 slots.
 *
 * @param {string} key
 * @returns {{ brand: string | null, runtime: string | null, vendor: string | null, resource: string | null, qualifier: string | null, raw: string }}
 */
export function parseLayer1Key(key) {
  /** @type {{ brand: string | null, runtime: string | null, vendor: string | null, resource: string | null, qualifier: string | null, raw: string }} */
  const result = {
    brand: null,
    runtime: null,
    vendor: null,
    resource: null,
    qualifier: null,
    raw: key,
  };

  let remaining = key;

  // Detect brand prefix
  for (const brand of BRAND_PREFIXES) {
    if (remaining.startsWith(brand + "_")) {
      result.brand = brand;
      remaining = remaining.slice(brand.length + 1);
      break;
    }
  }

  // Detect runtime prefix (after brand, when present)
  for (const { prefix } of RUNTIME_PREFIXES) {
    if (remaining.startsWith(prefix)) {
      result.runtime = prefix.replace(/_$/, "");
      remaining = remaining.slice(prefix.length);
      break;
    }
  }

  // Detect vendor prefix (longest match wins — GOOGLE_CLOUD before GOOGLE_PLAY)
  const vendorSortedByLength = Object.keys(VENDOR_CANONICAL).sort((a, b) => b.length - a.length);
  for (const vendor of vendorSortedByLength) {
    if (remaining.startsWith(vendor + "_") || remaining === vendor) {
      result.vendor = vendor;
      remaining = remaining.slice(vendor.length + 1);
      break;
    }
  }

  // Detect resource kind (longest match wins for compound resources
  // like SERVICE_ACCOUNT_JSON_PATH before ACCOUNT_ID)
  const resourceSortedByLength = [...RESOURCE_KINDS].sort((a, b) => b.length - a.length);
  for (const resource of resourceSortedByLength) {
    if (remaining.startsWith(resource)) {
      result.resource = resource;
      remaining = remaining.slice(resource.length);
      if (remaining.startsWith("_")) remaining = remaining.slice(1);
      break;
    }
  }

  // Remainder is the qualifier
  if (remaining) result.qualifier = remaining;

  return result;
}

/**
 * Is this key Layer-1-compliant?
 *
 * @param {string} key
 * @returns {boolean}
 */
export function isCompliant(key) {
  if (RENAME_MAP[key]) return false; // has a rename → old shape.
  if (/** @type {readonly string[]} */ (ALREADY_COMPLIANT).includes(key)) {
    return true;
  }
  const parsed = parseLayer1Key(key);
  return parsed.brand !== null && parsed.vendor !== null && parsed.resource !== null;
}

/**
 * Does this key use a rejected alias for a known vendor?
 *
 * @param {string} key
 * @returns {string | null}  The alias if found; null otherwise.
 */
export function findAlias(key) {
  for (const alias of RESERVED_ALIASES) {
    if (key.includes(`_${alias}_`) || key.startsWith(`${alias}_`)) {
      return alias;
    }
  }
  return null;
}
