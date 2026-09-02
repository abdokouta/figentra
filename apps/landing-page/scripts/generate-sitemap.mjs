#!/usr/bin/env node
/**
 * @file generate-sitemap.mjs
 * @description Emits public/sitemap.xml from a static route table.
 *
 * The SDUI JSON catalog under public/api/v1/ was deleted in the
 * SDUI-drop refactor. Every landing route is now a hand-authored
 * React page under src/pages/, so this script hard-codes the
 * public URL set instead of walking a JSON tree.
 *
 * Run via package.json's `prebuild` step. Env `SITE_URL` overrides
 * the default hostname.
 */

import { writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const APP_ROOT = join(HERE, "..");
const OUTPUT = join(APP_ROOT, "public", "sitemap.xml");
const SITE_URL = process.env.SITE_URL ?? "https://academorix.com";

// ─── Route table ──────────────────────────────────────────────
//
// Every public URL the landing app renders. Priorities per
// sitemap.org convention: 1.0 = home, 0.8 = product tier-1,
// 0.6 = solutions + sports + case studies, 0.4 = support pages,
// 0.3 = company + legal.
//
// Keep in sync with `apps/landing/src/router.tsx`.

const ROUTES = [
  // ─── Tier 1 — home + commerce ──────────────────────────────
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/pricing", priority: 0.8, changefreq: "weekly" },
  { path: "/enterprise", priority: 0.8, changefreq: "weekly" },
  { path: "/contact-sales", priority: 0.7, changefreq: "monthly" },

  // ─── Products ──────────────────────────────────────────────
  { path: "/products", priority: 0.8, changefreq: "weekly" },
  { path: "/products/ai-engine", priority: 0.7, changefreq: "weekly" },
  { path: "/products/scheduling", priority: 0.7, changefreq: "weekly" },
  { path: "/products/attendance", priority: 0.7, changefreq: "weekly" },
  { path: "/products/billing", priority: 0.7, changefreq: "weekly" },
  { path: "/products/communication", priority: 0.7, changefreq: "weekly" },
  { path: "/products/registration", priority: 0.7, changefreq: "weekly" },
  { path: "/products/reporting", priority: 0.7, changefreq: "weekly" },

  // ─── Sports (canonical set per docs/brand/academorix) ─────
  { path: "/sports", priority: 0.7, changefreq: "monthly" },
  { path: "/sports/football", priority: 0.6, changefreq: "monthly" },
  { path: "/sports/basketball", priority: 0.6, changefreq: "monthly" },
  { path: "/sports/swimming", priority: 0.6, changefreq: "monthly" },
  { path: "/sports/tennis", priority: 0.6, changefreq: "monthly" },
  { path: "/sports/padel", priority: 0.6, changefreq: "monthly" },
  { path: "/sports/martial-arts", priority: 0.6, changefreq: "monthly" },
  { path: "/sports/athletics", priority: 0.6, changefreq: "monthly" },

  // ─── Solutions ─────────────────────────────────────────────
  { path: "/solutions", priority: 0.7, changefreq: "monthly" },
  { path: "/solutions/single-academy", priority: 0.6, changefreq: "monthly" },
  { path: "/solutions/multi-site", priority: 0.6, changefreq: "monthly" },
  { path: "/solutions/franchises", priority: 0.6, changefreq: "monthly" },
  { path: "/solutions/clubs", priority: 0.6, changefreq: "monthly" },

  // ─── For teams ─────────────────────────────────────────────
  { path: "/for/directors", priority: 0.6, changefreq: "monthly" },
  { path: "/for/coaches", priority: 0.6, changefreq: "monthly" },
  { path: "/for/administrators", priority: 0.6, changefreq: "monthly" },
  { path: "/for/parents", priority: 0.6, changefreq: "monthly" },
  { path: "/for/customers", priority: 0.6, changefreq: "monthly" },

  // ─── Customer stories ──────────────────────────────────────
  { path: "/customers", priority: 0.6, changefreq: "weekly" },
  { path: "/customers/apex-gymnastics", priority: 0.5, changefreq: "monthly" },
  { path: "/customers/riverside-aquatics", priority: 0.5, changefreq: "monthly" },
  { path: "/customers/northgate-fc", priority: 0.5, changefreq: "monthly" },

  // ─── Support + docs ────────────────────────────────────────
  { path: "/docs", priority: 0.6, changefreq: "weekly" },
  { path: "/faq", priority: 0.5, changefreq: "weekly" },
  { path: "/features", priority: 0.7, changefreq: "weekly" },
  { path: "/integrations", priority: 0.6, changefreq: "monthly" },
  { path: "/trust", priority: 0.6, changefreq: "monthly" },
  { path: "/status", priority: 0.4, changefreq: "daily" },
  { path: "/security", priority: 0.4, changefreq: "monthly" },
  { path: "/resources/tutorials", priority: 0.5, changefreq: "monthly" },
  { path: "/resources/build-first-schedule", priority: 0.4, changefreq: "monthly" },
  { path: "/resources/automate-tuition", priority: 0.4, changefreq: "monthly" },
  { path: "/resources/parent-portal-setup", priority: 0.4, changefreq: "monthly" },

  // ─── Company ───────────────────────────────────────────────
  { path: "/about", priority: 0.4, changefreq: "monthly" },
  { path: "/careers", priority: 0.4, changefreq: "weekly" },
  { path: "/press", priority: 0.3, changefreq: "monthly" },
  { path: "/blog", priority: 0.5, changefreq: "weekly" },
  { path: "/changelog", priority: 0.4, changefreq: "weekly" },
  { path: "/newsletter", priority: 0.3, changefreq: "monthly" },
];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildXml(entries) {
  const now = new Date().toISOString();
  const urls = entries
    .map((entry) => {
      const loc = new URL(entry.path, SITE_URL).toString();
      return [
        "  <url>",
        "    <loc>" + escapeXml(loc) + "</loc>",
        "    <lastmod>" + now + "</lastmod>",
        "    <changefreq>" + entry.changefreq + "</changefreq>",
        "    <priority>" + entry.priority.toFixed(1) + "</priority>",
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

async function main() {
  const entries = [...ROUTES].sort((a, b) => a.path.localeCompare(b.path));
  const xml = buildXml(entries);
  await writeFile(OUTPUT, xml, "utf8");
  const rel = relative(APP_ROOT, OUTPUT);
  console.log("[sitemap] wrote " + entries.length + " URLs to " + rel);
}

main().catch((error) => {
  console.error("[sitemap] failed:", error);
  process.exit(1);
});
