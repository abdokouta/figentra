/**
 * @file 07-anniversary.tsx
 * @module @figentra/email-templates/onboarding/anniversary
 * @description Onboarding touch 7 · Year 1.
 *
 *   Fires 12 months after the first deploy. Closes the onboarding
 *   drip and opens the renewal + case-study conversation. Reads as
 *   celebration — the deploys shipped, the governance held, the bet
 *   paid off.
 *
 *   Merge-vars:
 *     {{firstName}} · {{orgName}} · {{startDate}} · {{shippedTotal}}
 *     {{uptimePercent}} · {{incidentCount}} · {{caseStudyUrl}}
 *     {{renewalUrl}} · {{signingPartner}}
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

export default function OnboardingAnniversary(): React.ReactElement {
  return (
    <EmailShell preview="One year on Figentra. The bet paid off.">
      <Kicker>Touch 07 · Year 1 · Anniversary</Kicker>
      <H1>One year, {"{{firstName}}"}.</H1>
      <P>
        <strong>{"{{orgName}}"}</strong> shipped its first Figentra
        feature on <MonoChip>{"{{startDate}}"}</MonoChip>. Twelve months
        in, the receipts:
      </P>

      <H2>The numbers</H2>
      <P style={{ margin: 0 } as unknown as { margin: 0 }}>
        <MonoChip>{"{{shippedTotal}}"}</MonoChip> features live in
        production · every one authored under the doctrine · every one
        signed by a named Figentra partner.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>{"{{uptimePercent}}%"}</MonoChip> uptime · every SEV
        incident tracked · every one held to the review lane the ADR
        specified.
      </P>
      <P style={{ margin: "8px 0 24px" } as unknown as { margin: string }}>
        <MonoChip>{"{{incidentCount}}"}</MonoChip> production incidents
        · zero governance findings · every audit request answered from
        the shipped receipts alone.
      </P>

      <H2>What the doctrine did</H2>
      <P>
        You bought Figentra for the delivery velocity that AI enables.
        You kept Figentra for the governance layer no other AI-first
        team was shipping. That's the bet paying off — the doctrine is
        what your regulator, your DPO, and your CTO cite when someone
        asks "why is this AI-authored code trustworthy?"
      </P>

      <ShellDivider />

      <H2>Two things opening in Year 2</H2>
      <P>
        <MonoChip>01</MonoChip> · <strong>Case study</strong> ·{" "}
        {"{{signingPartner}}"} would like your permission to publish
        the anonymised case study at{" "}
        <span style={{ color: theme.ink }}>{"{{caseStudyUrl}}"}</span>{" "}
        — every metric above, none of the identifying details. A
        five-minute review call to lock scope.
      </P>
      <P>
        <MonoChip>02</MonoChip> · <strong>Renewal</strong> · your MSA
        renews on{" "}
        <MonoChip>{"{{startDate}}"}</MonoChip> next cycle. The renewal
        conversation opens 90 days out.
      </P>

      <CTA href="{{renewalUrl}}" label="Open the Year-2 conversation" />

      <Muted>
        Whether or not you renew — the doctrine we shipped is yours to
        keep. Every ADR, every steering file, every runbook lives in
        your repo, forever.
      </Muted>
    </EmailShell>
  );
}
