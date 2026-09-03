---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://mail-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/mail` — enterprise email sending

**Status:** Planned
**Anchor ADRs:** [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md)
**Reference:** `.ref/packages/mail/` (`@nesvel/nestjs-mail` v0.1.0)
**Depends on:** `@stackra/container`, `@stackra/contracts`, `@stackra/support`,
`@stackra/config`, `@stackra/queue` (for async delivery), `@stackra/logger`,
`@stackra/link` (for signed URLs in emails), `@react-email/render` (optional
peer)
**Design effort:** 24 days across 10 phases

## Purpose

Production-grade email sending for backend services. Laravel-inspired
Mailables + BullMQ queues + React email templates + 5 transport providers.

Every service that sends email composes from this. Ships:

- **Multi-transport** — SMTP / AWS SES / SendGrid / Mailgun / Postmark /
  Resend / stdout (dev). Selected via `MailManager` (Shape B — one connection
  per environment / brand).
- **Mailable classes** — Laravel-style declarative API. Author a `WelcomeEmail`
  class w/ subject, view, attachments, cc/bcc; send it via `mail.to(user).send(new WelcomeEmail(user))`.
- **React email templates** — via `@react-email/render`. Type-safe props;
  cross-client-tested HTML output.
- **Queued by default** — every send goes through `@stackra/queue`. Sync send
  available for critical paths (`.sendNow()`).
- **Suppression list** — bounce + complaint webhooks feed a suppression list;
  the service rejects sends to suppressed addresses at the API boundary.
- **Delivery logging** — every send + delivery + open + click tracked (via
  transport webhooks) in `mail_deliveries` table.
- **Gmail structured data** — order confirmations, reservations render w/
  schema.org markup (Gmail treats these specially).
- **Test-mode transport** — captures every send in memory; testing helpers
  assert on `.subject` / `.recipient` / `.body`.

## Non-goals

- Marketing-email campaigns (opt-in list management, drip campaigns) — that's
  a marketing-platform concern (Mailchimp / SendGrid Marketing API).
- SMS — separate package (`@stackra/sms` — future).
- Push notifications — separate package (`@stackra/push` — future).
- Inbox parsing / IMAP — not shipped; would be a separate package.

## Manager pattern — MultipleInstanceManager (Shape B per ADR-0090)

```typescript
{
  default: "primary",
  instances: {
    primary: {
      driver: "ses",
      region: "us-east-1",
      fromEmail: "noreply@stackra.com",
      fromName: "Stackra",
    },
    marketing: {
      driver: "sendgrid",
      apiKey: config.get("SENDGRID_API_KEY"),
      fromEmail: "hello@stackra.com",
    },
    transactional: {
      driver: "postmark",
      serverToken: config.get("POSTMARK_TOKEN"),
      messageStream: "outbound",
    },
    dev: {
      driver: "log",   // logs to stdout instead of sending
    },
    test: {
      driver: "array", // captures sends in memory
    },
  },
}
```

Consumers select the instance per send:

```typescript
mail.instance("marketing").to(user).send(new NewsletterEmail(newsletter));
```

## Transport drivers

| Driver     | Peer                      | Provides                                                    |
| ---------- | ------------------------- | ----------------------------------------------------------- |
| `smtp`     | `nodemailer`              | Generic SMTP (self-hosted / any provider).                  |
| `ses`      | `@aws-sdk/client-sesv2`   | AWS SES — bounce/complaint via SNS webhook.                 |
| `sendgrid` | native `fetch`             | SendGrid v3 API + event webhook.                            |
| `mailgun`  | native `fetch`             | Mailgun v4 API + event webhook.                             |
| `postmark` | native `fetch`             | Postmark server tokens + delivery hooks.                    |
| `resend`   | native `fetch`             | Resend API — modern, DX-focused.                            |
| `log`      | none                       | Prints to stdout; dev-only.                                 |
| `array`    | none                       | Captures in memory; test-only.                              |
| `null`     | none                       | No-op; benchmarks + tenant-suspended.                       |

## Public API — locked

### `MailService`

```typescript
class MailService {
  instance(name?: string): IMailInstance;

  // Fluent builder (delegates to default instance)
  to(recipient: string | IRecipient | IRecipient[]): PendingMail;
  cc(recipient: ...): PendingMail;
  bcc(recipient: ...): PendingMail;
}

interface PendingMail {
  cc(recipient: ...): this;
  bcc(recipient: ...): this;
  from(sender: string | IRecipient): this;
  replyTo(recipient: ...): this;
  send(mailable: Mailable): Promise<{ messageId: string; queued: boolean }>;
  sendNow(mailable: Mailable): Promise<{ messageId: string }>;  // bypass queue
}
```

### `Mailable` base class

```typescript
class WelcomeEmail extends Mailable {
  constructor(private user: User) {
    super();
  }

  envelope(): IEnvelope {
    return {
      subject: `Welcome to ${config.get("APP_NAME")}`,
      tags: ["welcome", "onboarding"],
      metadata: { userId: this.user.id },
    };
  }

  // React email template — auto-rendered via @react-email/render.
  content(): ReactElement {
    return <WelcomeTemplate user={this.user} />;
  }

  // Optional text fallback (defaults to auto-generated from HTML).
  text(): string { ... }

  // Attachments.
  attachments(): IAttachment[] {
    return [
      Attachment.fromPath("./welcome.pdf").as("welcome.pdf"),
    ];
  }

  // Structured data (Gmail schema.org markup).
  markup(): ISchemaOrgMarkup { ... }

  // Route to a specific instance.
  instance(): string { return "transactional"; }

  // Queue name override (default "mail").
  queue(): string { return "mail-transactional"; }
}
```

### `@stackra/mail/testing`

```typescript
import { mailFake } from "@stackra/mail/testing";

test("welcome email sends", async () => {
  const fake = mailFake();  // swaps default instance to "array" driver

  await userService.register({ email: "foo@bar.com" });

  fake.assertSent(WelcomeEmail);
  fake.assertSentTo("foo@bar.com", WelcomeEmail);
  fake.assertSentCount(1);

  const [sent] = fake.sent();
  expect(sent.mailable).toBeInstanceOf(WelcomeEmail);
  expect(sent.envelope.subject).toBe("Welcome to Stackra");
});
```

### Queued sends via `@stackra/queue`

`.send(mailable)` dispatches `SendMailJob` to `@stackra/queue`. Processor
lives in the same package. Config:

```typescript
MailModule.forRoot({
  queue: {
    connection: "primary",   // @stackra/queue connection name
    queueName: "mail",
    concurrency: 10,
    attempts: 3,
    backoff: { type: "exponential", delay: 60_000 },
  },
});
```

### Bounces + complaints — suppression list

Every transport driver ships a webhook handler:

```typescript
@Controller("/webhooks/mail")
class MailWebhooksController {
  constructor(private readonly suppression: SuppressionListService) {}

  @Post("/ses")
  async ses(@Body() event: ISesEvent) {
    if (event.type === "Bounce") {
      await this.suppression.add(event.recipient, { reason: "bounce", ...});
    }
    if (event.type === "Complaint") {
      await this.suppression.add(event.recipient, { reason: "complaint", ...});
    }
  }
}
```

The service short-circuits sends to suppressed addresses:

```typescript
async send(mailable: Mailable, opts: ISendOpts) {
  const suppressed = await this.suppression.check(opts.recipients);
  if (suppressed.length > 0) {
    this.logger.warn("Skipping suppressed recipients", { suppressed });
    // Removes them from the recipient list; sends to the rest.
  }
  // ... send
}
```

### Delivery + open + click tracking

Every send records to `mail_deliveries`:

```typescript
interface IMailDelivery {
  id: string;                     // ULID
  messageId: string;
  transport: string;              // "ses" / "sendgrid" / ...
  mailable: string;                // class name
  recipient: string;
  cc: string[];
  bcc: string[];
  subject: string;
  status: "queued" | "sent" | "delivered" | "bounced" | "complained" | "opened" | "clicked";
  events: IMailEvent[];             // timestamped state transitions
  createdAt: Date;
  metadata: Record<string, unknown>;
}
```

Webhook handlers update the `status` + append `events`. Enables the admin
"why didn't this email arrive?" flow.

## Subpath layout

```
packages/mail/
├── package.json                          # 5 subpath exports
├── src/
│   ├── core/                             # ".": platform-agnostic
│   │   ├── mail.module.ts
│   │   ├── services/
│   │   │   ├── mail.service.ts
│   │   │   ├── mail-manager.service.ts
│   │   │   ├── pending-mail.ts
│   │   │   ├── suppression-list.service.ts
│   │   │   └── delivery-log.service.ts
│   │   ├── mailables/
│   │   │   ├── mailable.base.ts
│   │   │   └── attachment.ts
│   │   ├── adapters/
│   │   │   ├── smtp.adapter.ts
│   │   │   ├── ses.adapter.ts
│   │   │   ├── sendgrid.adapter.ts
│   │   │   ├── mailgun.adapter.ts
│   │   │   ├── postmark.adapter.ts
│   │   │   ├── resend.adapter.ts
│   │   │   ├── log.adapter.ts            # dev
│   │   │   ├── array.adapter.ts          # test
│   │   │   └── null.adapter.ts
│   │   ├── processors/
│   │   │   └── send-mail.processor.ts    # @stackra/queue processor
│   │   ├── entites/                       # (note: matches ref typo)
│   │   │   ├── mail-delivery.entity.ts
│   │   │   ├── suppression-list.entity.ts
│   │   │   └── delivery-event.entity.ts
│   │   ├── constants/
│   │   │   ├── mail-events.const.ts
│   │   │   └── default-config.const.ts
│   │   ├── decorators/
│   │   │   ├── mailable.decorator.ts
│   │   │   └── mail-listener.decorator.ts
│   │   ├── exceptions/
│   │   │   ├── send-failed.exception.ts
│   │   │   ├── recipient-suppressed.exception.ts
│   │   │   └── template-render-failed.exception.ts
│   │   ├── enums/
│   │   │   ├── mail-status.enum.ts
│   │   │   └── mail-event-type.enum.ts
│   │   ├── interfaces/
│   │   │   ├── mailable.interface.ts
│   │   │   ├── envelope.interface.ts
│   │   │   ├── attachment.interface.ts
│   │   │   ├── recipient.interface.ts
│   │   │   ├── transport-adapter.interface.ts
│   │   │   └── mail-options.interface.ts
│   │   ├── markup/                       # Gmail schema.org
│   │   │   ├── order-confirmation.ts
│   │   │   ├── reservation.ts
│   │   │   └── generic-schema.ts
│   │   ├── providers/                    # DI providers
│   │   │   └── mail-connection.provider.ts
│   │   ├── resources/                    # HTTP webhooks
│   │   │   ├── mail-webhooks.controller.ts
│   │   │   └── mail-delivery-log.controller.ts
│   │   └── index.ts
│   ├── react/                            # "./react": React Email templates
│   │   ├── components/                    # shared template primitives
│   │   │   ├── layout.tsx
│   │   │   ├── button.tsx
│   │   │   └── signature.tsx
│   │   ├── templates/                    # example templates
│   │   │   ├── welcome.template.tsx
│   │   │   └── password-reset.template.tsx
│   │   └── index.ts
│   ├── nest/                             # "./nest": module + controllers
│   │   ├── nest-mail.module.ts
│   │   └── index.ts
│   ├── cli/                              # "./cli"
│   │   ├── mail-preview.command.ts       # `stackra mail:preview WelcomeEmail`
│   │   ├── mail-send-test.command.ts     # `stackra mail:send-test <mailable> <recipient>`
│   │   ├── mail-suppression.command.ts
│   │   └── index.ts
│   └── testing/
│       ├── mail-fake.ts
│       ├── mail-assertions.ts
│       └── index.ts
└── __tests__/
    └── unit/                             # 30+ files
```

## `@Mailable()` — auto-discovery + preview

Every Mailable class registered via `@Mailable()` decorator ships:

- A **preview URL** — `/dev/mail-preview/<mailable-name>` renders the email
  in the browser (dev-only middleware).
- A **CLI command** — `stackra mail:preview WelcomeEmail --to=foo@bar.com`.

Enables designers to iterate on templates without a full send.

## Phases

### Phase 1 — Scaffold + Manager (2 days)

- [ ] Package skeleton.
- [ ] `MailManager` (Shape B) + basic PendingMail builder.

### Phase 2 — Adapters (5 days)

- [ ] SMTP (nodemailer).
- [ ] SES (v3 SDK).
- [ ] SendGrid (fetch).
- [ ] Mailgun (fetch).
- [ ] Postmark (fetch).
- [ ] Resend (fetch).
- [ ] Log + Array + Null.

### Phase 3 — Mailable + templates (3 days)

- [ ] `Mailable` base class.
- [ ] `@react-email/render` integration.
- [ ] Attachment builder.
- [ ] Auto text-fallback from HTML.

### Phase 4 — Queue integration (2 days)

- [ ] `SendMailJob` + processor in `@stackra/queue`.
- [ ] Retry / backoff policy per adapter.
- [ ] Dead-letter queue for permanently failed sends.

### Phase 5 — Suppression + delivery log (3 days)

- [ ] Suppression list w/ per-tenant scoping.
- [ ] `mail_deliveries` table + status tracking.
- [ ] Webhook handlers per transport (SES / SendGrid / Mailgun / Postmark).

### Phase 6 — Gmail structured data (1 day)

- [ ] Order-confirmation markup.
- [ ] Reservation markup.
- [ ] Generic schema.org helper.

### Phase 7 — CLI commands (2 days)

- [ ] `mail:preview` — HTML render in browser.
- [ ] `mail:send-test` — CLI-triggered send.
- [ ] `mail:suppression` — list / add / remove.

### Phase 8 — Nest module + admin UI (2 days)

- [ ] `NestMailModule.forRoot()`.
- [ ] Delivery-log admin controller.
- [ ] `<MailPreviewer>` React component for embed in admin UI.

### Phase 9 — Testing (2 days)

- [ ] `mailFake()` swap.
- [ ] `assertSent` / `assertNotSent` / `assertSentTo` / `assertSentCount`.
- [ ] Integration test w/ each transport (mocked HTTP).

### Phase 10 — Verification + docs (2 days)

- [ ] End-to-end SES send in staging.
- [ ] Bounce webhook → suppression list round-trip verified.
- [ ] Preview UI + CLI verified.
- [ ] README documents every transport + a "your first mailable" walkthrough.

## Exit criteria

- [ ] Every transport driver sends successfully in dev (SMTP / SES /
      SendGrid / Mailgun / Postmark / Resend).
- [ ] React email template renders w/ dark-mode support (Gmail + Apple Mail
      + Outlook rendering verified).
- [ ] Queued sends complete + failure retries per policy.
- [ ] Bounce webhook adds recipient to suppression list; subsequent sends
      short-circuit.
- [ ] `mail_deliveries` records every event.
- [ ] `mailFake()` captures sends + assertions pass.
- [ ] `stackra mail:preview <MailableName>` renders in browser.
- [ ] 90% branch coverage.

## Cross-refs

- ADR-0090, 0091, 0092.
- `.ref/packages/mail/` — reference implementation.
- `@stackra/queue` — dispatch layer.
- `@stackra/link` — signed URLs for password reset + unsubscribe.
- `@stackra/config` — reads transport credentials + `APP_NAME`.
