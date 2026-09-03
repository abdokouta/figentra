---
inclusion: manual
authored_by: kiro
authored_at: 2026-08-07
source: prompt://enterprise-close-out
reviewed_by: null
reviewed_at: null
---

# Cloudflare conventions

Rules for how every public domain owned by the workspace routes, terminates TLS,
applies WAF, and enforces rate limits at the edge. Applies to every
`figentra.com` + `academorix.com` subdomain + every custom domain declared in
`.kiro/cloud/apps/*.yaml`.

> **ADR anchor.** Codified alongside the enterprise close-out plan
> [`.kiro/plans/2026-08-07-enterprise-close-out.md`](../plans/2026-08-07-enterprise-close-out.md)
> §Bundle E.

## Scope

**This steering doc applies to every public-facing domain the workspace routes
through Cloudflare.** It does NOT apply to internal service-to-service traffic
(that travels over private service bindings via the `X-Service-Identity` JWT
contract per ADR-0033).

## Precedence

1. This file wins over generic Cloudflare community guidance when they differ.
2. When this file and a service's own `.kiro/cloud/apps/*.yaml` `domains:` block
   disagree, the yaml wins for domain listing; this file wins for HOW each
   domain is protected.
3. The origin's SSL cert stays canonical. Cloudflare never issues a competing
   cert; TLS mode is Full (Strict) so Cloudflare validates against the origin's
   cert.

## Rule 1 — every public domain sits behind Cloudflare

Every A / AAAA / CNAME record for a public-facing hostname is proxied through
Cloudflare (orange cloud). Direct-to-origin routing is forbidden except for:

- Certificate validation records (`_acme-challenge.*` — grey cloud)
- Mail records (MX, SPF, DKIM — grey cloud, not proxyable)
- Internal health probes (never public)

Every domain listed in `.kiro/cloud/apps/*.yaml` `domains:` block MUST have its
DNS record proxied within 24 hours of the yaml entry landing.

## Rule 2 — TLS mode is Full (Strict)

Cloudflare terminates TLS at the edge with a Cloudflare Universal SSL cert, then
re-establishes TLS to the origin using the origin's provisioned certificate. Full
(Strict) mode validates the origin cert against a public CA — the origin uses
Let's Encrypt, which Cloudflare trusts.

Never accept:

- **Flexible** (edge TLS + plaintext to origin) — leaks credentials over the
  public network
- **Full (non-strict)** — accepts any cert, opens MITM window

Enforced via Cloudflare Dashboard → SSL/TLS → Overview → Full (Strict). Verify
per zone.

## Rule 3 — Minimum TLS Version is 1.2

Cloudflare Dashboard → SSL/TLS → Edge Certificates → Minimum TLS Version = 1.2.
Deprecates TLS 1.0 / 1.1 (PCI-DSS 3.2.1 requirement, GDPR "state-of-the-art"
clause).

TLS 1.3 negotiates automatically for clients that support it — don't set a
maximum.

## Rule 4 — HSTS with preload

Every zone has HSTS enabled:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Cloudflare Dashboard → SSL/TLS → Edge Certificates → HSTS → enable + set:

- Max Age: 12 months (`31536000`)
- Apply to subdomains: on
- Preload: on
- No-Sniff Header: on

30-day soak period first (`max-age=2592000` without preload). After soak, submit
each root domain to [hstspreload.org](https://hstspreload.org).

**Never enable preload before the 30-day soak** — mistakes are irreversible for
12 months.

## Rule 5 — Always Use HTTPS + Automatic HTTPS Rewrites

Cloudflare Dashboard → SSL/TLS → Edge Certificates:

- **Always Use HTTPS**: on (http:// → 301 → https://)
- **Automatic HTTPS Rewrites**: on (auto-upgrade mixed-content links)

Every browser request over http:// terminates with a 301 to https://. Cloudflare
handles this at the edge; origin never sees plaintext.

## Rule 6 — WAF Managed Rules + OWASP CRS

Cloudflare Dashboard → Security → WAF → Managed rules:

- **Cloudflare Managed Ruleset**: enabled, action = challenge
- **OWASP Core Rule Set**: enabled, paranoia level = 1 default, paranoia level =
  2 for auth endpoints (`*/auth/*`, `*/admin/*`)
- **Cloudflare Sensitive Data Detection**: enabled (redacts credit-card / SSN
  patterns from Cloudflare logs)

Paranoia levels:

| Level | Behaviour                                 | When to use                             |
| ----- | ----------------------------------------- | --------------------------------------- |
| 1     | Blocks known-bad payloads only            | Every public endpoint (default)         |
| 2     | Adds broader suspicious-pattern detection | Auth + admin endpoints                  |
| 3     | Blocks anything unusual                   | Not recommended — high false-positive   |
| 4     | Blocks by default                         | Zero-tolerance only (banking / defense) |

Tune paranoia via WAF Rules editor, not via disabling the ruleset.

## Rule 7 — Rate limiting by endpoint class

Cloudflare Dashboard → Security → WAF → Rate limiting rules:

| Endpoint pattern         | Threshold          | Action            | Block duration |
| ------------------------ | ------------------ | ----------------- | -------------- |
| `*/auth/login`           | 10 req/min per IP  | Block             | 1 hour         |
| `*/auth/register`        | 5 req/min per IP   | Block             | 1 hour         |
| `*/auth/password/reset`  | 5 req/min per IP   | Block             | 1 hour         |
| `*/auth/mfa/verify`      | 10 req/min per IP  | Block             | 1 hour         |
| `api.*/*` (general API)  | 100 req/min per IP | Challenge         | 10 min         |
| `*.figentra.com/*` (web) | 300 req/min per IP | Managed challenge | 10 min         |
| `admin.*/*`              | 60 req/min per IP  | Challenge         | 10 min         |

Rate limits are per Cloudflare edge datacenter — actual per-IP limit is roughly
N × (number of PoPs reached by that IP). This is intentional and matches
Cloudflare's product model.

## Rule 8 — Bot Fight Mode

Cloudflare Dashboard → Security → Bots → Bot Fight Mode = on.

Blocks automated abuse (crawlers, credential stuffers, scrapers) without
impacting legitimate users. Free on every plan; upgrade to Super Bot Fight Mode
for verified-bot allowlist (Google, Bing, Yandex, DuckDuckGo).

## Rule 9 — Country blocking (compliance)

Cloudflare Dashboard → Security → WAF → Custom rules:

Block traffic from countries on the US OFAC list (Iran, North Korea, Syria,
Cuba, Crimea/Sevastopol regions of Russia/Ukraine):

```
(ip.geoip.country in {"IR" "KP" "SY" "CU"}) or
(ip.geoip.subdivision_1_iso_code in {"UA-43" "UA-40"})
```

Action = Block. Applies to every zone.

For GDPR jurisdictions (EEA + UK), do NOT block — just ensure DPA is in place
per bundle G (compliance). Cloudflare's default data-processing terms cover EEA.

## Rule 10 — Cache Rules for static assets

Website hosts (`academorix-website`, `figentra-website`) get long-lived edge
caching for static assets:

| Path pattern                | Cache TTL    | Browser TTL |
| --------------------------- | ------------ | ----------- |
| `/assets/*`                 | 1 year       | 1 year      |
| `/build/*`                  | 1 year       | 1 year      |
| `/_next/static/*`           | 1 year       | 1 year      |
| `/_astro/*`                 | 1 year       | 1 year      |
| `/*.js`, `/*.css` with hash | 1 year       | 1 year      |
| `/*.woff2`, `/*.woff`       | 1 year       | 1 year      |
| Everything else             | Bypass cache | 4 hours     |

Cloudflare Dashboard → Rules → Cache Rules. One rule per pattern class. Every
asset served with `Cache-Control: public, max-age=31536000, immutable`.

## Rule 11 — Zero Trust access for admin routes

Cloudflare Zero Trust → Access → Applications:

Every admin route (`/admin/*`, `/backoffice/*`, `/ops/*`) sits behind an Access
policy requiring:

- Identity: Google Workspace SSO (same IdP as bundle H)
- Group membership: `figentra-admins` OR `academorix-admins`
- Session duration: 8 hours max
- Device posture: verified (MFA + up-to-date OS)

Access injects a signed JWT into requests reaching the origin — apps validate
the JWT to know the authenticated operator.

Blocked on bundle H (SSO wiring). Requires Cloudflare Zero Trust subscription
(Free tier: 50 users, sufficient for day-1).

## Rule 12 — Turnstile on public forms

Cloudflare Turnstile (CAPTCHA replacement) protects every public form:

- Login (`/auth/login`)
- Register (`/auth/register`)
- Password reset (`/auth/password/reset`)
- Contact us (`/contact`)
- Newsletter signup (`/subscribe`)

Frontend integration:

```html
<div class="cf-turnstile" data-sitekey="0x4AAAAAA..." data-theme="auto"></div>
```

Backend validation (Worker):

```ts
const verify = await fetch(
  "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: form.get("cf-turnstile-response") ?? "",
      remoteip: request.headers.get("cf-connecting-ip") ?? "",
    }),
  },
);
const { success } = await verify.json<{ success: boolean }>();
if (!success) throw new HttpError(403, "Turnstile failed");
```

Sitekey + secret per zone via Cloudflare Dashboard → Turnstile.

## Rule 13 — Notifications on origin errors

Cloudflare Dashboard → Notifications → Create new:

- **Origin 5xx spike**: threshold 1% over 5 minutes → OneUptime SEV-3
- **DDoS attack alert**: any → OneUptime SEV-2 + `#incidents` Slack
- **WAF blocked requests spike**: threshold 100 blocks/min → `#alerts` Slack
- **Certificate expiring**: within 30 days → `#alerts` Slack (belt + braces;
  Cloudflare auto-renews)

Wired via webhook URLs held in Doppler (`figentra-workspace` project → `dev`
config → `CLOUDFLARE_NOTIFICATION_WEBHOOK_*` secrets).

## Rule 14 — HTTP/3 + QUIC

Cloudflare Dashboard → Network:

- **HTTP/3 (with QUIC)**: on
- **0-RTT Connection Resumption**: on (safe for GET, blocked for POST)
- **WebSockets**: on (Reverb clusters need this)
- **gRPC**: on (future — not currently used)

Default on every Cloudflare plan; verify enabled per zone.

## Rule 15 — DNS record hygiene

Every A / AAAA / CNAME record in Cloudflare DNS follows:

- **Proxied** (orange cloud) for HTTP hostnames
- **DNS Only** (grey cloud) for MX, SRV, TXT, SOA
- **DNS Only** (grey cloud) for `_acme-challenge.*` (Let's Encrypt validation)
- **TTL**: Auto (Cloudflare picks 5 min proxied, 4 hours DNS-only)

Every record has a comment naming its purpose:

```
identity.figentra.com  A   proxied   auto  # Worker edge for identity/prd
api.academorix.com     CNAME proxied auto  # Worker edge for api/prd
_acme-challenge...     TXT   dns-only auto  # letsencrypt validation
```

DNS records live in Cloudflare as source of truth. `.kiro/cloud/apps/*.yaml`
`domains:` blocks declare what SHOULD be routed; Cloudflare Dashboard is the
reconciler. `stackra cloudflare:sync` (future) will bridge these.

## §Pages — Cloudflare Pages as SPA substrate

> **ADR anchor.** Codified by
> [ADR-0110](../../.docs/adr/0110-cloudflare-pages-as-spa-substrate.md) —
> Cloudflare Pages as SPA substrate. Extends
> [ADR-0074](../../.docs/adr/0074-terraform-infrastructure-as-code.md).

Every SPA (`runtime: static-site` in cloud.yaml) resolves through Cloudflare
Pages. Terraform routes SPAs to `modules/spa-pages/`. Static-first,
edge-distributed, free-tier friendly. Cloudflare Pages is the sole SPA substrate
— there is no per-app hosting-provider switch.

### Rule 16 — cloud.yaml carries `runtime: static-site`

Every SPA-flavored cloud.yaml declares `runtime: static-site`. Cloudflare Pages
hosts every SPA.

```yaml
# cloud.yaml — canonical SPA on Cloudflare Pages
kind: app
slug: landing
runtime: static-site
```

Rules:

- `runtime: static-site` names the ARTEFACT (a Vite SPA producing `dist/`); the
  hosting substrate is always Cloudflare Pages.
- Adding a second substrate (e.g. `netlify`, `s3-cloudfront`) requires an ADR
  extension per
  [ADR-0110 §D1](../../.docs/adr/0110-cloudflare-pages-as-spa-substrate.md).
- Reviewers reject a cloud.yaml that combines `runtime: static-site` with any
  hosting-provider override — there is no escape hatch.

### Rule 17 — one Pages project per (app, env)

Terraform provisions ONE `cloudflare_pages_project` per SPA per workspace env.
Naming pattern:

```
<doppler-project>-<env>
```

Applied to the current 3 SPAs:

| Brand      | Slug           | Doppler project        | dev                        | stg                        | prd                        |
| ---------- | -------------- | ---------------------- | -------------------------- | -------------------------- | -------------------------- |
| master     | `landing-page` | `figentra-landing`     | `figentra-landing-dev`     | `figentra-landing-stg`     | `figentra-landing-prd`     |
| academorix | `landing`      | `academorix-landing`   | `academorix-landing-dev`   | `academorix-landing-stg`   | `academorix-landing-prd`   |
| academorix | `dashboard`    | `academorix-dashboard` | `academorix-dashboard-dev` | `academorix-dashboard-stg` | `academorix-dashboard-prd` |

Rules:

- Cloudflare Pages project names are globally unique per account. Per-env naming
  prevents `master-prd` applying against a `master-dev` workspace's Pages
  project.
- Per-env project naming aligns with
  [ADR-0109](../../.docs/adr/0109-multi-workspace-per-brand-per-env-terraform-state.md)'s
  per-brand-per-env terraform workspace state model.
- The custom-domain binding on each per-env project resolves to the env-scoped
  hostname (`dev.figentra.com` → `figentra-landing-dev`; `figentra.com` →
  `figentra-landing-prd`) via `local.marketing_tld`'s env-prefix rule.
- Never share ONE Pages project across envs with 3 custom domains — couples
  every env's traffic to a single deploy; every dev push overwrites stg + prd
  assets.

### Rule 18 — Direct Upload is the default deploy model

`modules/spa-pages/main.tf`'s `cloudflare_pages_project` resource ships WITHOUT
the `source { ... }` block. CI/CD (or an operator locally) pushes builds via:

```bash
npm run build
wrangler pages deploy dist --project-name=<slug>-<env>
```

Rules:

- Direct Upload works from day one — the Pages project + custom domain provision
  immediately; the first `wrangler pages deploy` proves the substrate live.
- Git-source binding requires a one-time human OAuth flow between the Cloudflare
  account + GitLab. That flow is DEFERRED per
  [ADR-0110 §D5](../../.docs/adr/0110-cloudflare-pages-as-spa-substrate.md) as a
  follow-up.
- Every existing Vite build already produces `dist/`. The wrangler push is a
  two-line CI/CD addition.
- Never bypass the substrate — a manual dashboard upload for prd is a
  break-glass path, not a routine. Every prd deploy goes through CI/CD wrangler.

### Rule 19 — Custom domain binding via `cloudflare_pages_domain`

Every SPA's custom domain flows through `cloudflare_pages_domain`. When the
Pages project + the target zone live on the SAME Cloudflare account (typical),
the binding auto-provisions the CNAME record — no separate
`cloudflare_dns_record` needed.

Cross-account setups (Pages project on account A, DNS zone on account B) DO
require a manual CNAME to `<project>.pages.dev`. Not the workspace default;
noted for future brand additions.

Custom-domain resolution:

- Subdomain-less SPA (marketing surface at bare TLD) → `local.marketing_tld`
  (env-prefixed for dev/stg via workspace-level locals).
- Subdomain SPA (dashboards) → `<subdomain>.<api_tld>`.
- Per-app `tld_override` cloud.yaml field wins when non-empty.

Applied:

| SPA slug               | dev binding              | stg binding              | prd binding          |
| ---------------------- | ------------------------ | ------------------------ | -------------------- |
| `landing-page`         | `dev.figentra.com`       | `stg.figentra.com`       | `figentra.com`       |
| `landing` (academorix) | `dev.academorix.com`     | `stg.academorix.com`     | `academorix.com`     |
| `dashboard`            | `app.dev.academorix.com` | `app.stg.academorix.com` | `app.academorix.com` |

### Rule 20 — env vars — VITE_* is `plain_text`, tokens are `secret_text`

`cloudflare_pages_project.deployment_configs.production.env_vars` accepts a map
of `{ type: "plain_text|secret_text", value }`. Rules:

- **Every `VITE_*` variable ships as `type: "plain_text"`.** Vite's public
  prefix bakes the value into the client-side JS bundle at build time — treat
  `VITE_*` as public per Vite's own contract.
- **Every build-time secret ships as `type: "secret_text"`.** Applies to
  `GITLAB_TOKEN` (pnpm's group registry auth) + `HEROUI_AUTH_TOKEN`
  (@heroui-pro/react postinstall). Never expose either in a `VITE_*` variable.
- Reviewers reject a `VITE_STACKRA_GITLAB_TOKEN` OR `VITE_HEROUI_AUTH_TOKEN` in
  any SPA's cloud.yaml env_vars block — the prefix bakes a secret into the
  bundle.
- Every genuine runtime secret (auth cookies, session tokens, per-user data)
  MUST come from the runtime API surface, never a build-time env var. SPAs don't
  hold long-lived secrets client-side.

### Rule 21 — one Pages project per SPA, no stale bindings

Every SPA resolves through EXACTLY ONE `cloudflare_pages_project`. Reviewers
reject:

- A SPA with more than one `cloudflare_pages_project` in terraform-state for the
  same (app, env).
- A migration wave that leaves the same custom domain bound to BOTH a prior
  origin AND a Pages project — Cloudflare rejects the second binding, but the
  race window between the two applies is a live-traffic risk. Per-SPA migrations
  MUST destroy the prior custom-domain binding BEFORE applying the Pages
  binding.

### Rule 22 — GitLab OAuth binding (follow-up, deferred)

Git-push auto-deploy is DEFERRED per
[ADR-0110 §D5 + FUP-1](../../.docs/adr/0110-cloudflare-pages-as-spa-substrate.md).
Enabling it requires:

1. Human enables Pages GitLab OAuth on each CF account (one-time per account via
   CF dashboard → Pages → Connect to GitLab).
2. Author `hosting.git_source: gitlab` cloud.yaml opt-in field.
3. Extend `modules/spa-pages/main.tf`'s `cloudflare_pages_project` with a
   `source { type = "gitlab" config { ... } }` block, gated on the field.

Every SPA stays on Direct Upload (Rule 18) until a follow-up ADR lands the
binding. Reviewers reject a spa-pages module change that ships a `source` block
without the OAuth follow-up ADR referenced.

## Anti-patterns

| Anti-pattern                                                           | Correct                                                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Flexible TLS mode** — plaintext to origin                            | Full (Strict) — validated end-to-end                                                              |
| **Grey-cloud on public HTTP** — bypasses WAF + rate limits             | Orange-cloud proxied                                                                              |
| **HSTS preload without soak** — 12-month regret window                 | 30-day soak with `max-age=2592000` first                                                          |
| **Rate limit per zone, not per endpoint class** — auth same as static  | Per-pattern rules with different thresholds                                                       |
| **CAPTCHA v3 or reCAPTCHA** — Google data-sharing                      | Cloudflare Turnstile (no data-sharing)                                                            |
| **WAF disabled** because it "blocks legit users"                       | Tune paranoia + add allowlist rules; never disable                                                |
| **Cloudflare cert issued for origin** — competing certs                | Origin owns cert (the origin provisions); Cloudflare uses Universal SSL                           |
| **DNS-Only on `api.*` for "performance"** — leaks IP, no WAF           | Orange-cloud always for public traffic                                                            |
| **Admin routes without Zero Trust** — password auth only               | Access policy with SSO + group membership                                                         |
| **Unproxied `_dmarc` / `_dkim`** — these ARE proxyable                 | Grey-cloud only — DNS-only records aren't proxyable regardless                                    |
| **Pages** — `runtime: cloudflare-pages` (naming substrate, not artefact) | Use `runtime: static-site` per §Rule 16                                                        |
| **Pages** — a `hosting.provider` override in cloud.yaml                | Cloudflare Pages is the sole substrate per §Rule 16 — no override                                |
| **Pages** — one Pages project with 3 custom domains for dev/stg/prd    | One project per (SPA, env) per §Rule 17                                                           |
| **Pages** — `VITE_HEROUI_AUTH_TOKEN` in cloud.yaml env_vars            | `HEROUI_AUTH_TOKEN` (no VITE prefix) + `type: secret_text` per §Rule 20                           |
| **Pages** — dashboard upload to prd via CF UI                          | CI/CD wrangler push per §Rule 18 — dashboard uploads are break-glass                              |
| **Pages** — `source { type = "gitlab" }` on `cloudflare_pages_project` | Deferred per §Rule 22 — Direct Upload MVP until OAuth follow-up ADR                               |

## Enforcement

Zero-hit greps operators run before merging a domain change:

```sh
# every .kiro/cloud/apps/*.yaml domain should be on Cloudflare
for f in .kiro/cloud/apps/*/*.yaml; do
  grep -oE 'hostname: [a-z0-9.-]+' "$f" | awk '{print $2}'
done | sort -u | while read host; do
  dig +short "$host" NS | grep -q cloudflare || echo "not on Cloudflare: $host"
done

# TLS grade per domain
for host in identity.figentra.com api.figentra.com; do
  echo "=== $host ==="
  curl -sI "https://$host" | grep -iE 'server:|strict-transport'
done

# §Pages — any hosting-provider override. Cloudflare Pages is the sole
# SPA substrate per §Rule 16 — there is no hosting.provider switch.
grep -rE '^hosting:|^ +provider:' \
  ~/dev/{figentra-inc,academorix,stackra}/**/cloud.yaml 2>/dev/null

# §Pages — VITE_-prefixed secret leak (Rule 20).
grep -rE 'VITE_(HEROUI_AUTH_TOKEN|GITLAB_TOKEN|STACKRA_.*_TOKEN)' \
  ~/dev/{figentra-inc,academorix,stackra}/**/cloud.yaml 2>/dev/null
```

Every hit is a review-blocking finding.

## Cross-references

- [ADR-0110 Cloudflare Pages as SPA substrate](../../.docs/adr/0110-cloudflare-pages-as-spa-substrate.md)
- [ADR-0074 Terraform infrastructure-as-code](../../.docs/adr/0074-terraform-infrastructure-as-code.md)
- [`observability-signals.md`](observability-signals.md) — Sentry / OneUptime
  lanes; Cloudflare origin-error alerts feed the same lane
- [`.kiro/plans/2026-08-07-enterprise-close-out.md`](../plans/2026-08-07-enterprise-close-out.md)
  §Bundle E — the plan this steering codifies
- [`.docs/runbooks/custom-domain-onboarding.md`](../../.docs/runbooks/custom-domain-onboarding.md)
  — flow that adds a custom domain to the origin + Cloudflare in tandem
- Module — `terraform/modules/spa-pages/` — Cloudflare Pages substrate
