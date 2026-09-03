/**
 * @file boolean-field-row.component.tsx
 * @module @stackra/settings/native/components/boolean-field-row
 * @description `<BooleanFieldRow>` — a `ListGroup.Item` with an
 *   inline HeroUI Native `Switch` in the suffix slot.
 *
 *   The iOS + Android system-Settings pattern: title (+ optional
 *   description) on the left, switch on the right. Tapping the row
 *   itself flips the switch too — enlarges the touch target to the
 *   full 48-px row height. The row disables when `field.readOnly`
 *   or the caller passes `disabled`.
 *
 *   Compound APIs verified via HeroUI Native MCP `get_component_docs`
 *   for Switch + ListGroup:
 *   - `ListGroup.Item onPress={...}` — pressable row.
 *   - `ListGroup.ItemContent > (ItemTitle + ItemDescription)`.
 *   - `ListGroup.ItemSuffix` — override chevron with the Switch.
 *   - `Switch > Switch.Thumb` — the compound thumb pattern the
 *     Switch docs demonstrate.
 *
 *   Accessibility: the row exposes a single logical control — the
 *   Switch — with an `accessibilityLabel` derived from the field's
 *   label. Tapping the row invokes the same `onChange` so screen
 *   readers see one control instead of two.
 */

import { ListGroup, Switch } from "@stackra/ui/native";
import type { ReactElement } from "react";

import type { IBooleanFieldRowProps } from "./boolean-field-row.interface";

/**
 * `<BooleanFieldRow>` — inline switch inside a ListGroup row.
 *
 * @param props - {@link IBooleanFieldRowProps}.
 *
 * @example
 * ```tsx
 * <BooleanFieldRow
 *   field={definition.fields.find((f) => f.key === "compact")!}
 *   value={values.compact}
 *   onChange={(next) => set("compact", next)}
 * />
 * ```
 */
export function BooleanFieldRow(props: IBooleanFieldRowProps): ReactElement {
  const { field, value, onChange, disabled } = props;
  const isDisabled = disabled === true || field.readOnly === true;

  // The row's onPress flips the same switch — makes the whole 48px
  // row a valid tap target, matching iOS Settings behavior.
  const handleRowPress = (): void => {
    if (isDisabled) return;
    onChange(!value);
  };

  return (
    <ListGroup.Item
      accessibilityLabel={field.label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: isDisabled }}
      className="min-h-[48px]"
      onPress={handleRowPress}
    >
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{field.label}</ListGroup.ItemTitle>
        {field.description ? (
          <ListGroup.ItemDescription>{field.description}</ListGroup.ItemDescription>
        ) : null}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        {/*
         * The inline switch — mirrors the row's onPress so touching
         * the switch itself works the same as touching the row.
         * `accessibilityLabel` is intentionally empty here so the
         * row's label is announced once, not twice.
         */}
        <Switch
          accessibilityLabel=""
          isDisabled={isDisabled}
          isSelected={value}
          onSelectedChange={onChange}
        >
          <Switch.Thumb />
        </Switch>
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}

BooleanFieldRow.displayName = "BooleanFieldRow";
