/**
 * @file use-i18n.hook.ts
 * @module @stackra/i18n/core/hooks/use-i18n
 * @description Primary hook for accessing i18n in React components.
 *   Provides the `t()` function, locale state, direction, and switching.
 *
 *   Uses `useInject()` from `@stackra/container/react` to access the
 *   I18nManager and I18nLocaleService via proper DI tokens.
 */

import { useInject } from "@stackra/container/react";
import {
  I18N_MANAGER,
  I18N_LOCALE_SERVICE,
  type TranslateOptions,
} from "@stackra/contracts";
import { useCallback, useSyncExternalStore } from "react";

import type { UseI18nReturn } from "../../interfaces";
import type { I18nLocaleService } from "../../services/i18n-locale.service";
import type { I18nManager } from "../../services/i18n-manager.service";

/**
 * Access the i18n system from a React component.
 *
 * Uses DI injection via `useInject()` — requires `I18nModule.forRoot()` or
 * `WebI18nModule.forRoot()` to be registered in the module tree.
 *
 * @typeParam K - Generated translations type for autocomplete
 * @returns i18n state and functions
 *
 * @example
 * ```typescript
 * const { t, locale, setLocale, dir } = useI18n();
 * return <h1 dir={dir}>{t("common.hello")}</h1>;
 * ```
 */
export function useI18n<K = Record<string, unknown>>(): UseI18nReturn<K> {
  const manager = useInject<I18nManager>(I18N_MANAGER);
  const localeService = useInject<I18nLocaleService>(I18N_LOCALE_SERVICE);

  // Subscribe to locale changes so consumers of `useI18n()` re-
  // render whenever ANY caller (this component, another instance
  // of the same component, the footer toggle, an event listener,
  // ...) fires `setLocale`. Without the subscription, `useI18n`
  // just read `getLocale()` once per render — locale mutations
  // never triggered a re-render, so external changes never
  // propagated to a component's `locale` value. See ADR-worthy
  // discussion in `.kiro/steering/communication-patterns.md`
  // §Lane 1 (DI + subscribe) for the pattern used here.
  //
  // `getSnapshot` returns a primitive string so React's default
  // referential equality check works — no need for a memoised
  // shim.
  const locale = useSyncExternalStore(
    (onChange) => localeService.subscribe(() => onChange()),
    () => localeService.getSnapshot(),
    () => localeService.getSnapshot(),
  );
  const dir = localeService.getDir();

  const setLocale = useCallback(
    async (newLocale: string) => {
      await localeService.setLocale(newLocale);
    },
    [localeService],
  );

  const t = useCallback(
    (key: string, options?: TranslateOptions) => {
      return manager.t(key, { ...options, lang: locale });
    },
    [manager, locale],
  );

  return {
    locale,
    dir,
    isRTL: dir === "rtl",
    languages: localeService.getSupportedLocales(),
    // `localeService.getLocales()` returns a stable frozen array
    // built once at construction (see
    // `I18nLocaleService.constructor` — one item per
    // `supportedLocales` entry, keyed off `config.locales`).
    // Consumers should treat it as read-only.
    locales: localeService.getLocales(),
    setLocale,
    isLoading: false,
    t: t,
  };
}
