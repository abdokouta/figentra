/**
 * @file sensitivity.enum.ts
 * @module @stackra/contracts/enums
 * @description Data-sensitivity classification enum. Used by AI tool
 *   declarations, audit-field annotations, and data-residency gates.
 */

/**
 * Sensitivity tiers — ascending. Higher tiers require stricter access
 * controls, audit trails, and may trigger data-residency constraints.
 */
export enum Sensitivity {
  /** Publicly available data — no access restriction. */
  PUBLIC = "public",
  /** Personally identifiable information — GDPR/CCPA scope. */
  PII = "pii",
  /** Medical / health data — FERPA/HIPAA scope. */
  MEDICAL = "medical",
  /** Financial data — PCI-DSS scope. */
  FINANCIAL = "financial",
}
