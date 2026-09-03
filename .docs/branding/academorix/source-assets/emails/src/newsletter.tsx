/**
 * @file newsletter.tsx
 * @module @academorix/email-templates/newsletter
 * @description "The Track" — monthly newsletter for coaches + academy
 *   owners subscribed to Academorix's public list.
 *
 *   Recipe · 4 sections + 1 podium winner card + 1 CTA:
 *     1. Coach-of-the-month · one photo · one quote · one metric
 *     2. Field notes · 3-4 short product updates
 *     3. Podium · this month's tournament winners across academies
 *     4. Read next · 3 essays / blog posts
 *
 * Subject: "The Track · {{monthYear}} · {{lead}}"
 * Preview: "{{leadSummary}}"
 *
 * Trigger: Manually authored monthly · sent via Resend broadcast list.
 */

import { Column, Hr, Row, Section, Text } from "@react-email/components";
import * as React from "react";

import { CTA, EmailShell, H1, H2, Kicker, MonoChip, P, theme } from "./_theme";

export interface PodiumEntry {
  rank: 1 | 2 | 3;
  athleteName: string;
  academyName: string;
  event: string;
  discipline: string;
}

export interface FieldNote {
  tag: string;
  title: string;
  body: string;
  url: string;
}

export interface ReadNextEntry {
  title: string;
  minutes: number;
  url: string;
  authorHandle: string;
}

export interface NewsletterEmailProps {
  monthYear?: string;
  editionNumber?: number;
  lead?: string;
  leadSummary?: string;
  coachOfTheMonth?: {
    name: string;
    academyName: string;
    quote: string;
    metricLabel: string;
    metricValue: string;
    photoUrl: string;
  };
  fieldNotes?: FieldNote[];
  podium?: PodiumEntry[];
  readNext?: ReadNextEntry[];
  archiveUrl?: string;
}

const defaultProps: Required<NewsletterEmailProps> = {
  monthYear: "September 2026",
  editionNumber: 14,
  lead: "The 6-minute session set-up + one coach on how to write your first grading ladder",
  leadSummary:
    "Layla's grading ladder cut 40 minutes off her Saturday. Field notes from the last release. Podium finishes across the network.",
  coachOfTheMonth: {
    name: "Layla Farid",
    academyName: "Sahara Padel Academy",
    quote:
      "The ladder I authored in Academorix on a Wednesday shaved 40 minutes off every Saturday grading day after. Parents finally understood what a promotion actually meant.",
    metricLabel: "Ladder authoring time",
    metricValue: "8 min",
    photoUrl: "https://academorix.com/newsletter/coach-of-month-layla.jpg",
  },
  fieldNotes: [
    {
      tag: "Session runner",
      title: "One-tap attendance from the sideline",
      body: "Attendance now writes back from the coach's phone even offline. Late-arrivers reconcile the moment reception opens.",
      url: "https://academorix.com/changelog/attendance-offline",
    },
    {
      tag: "Grading",
      title: "Belt-level ladder authoring · 6 minutes → 2 minutes",
      body: "New authoring flow drops the boilerplate. Colour-picker + rank name + required drills — done.",
      url: "https://academorix.com/changelog/grading-authoring-v2",
    },
    {
      tag: "Invoicing",
      title: "Multi-currency invoices for federations",
      body: "Federations invoicing across MAD + EUR + USD now roll up to one dashboard total. Group-by-currency toggle in beta.",
      url: "https://academorix.com/changelog/multi-currency-invoices",
    },
    {
      tag: "Tournament",
      title: "Micro-brand generator · season logos in 90 seconds",
      body: "Author a season mark from the tournament page — auto-composes with the Academorix chevron. Print-ready SVG + JPG.",
      url: "https://academorix.com/changelog/micro-brand-generator",
    },
  ],
  podium: [
    {
      rank: 1,
      athleteName: "Aya Bensaid",
      academyName: "Sahara Padel · Ain Diab",
      event: "Ain Diab Open · Youth U14",
      discipline: "Padel",
    },
    {
      rank: 2,
      athleteName: "Ilyas Rahmani",
      academyName: "Atlas Combat Club · Rabat",
      event: "Kingdom Cup · U16",
      discipline: "Karate · Kumite",
    },
    {
      rank: 3,
      athleteName: "Sara El Amrani",
      academyName: "Blue Wave Swim · Tangier",
      event: "Nord-Ouest Meet",
      discipline: "Swimming · 100 m free",
    },
  ],
  readNext: [
    {
      title: "Grading ladders that parents actually understand",
      minutes: 6,
      url: "https://academorix.com/the-track/parent-friendly-grading",
      authorHandle: "@layla",
    },
    {
      title: "Attendance rate is a lagging indicator (here's the leading one)",
      minutes: 4,
      url: "https://academorix.com/the-track/leading-attendance",
      authorHandle: "@karim",
    },
    {
      title: "One roster, three windows — the coach + parent + athlete view",
      minutes: 8,
      url: "https://academorix.com/the-track/three-windows",
      authorHandle: "@nadia",
    },
  ],
  archiveUrl: "https://academorix.com/the-track/archive",
};

export function NewsletterEmail(props: NewsletterEmailProps): React.ReactElement {
  const p = { ...defaultProps, ...props };

  return (
    <EmailShell preview={p.leadSummary}>
      {/* ── masthead ── */}
      <Row>
        <Column>
          <Text
            style={{
              margin: 0,
              fontFamily: theme.fontMono,
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: theme.signal,
            }}
          >
            The Track
          </Text>
          <Text
            style={{
              margin: "2px 0 0",
              fontFamily: theme.fontMono,
              fontSize: 11,
              color: theme.textMuted,
            }}
          >
            Edition {String(p.editionNumber).padStart(3, "0")} · {p.monthYear}
          </Text>
        </Column>
        <Column style={{ textAlign: "right", verticalAlign: "middle" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: theme.fontMono,
              fontSize: 10,
              color: theme.textDim,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            5 min read
          </Text>
        </Column>
      </Row>

      <H1>{p.lead}</H1>

      <P>{p.leadSummary}</P>

      <Hr style={{ borderColor: theme.border, margin: "24px 0 32px" }} />

      {/* ── coach of the month ── */}
      <Kicker>Coach of the month</Kicker>
      <Section
        style={{
          backgroundColor: theme.ink,
          borderRadius: theme.radius,
          padding: "24px",
          margin: "12px 0 32px",
          color: theme.paper,
        }}
      >
        <Row>
          <Column style={{ width: 84, verticalAlign: "top" }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 999,
                backgroundColor: theme.signal,
                display: "block",
                overflow: "hidden",
                border: `2px solid ${theme.signal}`,
              }}
            >
              <img
                src={p.coachOfTheMonth.photoUrl}
                alt={p.coachOfTheMonth.name}
                width={68}
                height={68}
                style={{
                  width: 68,
                  height: 68,
                  objectFit: "cover",
                  filter: "grayscale(0.4) contrast(1.05)",
                  display: "block",
                }}
              />
            </div>
          </Column>
          <Column>
            <Text
              style={{
                margin: 0,
                fontFamily: theme.fontSans,
                fontWeight: 500,
                fontSize: 18,
                color: theme.paper,
                letterSpacing: "-0.02em",
              }}
            >
              {p.coachOfTheMonth.name}
            </Text>
            <Text
              style={{
                margin: "2px 0 12px",
                fontFamily: theme.fontMono,
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "rgba(250, 250, 250, 0.62)",
                textTransform: "uppercase",
              }}
            >
              {p.coachOfTheMonth.academyName}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: theme.fontSans,
                fontSize: 15,
                fontStyle: "italic",
                lineHeight: 1.5,
                color: "rgba(250, 250, 250, 0.9)",
                borderLeft: `2px solid ${theme.signal}`,
                paddingLeft: 14,
              }}
            >
              “{p.coachOfTheMonth.quote}”
            </Text>
            <Row style={{ marginTop: 14 }}>
              <Column>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: theme.fontMono,
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    color: "rgba(250, 250, 250, 0.6)",
                    textTransform: "uppercase",
                  }}
                >
                  {p.coachOfTheMonth.metricLabel}
                </Text>
                <Text
                  style={{
                    margin: "2px 0 0",
                    fontFamily: theme.fontMono,
                    fontSize: 22,
                    fontWeight: 600,
                    color: theme.signal,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {p.coachOfTheMonth.metricValue}
                </Text>
              </Column>
            </Row>
          </Column>
        </Row>
      </Section>

      {/* ── field notes ── */}
      <Kicker>Field notes · what shipped in {p.monthYear}</Kicker>
      {p.fieldNotes.map((n, i) => (
        <Section
          key={i}
          style={{
            padding: "16px 0",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <Row>
            <Column style={{ width: 112, verticalAlign: "top" }}>
              <MonoChip bg={theme.signalTint} color={theme.signal}>
                {n.tag}
              </MonoChip>
            </Column>
            <Column>
              <Text
                style={{
                  margin: 0,
                  fontFamily: theme.fontSans,
                  fontWeight: 500,
                  fontSize: 16,
                  color: theme.ink,
                  letterSpacing: "-0.01em",
                }}
              >
                <a href={n.url} style={{ color: theme.ink, textDecoration: "none" }}>
                  {n.title} →
                </a>
              </Text>
              <Text
                style={{
                  margin: "4px 0 0",
                  fontFamily: theme.fontSans,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: theme.textMuted,
                }}
              >
                {n.body}
              </Text>
            </Column>
          </Row>
        </Section>
      ))}

      {/* ── podium ── */}
      <H2>Podium · {p.monthYear}</H2>
      <P>
        Three athletes we watched cross the line this month. Full board on the network dashboard.
      </P>

      <Section style={{ margin: "12px 0 24px" }}>
        {p.podium.map((entry, i) => {
          const bar =
            entry.rank === 1
              ? { color: theme.signal, label: "01 · GOLD" }
              : entry.rank === 2
                ? { color: theme.ink, label: "02 · SILVER" }
                : { color: theme.textMuted, label: "03 · BRONZE" };

          return (
            <Row key={i} style={{ marginBottom: 12 }}>
              <Column style={{ width: 100, verticalAlign: "top" }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: theme.fontMono,
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: bar.color,
                    fontWeight: 600,
                  }}
                >
                  {bar.label}
                </Text>
              </Column>
              <Column>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: theme.fontSans,
                    fontWeight: 500,
                    fontSize: 15,
                    color: theme.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {entry.athleteName}
                </Text>
                <Text
                  style={{
                    margin: "2px 0 0",
                    fontFamily: theme.fontSans,
                    fontSize: 13,
                    color: theme.textMuted,
                  }}
                >
                  {entry.event} · {entry.discipline} · {entry.academyName}
                </Text>
              </Column>
            </Row>
          );
        })}
      </Section>

      {/* ── read next ── */}
      <H2>Read next</H2>
      {p.readNext.map((r, i) => (
        <Row key={i} style={{ marginBottom: 10 }}>
          <Column style={{ width: 60, verticalAlign: "top", paddingTop: 4 }}>
            <Text
              style={{
                margin: 0,
                fontFamily: theme.fontMono,
                fontSize: 11,
                color: theme.signal,
                letterSpacing: "0.08em",
              }}
            >
              {r.minutes} min
            </Text>
          </Column>
          <Column>
            <Text
              style={{
                margin: 0,
                fontFamily: theme.fontSans,
                fontSize: 15,
                color: theme.ink,
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              <a href={r.url} style={{ color: theme.ink, textDecoration: "none" }}>
                {r.title} →
              </a>
            </Text>
            <Text
              style={{
                margin: "2px 0 0",
                fontFamily: theme.fontMono,
                fontSize: 11,
                color: theme.textMuted,
              }}
            >
              by {r.authorHandle}
            </Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: theme.border, margin: "32px 0 20px" }} />

      <CTA href={p.archiveUrl} label="Every past edition · The Track archive" />

      <Text
        style={{
          fontFamily: theme.fontMono,
          fontSize: 10,
          color: theme.textDim,
          margin: "16px 0 0",
        }}
      >
        Forwarded?{" "}
        <a href="https://academorix.com/the-track/subscribe" style={{ color: theme.signal }}>
          Subscribe direct
        </a>{" "}
        · one email per month · never a sales pitch.
      </Text>
    </EmailShell>
  );
}

export default NewsletterEmail;
