/**
 * @file auditable.decorator.ts
 * @module @stackra/nestjs-orm/decorators/traits
 * @description @Auditable() trait — auto-logs entity changes to the audit subsystem.
 *
 *   No fields added to the entity. On update/delete, captures a diff of changed
 *   fields and emits an audit event via IPubSubDriver. The audit subsystem
 *   persists this to the `audit_entries` table.
 */

import { defineMetadata } from '@vivtel/metadata';
import { addTrait } from '../../utils/add-trait.util';

// ============================================================================
// Constants
// ============================================================================

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Decorator
// ============================================================================

/**
 * Enable automatic audit logging for entity mutations.
 *
 * When applied, the ORM lifecycle subscriber will:
 * - On create: log the full entity snapshot
 * - On update: log the diff (old values → new values)
 * - On delete: log the final snapshot before deletion
 *
 * Audit entries are emitted via IPubSubDriver to the audit subsystem.
 * No additional columns are added to the entity table.
 *
 * @param config - Optional configuration (field exclusions, operation toggles)
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @Entity({ tableName: 'orders' })
 * @Timestamps()
 * @Auditable({ exclude: ['internal_notes'] })
 * export class Order extends BaseEntity { ... }
 * ```
 */
export function Auditable(config?: IAuditableConfig): ClassDecorator {
  return (target: Function) => {
    const resolvedConfig: Required<IAuditableConfig> = {
      exclude: config?.exclude ?? [],
      logCreates: config?.logCreates ?? true,
      logUpdates: config?.logUpdates ?? true,
      logDeletes: config?.logDeletes ?? true,
    };

    defineMetadata(AUDITABLE_METADATA_KEY, resolvedConfig, target);
    addTrait(target.prototype, 'auditable');
  };
}
