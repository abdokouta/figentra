# Frontend localization

Rules for how every `@stackra/*` frontend package ships user-facing strings.
Applies to feature packages (`rbac`, `grants`, `notifications`, `pwa`, `kbd`, …)
and framework-plumbing packages that surface user-facing errors (`error`,
`network`, `pwa`, …).

Read alongside:

- `ui-components.md` — the "no literal strings in JSX" enforcement.
- `subpath-layering.md` — why catalogs live under `core/`.
- `code-standards.md` — where source files live inside a subpath.
- `documentation.md` — docblock text is NOT translated (developer-facing).
- The workspace's `localization-content-strategy.md` — that doc is the
  BACKEND-side counterpart (Supabase-stored translatable content). This doc
  is the frontend-side sibling.

The `translator` sub-agent is the operational authority for scaffolding and
auditing per-package catalogs. This doc codifies the shape it emits.

## Rule — one catalog pair per package, JSON, under `src/core/i18n/`

Every package that ships user-facing strings ships EXACTLY two files:

- `src/core/i18n/en.json` — source of truth, authored by humans.
- `src/core/i18n/ar.json` — machine-generated Modern Standard Arabic, audited by
  a native Arabic speaker before shipping to production.

The location is `src/core/i18n/` (under `core/`) even for packages with `react/`
or `native/` subpaths. Rationale — a translation key is not platform-specific:
`roles.title` is a semantic identifier that both web and RN read. Catalogs under
`core/` match the "core is platform-agnostic" rule from `subpath-layering.md`.

**Single-entry exception**: single-entry packages (no `core/` subfolder) ship
`src/i18n/` at the src root. `@stackra/theming` uses this shape today. Both
layouts are valid — the important part is ONE canonical location per package,
not two.

### Namespace = package folder name

The `@stackra/i18n` runtime resolves the namespace from the package directory at
build time. `frontend/packages/rbac/` → `rbac.*`,
`frontend/packages/notifications-push/` → `notifications-push.*`.

Do NOT prefix keys inside the catalog with the namespace:

```json
// ✅ CORRECT — src/core/i18n/en.json for @stackra/rbac
{
  "roles": { "title": "Roles" },
  "permissions_catalog": { "title": "Permissions Catalog" }
}
```

```json
// ❌ WRONG — namespace baked into the file
{
  "rbac": {
    "roles": { "title": "Roles" }
  }
}
```

### Key convention — snake_case, nested by feature

- Keys are `snake_case` (not camelCase, not kebab-case).
- Nest by feature area, not by component name. `role_form.fields.name` (feature
  area = `role_form`, sub-area = `fields`) — not
  `role_form_component.name_field`.
- Common leaf names across packages: `title`, `description`, `submit`,
  `submitting`, `cancel`, `empty.title`, `empty.description`, `empty.cta`,
  `errors.<verb>_failed`, `loading`.
- Interpolation uses `{name}` placeholders. Plurals use ICU when the runtime
  ships pluralisation: `"{count, plural, one {role} other {roles}}"`. Until then
  a hand-authored single string with `{count}` is the pragmatic form.

### Every user-facing string goes through the runtime

Zero string literals in JSX intended for the user. Every rendered string routes
through the future `@stackra/i18n` runtime — currently via a component-level
`useTranslation()` hook or the equivalent context reader:

```tsx
// ✅ CORRECT
<Button>{t("roles.actions.create")}</Button>

// ❌ WRONG — literal that the translator can't extract
<Button>Create Role</Button>
```

The rule applies to attribute values too. `aria-label`, `placeholder`, `title`,
`alt`, `label` HTML attributes that render to the user MUST route through the
runtime:

```tsx
// ✅ CORRECT
<Input placeholder={t("permission_matrix.search_placeholder")} />
```

Attribute NAMES stay in code — no translation applies. Data attributes
(`data-testid`, `data-*`) stay in code. Test IDs stay in code.

### RTL is a runtime + CSS concern, not a translation concern

The catalog file only stores translations. Right-to-left layout is handled by
the runtime (`dir="rtl"` on the document element) + Tailwind's `rtl:*` utility
variants. Do NOT flip text order inside the JSON values, do NOT wrap strings in
bidi override marks (`\u202E`, `\u200F` unless genuinely needed as characters),
and do NOT ship two Arabic files (LTR / RTL) — one `ar.json` is enough.

## Rule — when to ship catalogs vs. when not to

Two decision questions in order:

1. **Does the package render user-facing strings?** — labels, buttons, empty
   states, error messages a user reads, aria labels, placeholders. If yes → ship
   catalogs.
2. **Is the package pure plumbing that only surfaces developer errors?** —
   `cache`, `container`, `discovery`, `http`, `logger`, `pipeline`, `queue`,
   `state`, `pipeline`, `coordinator`. Those strings belong in `Error` class
   messages, not `i18n/*.json`. If yes → no catalogs.

The line is: does a real end-user (a coach, a parent, a tenant admin) ever see
this string? If yes, translate. If no, English-only in the source is fine.

### Framework-plumbing exception — user-facing error surfaces

`@stackra/error`, `@stackra/network`, `@stackra/pwa` — framework-plumbing
packages but they own strings a user sees (default error-boundary fallback,
offline banner, install-app prompt). They ship catalogs for those specific
strings, kept small and framework-scoped.

The rule of thumb: if a screen renders it, it goes in the catalog even when the
owning package is otherwise "plumbing".

## Rule — the translator agent owns the Arabic pass

The `translator` sub-agent scaffolds and audits per-package catalogs. Its
operational contract:

- **AUDIT mode** — scans a package's `src/`, extracts user-facing English
  strings (JSX text nodes, prop defaults, `aria-label`, `placeholder`, `title`,
  `alt`, fallback copy), produces a report of missing catalog coverage.
- **SCAFFOLD mode** — writes `en.json` (source of truth) + `ar.json`
  (machine-generated MSA) with 1:1 key parity.
- **NEVER modifies** existing component source, tests, manifest, README, or
  generated `dist/`.
- Every scaffold is flagged as requiring a native-Arabic reviewer pass before
  shipping to production.

To scaffold a new package's catalogs:

```
invoke_sub_agent(name: "translator", prompt: "Scaffold i18n catalogs for @stackra/<pkg>")
```

To audit an existing package's coverage:

```
invoke_sub_agent(name: "translator", prompt: "Audit i18n catalogs for @stackra/<pkg>")
```

## Rule — key parity between `en.json` and `ar.json`

Every key that exists in `en.json` MUST exist in `ar.json`. Same nesting, same
leaf names. The runtime falls back to `en` for missing `ar` keys, but the
catalog itself is a completeness contract.

Enforced by:

- The `translator` agent generates both files together with 1:1 parity.
- A `<pkg>/__tests__/i18n-parity.test.ts` fixture (recommended per package)
  diffs the two catalogs and fails on any missing key.

## Enforcement

Zero-hit greps:

- **Literal English text nodes in JSX** (`>Some Text<` inside
  `src/react/**/*.tsx`). Every hit is either a `t(...)` call OR carries a
  `// i18n-exempt: <reason>` inline comment. Framework-only identifiers
  (`<Route path="admin">`), test IDs, and `data-*` attributes are exempt.
- **Literal English `aria-label`, `placeholder`, `title`, `alt` VALUES** — same
  rule.
- **`en.json` without a sibling `ar.json`** — every catalog is a pair.
- **`ar.json` without a sibling `en.json`** — same.
- **A key in `en.json` missing from `ar.json`** (checked by the parity test).

## Anti-patterns

| Anti-pattern                                                   | Fix                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `<Button>Create Role</Button>`                                 | `<Button>{t("roles.actions.create")}</Button>`                                  |
| `aria-label="Search"`                                          | `aria-label={t("permission_matrix.search_placeholder")}`                        |
| Catalog under `src/react/i18n/`                                | Move to `src/core/i18n/` — keys are platform-agnostic.                          |
| Catalog outside `src/core/i18n/` (`translations/`, `lang/`)    | Move to the canonical `src/core/i18n/`.                                         |
| File named `locale-en.json` or `en_US.json`                    | `en.json` — BCP-47 short form. `ar.json` — same.                                |
| Key namespaced inside `en.json` (`rbac.roles.title`)           | Drop the outer namespace — the runtime prefixes it from the folder.             |
| Only `en.json` shipped                                         | Every catalog is a pair. Ship `ar.json` (machine-generated, flagged).           |
| Hand-editing `ar.json` on a whim                               | Route Arabic edits through the `translator` agent to stay 1:1 with en.          |
| Storing plural forms as `role_one` / `role_many`               | Use ICU: `"{count, plural, one {role} other {roles}}"`.                         |
| Translating developer-only errors thrown in framework code     | Keep those in English inside `Error` classes; users never see them.             |
| Two Arabic files (LTR + RTL) or wrapping strings in bidi marks | One `ar.json`. Layout is handled by `dir="rtl"` on the root + Tailwind `rtl:*`. |

## Cross-references

- `ui-components.md` — the "no literal strings in JSX" rule this doc's
  enforcement section codifies.
- `subpath-layering.md` — why catalogs live under `core/`.
- `code-standards.md` — where source files live inside a subpath.
- `documentation.md` — docblock text is developer-facing, not translated.
- `translator` sub-agent — the operational owner of Arabic scaffolding and
  auditing.
