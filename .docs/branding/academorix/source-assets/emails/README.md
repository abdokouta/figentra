---
authored_by: kiro
authored_at: 2026-08-17
source: prompt://academorix-brand-sprint-2
reviewed_by: null
reviewed_at: null
---

# `@academorix/email-templates` · v1.1 draft

Sprint 2 · React Email workspace for every outbound Academorix message. Four
templates ship in v1.1:

| Template           | Trigger                                    | Provider hint |
| ------------------ | ------------------------------------------ | ------------- |
| `welcome`          | Coach account created · post-verification  | Transactional |
| `session-reminder` | T-24h before a scheduled training session  | Transactional |
| `invoice`          | Monthly subscription + per-athlete invoice | Transactional |
| `newsletter`       | Monthly `The Track` roll-up                | Marketing     |

Every template inherits from `src/_theme.tsx` — Track Orange rebind, Geist
stack, ink/paper contrast pair, A-Chevron logo mark. If the theme drifts from
the Sprint 1 `_shared/tokens.css`, Sprint 1 wins.

## Local preview

```bash
pnpm install
pnpm dev
# → open http://localhost:3005
```

React Email's dev server mounts every file in `src/*.tsx` (except `_*.tsx`) as
an addressable preview. Edit + save · hot-reloads.

## Rendering for Resend

```ts
import { render } from "@react-email/render";
import WelcomeEmail from "@academorix/email-templates/welcome";

const html = await render(<WelcomeEmail coachName="Layla" magicLink="..." />);

await resend.emails.send({
  from: "Academorix <noreply@academorix.com>",
  to: coach.email,
  subject: "You're on the sideline · verify to open your first roster",
  html,
});
```

## Rendering for Postmark

```ts
import { render } from "@react-email/render";
import InvoiceEmail from "@academorix/email-templates/invoice";

const htmlBody = await render(<InvoiceEmail {...props} />);
const textBody = await render(<InvoiceEmail {...props} />, { plainText: true });

await postmark.sendEmail({
  From: "Academorix <invoices@academorix.com>",
  To: parent.email,
  Subject: `Invoice ${invoice.number} · ${invoice.athleteName}`,
  HtmlBody: htmlBody,
  TextBody: textBody,
  MessageStream: "outbound",
});
```

## Producing a static HTML preview

```bash
pnpm render:welcome           # writes .out/welcome.html
pnpm render:session-reminder  # writes .out/session-reminder.html
pnpm render:invoice           # writes .out/invoice.html
pnpm render:newsletter        # writes .out/newsletter.html
```

## Voice + tone

- Coach-forward · second-person · no marketing verbs.
- Every subject line reads like a scoreboard update, never a "big announcement".
- Every CTA verb is a real action: `Open roster`, `Confirm session`,
  `Download invoice`, `Read this week's Track`.
- Every footer carries the operator-of-record (Figentra L.L.C) + a plain-text
  unsubscribe link (per CAN-SPAM + GDPR Art. 8).

## Files

```
02-emails/
├── package.json                ← @react-email/components workspace
├── tsconfig.json
├── README.md                   ← you are here
├── src/
│   ├── _theme.tsx              ← shared tokens · logo · footer · helpers
│   ├── welcome.tsx
│   ├── session-reminder.tsx
│   ├── invoice.tsx
│   └── newsletter.tsx
└── scripts/
    └── render.ts               ← CLI · writes .out/<template>.html
```

## Cross-references

- `../README.md` · Sprint 2 index
- `../_shared/tokens.css` · CSS-side canonical rebind
- Sprint 1 `docs/brand/22-email-templates.md` · shared shell rules
