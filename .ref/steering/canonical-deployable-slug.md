---
authored_by: kiro
authored_at: 2026-08-19
source: prompt://landing-page-canonical-slug-rename
reviewed_by: null
reviewed_at: null
---

# Canonical deployable slug — one name across every substrate

Rule for how every deployable app in the workspace names itself across Sentry,
Doppler, Cloudflare, terraform, and GitLab CI variables. Codified
by [ADR-0105](../../.docs/adr/0105-canonical-deployable-slug.md).

## The one rule

**The GitLab repo slug (or monorepo folder name for sub-apps) is the canonical
deployable identifier. Every downstream substrate MUST use that exact slug — no
per-substrate renames, no brand prefixes, no `-service` stripping.**

Env suffix `-<env>` is appended only where the substrate is inherently
env-scoped (Sentry project per env, GitLab CI vars per env). Substrates that
scope by other means (Cloudflare Workers environments, Doppler configs,
Cloudflare DNS records) don't need the suffix.

## Applied table

For a GitLab repo at `figentra-inc/<slug>`:

| Substrate                                       | Value          | Env-scoped?                |
| ----------------------------------------------- | -------------- | -------------------------- |
| Terraform `catalog.json` apps[].slug            | `<slug>`       | no                         |
| Terraform `catalog.json` apps[].tags.service    | `<slug>`       | no                         |
| Terraform `catalog.json` apps[].doppler_project | `<slug>`       | no                         |
| Doppler project name                            | `<slug>`       | no (configs scope by env)  |
| Sentry project slug                             | `<slug>-<env>` | YES (one per env)          |
| Cloudflare Worker name                          | `<slug>`       | no (envs scope internally) |
| Cloudflare DNS record label key                 | `<slug>`       | no                         |
| GitLab CI `SENTRY_PROJECT` var                  | `<slug>-<env>` | YES                        |
| GitLab CI `DOPPLER_PROJECT` var                 | `<slug>`       | no                         |

For a monorepo at `<org>/<mono-repo>` with apps at `apps/<slug>/`, treat
`<slug>` (the folder name) as the canonical identifier. Example:
`academorix/frontend/apps/landing` → canonical slug `landing`.

## No brand prefix inside the Doppler slug

Prior convention was `<brand>-<slug>` (e.g. `figentra-landing`). Retired.

Each terraform workspace is brand-scoped (`master-{dev,stg,prd}` +
`academorix-{dev,stg,prd}` per ADR-0109), so the brand context is implicit in
the terraform workspace name.

Cross-brand collision is prevented by construction:

1. SHARED runtime services
   (identity/commerce/notifications/observability/platform) live under master
   only per ADR-0069.
2. Per-application services (`api`, `ai`) use product-native slugs (`api`, `ai`)
   that don't collide with SHARED slugs.
3. Product-web apps get product-native slugs (`figentra-inc/landing-page` →
   `landing-page`, `academorix/frontend/apps/landing` → `landing`) — different
   words for different apps.

## Adding a new deployable

1. GitLab repo (or monorepo folder) is the source of truth. Pick the slug once.
2. `catalog.json` apps[] entry uses that slug for `slug`, `tags.service`,
   `doppler_project` (three identical values).
3. On first apply, terraform provisions:
   - Sentry projects `<slug>-{dev,stg,prd}`
   - Cloudflare Worker named `<slug>` with envs
   - Doppler project `<slug>` with configs
   - Cloudflare DNS records keyed by `<slug>`
4. In the repo's `.gitlab-ci.yml`, add `SENTRY_PROJECT` env-scoped CI variables
   (or rely on the shared sentry-release template's default).

## Enforcement

Zero-hit greps a reviewer runs before merging a new app to `catalog.json`:

```sh
# apps[].slug must equal apps[].doppler_project
python3 -c "
import json
d = json.load(open('terraform/catalog.json'))
for a in d.get('apps', []):
    slug = a.get('slug', '')
    dp = a.get('doppler_project', '')
    tag = a.get('tags', {}).get('service', '')
    if slug != dp:
        print(f'DOPPLER MISMATCH: {slug} vs doppler_project={dp}')
    if slug != tag:
        print(f'TAG MISMATCH: {slug} vs tags.service={tag}')
"

# Doppler project name matches slug (no brand prefix)
python3 -c "
import json
d = json.load(open('terraform/catalog.json'))
for a in d.get('apps', []):
    dp = a.get('doppler_project', '')
    if dp.startswith(('figentra-', 'academorix-', 'stackra-')):
        print(f'BRAND PREFIX FOUND: {dp} — should be bare slug per ADR-0105')
"
```

Both must return zero hits.

## Follow-up — the sentry-release template

The workspace-shared `.gitlab-ci-sentry-release.yml` template currently defaults
`SENTRY_PROJECT` to `"${CI_PROJECT_NAME}"` which doesn't include the env suffix.
Repos whose Sentry projects follow the `<slug>-<env>` convention (i.e. every
workspace-managed repo) MUST override `SENTRY_PROJECT` at the CI variable layer
— env-scoped `production` → `<slug>-prd`.

Future work: update the template default to `"${CI_PROJECT_NAME}-prd"` (safe
since the template runs only on main-branch → production).

## Cross-references

- [ADR-0105](../../.docs/adr/0105-canonical-deployable-slug.md) — this
  steering's authorising ADR.
- [ADR-0058](../../.docs/adr/0058-per-application-service-vendor-split.md) —
  per-Application vendor split (avoids cross-brand collision at the vendor scope
  level).
- [ADR-0069](../../.docs/adr/0069-corporate-operator-vendor-scope.md) — SHARED
  runtime vs product vendor split.
- [ADR-0074](../../.docs/adr/0074-terraform-infrastructure-as-code.md) — Sentry
  project env-suffix convention (`<slug>-<env>`).
- [ADR-0109](../../.docs/adr/0109-multi-workspace-per-brand-per-env-terraform-state.md)
  — Brand-scoped terraform workspaces.
- [`.kiro/steering/env-naming.md`](env-naming.md) §Rule 3 — Layer 2 keys use
  `<VENDOR>_<RESOURCE>` (no brand prefix inside per-deployable Doppler
  projects); this rule is the deployable-slug counterpart.
- [`.kiro/steering/package-naming.md`](package-naming.md) — npm package scope
  naming (a separate rule for package identifiers).
