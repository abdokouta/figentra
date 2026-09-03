/**
 * @file 05-retro.tsx
 * @module @figentra/email-templates/onboarding/retro
 * @description Onboarding touch 5 · Month 1.
 *
 *   Fires 30 days after the first deploy. Presents month-1 numbers ·
 *   what shipped · what didn't · what the doctrine changed in your
 *   codebase. Sets the retrospective cadence for the rest of the
 *   engagement.
 *
 *   Merge-vars:
 *     {{firstName}} · {{partnerName}} · {{shippedCount}}
 *     {{adrCount}} · {{migrationCount}} · {{incidentCount}}
 *     {{retroUrl}} · {{nextRetroDate}}
 */
import * as React from "react";
import { CTA, EmailShell, H1, H2, Kicker, MonoChip, Muted, P, ShellDivider, theme } from "./_theme";

export default function OnboardingRetro(): React.ReactElement {
  return (
    <EmailShell preview="Month 1 receipt: what shipped, what didn't, what changed.">
      <Kicker>Touch 05 · Month 1 · Retrospective</Kicker>
      <H1>Month 1 receipt, {"{{firstName}}"}.</H1>
      <P>
        {"{{partnerName}}"} authored the retrospective at
        <MonoChip>{"{{retroUrl}}"}</MonoChip>. The bullet points below are the highlights; the URL
        carries the full narrative + every signature.
      </P>

      <H2>What shipped</H2>
      <P>
        <MonoChip>{"{{shippedCount}}"}</MonoChip> features live in production · every one carrying
        the seven-layer chain (ADR → migration → tests → review → provenance → signed commit →
        deploy). Every deployment traceable to a partner countersign.
      </P>

      <H2>What the doctrine changed</H2>
      <P>
        <MonoChip>{"{{adrCount}}"}</MonoChip> ADRs authored ·{" "}
        <MonoChip>{"{{migrationCount}}"}</MonoChip> migrations landed ·
        <MonoChip>{"{{incidentCount}}"}</MonoChip> incidents · every one caught by a review lane
        BEFORE production. The number of governance findings that made it past a review lane and
        into production this month: <MonoChip>0</MonoChip>.
      </P>

      <Muted>
        A production-affecting incident that a review lane missed is the headline number for every
        retro — we surface it front + centre.
      </Muted>

      <ShellDivider />

      <H2>What ships next</H2>
      <P>
        The Month 2 retrospective lands on <MonoChip>{"{{nextRetroDate}}"}</MonoChip>. Same cadence
        · same format · same partner ownership. Between now and then, the governance dashboard is
        your always-current view.
      </P>
      <CTA href="{{retroUrl}}" label="Read the full retrospective" />
    </EmailShell>
  );
}
