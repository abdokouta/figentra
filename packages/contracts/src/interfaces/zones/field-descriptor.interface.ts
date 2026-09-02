/**
 * @file field-descriptor.interface.ts
 * @module @stackra/contracts/interfaces/zones
 * @description Field-descriptor family — the wire-safe shape a
 *   contribution can push into a `<FormFieldZone>` host.
 *
 *   Three interfaces + one union make up the family; every symbol is
 *   grouped here per the composite-family exception in
 *   `.kiro/steering/code-standards.md` §"Composite family grouping" —
 *   `IFieldOption` and `FieldKind` are only ever consumed as parts
 *   of an `IFieldDescriptor`, so the reader sees the whole shape in
 *   one file.
 *
 *   Consumers: `IZoneFieldContribution` in
 *   `zone-contribution.interface.ts`; `<FormFieldZone>` in
 *   `@stackra/zones/react` + `@stackra/zones/native`; the host page's
 *   descriptor-to-input mapper (HeroUI `Form` + zod, Refine, ...).
 */

/**
 * The kind of input a `IFieldDescriptor` renders as. Renderers are
 * host-owned — this interface only declares the wire-safe kind
 * string so the host can pick the right HeroUI (`Input`, `Select`,
 * `ComboBox`, `Switch`, `Checkbox`, ...) or bespoke input component.
 */
export type FieldKind =
  | "text"
  | "email"
  | "url"
  | "password"
  | "number"
  | "date"
  | "time"
  | "datetime"
  | "select"
  | "combobox"
  | "checkbox"
  | "switch"
  | "textarea";

/**
 * One option in a `select` / `combobox` field.
 *
 * `value` is the wire value stored in the form; `label` is the
 * user-facing string rendered inside the option.
 */
export interface IFieldOption {
  /** The value stored in the form when this option is selected. */
  readonly value: string;
  /** The displayed label the user sees inside the option. */
  readonly label: string;
}

/**
 * Descriptor for a form field a zone contribution injects into a
 * `<FormFieldZone>` host.
 *
 * The host owns the `<Form>` element AND the descriptor-to-input
 * mapping. `IFieldDescriptor` is pure data (safe to travel over the
 * wire in an `ISduiScreen` payload); it never carries React
 * components. Zone contributions of `kind: "field"` produce these
 * descriptors so the host page can compose them into its form + zod
 * schema without knowing which module authored each field.
 *
 * @example
 * ```ts
 * const contribution: IZoneFieldContribution = {
 *   id: "age-restriction-min-age",
 *   zone: "customer.create.form",
 *   kind: "field",
 *   anchor: "email",
 *   position: "after",
 *   field: {
 *     name: "minimum_age",
 *     label: "Minimum age",
 *     kind: "number",
 *     required: true,
 *     validation: { min: 13, max: 120 },
 *   },
 * };
 * ```
 */
export interface IFieldDescriptor {
  /**
   * Form-value key. MUST be unique within the form the descriptor
   * lands in — anchor targeting inside `<FormFieldZone>` uses this
   * name too, so a duplicate produces ambiguous ordering.
   */
  readonly name: string;

  /**
   * The user-facing label rendered above the input.
   */
  readonly label: string;

  /** Which input shape the host renders for this field. */
  readonly kind: FieldKind;

  /**
   * Options for `select` / `combobox` fields. Ignored for other
   * kinds. Empty / undefined ⇒ the host renders an empty list.
   */
  readonly options?: readonly IFieldOption[];

  /** Whether the field must have a value before the form submits. */
  readonly required?: boolean;

  /** Placeholder text shown inside the empty input. */
  readonly placeholder?: string;

  /** Help text rendered below the input (never a tooltip). */
  readonly help?: string;

  /**
   * Default value written into the form's value registry on mount.
   * Runtime typing intentionally opaque — the host coerces per
   * `kind`.
   */
  readonly defaultValue?: unknown;

  /**
   * Structured validation. Descriptor stays pure data — the host's
   * renderer maps this to a real validator (typically zod) at
   * composition time. `custom` names a validator registered in a
   * host-owned registry.
   */
  readonly validation?: Readonly<{
    /** Minimum numeric value (inclusive). */
    readonly min?: number;
    /** Maximum numeric value (inclusive). */
    readonly max?: number;
    /** Minimum string length (inclusive). */
    readonly minLength?: number;
    /** Maximum string length (inclusive). */
    readonly maxLength?: number;
    /** Regex source string (no flags). Matched against the value. */
    readonly pattern?: string;
    /** Name of a validator resolved from a host-owned validator registry. */
    readonly custom?: string;
  }>;
}
