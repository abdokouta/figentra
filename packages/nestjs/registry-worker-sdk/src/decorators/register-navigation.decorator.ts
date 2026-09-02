/**
 * @file register-navigation.decorator.ts
 * @description Annotates a Nest class as a navigation entry in the application manifest.
 *
 * Navigation entries are surfaced in Figentra dashboards and launchers.
 * Each entry carries a path, a display label, an optional icon, and an optional
 * IAM permission that gates visibility.
 *
 * @example
 * ```ts
 * \@RegisterNavigation({ key: 'audit-log', path: '/audit', label: 'Audit Log', permission: 'audit:read' })
 * \@Controller('audit')
 * export class AuditController {}
 * ```
 */

import type { NavigationManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares a navigation entry in the application manifest.
 * @param value - Navigation descriptor.
 */
export function RegisterNavigation(value: NavigationManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "navigation", value);
}

/** @deprecated Use {@link RegisterNavigation} instead. */
export const RegistryNavigation = RegisterNavigation;
