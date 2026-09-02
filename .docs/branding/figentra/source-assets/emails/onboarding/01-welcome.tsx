/**
 * @file 01-welcome.tsx
 * @module @figentra/email-templates/onboarding/welcome
 * @description Onboarding touch 1 · Day 0.
 *
 *   Fires the moment a customer signs the master service agreement.
 *   Delivers the doctrine — steering files, ADRs, provenance
 *   frontmatter — as reading material. Establishes the "governance
 *   before code" cadence.
 *
 *   Merge-vars:
 *     {{firstName}}      — signer's given name
 *     {{partnerName}}    — Figentra partner assigned to the account
 *     {{orgName}}        — customer organisation
 *     {{intakeUrl}}      — Calendly link for the intake call
 *     {{docsUrl}}        — docs.figentra.cloud landing
 *     {{unsubscribeUrl}} — one-click unsubscribe
 */
import * as React from "react";
import { Section } from "@react-email/components";
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

export default function OnboardingWelcome(): React.ReactElement {
  return (
    <EmailShell preview="Welcome to Figentra. Here's the doctrine you're inheriting.">
      <Kicker>Touch 01 · Day 0 · Welcome</Kicker>
      <H1>Welcome to Figentra, {"{{firstName}}"}.</H1>
      <P>
        The MSA is signed. Your <MonoChip>tenant-id</MonoChip> is provisioned.
        Your partner ({"{{partnerName}}"}) will run the intake call
        below. Before that, the doctrine you're inheriting:
      </P>

      <H2>What ships before code</H2>
      <P>
        Every commit at {"{{orgName}}"} passes through the same seven
        layers that ship every artefact on the Figentra platform: an ADR
        recording the architectural decision, a steering file codifying
        the per-repo rule, provenance frontmatter naming the author +
        reviewer, a human-signed commit, an automated CI gate, a review
        pass from a named lane owner, and a partner-countersigned
        deploy.
      </P>

      <Muted>
        None of this is optional. Every merge to your{" "}
        <MonoChip>main</MonoChip> branch runs the same seven layers.
      </Muted>

      <ShellDivider />

      <H2>Your first 60 minutes</H2>
      <P>
        The intake call locks scope · timeline · governance envelope. Every
        subsequent artefact — the first ADR, the first migration, the
        first release note — traces back to what you scoped here.
      </P>
      <CTA href="{{intakeUrl}}" label="Book the intake call" />

      <Muted>
        Prefer to read first? The doctrine lives at{" "}
        <span style={{ color: theme.ink }}>docs.figentra.cloud</span> — every
        steering file, every ADR, every runbook.
      </Muted>
    </EmailShell>
  );
}
