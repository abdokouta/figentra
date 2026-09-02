/**
 * CLI · render a template to `.out/<template>.html`.
 *
 * Usage:
 *   pnpm tsx ./scripts/render.ts welcome
 *   pnpm tsx ./scripts/render.ts session-reminder
 *   pnpm tsx ./scripts/render.ts invoice
 *   pnpm tsx ./scripts/render.ts newsletter
 *
 * Every template ships preview props so `render` produces a
 * representative HTML file suitable for QA + provider preflight.
 */

import { render } from "@react-email/render";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import React from "react";

import InvoiceEmail from "../src/invoice";
import NewsletterEmail from "../src/newsletter";
import SessionReminderEmail from "../src/session-reminder";
import WelcomeEmail from "../src/welcome";

const OUT = resolve(process.cwd(), ".out");
await mkdir(OUT, { recursive: true });

const templates = {
  welcome: React.createElement(WelcomeEmail),
  "session-reminder": React.createElement(SessionReminderEmail),
  invoice: React.createElement(InvoiceEmail),
  newsletter: React.createElement(NewsletterEmail),
} as const;

const key = process.argv[2] as keyof typeof templates | undefined;
if (!key || !(key in templates)) {
  console.error(
    `Unknown template. Pick one of: ${Object.keys(templates).join(", ")}`,
  );
  process.exit(1);
}

const html = await render(templates[key]);
const path = resolve(OUT, `${key}.html`);
await writeFile(path, html, "utf8");
console.log(`✓ ${key} → ${path}`);
