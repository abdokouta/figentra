/**
 * @file form-field-zone.interface.ts
 * @module @stackra/zones/react/components/form-field-zone
 * @description Props interface for `<FormFieldZone>` — the
 *   render-prop wrapper that produces the ordered list of
 *   `IFieldDescriptor`s a host form composes.
 */

import type { IFieldDescriptor } from "@stackra/contracts";
import type { ReactNode } from "react";

/**
 * Props accepted by `<FormFieldZone>`.
 *
 * The host owns the actual `<Form>` element AND the
 * descriptor-to-input mapping — `<FormFieldZone>` only produces
 * the ordered descriptor list.
 *
 * @example
 * ```tsx
 * <FormFieldZone
 *   id="user.create.form"
 *   intrinsicFields={[
 *     { name: "email", label: "Email", kind: "email" },
 *     { name: "name", label: "Name", kind: "text" },
 *   ]}
 * >
 *   {(fields) => (
 *     <Form>
 *       {fields.map((f) => <FieldRenderer key={f.name} descriptor={f} />)}
 *     </Form>
 *   )}
 * </FormFieldZone>
 * ```
 */
export interface IFormFieldZoneProps {
  /** The dotted zone id. */
  readonly id: string;

  /**
   * The host's default field descriptors — the ones that render
   * when no contribution replaces / precedes / follows. Every
   * descriptor's `name` is used as the anchor id.
   */
  readonly intrinsicFields: readonly IFieldDescriptor[];

  /**
   * Optional params merged into `IZoneContext.params` every
   * contribution's `when(ctx)` sees.
   */
  readonly params?: Readonly<Record<string, unknown>>;

  /**
   * Render prop — receives the ordered final descriptor list. The
   * host composes the descriptors into a form any way it wants —
   * HeroUI `Form` + zod schema, Refine, bespoke.
   *
   * @param fields - Ordered `IFieldDescriptor` list, filtered by
   *   `when(ctx)` and interspersed with the intrinsic set per
   *   `resolveZoneOrder`.
   */
  readonly children: (fields: readonly IFieldDescriptor[]) => ReactNode;
}
