/**
 * @file select-field-row.component.tsx
 * @module @stackra/settings/native/components/select-field-row
 * @description `<SelectFieldRow>` — a `ListGroup.Item` that opens a
 *   `BottomSheet` option picker on press.
 *
 *   The row surfaces the current value in the description slot, so
 *   users can see the current selection without opening the sheet.
 *   Tapping the row opens the sheet; tapping an option in the sheet
 *   dismisses the sheet and fires `onChange`.
 *
 *   Compound APIs verified via HeroUI Native MCP `get_component_docs`
 *   for BottomSheet + ListGroup:
 *   - `ListGroup.Item onPress={...}` — pressable row.
 *   - `BottomSheet > BottomSheet.Portal > BottomSheet.Overlay +
 *     BottomSheet.Content > (BottomSheet.Title + list rows)`.
 *   - `BottomSheet.Close` renders the top-right dismiss button.
 *
 *   Accessibility: the row exposes an `accessibilityRole="button"`
 *   (the OS convention for a value-editing action). The bottom
 *   sheet options carry `accessibilityRole="radio"` with the
 *   current selection marked via `accessibilityState.selected`.
 */

import { BottomSheet, ListGroup, Separator } from "@stackra/ui/native";
import { Fragment, useCallback, useMemo, useState, type ReactElement } from "react";

import { useNativeSettingsT } from "../../hooks/use-native-settings-t/use-native-settings-t.hook";

import type { ISettingFieldOption } from "@stackra/contracts";
import type { ISelectFieldRowProps } from "./select-field-row.interface";

/**
 * `<SelectFieldRow>` — tappable row + option picker sheet.
 *
 * @param props - {@link ISelectFieldRowProps}.
 */
export function SelectFieldRow(props: ISelectFieldRowProps): ReactElement {
  const { field, options, value, onChange, disabled } = props;
  const isDisabled = disabled === true || field.readOnly === true;
  const t = useNativeSettingsT();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Resolve the label of the currently-selected option — surfaced in
  // the row's description slot so users can see the current choice
  // without opening the sheet.
  const selectedLabel = useMemo<string>(() => {
    const match = options.find((option) => option.value === value);
    return match?.label ?? t("select_field.no_selection");
  }, [options, value, t]);

  const handlePickOption = useCallback(
    (option: ISettingFieldOption): void => {
      if (option.disabled === true) return;
      setIsOpen(false);
      onChange(option.value);
    },
    [onChange],
  );

  return (
    <Fragment>
      <ListGroup.Item
        accessibilityHint={t("select_field.open_hint")}
        accessibilityLabel={field.label}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        className="min-h-[48px]"
        onPress={() => {
          if (isDisabled) return;
          setIsOpen(true);
        }}
      >
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>{field.label}</ListGroup.ItemTitle>
          <ListGroup.ItemDescription>{selectedLabel}</ListGroup.ItemDescription>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix />
      </ListGroup.Item>

      {/*
       * BottomSheet lives OUTSIDE the ListGroup.Item so pressing it
       * (or dragging to dismiss) doesn't trigger the row's onPress.
       * The `isOpen` state governs the mount/unmount cycle.
       */}
      <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <BottomSheet.Close />
            <BottomSheet.Title>{field.label}</BottomSheet.Title>
            {field.description ? (
              <BottomSheet.Description>{field.description}</BottomSheet.Description>
            ) : null}

            <ListGroup className="mt-4" variant="transparent">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <Fragment key={String(option.value)}>
                    {index > 0 ? <Separator className="mx-4" /> : null}
                    <ListGroup.Item
                      accessibilityLabel={option.label}
                      accessibilityRole="radio"
                      accessibilityState={{
                        disabled: option.disabled ?? false,
                        selected: isSelected,
                      }}
                      className="min-h-[48px]"
                      onPress={() => handlePickOption(option)}
                    >
                      <ListGroup.ItemContent>
                        <ListGroup.ItemTitle>{option.label}</ListGroup.ItemTitle>
                        {option.description ? (
                          <ListGroup.ItemDescription>
                            {option.description}
                          </ListGroup.ItemDescription>
                        ) : null}
                      </ListGroup.ItemContent>
                      {/*
                       * Suffix intentionally left empty when unselected
                       * so the check indicator only appears on the
                       * current selection — matches iOS Settings.
                       */}
                      {isSelected ? (
                        <ListGroup.ItemSuffix>
                          <ListGroup.ItemDescription className="text-success">
                            {t("select_field.selected_indicator")}
                          </ListGroup.ItemDescription>
                        </ListGroup.ItemSuffix>
                      ) : null}
                    </ListGroup.Item>
                  </Fragment>
                );
              })}
            </ListGroup>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </Fragment>
  );
}

SelectFieldRow.displayName = "SelectFieldRow";
