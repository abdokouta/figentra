/**
 * @file _theme.tsx
 * @module @figentra/email-templates/onboarding/_theme
 * @description Shared tokens + primitive components for every
 *   Figentra onboarding React Email template. Mirrors the
 *   Academorix template shape so operators reading both codebases
 *   see the same primitives — only the accent + wordmark differ.
 *
 *   Never renders on its own (leading underscore excludes it from the
 *   `email dev` preview server). Consumed by welcome.tsx,
 *   intake-scheduled.tsx, first-adr.tsx, first-deploy.tsx, retro.tsx,
 *   quarterly-review.tsx, anniversary.tsx.
 *
 *   If a token drifts from the shipped Figentra rebind
 *   (../../../_shared/ + ../../../brand-system.html), the brand-system
 *   page wins — fix here.
 */

import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

/* ── tokens · match Figentra Sprint 1 rebind ───────────── */
export const theme = {
  ink: "#141414",
  ink2: "#1c1c1c",
  paper: "#fafafa",
  paper2: "#f0f0f0",
  signal: "#00e5a0", // Signal Mint · f_ cursor accent
  signal100: "#b3f7de",
  signal700: "#00b380",
  signalTint: "rgba(0, 229, 160, 0.08)",
  textMuted: "rgba(20, 20, 20, 0.62)",
  textDim: "rgba(20, 20, 20, 0.42)",
  border: "rgba(20, 20, 20, 0.12)",
  borderStrong: "rgba(20, 20, 20, 0.24)",

  fontSans:
    '"Geist", "Inter", -apple-system, "Segoe UI", Roboto, Helvetica, sans-serif',
  fontMono:
    '"Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',

  radius: 12,
  radiusSm: 8,
  radiusLg: 16,
};

/* ── f_ mark · inline SVG for max client-compat ─────────── */
export function LogoMark({
  color = theme.paper,
  size = 22,
}: {
  color?: string;
  size?: number;
}): React.ReactElement {
  return (
    <Img
      src="https://figentra.com/brand/logos/mark-inline.svg"
      alt="Figentra"
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}

/* ── shared shell · every template wraps in this ────────── */
export interface EmailShellProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailShell({
  preview,
  children,
}: EmailShellProps): React.ReactElement {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <Font
          fontFamily="Geist"
          fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
          webFont={{
            url: "https://fonts.gstatic.com/s/geist/v3/gyByhwUxId8gMEwYGFU5-4kQvQnHUA.woff2",
            format: "woff2",
          }}
          fontWeight={500}
          fontStyle="normal"
        />
        <Font
          fontFamily="Geist Mono"
          fallbackFontFamily={["Menlo", "Consolas", "monospace"]}
          webFont={{
            url: "https://fonts.gstatic.com/s/geistmono/v3/or3nQ6H-1_WfwkMZI_qYPLs1a-t7PU0AbeE9KA.woff2",
            format: "woff2",
          }}
          fontWeight={500}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: theme.paper2,
          fontFamily: theme.fontSans,
          color: theme.ink,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <Container
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "32px 0",
          }}
        >
          {/* ── header · f_ mark · dark strip ── */}
          <Section
            style={{
              backgroundColor: theme.ink,
              color: theme.paper,
              padding: "20px 32px",
              borderTopLeftRadius: theme.radiusLg,
              borderTopRightRadius: theme.radiusLg,
            }}
          >
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "middle" }}>
                    <table role="presentation" cellPadding={0} cellSpacing={0}>
                      <tbody>
                        <tr>
                          <td style={{ paddingRight: 10 }}>
                            <LogoMark size={22} />
                          </td>
                          <td
                            style={{
                              color: theme.paper,
                              fontFamily: theme.fontSans,
                              fontWeight: 500,
                              fontSize: 15,
                              letterSpacing: "-0.02em",
                            }}
                          >
                            Figentra
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: theme.signal,
                      fontFamily: theme.fontMono,
                      fontSize: 10,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                    }}
                  >
                    Governance-first
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* ── body card ── */}
          <Section
            style={{
              backgroundColor: theme.paper,
              padding: "40px 32px",
              borderBottomLeftRadius: theme.radiusLg,
              borderBottomRightRadius: theme.radiusLg,
              border: `1px solid ${theme.border}`,
              borderTop: "none",
            }}
          >
            {children}
          </Section>

          {/* ── footer ── */}
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

/* ── body-copy building blocks ───────────────────────────── */

export function Kicker({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: theme.fontMono,
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: theme.signal,
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

export function H1({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: theme.fontSans,
        fontWeight: 500,
        fontSize: 28,
        letterSpacing: "-0.03em",
        lineHeight: 1.15,
        color: theme.ink,
        margin: "0 0 20px",
      }}
    >
      {children}
    </Text>
  );
}

export function H2({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: theme.fontSans,
        fontWeight: 500,
        fontSize: 20,
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
        color: theme.ink,
        margin: "24px 0 12px",
      }}
    >
      {children}
    </Text>
  );
}

export function P({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: theme.fontSans,
        fontSize: 15,
        lineHeight: 1.55,
        color: theme.ink,
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

export function Muted({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: theme.fontSans,
        fontSize: 13,
        lineHeight: 1.55,
        color: theme.textMuted,
        margin: "0 0 12px",
      }}
    >
      {children}
    </Text>
  );
}

/* ── CTA button · bulletproof table button ─────────────── */
export function CTA({
  href,
  label,
}: {
  href: string;
  label: string;
}): React.ReactElement {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      style={{ margin: "8px 0 24px" }}
    >
      <tbody>
        <tr>
          <td
            align="center"
            bgcolor={theme.signal}
            style={{
              backgroundColor: theme.signal,
              borderRadius: theme.radiusSm,
              padding: 0,
            }}
          >
            <Link
              href={href}
              style={{
                display: "inline-block",
                padding: "13px 22px",
                fontFamily: theme.fontSans,
                fontWeight: 500,
                fontSize: 14,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                color: theme.ink,
                textDecoration: "none",
                borderRadius: theme.radiusSm,
              }}
            >
              {label}
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* ── mono chip · used for ADR IDs, commit SHAs, run numbers ── */
export function MonoChip({
  children,
  color = theme.ink,
  bg = theme.paper2,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}): React.ReactElement {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: theme.fontMono,
        fontSize: 12,
        letterSpacing: "0.02em",
        padding: "4px 8px",
        borderRadius: 4,
        backgroundColor: bg,
        color,
      }}
    >
      {children}
    </span>
  );
}

/* ── shell prompt divider · f_ signature glyph ─────────── */
export function ShellDivider(): React.ReactElement {
  return (
    <Section style={{ padding: "24px 0", textAlign: "center" }}>
      <Text
        style={{
          margin: 0,
          fontFamily: theme.fontMono,
          fontSize: 12,
          letterSpacing: "0.4em",
          color: theme.borderStrong,
        }}
      >
        f_
      </Text>
    </Section>
  );
}

/* ── footer · provenance + unsubscribe + operator ─────── */
export function EmailFooter(): React.ReactElement {
  return (
    <Section
      style={{
        padding: "32px 32px 8px",
        textAlign: "center",
      }}
    >
      <Hr style={{ borderColor: theme.border, margin: "0 0 20px" }} />
      <Text
        style={{
          margin: "0 0 8px",
          fontFamily: theme.fontMono,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: theme.textDim,
        }}
      >
        Figentra · governance-first agentic delivery
      </Text>
      <Text
        style={{
          margin: "0 0 12px",
          fontFamily: theme.fontSans,
          fontSize: 12,
          color: theme.textMuted,
          lineHeight: 1.5,
        }}
      >
        You're getting this because your team engaged Figentra as your
        agentic delivery partner. Every message we send carries a plain-
        text unsubscribe below and links to the master service agreement.
      </Text>
      <Text
        style={{
          margin: 0,
          fontFamily: theme.fontSans,
          fontSize: 11,
          color: theme.textMuted,
        }}
      >
        <Link
          href="{{unsubscribeUrl}}"
          style={{ color: theme.textMuted, textDecoration: "underline" }}
        >
          Unsubscribe
        </Link>
        {" · "}
        <Link
          href="https://figentra.com/legal/privacy"
          style={{ color: theme.textMuted, textDecoration: "underline" }}
        >
          Privacy
        </Link>
        {" · "}
        <Link
          href="https://figentra.com/legal/msa"
          style={{ color: theme.textMuted, textDecoration: "underline" }}
        >
          MSA
        </Link>
        {" · "}
        <Link
          href="https://figentra.com/trust"
          style={{ color: theme.textMuted, textDecoration: "underline" }}
        >
          Trust Center
        </Link>
      </Text>
      <Text
        style={{
          margin: "16px 0 0",
          fontFamily: theme.fontMono,
          fontSize: 10,
          color: theme.textDim,
        }}
      >
        Figentra L.L.C · Casablanca, Morocco · © 2026
      </Text>
    </Section>
  );
}
