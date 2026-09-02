/**
 * @file 03-first-adr.tsx
 * @module @figentra/email-templates/onboarding/first-adr
 * @description Onboarding touch 3 · Week 1.
 *
 *   Fires when the first ADR is authored + countersigned by the
 *   partner. Presents the ADR as the load-bearing artefact the
 *   customer's engineering team can trace every subsequent commit
 *   back to.
 *
 *   Merge-vars:
 *     {{firstName}} · {{partnerName}} · {{adrId}} · {{adrTitle}}
 *     {{adrUrl}} · {{signingPartner}} · {{commitSha}}
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

export default function OnboardingFirstAdr(): React.ReactElement {
  return (
    <EmailShell preview="Your first ADR is signed. Every commit will trace back to it.">
      <Kicker>Touch 03 · Week 1 · First ADR</Kicker>
      <H1>ADR-{"{{adrId}}"} is signed.</H1>
      <P>
        <strong>{"{{adrTitle}}"}</strong> · authored by {"{{partnerName}}"} ·
        countersigned by {"{{signingPartner}}"} · commit{" "}
        <MonoChip>{"{{commitSha}}"}</MonoChip>. Merged to{" "}
        <MonoChip>main</MonoChip> · public in your repo · linked from
        every subsequent commit that touches this decision surface.
      </P>

      <CTA href="{{adrUrl}}" label="Read the accepted ADR" />

      <H2>Why this ADR is load-bearing</H2>
      <P>
        Every commit under your project MUST pass a CI gate that traces
        it back to an accepted ADR. When your engineers pull the repo,
        the steering file at <MonoChip>.kiro/steering/adr-required.md</MonoChip>{" "}
        enforces the reverse rule: no ADR = no commit.
      </P>

      <Muted>
        This is the doctrine layer. It's what a UAE ministry auditor or
        Cairo fintech DPO cites when they ask "how do you know this
        decision was authorised?" You cite this ADR.
      </Muted>

      <ShellDivider />

      <H2>What ships next</H2>
      <P>
        {"{{partnerName}}"} is drafting the first migration under
        the decision surface ADR-{"{{adrId}}"} locks. Next email in this
        sequence: <em>Your first deploy</em>. When your service goes
        behind its production URL for the first time — the same seven-
        layer chain, from ADR to signed deploy.
      </P>
    </EmailShell>
  );
}
