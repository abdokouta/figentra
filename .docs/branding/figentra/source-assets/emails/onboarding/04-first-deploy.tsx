/**
 * @file 04-first-deploy.tsx
 * @module @figentra/email-templates/onboarding/first-deploy
 * @description Onboarding touch 4 · Week 2-3.
 *
 *   Fires when the first customer-visible feature crosses production.
 *   Presents the deploy as the seven-layer chain (ADR → migration →
 *   tests → review → provenance → signed commit → deploy) with
 *   receipt for each stage. This is the moment the customer sees
 *   what "governance-first" looks like in production.
 *
 *   Merge-vars:
 *     {{firstName}} · {{featureName}} · {{prodUrl}} · {{deployedAt}}
 *     {{adrChainCount}} · {{migrationCount}} · {{testCount}}
 *     {{reviewCount}} · {{commitSha}} · {{onCallName}} · {{onCallPhone}}
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

export default function OnboardingFirstDeploy(): React.ReactElement {
  return (
    <EmailShell preview="Your first feature is live. Here's the seven-layer receipt.">
      <Kicker>Touch 04 · Week 2-3 · First deploy</Kicker>
      <H1>{"{{featureName}}"} shipped, {"{{firstName}}"}.</H1>
      <P>
        Live at <MonoChip>{"{{prodUrl}}"}</MonoChip> since{" "}
        {"{{deployedAt}}"}. Every layer of the seven-layer chain is
        linked below · every one carries an accountable signature.
      </P>

      <H2>The receipt</H2>
      <P style={{ margin: 0 } as unknown as { margin: 0 }}>
        <MonoChip>01</MonoChip> · <strong>ADRs</strong> ·{" "}
        {"{{adrChainCount}}"} architectural decisions accepted +
        countersigned before code.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>02</MonoChip> · <strong>Migrations</strong> ·{" "}
        {"{{migrationCount}}"} schema deltas · each one down-migratable
        · none touched a running tenant without a partner countersign.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>03</MonoChip> · <strong>Tests</strong> ·{" "}
        {"{{testCount}}"} tests authored · CI green on every commit ·
        coverage numbers in your dashboard.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>04</MonoChip> · <strong>Reviews</strong> ·{" "}
        {"{{reviewCount}}"} review lanes passed · every one blocking ·
        every finding tracked in the audit log.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>05</MonoChip> · <strong>Provenance</strong> · every
        artefact carries an authored_by + reviewed_by header · commit{" "}
        <MonoChip>{"{{commitSha}}"}</MonoChip> is the ship-tag.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>06</MonoChip> · <strong>Signed commits</strong> ·
        every merge to <MonoChip>main</MonoChip> · human-signed by a
        named Figentra partner · verifiable via GPG keyring published
        at{" "}
        <span style={{ color: theme.ink }}>figentra.com/trust/keys</span>.
      </P>
      <P style={{ margin: "8px 0 24px" } as unknown as { margin: string }}>
        <MonoChip>07</MonoChip> · <strong>Deploy</strong> · production
        deploy authorised by {"{{onCallName}}"} · on-call at{" "}
        <MonoChip>{"{{onCallPhone}}"}</MonoChip> · 24/7 for the next 14
        days.
      </P>

      <CTA href="{{prodUrl}}" label="Visit your production URL" />

      <ShellDivider />

      <H2>What ships next</H2>
      <P>
        The retrospective email lands at Month 1 — you'll see what
        shipped · what didn't · what the doctrine changed. Meanwhile{" "}
        {"{{onCallName}}"} is on call. Text or call the number above
        for anything production-affecting.
      </P>

      <Muted>
        Your governance dashboard aggregates every layer of the receipt
        above · one page · one URL · always current.
      </Muted>
    </EmailShell>
  );
}
