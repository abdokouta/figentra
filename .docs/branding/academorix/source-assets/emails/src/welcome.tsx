/**
 * @file welcome.tsx
 * @module @academorix/email-templates/welcome
 * @description Post-signup welcome + email-verification magic link.
 *   Fires the first time a coach account clears email verification.
 *
 * Subject line: "You're on the sideline · verify to open your first roster"
 * Preview:      "One tap to open your first roster. Trial runs 30 days."
 *
 * Trigger: `Stackra\Auth\Events\EmailVerificationRequested` post-signup
 *          flow after CreateRegisterAction lands.
 */

import { Column, Row, Section, Text } from "@react-email/components";
import * as React from "react";

import { CTA, EmailShell, H1, Kicker, MonoChip, Muted, P, theme } from "./_theme";

export interface WelcomeEmailProps {
  coachName?: string;
  academyName?: string;
  magicLink?: string;
  trialEndsAt?: string;
  supportEmail?: string;
}

const defaultProps: Required<WelcomeEmailProps> = {
  coachName: "Layla",
  academyName: "Sahara Padel Academy",
  magicLink: "https://academorix.com/verify?token=preview-token",
  trialEndsAt: "September 16, 2026",
  supportEmail: "coaches@academorix.com",
};

export function WelcomeEmail(props: WelcomeEmailProps): React.ReactElement {
  const p = { ...defaultProps, ...props };

  return (
    <EmailShell preview="One tap to open your first roster. Trial runs 30 days.">
      <Kicker>Trial · Day 01 of 30</Kicker>
      <H1>
        You&#39;re on the sideline, {p.coachName}.<br />
        One tap opens your first roster.
      </H1>

      <P>
        Welcome to Academorix. Your 30-day trial is live for{" "}
        <strong>{p.academyName}</strong> and every module is unlocked. No card
        on file. Cancel any day between now and {p.trialEndsAt} with a single
        click.
      </P>

      <CTA href={p.magicLink} label="Verify + open my roster →" />

      <Muted>
        The link expires in 24 hours. If it&#39;s already gone stale, hit{" "}
        <a
          href="https://academorix.com/auth/re-verify"
          style={{ color: theme.signal }}
        >
          send a fresh link
        </a>
        .
      </Muted>

      <Text
        style={{
          fontFamily: theme.fontMono,
          fontSize: 11,
          color: theme.textMuted,
          margin: "16px 0 32px",
        }}
      >
        Token · <MonoChip>{"{{tokenPreview}}"}</MonoChip>
      </Text>

      {/* ── three quick wins · what to try first ────────────── */}
      <Section
        style={{
          backgroundColor: theme.paper2,
          borderRadius: theme.radiusSm,
          padding: "24px 24px 8px",
          margin: "8px 0 24px",
        }}
      >
        <Text
          style={{
            fontFamily: theme.fontMono,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: theme.signal,
            margin: "0 0 8px",
          }}
        >
          Three quick wins · 15 minutes
        </Text>
        <Row style={{ marginBottom: 16 }}>
          <Column style={{ width: 32, verticalAlign: "top", paddingTop: 4 }}>
            <Text
              style={{
                fontFamily: theme.fontMono,
                fontSize: 13,
                fontWeight: 600,
                color: theme.signal,
                margin: 0,
              }}
            >
              01
            </Text>
          </Column>
          <Column>
            <Text
              style={{
                fontFamily: theme.fontSans,
                fontSize: 14,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              <strong>Import your roster.</strong> CSV, Google Sheets, or paste
              a WhatsApp export. Under 3 minutes for up to 200 athletes.
            </Text>
          </Column>
        </Row>
        <Row style={{ marginBottom: 16 }}>
          <Column style={{ width: 32, verticalAlign: "top", paddingTop: 4 }}>
            <Text
              style={{
                fontFamily: theme.fontMono,
                fontSize: 13,
                fontWeight: 600,
                color: theme.signal,
                margin: 0,
              }}
            >
              02
            </Text>
          </Column>
          <Column>
            <Text
              style={{
                fontFamily: theme.fontSans,
                fontSize: 14,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              <strong>Run one session.</strong> Attendance, drill notes, a
              scoreline. The whole workflow in 6 minutes.
            </Text>
          </Column>
        </Row>
        <Row style={{ marginBottom: 16 }}>
          <Column style={{ width: 32, verticalAlign: "top", paddingTop: 4 }}>
            <Text
              style={{
                fontFamily: theme.fontMono,
                fontSize: 13,
                fontWeight: 600,
                color: theme.signal,
                margin: 0,
              }}
            >
              03
            </Text>
          </Column>
          <Column>
            <Text
              style={{
                fontFamily: theme.fontSans,
                fontSize: 14,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              <strong>Invite a parent.</strong> They get one weekly digest.
              Zero apps to install if they don&#39;t want one.
            </Text>
          </Column>
        </Row>
      </Section>

      <Text
        style={{
          fontFamily: theme.fontSans,
          fontSize: 14,
          color: theme.ink,
          margin: "16px 0 4px",
        }}
      >
        Stuck? Reply to this email — it lands in a real coach&#39;s inbox
        (not a bot). Or write to us at{" "}
        <a href={`mailto:${p.supportEmail}`} style={{ color: theme.signal }}>
          {p.supportEmail}
        </a>
        .
      </Text>

      <Muted>— The Academorix team</Muted>
    </EmailShell>
  );
}

export default WelcomeEmail;
