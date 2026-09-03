/**
 * @file language-selector.component.tsx
 * @module @stackra/i18n/react/components
 * @description Language selector — a HeroUI `Popover` + `Button`
 *   trigger + `ListBox` menu. Matches the shape of
 *   `<ThemeSelector>` from `@stackra/theming/react` so both
 *   header controls read as a coherent pair (button-triggered
 *   dropdowns, not text-input comboboxes).
 *
 *   The trigger renders `[flag] [CODE]` (compact, default) or
 *   `[flag] [name]` (expanded). List items always render the
 *   full `[flag] [name]` shape so the menu stays legible even
 *   when the trigger is compact.
 *
 *   Previously composed HeroUI's `<ComboBox>` — the visible
 *   `<Input>` field and its filter behaviour surfaced as an
 *   inconsistent border-radius + focus-ring compared to the
 *   button-triggered dropdowns around it (theme selector, mega-
 *   menus). Swapped to the `<Popover>` + `<Button>` + `<ListBox>`
 *   shape 2026-07-31.
 *
 * @example
 * ```tsx
 * <LanguageSelector />
 * <LanguageSelector
 *   locales={[
 *     { code: 'en', name: 'English', flag: '🇺🇸' },
 *     { code: 'ar', name: 'العربية', flag: '🇸🇦' },
 *   ]}
 * />
 * <LanguageSelector compact={false} />  // 🇺🇸 English — wider variant.
 * ```
 */

"use client";

import { Str } from "@stackra/support";
import { Button, Label, ListBox, Popover } from "@stackra/ui/react";
import { useCallback, useMemo } from "react";

import type { LanguageSelectorProps, LocaleItem } from "../../interfaces";
import type { Key, ReactElement } from "react";

import { useI18n } from "../../../core/hooks/use-i18n";

/**
 * Compose the trigger label from a locale item.
 *
 * - `compact === true` (default) → `"🇺🇸 EN"` (short code).
 * - `compact === false` → `"🇺🇸 English"` (full name).
 *
 * Falls back to the code / name alone when no flag is present.
 */
function composeTriggerLabel(
  item: LocaleItem,
  compact: boolean,
): {
  readonly flag: string | null;
  readonly text: string;
} {
  const text = compact ? Str.upper(item.code) : item.name;
  return { flag: item.flag ?? null, text };
}

/**
 * Language selector — a button-triggered dropdown for switching
 * the active locale. See file docblock for the full contract.
 */
export function LanguageSelector({
  label,
  locales,
  className,
  "aria-label": ariaLabelOverride,
  compact = true,
}: LanguageSelectorProps): ReactElement {
  const { locale, setLocale, locales: configLocales } = useI18n();

  // Prop overrides the config-driven display map; every rendered
  // entry uses whatever name + flag the consumer app supplied via
  // `II18nConfig.locales` (or the derived `{ code, name: code }`
  // fallback for codes with no explicit entry). Hardcoding a
  // display array at the call site is only warranted when a
  // single-page scenario legitimately needs a different label
  // than the app-wide default.
  const items: LocaleItem[] = useMemo(
    () => locales ?? [...configLocales],
    [locales, configLocales],
  );

  // Currently-selected item; may be undefined during first render
  // before the i18n provider hydrates its persisted locale.
  const currentItem = useMemo(
    () => items.find((item) => item.code === locale) ?? items[0],
    [items, locale],
  );

  const trigger = useMemo(() => {
    if (!currentItem) return { flag: null, text: locale };
    return composeTriggerLabel(currentItem, compact);
  }, [currentItem, compact, locale]);

  const handleSelection = useCallback(
    (keys: "all" | Set<Key>) => {
      // React Aria's `ListBox` selection callback receives either
      // the "all" sentinel (unused here — single-select mode) or
      // a `Set<Key>` with the picked key(s).
      if (keys === "all") return;
      const [next] = [...keys];
      if (typeof next === "string" && next !== locale) {
        void setLocale(next);
      }
    },
    [locale, setLocale],
  );

  const ariaLabel =
    ariaLabelOverride ??
    (label ? undefined : `Language: ${currentItem?.name ?? locale}`);

  return (
    <Popover>
      <Button
        aria-label={ariaLabel}
        className={className}
        data-current-locale={locale}
        data-testid="language-selector"
        size="sm"
        variant="ghost"
      >
        {trigger.flag ? (
          <span aria-hidden="true" className="text-base leading-none">
            {trigger.flag}
          </span>
        ) : null}
        <span className="ml-1.5 text-sm font-medium">{trigger.text}</span>
      </Button>
      <Popover.Content className="w-48">
        <Popover.Dialog>
          {/*
            List items always render the full `[flag] [name]` shape
            — the menu stays legible even when the trigger is
            compact. `textValue` carries the name for React Aria's
            typeahead search + screen-reader announcement.
          */}
          <ListBox
            aria-label="Language options"
            disallowEmptySelection
            onSelectionChange={handleSelection}
            selectedKeys={new Set([locale])}
            selectionMode="single"
          >
            {items.map((item) => (
              <ListBox.Item
                key={item.code}
                id={item.code}
                textValue={item.name}
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
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

LanguageSelector.displayName = "LanguageSelector";
