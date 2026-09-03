/**
 * @file 06-quarterly-review.tsx
 * @module @figentra/email-templates/onboarding/quarterly-review
 * @description Onboarding touch 6 · Quarter 1.
 *
 *   Fires at the 90-day boundary. Presents the quarterly governance
 *   receipt — a longer-form retrospective aggregating three monthly
 *   retros into a single accountable document ready for the
 *   customer's own regulator + compliance officer.
 *
 *   Merge-vars:
 *     {{firstName}} · {{orgName}} · {{quarterLabel}}
 *     {{qbrUrl}} · {{qbrPdfUrl}} · {{signingPartner}}
 *     {{regulator}} · {{nextQbrDate}}
 */
import * as React from "react";
import { CTA, EmailShell, H1, H2, Kicker, MonoChip, Muted, P, ShellDivider, theme } from "./_theme";

export default function OnboardingQuarterlyReview(): React.ReactElement {
  return (
    <EmailShell preview="Q1 governance receipt: your regulator-ready summary.">
      <Kicker>Touch 06 · Quarter 1 · Governance receipt</Kicker>
      <H1>Your Q1 receipt is signed.</H1>
      <P>
        {"{{quarterLabel}}"} governance receipt for <strong>{"{{orgName}}"}</strong> · countersigned
        by {"{{signingPartner}}"} · shipped in a format your regulator ({"{{regulator}}"}) or
        compliance officer can drop into an audit response with zero rework.
      </P>

      <CTA href="{{qbrUrl}}" label="Open the Q1 review page" />

      <H2>What the receipt contains</H2>
      <P style={{ margin: 0 } as unknown as { margin: 0 }}>
        <MonoChip>01</MonoChip> · Every ADR authored in the quarter, with signing partner + accepted
        date.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>02</MonoChip> · Every migration + rollback readiness + reviewer signature per
        migration.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>03</MonoChip> · Every incident (SEV-1 through 4), cause, resolution, and the
        review-lane change that prevents recurrence.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>04</MonoChip> · Every third-party dependency added or bumped, license, and
        vulnerability posture at quarter end.
      </P>
      <P style={{ margin: "8px 0 0" } as unknown as { margin: string }}>
        <MonoChip>05</MonoChip> · Every access grant, revocation, and role change on your production
        plane.
      </P>
      <P style={{ margin: "8px 0 24px" } as unknown as { margin: string }}>
        <MonoChip>06</MonoChip> · A "what would fail an audit" section · empty this quarter · not
        always.
      </P>

      <Muted>
        Download the signed PDF for filing:{" "}
        <span style={{ color: theme.ink }}>{"{{qbrPdfUrl}}"}</span> — SHA-256 hash +
        partner-signature footer.
      </Muted>

      <ShellDivider />

      <H2>What ships next quarter</H2>
      <P>
        The Q2 review lands on <MonoChip>{"{{nextQbrDate}}"}</MonoChip>. Same format, longer scope —
        Q2 typically adds a compliance posture summary for whichever new regulator surface the
        quarter shipped.
      </P>
    </EmailShell>
  );
}
