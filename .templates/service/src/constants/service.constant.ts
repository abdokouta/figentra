/**
 * @file service.constant.ts
 * @module {{PACKAGE_NAME}}/constants
 * @description Service identity constant. Used by observability, logging,
 *   and health-check responses.
 */

/** Canonical service name — matches the deployable slug. */
export const SERVICE_NAME = "{{SLUG}}" as const;
