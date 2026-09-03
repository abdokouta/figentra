/**
 * @file zone.interface.ts
 * @module @stackra/zones/react/components/zone
 * @description Props interface for `<Zone>` — the general-purpose
 *   zone renderer.
 */

import type { ReactNode } from "react";

/**
 * Props accepted by `<Zone>`.
 *
 * @example
 * ```tsx
 * <Zone id="users.list.header">
 *   <SearchInput id="search" />
 *   <ExportButton id="export" />
 * </Zone>
 * ```
 */
export interface IZoneProps {
  /**
   * The dotted zone id. Contribution registration matches this
   * string exactly — a typo means the contribution won't land.
   */
  readonly id: string;

  /**
   * Optional runtime params merged into `IZoneContext.params`
   * every contribution's `when(ctx)` sees. Route params, current
   * user id, filter selections — anything the host page wants to
   * expose to contributions.
   */
  readonly params?: Readonly<Record<string, unknown>>;

  /**
   * The host's intrinsic children — the default content the zone
   * renders when no contribution replaces / precedes / follows.
   *
   * Every direct child MUST carry a stable id (`id` prop or React
   * `key`). Anchor lookups against ids reference these children —
   * a missing id triggers a dev-time warning and gets a synthesised
   * fallback id that isn't stable across re-mounts.
   */
  readonly children?: ReactNode;
}
