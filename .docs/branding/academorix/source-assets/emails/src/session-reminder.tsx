/**
 * @file session-reminder.tsx
 * @module @academorix/email-templates/session-reminder
 * @description T-24h reminder to parents + coaches about an upcoming
 *   training session. Composes the scoreboard readout as an email
 *   card — team · day · time · court · coach · kit.
 *
 * Subject: "Tomorrow · {{sport}} · {{startTime}} · Court {{courtNo}}"
 * Preview: "Kit check · {{kitItems}} · Coach {{coachName}}"
 *
 * Trigger: `Stackra\Scheduling\Actions\FireSessionReminders` cron @ T-24h
 */

import { Column, Hr, Row, Section, Text } from "@react-email/components";
import * as React from "react";

import { CTA, EmailShell, H1, Kicker, MonoChip, P, theme } from "./_theme";

export interface SessionReminderEmailProps {
  athleteName?: string;
  sport?: string;
  discipline?: string;
  coachName?: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  venueName?: string;
  courtNumber?: string;
  kitItems?: string[];
  focusOfSession?: string;
  confirmUrl?: string;
  cancelUrl?: string;
  meetPointNote?: string;
}

const defaultProps: Required<SessionReminderEmailProps> = {
  athleteName: "Youssef",
  sport: "Padel",
  discipline: "U14 Skills",
  coachName: "Layla Farid",
  sessionDate: "Tuesday · Sep 22, 2026",
  startTime: "18:00",
  endTime: "19:15",
  venueName: "Sahara Padel · Ain Diab branch",
  courtNumber: "3",
  kitItems: [
    "Padel racket",
    "Court shoes (non-marking)",
    "1.5 L water bottle",
    "Extra t-shirt",
  ],
  focusOfSession: "Backhand · defensive lobs · match-play (15 min at close)",
  confirmUrl: "https://academorix.com/sessions/preview/confirm",
  cancelUrl: "https://academorix.com/sessions/preview/cancel",
  meetPointNote:
    "Meet at the front gate. Coach opens the courts at 17:45. Late arrivals join after warm-up.",
};

export function SessionReminderEmail(
  props: SessionReminderEmailProps,
): React.ReactElement {
  const p = { ...defaultProps, ...props };

  return (
    <EmailShell
      preview={`Kit check · ${p.kitItems.slice(0, 2).join(" · ")} · Coach ${p.coachName}`}
    >
      <Kicker>Tomorrow · T-24h</Kicker>
      <H1>
        {p.athleteName} — {p.sport}<br />
        tomorrow at {p.startTime}.
      </H1>

      <P>
        One session on {p.sessionDate}. This is the reminder your academy
        sends every night so nothing goes sideways at the gate.
      </P>

      {/* ── scoreboard-style session card ── */}
      <Section
        style={{
          backgroundColor: theme.ink,
          color: theme.paper,
          borderRadius: theme.radius,
          padding: 0,
          overflow: "hidden",
          margin: "16px 0 24px",
        }}
      >
        <Row>
          <Column style={{ padding: "24px 24px 12px", width: "50%" }}>
            <Text
              style={{
                margin: "0 0 6px",
                fontFamily: theme.fontMono,
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: theme.signal,
              }}
            >
              Session
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: theme.fontSans,
                fontWeight: 500,
                fontSize: 20,
                letterSpacing: "-0.02em",
                color: theme.paper,
              }}
            >
              {p.discipline}
            </Text>
            <Text
              style={{
                margin: "4px 0 0",
                fontFamily: theme.fontMono,
                fontSize: 12,
                color: "rgba(250, 250, 250, 0.6)",
              }}
            >
              Coach · {p.coachName}
            </Text>
          </Column>
          <Column
            style={{
              padding: "24px 24px 12px",
              width: "50%",
              borderLeft: "1px dashed rgba(250, 250, 250, 0.16)",
              textAlign: "right",
            }}
          >
            <Text
              style={{
                margin: "0 0 6px",
                fontFamily: theme.fontMono,
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: theme.signal,
              }}
            >
              Start
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: theme.fontMono,
                fontWeight: 600,
                fontSize: 32,
                letterSpacing: "-0.02em",
                color: theme.paper,
                lineHeight: 1,
              }}
            >
              {p.startTime}
            </Text>
            <Text
              style={{
                margin: "6px 0 0",
                fontFamily: theme.fontMono,
                fontSize: 12,
                color: "rgba(250, 250, 250, 0.6)",
              }}
            >
              → ends {p.endTime}
            </Text>
          </Column>
        </Row>
        <Hr style={{ borderColor: "rgba(250, 250, 250, 0.08)", margin: 0 }} />
        <Row>
          <Column style={{ padding: "16px 24px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: theme.fontMono,
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "rgba(250, 250, 250, 0.72)",
              }}
            >
              {p.venueName} · Court {p.courtNumber}
            </Text>
          </Column>
        </Row>
      </Section>

      <Text
        style={{
          fontFamily: theme.fontMono,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: theme.signal,
          margin: "16px 0 8px",
        }}
      >
        Kit check
      </Text>
      <Section style={{ margin: "0 0 20px" }}>
        {p.kitItems.map((item, i) => (
          <Row key={i} style={{ marginBottom: 6 }}>
            <Column style={{ width: 20, verticalAlign: "top", paddingTop: 4 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  border: `2px solid ${theme.ink}`,
                  borderRadius: 3,
                }}
              />
            </Column>
            <Column>
              <Text
                style={{
                  margin: 0,
                  fontFamily: theme.fontSans,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: theme.ink,
                }}
              >
                {item}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Text
        style={{
          fontFamily: theme.fontMono,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: theme.signal,
          margin: "16px 0 8px",
        }}
      >
        Focus of the session
      </Text>
      <P>{p.focusOfSession}</P>

      <Text
        style={{
          backgroundColor: theme.signalTint,
          borderLeft: `3px solid ${theme.signal}`,
          padding: "12px 16px",
          margin: "8px 0 24px",
          fontFamily: theme.fontSans,
          fontSize: 14,
          lineHeight: 1.5,
          color: theme.ink,
        }}
      >
        {p.meetPointNote}
      </Text>

      <Row>
        <Column>
          <CTA href={p.confirmUrl} label="Confirm attendance →" />
        </Column>
        <Column style={{ paddingLeft: 12 }}>
          <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "8px 0 24px" }}>
            <tbody>
              <tr>
                <td
                  align="center"
                  style={{
                    border: `1px solid ${theme.borderStrong}`,
                    borderRadius: theme.radiusSm,
                    padding: 0,
                  }}
                >
                  <a
                    href={p.cancelUrl}
                    style={{
                      display: "inline-block",
                      padding: "12px 22px",
                      fontFamily: theme.fontSans,
                      fontWeight: 500,
                      fontSize: 14,
                      color: theme.ink,
                      textDecoration: "none",
                    }}
                  >
                    Can&#39;t make it
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </Column>
      </Row>

      <Text
        style={{
          fontFamily: theme.fontMono,
          fontSize: 10,
          color: theme.textDim,
          margin: "16px 0 0",
        }}
      >
        Session · <MonoChip>ses_01H8R…{'{{'}sessionId{'}}'}</MonoChip>
      </Text>
    </EmailShell>
  );
}

export default SessionReminderEmail;
