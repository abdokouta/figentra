/**
 * @file language-combobox.component.tsx
 * @module @stackra/i18n/react/components
 * @description Language combobox — a HeroUI `ComboBox` with a
 *   filterable popover of locale items. Sibling of the button-
 *   triggered {@link LanguageSelector}.
 *
 *   Anatomy per HeroUI 3's `ComboBox` compound API + verified
 *   against `.kiro/steering/ui-components.md` §"Always prefer
 *   ComboBox over Select":
 *
 *   ```
 *   <ComboBox>                     ← controlled selection + input
 *     <ComboBox.InputGroup>
 *       <Input placeholder="..." />
 *       <ComboBox.Trigger />       ← chevron; also opens the popover
 *     </ComboBox.InputGroup>
 *     <ComboBox.Popover>
 *       <ListBox>
 *         <ListBox.Item textValue="🇺🇸 English">…</ListBox.Item>
 *       </ListBox>
 *     </ComboBox.Popover>
 *   </ComboBox>
 *   ```
 *
 *   React Aria's ComboBox filters items whose `textValue`
 *   includes the typed text — setting `textValue="🇺🇸 English"`
 *   makes both `en` (via code) and `Eng` (via name prefix)
 *   productive search inputs. After selection, the input value
 *   defaults to the item's `textValue`.
 *
 * @example
 * ```tsx
 * <LanguageCombobox />
 * <LanguageCombobox placeholder="Choose your language…" />
 * <LanguageCombobox
 *   locales={[
 *     { code: 'en', name: 'English', flag: '🇺🇸' },
 *     { code: 'ar', name: 'العربية', flag: '🇸🇦' },
 *     { code: 'fr', name: 'Français', flag: '🇫🇷' },
 *   ]}
 * />
 * ```
 */

"use client";

import { ComboBox, Input, Label, ListBox } from "@stackra/ui/react";
import { useCallback, useMemo, type Key, type ReactElement } from "react";

import type { LanguageComboboxProps, LocaleItem } from "../../interfaces";

import { useI18n } from "../../../core/hooks/use-i18n";

/**
 * Compose the `textValue` for a locale item. Drives:
 *
 * - React Aria's typeahead search + item filtering
 * - The screen-reader announcement
 * - The input value shown after selection
 *
 * @param item - The locale item.
 * @returns `"🇺🇸 English"` when a flag is present, otherwise
 *   just the name.
 */
function composeItemTextValue(item: LocaleItem): string {
  return item.flag ? `${item.flag} ${item.name}` : item.name;
}

/**
 * Language combobox — filterable locale picker. See file
 * docblock for the full contract.
 */
export function LanguageCombobox({
  label,
  locales,
  className,
  placeholder,
  "aria-label": ariaLabelOverride,
  menuTrigger = "focus",
}: LanguageComboboxProps = {}): ReactElement {
  const { locale, setLocale, locales: configLocales } = useI18n();

  // Prop overrides the config-driven display map; every rendered
  // entry uses whatever name + flag the consumer app supplied via
  // `II18nConfig.locales` (or the derived `{ code, name: code }`
  // fallback for codes with no explicit entry).
  const items: LocaleItem[] = useMemo(
    () => locales ?? [...configLocales],
    [locales, configLocales],
  );

  const currentItem = useMemo(
    () => items.find((item) => item.code === locale) ?? items[0],
    [items, locale],
  );

  const handleSelectionChange = useCallback(
    (key: Key | null) => {
      // React Aria's ComboBox emits `null` when the user clears
      // the selection (Escape / Backspace-through-empty). Ignore
      // — the combobox is always associated with a locale.
      if (typeof key !== "string" || key === locale) return;
      void setLocale(key);
    },
    [locale, setLocale],
  );

  const ariaLabel =
    ariaLabelOverride ??
    (label ? undefined : `Language: ${currentItem?.name ?? locale}`);

  return (
    <ComboBox
      aria-label={ariaLabel}
      className={className}
      data-current-locale={locale}
      data-testid="language-combobox"
      menuTrigger={menuTrigger}
      onSelectionChange={handleSelectionChange}
      selectedKey={locale}
    >
      {label ? <Label>{label}</Label> : null}
      <ComboBox.InputGroup>
        <Input placeholder={placeholder ?? "Search language\u2026"} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item
              key={item.code}
              id={item.code}
              textValue={composeItemTextValue(item)}
            >
              {item.flag ? (
                <span aria-hidden="true" className="text-base leading-none">
                  {item.flag}
                </span>
              ) : null}
              <Label>{item.name}</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

LanguageCombobox.displayName = "LanguageCombobox";
