/**
 * @file 02-intake-scheduled.tsx
 * @module @figentra/email-templates/onboarding/intake-scheduled
 * @description Onboarding touch 2 · Day 1-3.
 *
 *   Fires when the customer books the intake call. Confirms the
 *   agenda (scope · governance envelope · timeline · shipping
 *   cadence) and previews the first ADR the partner will draft
 *   during the call itself.
 *
 *   Merge-vars:
 *     {{firstName}} · {{partnerName}} · {{intakeAtIso}}
 *     {{intakeTz}} · {{joinUrl}} · {{adrDraftUrl}}
 */
import * as React from "react";
import {
  CTA,
  EmailShell,
  H1,
  H2,
  Kicker,
  MonoChip,
  Muted,
  P,
  ShellDivider,
  theme,
} from "./_theme";

export default function OnboardingIntakeScheduled(): React.ReactElement {
  return (
    <EmailShell preview="Your Figentra intake is booked. Here's the agenda.">
      <Kicker>Touch 02 · Day 1-3 · Intake booked</Kicker>
      <H1>Intake booked, {"{{firstName}}"}.</H1>
      <P>
        {"{{partnerName}}"} will run the call on{" "}
        <strong>{"{{intakeAtIso}}"}</strong> ({"{{intakeTz}}"}). Sixty
        minutes, one document out. Agenda below · nothing to prep.
      </P>

      <H2>What the call locks</H2>
      <P style={{ margin: 0 } as unknown as { margin: 0 }}>
        <MonoChip>01</MonoChip> · <strong>Scope</strong> · which product
        surface Figentra is delivering, which stays on your side.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>02</MonoChip> · <strong>Governance envelope</strong> ·
        which regulator (GDPR · SAMA · UAE ADGM · Egypt FRA) applies,
        which review lanes are non-negotiable.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>03</MonoChip> · <strong>Timeline</strong> · first ADR
        · first migration · first deploy. Every date lands on the deck.
      </P>
      <P style={{ margin: "8px 0 24px" } as unknown as { margin: string }}>
        <MonoChip>04</MonoChip> · <strong>Signing cadence</strong> · who
        countersigns each merge to <MonoChip>main</MonoChip>, on which
        SLA.
      </P>

      <CTA href="{{joinUrl}}" label="Add to calendar + join link" />

      <ShellDivider />

      <H2>A preview of ADR-0001</H2>
      <P>
        {"{{partnerName}}"} has drafted the first architectural
        decision record. It ships as a Markdown proposal under
        <MonoChip>.docs/adr/0001-<em>slug</em>.md</MonoChip>. You'll
        countersign or iterate during the call — never after.
      </P>
      <CTA href="{{adrDraftUrl}}" label="Read the ADR-0001 draft" />

      <Muted>
        The draft is a proposal — not a decision. The call is when it
        becomes an accepted ADR.
      </Muted>
    </EmailShell>
  );
}
