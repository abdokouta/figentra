/**
 * @file invoice.tsx
 * @module @academorix/email-templates/invoice
 * @description Monthly subscription + per-athlete invoice.
 *   Renders as an itemised statement · totals · pay-online CTA ·
 *   VAT-line where applicable · Stripe / Paddle handoff.
 *
 * Subject: "Invoice {{invoiceNumber}} · {{athleteName}} · {{month}}"
 * Preview: "{{amountDue}} due on {{dueDate}} · one-click pay"
 *
 * Trigger: `Stackra\Finance\Actions\FireMonthlyInvoice` cron on day-1
 *          of each calendar month.
 */

import { Column, Hr, Row, Section, Text } from "@react-email/components";
import * as React from "react";

import { CTA, EmailShell, H1, Kicker, MonoChip, Muted, P, theme } from "./_theme";

export interface InvoiceLineItem {
  label: string;
  detail?: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}

export interface InvoiceEmailProps {
  parentName?: string;
  athleteName?: string;
  academyName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  lineItems?: InvoiceLineItem[];
  subtotal?: string;
  vatRate?: string;
  vatAmount?: string;
  totalDue?: string;
  payUrl?: string;
  invoicePdfUrl?: string;
  invoiceStatus?: "due" | "overdue" | "paid";
}

const defaultProps: Required<InvoiceEmailProps> = {
  parentName: "Karim",
  athleteName: "Youssef Hakim",
  academyName: "Sahara Padel Academy",
  invoiceNumber: "INV-2026-09-0142",
  invoiceDate: "September 1, 2026",
  dueDate: "September 15, 2026",
  currency: "MAD",
  lineItems: [
    {
      label: "Padel U14 · monthly subscription",
      detail: "September 2026 · 8 sessions",
      quantity: 1,
      unitPrice: "650.00",
      amount: "650.00",
    },
    {
      label: "Private coaching · Coach Layla",
      detail: "2 sessions · 60 min each",
      quantity: 2,
      unitPrice: "180.00",
      amount: "360.00",
    },
    {
      label: "Tournament fee · Ain Diab Open",
      detail: "Youth bracket · Sep 22-23",
      quantity: 1,
      unitPrice: "120.00",
      amount: "120.00",
    },
    {
      label: "Kit · Academorix training tee",
      detail: "Size YL · Track Orange",
      quantity: 1,
      unitPrice: "90.00",
      amount: "90.00",
    },
  ],
  subtotal: "1 220.00",
  vatRate: "20 %",
  vatAmount: "244.00",
  totalDue: "1 464.00",
  payUrl: "https://academorix.com/pay/preview",
  invoicePdfUrl: "https://academorix.com/invoices/preview.pdf",
  invoiceStatus: "due",
};

export function InvoiceEmail(props: InvoiceEmailProps): React.ReactElement {
  const p = { ...defaultProps, ...props };

  const statusChip =
    p.invoiceStatus === "paid"
      ? { color: "#0f7a3a", bg: "#e6f4ea", text: "Paid" }
      : p.invoiceStatus === "overdue"
        ? { color: "#a3170b", bg: "#fde5e0", text: "Overdue" }
        : { color: theme.ink, bg: "#fff2cc", text: "Due" };

  return (
    <EmailShell preview={`${p.currency} ${p.totalDue} due on ${p.dueDate} · one-click pay`}>
      <Row>
        <Column>
          <Kicker>Invoice · {p.invoiceDate}</Kicker>
        </Column>
        <Column style={{ textAlign: "right" }}>
          <Text
            style={{
              display: "inline-block",
              padding: "4px 10px",
              backgroundColor: statusChip.bg,
              color: statusChip.color,
              fontFamily: theme.fontMono,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              borderRadius: 4,
              margin: 0,
            }}
          >
            {statusChip.text}
          </Text>
        </Column>
      </Row>

      <H1>
        {p.athleteName}
        <br />
        <span style={{ color: theme.textMuted, fontSize: 20, fontWeight: 400 }}>
          September at {p.academyName}
        </span>
      </H1>

      <P>
        Hi {p.parentName} — here&#39;s the statement for {p.athleteName}
        &#39;s September training. Every line matches a session on your parent dashboard. Pay online
        with one tap or reply with any question before {p.dueDate}.
      </P>

      <CTA href={p.payUrl} label={`Pay ${p.currency} ${p.totalDue} online →`} />

      <Text
        style={{
          fontFamily: theme.fontMono,
          fontSize: 11,
          color: theme.textMuted,
          margin: "0 0 8px",
        }}
      >
        Invoice · <MonoChip>{p.invoiceNumber}</MonoChip> · due{" "}
        <strong style={{ color: theme.ink }}>{p.dueDate}</strong>
      </Text>

      <Hr style={{ borderColor: theme.border, margin: "24px 0" }} />

      {/* ── line items · scoreboard-style ── */}
      <Text
        style={{
          fontFamily: theme.fontMono,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: theme.signal,
          margin: "0 0 12px",
        }}
      >
        Statement · itemised
      </Text>

      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        width="100%"
        style={{ borderCollapse: "collapse", margin: "0 0 24px" }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                fontFamily: theme.fontMono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: theme.textMuted,
                padding: "0 0 8px",
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              Item
            </th>
            <th
              style={{
                textAlign: "right",
                fontFamily: theme.fontMono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: theme.textMuted,
                padding: "0 0 8px 12px",
                borderBottom: `1px solid ${theme.border}`,
                width: 40,
              }}
            >
              Qty
            </th>
            <th
              style={{
                textAlign: "right",
                fontFamily: theme.fontMono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: theme.textMuted,
                padding: "0 0 8px 12px",
                borderBottom: `1px solid ${theme.border}`,
                width: 80,
              }}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {p.lineItems.map((li, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: "14px 0",
                  borderBottom: `1px solid ${theme.border}`,
                  verticalAlign: "top",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontFamily: theme.fontSans,
                    fontSize: 14,
                    fontWeight: 500,
                    color: theme.ink,
                  }}
                >
                  {li.label}
                </Text>
                {li.detail && (
                  <Text
                    style={{
                      margin: "2px 0 0",
                      fontFamily: theme.fontSans,
                      fontSize: 12,
                      color: theme.textMuted,
                    }}
                  >
                    {li.detail}
                  </Text>
                )}
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "14px 0 14px 12px",
                  borderBottom: `1px solid ${theme.border}`,
                  fontFamily: theme.fontMono,
                  fontSize: 13,
                  color: theme.ink,
                  verticalAlign: "top",
                }}
              >
                {li.quantity}
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "14px 0 14px 12px",
                  borderBottom: `1px solid ${theme.border}`,
                  fontFamily: theme.fontMono,
                  fontSize: 13,
                  color: theme.ink,
                  verticalAlign: "top",
                }}
              >
                {p.currency} {li.amount}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ textAlign: "right", padding: "16px 12px 4px 0" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: theme.fontMono,
                  fontSize: 12,
                  color: theme.textMuted,
                }}
              >
                Subtotal
              </Text>
            </td>
            <td style={{ textAlign: "right", padding: "16px 0 4px 12px" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: theme.fontMono,
                  fontSize: 13,
                  color: theme.ink,
                }}
              >
                {p.currency} {p.subtotal}
              </Text>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ textAlign: "right", padding: "4px 12px 4px 0" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: theme.fontMono,
                  fontSize: 12,
                  color: theme.textMuted,
                }}
              >
                VAT ({p.vatRate})
              </Text>
            </td>
            <td style={{ textAlign: "right", padding: "4px 0 4px 12px" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: theme.fontMono,
                  fontSize: 13,
                  color: theme.ink,
                }}
              >
                {p.currency} {p.vatAmount}
              </Text>
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                textAlign: "right",
                padding: "16px 12px 8px 0",
                borderTop: `2px solid ${theme.ink}`,
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: theme.fontMono,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: theme.signal,
                  fontWeight: 500,
                }}
              >
                Total due
              </Text>
            </td>
            <td
              style={{
                textAlign: "right",
                padding: "16px 0 8px 12px",
                borderTop: `2px solid ${theme.ink}`,
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: theme.fontMono,
                  fontSize: 20,
                  fontWeight: 600,
                  color: theme.ink,
                  letterSpacing: "-0.02em",
                }}
              >
                {p.currency} {p.totalDue}
              </Text>
            </td>
          </tr>
        </tfoot>
      </table>

      <Text
        style={{
          fontFamily: theme.fontSans,
          fontSize: 14,
          color: theme.ink,
          margin: "0 0 12px",
        }}
      >
        Prefer a paper trail? Grab the PDF:{" "}
        <a href={p.invoicePdfUrl} style={{ color: theme.signal }}>
          {p.invoiceNumber}.pdf
        </a>
        .
      </Text>

      <Muted>
        Payments are processed by Stripe or Paddle depending on your country. Neither Academorix nor{" "}
        {p.academyName} touches your card number. PCI-DSS scope stays with the processor.
      </Muted>
    </EmailShell>
  );
}

export default InvoiceEmail;
