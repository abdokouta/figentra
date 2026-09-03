# Growth signals — analytics vs marketing vs newsletter

Rules for which package owns a given outbound event or send. Three packages live
in this space and their boundaries look similar on the surface — they differ on
WHO ACTS on the signal, WHAT the failure consequences are, and WHERE the
compliance surface sits.

Read alongside:

- `.kiro/steering/hierarchy.md` — the platform tree the three packages sit
  under.
- `.kiro/steering/tenancy-columns.md` — every row in all three packages carries
  `tenant_id` (§3 mandate).

## The three packages at a glance

| Package                    | Job                                | Who acts on the signal                | User-visible on failure? |
| -------------------------- | ---------------------------------- | ------------------------------------- | ------------------------ |
| `notifications/newsletter` | First-party editorial send         | **We** deliver the email              | Yes — no email arrives   |
| `growth/marketing`         | Third-party CRM + ad-platform sync | **Vendor** (Mailchimp, Meta) delivers | Sometimes                |
| `growth/analytics`         | Product-behaviour measurement      | **We** read the vendor's dashboards   | No                       |

Same question, three answers. The rule of thumb is the middle column: **who acts
on this event?**

## Decision tree — where does this event go?

Walk this in order. Stop at the first "yes".

```
1. Are WE the send engine? (WE deliver the email / SMS / push?)
     yes → newsletter (editorial) OR notifications-* (transactional)
     no  → continue.

2. Does a VENDOR's send-engine or ad-optimiser act on this event?
   (Mailchimp runs a drip; Meta re-targets; HubSpot triggers a sales
   task; Google Ads bids higher on lookalikes.)
     yes → marketing.
     no  → continue.

3. Does the event feed OUR dashboards / product decisions / funnels?
     yes → analytics.
     no  → You probably don't need a growth signal. It's either a
           domain event (`framework/events` local emit) or a
           telemetry signal (`observability/*`).
```

## `notifications/newsletter` — first-party editorial

**Owns rows:** `Newsletter` (publication), `NewsletterIssue`,
`NewsletterSubscription`, `NewsletterCampaign`, `NewsletterAudience`.

**We own everything.** The tenant composes the content in our editor. The tenant
curates the send list through our audience picker. We deliver through our own
SMTP via `notifications-mail`. We handle unsubscribe via signed URL. We track
opens + clicks with our own tracking pixels.

**Signal shape:** curated editorial content on a cadence (weekly, monthly,
ad-hoc). Not tied to a domain event — an editor initiates the send.

**Example:**

- Tenant composes "Coach Corner" issue #47 in the newsletter editor.
- Selects the "Parents with active memberships" audience.
- Clicks Send.
- Our worker enqueues one `SendNewsletterIssueJob` per subscriber.
- `notifications-mail` delivers each email through the tenant's configured SMTP
  (SES / SendGrid / Postmark).
- Every open + click stamps the `NewsletterCampaign` metrics.

**Compliance:** CAN-SPAM + CASL. Every email carries our signed one-click
unsubscribe URL that flips `NewsletterSubscription.status = unsubscribed` on
click. No vendor in the loop.

## `growth/marketing` — third-party CRM + ad-platform sync

**Owns rows:** `MarketingProviderConfig`, `MarketingEvent`, `MarketingDelivery`,
`MarketingDeadLetter`.

**A vendor owns the send.** We mirror events + audience state OUT to vendors who
own the delivery mechanism. Two sub-families:

1. **CRM / marketing-automation vendors** — Mailchimp, HubSpot, Klaviyo, Braze,
   Iterable, Customer.io. They run drip campaigns + audience segmentation +
   sales-rep task creation.
2. **Ad-platform vendors** — Meta CAPI, TikTok Events, Google Ads Enhanced
   Conversions, LinkedIn Insight Tag. They use the events to optimise ad
   delivery + build lookalike audiences.

**Signal shape:** domain event → vendor SDK call. The vendor decides what to do
with it.

**Examples:**

- `user_registered` → Mailchimp `POST /lists/{id}/members` → Mailchimp runs a
  5-email onboarding drip. The user gets 5 emails from Mailchimp's SMTP, not
  ours.
- `athlete_registered` → Meta CAPI `POST /events` with
  `event_name: 'CompleteRegistration'` → Meta's optimiser learns which lookalike
  parents to target with the tenant's next ad campaign.
- `subscription_upgraded` → HubSpot `POST /events/v3/send` → HubSpot triggers a
  sales-rep task in the tenant's pipeline.
- `purchase_completed` → Google Ads offline conversion upload → Google's Smart
  Bidding raises bids on similar users.

**Compliance:** GDPR + CCPA. On tenant erasure request, marketing package MUST
propagate DELETE to every vendor. The `MarketingDeadLetter` model exists so
failed propagations get manual replay — losing a delete is a compliance breach.

**Rate-limit awareness:** every vendor has a strict quota (Mailchimp: 10 req/s;
Meta CAPI: 5000 events/s; HubSpot: 100 req/10s). The marketing dispatcher's
`MarketingRateLimitGate` + `MarketingCircuitBreakerRegistry` back-pressure per
vendor without blocking the caller.

**PII handling:** email + phone + `external_id` hashed by
`MarketingPayloadPiiHasher` before the payload reaches the driver. Meta / TikTok
/ Google Ads / LinkedIn require SHA-256 hashing of user identifiers per their
spec.

## `growth/analytics` — product-behaviour measurement

**Owns rows:** `AnalyticsProviderConfig`, `AnalyticsEvent`, `AnalyticsDelivery`,
`AnalyticsIdentity`.

**We read the vendor's dashboards.** Same shape as marketing — domain event →
vendor SDK call — but the vendor is a product- analytics platform whose
dashboards / funnels / cohort charts WE consume. The event doesn't drive any
outbound action on the vendor's side.

**Signal shape:** domain event → analytics SDK call. We read the resulting
dashboards to make product decisions.

**Examples:**

- `session_completed` → PostHog `POST /capture/` with
  `event: 'session_completed'` → shows up in PostHog's funnel chart (sign-up →
  first-session → session-completed). We read this to know how many users
  complete their first session.
- `feature_used` → Mixpanel `POST /track` → adoption curves. Product team reads
  this to prioritise feature investment.
- `error_rendered` → Segment `POST /v1/track` → fan-out to N downstream tools
  (Amplitude, Heap, warehouse). Different teams read different views of the same
  event.

**Compliance:** analytics has a lighter compliance footprint because the events
don't drive outbound send. The workspace's `SamplingGate` downsamples at the
pipeline level; GDPR erasure is "stop sending for this user id" rather than
"propagate DELETE to every vendor".

**Rate-limit awareness:** analytics vendors are generally unbounded — PostHog +
Segment + GA4 all accept high-volume streams without per-tenant quotas. The
`BatchBuffer` service groups events into batches for network efficiency, not for
rate-limit compliance.

**Failure model:** fire-and-forget. A PostHog outage means a metric gap in our
dashboard for a few minutes; nobody is user-visibly harmed. Persistent failures
observed via `AnalyticsCircuitBreakerRegistry` (same shape as marketing, lower
severity thresholds).

## Concrete decision matrix

Common events and where they route:

| Event                      | newsletter |                          marketing                          |         analytics          |
| -------------------------- | :--------: | :---------------------------------------------------------: | :------------------------: |
| `user_registered`          |            | ✅ Mailchimp / HubSpot / Meta CAPI (`CompleteRegistration`) | ✅ PostHog / Segment / GA4 |
| `athlete_enrolled`         |            |                    ✅ Meta CAPI (`Lead`)                    |         ✅ PostHog         |
| `subscription_upgraded`    |            |    ✅ HubSpot (sales-rep task) / Meta CAPI (`Purchase`)     |        ✅ Mixpanel         |
| `purchase_completed`       |            |     ✅ Meta / Google Ads / TikTok / LinkedIn `Purchase`     |         ✅ PostHog         |
| `page_viewed`              |            |          ✅ Meta CAPI `PageView` (ad optimisation)          |      ✅ GA4 / PostHog      |
| `feature_used`             |            |                                                             |        ✅ Mixpanel         |
| `newsletter_issue_sent`    | ✅ WE send |                                                             |      ✅ PostHog (KPI)      |
| `password_reset_requested` |            |                                                             |         ✅ PostHog         |
| `admin_impersonated_user`  |            |                                                             |         ✅ (only)          |
| `session_completed`        |            |                                                             |         ✅ PostHog         |
| `funnel_step_completed`    |            |                                                             |         ✅ (only)          |

**Reading the matrix:** every row that lands in `marketing` AND `analytics` is
emitted twice — once through each pipeline. Each pipeline has its own retry
semantics, its own dead-letter policy, its own PII scrubbing. The event class
(from `framework/events`) is the ONE source; both pipelines subscribe to it.

## Driver rollout — what ships today

**Analytics (4 drivers):**

- `NullAnalyticsProviderDriver` — fail-soft default (registered as the fallback
  driver).
- `PostHogAnalyticsProviderDriver` — self-hostable workspace default.
- `SegmentAnalyticsProviderDriver` — fan-out hub to N destinations.
- `Ga4AnalyticsProviderDriver` — Measurement Protocol.

**Marketing (7 drivers — 3 CRM + 4 ad-platform):**

- `NullMarketingProviderDriver` — fail-soft default (registered as the fallback
  driver).
- `MailchimpMarketingProviderDriver` — SMB email + audiences.
- `HubspotMarketingProviderDriver` — CRM baseline.
- `MetaCapiMarketingProviderDriver` — Meta / Instagram ads.
- `TiktokEventsMarketingProviderDriver` — TikTok ads.
- `GoogleAdsConversionsMarketingProviderDriver` — Google Ads offline
  conversions.
- `LinkedinInsightsMarketingProviderDriver` — LinkedIn ads.

Adding a new vendor = one driver class + one `providers.*` block in the
analytics/marketing config module + a Doppler secret set. No other package
changes.

## The "same vendor, different lane" case

Google Analytics 4 and Google Ads are BOTH from Google. They live on DIFFERENT
lanes because their semantics diverge:

- **GA4** (analytics lane) — Measurement Protocol → GA4 property → our
  dashboards. Feeds funnel + cohort analysis.
- **Google Ads** (marketing lane) — Enhanced Conversions API → Ads Manager →
  Google's Smart Bidding optimiser. Feeds ad bid strategy.

Same rule applies to Meta:

- **Meta Pixel browser-side** — pageview measurement lands in a bundled JS SDK.
  Different concern; typically served from the frontend's `@stackra/pwa`
  package, not this backend.
- **Meta CAPI server-side** (marketing lane) — server-emitted conversion signal
  for ad optimisation.

## Anti-patterns

| Anti-pattern                                                                          | Correct                                                                                                                                             |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adding `MetaCapiAnalyticsProviderDriver` to `growth/analytics`                        | Ships as `MetaCapiMarketingProviderDriver` in `growth/marketing`. Meta acts on the event, we don't.                                                 |
| Deleting `growth/marketing` and folding into `analytics`                              | Keep them separate — different retry semantics, compliance surface, rate limits, dead-letter policy.                                                |
| Compressing `newsletter` into `marketing` because both send emails                    | Newsletter = WE send. Marketing = vendor sends. Different SMTP, different unsubscribe surface, different compliance envelope.                       |
| Emitting `page_viewed` through `newsletter`                                           | Newsletter is editorial content, not event streaming.                                                                                               |
| Emitting `newsletter_issue_sent` through `marketing`                                  | The newsletter IS the send; marketing mirrors events to vendors. Emit through `analytics` if you want a KPI dashboard.                              |
| Adding a `dependencies` block on the marketing package for a vendor SDK               | Never — every driver uses the platform's shared `fetch`-based HTTP client. No vendor SDKs in vendor lock-in territory.                              |
| Bypassing `MarketingPayloadPiiHasher` because "the vendor accepts plaintext"          | Meta / TikTok / Google Ads / LinkedIn REQUIRE SHA-256 hashed identifiers per their spec. The pipeline hashes upstream so drivers see hashed values. |
| Registering the same domain event on both pipelines but with different payload shapes | Emit ONE event class from `framework/events`; each pipeline maps to its vendor's shape via its own `PayloadTransformer`.                            |

## Cross-references

- ADR-0062 — reporting query engine (Option A, PG-native). Analytics events land
  in `AnalyticsEvent`; reporting queries them via the reporting query engine.
- ADR-0065 — central observability store via SDK. The three-lane pattern this
  steering codifies (newsletter / marketing / analytics) parallels the
  observability domain's client-SDK-emits-to-central-store shape codified by
  ADR-0065.
- `.kiro/specs/backend-completion-audit/PLAN.md` §7 — the wave brief this
  steering codifies.
- `backend/packages/notifications/newsletter/README.md` — the editorial send
  package.
- `backend/packages/growth/marketing/README.md` — the CRM + ad- platform sync
  package.
- `backend/packages/growth/analytics/README.md` — the product- analytics
  measurement package.
- `backend/packages/growth/attribution/README.md` — the attribution ledger that
  feeds BOTH marketing (which channel converts) and analytics (funnel stage)
  with `AttributionTouchpoint` rows.
