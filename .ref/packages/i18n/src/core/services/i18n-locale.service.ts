/**
 * @file i18n-locale.service.ts
 * @module @stackra/i18n/core/services
 * @description Reactive locale orchestrator. Owns the current locale,
 *   validates against the supported set, persists to storage, applies
 *   direction via the platform adapter, triggers translation loading,
 *   and notifies subscribers.
 *
 *   Owns its own post-wire coordination via `OnModuleInit` (wires the
 *   manager ↔ locale-service bridge) and `OnApplicationBootstrap`
 *   (hydrates the persisted locale + fires the initial translation load
 *   after every module has finished `onModuleInit`).
 *
 *   ## Flow
 *
 *   ```
 *   setLocale('ar')
 *     ↳ validate against supportedLocales
 *     ↳ store.setState({ isLoading: true })
 *     ↳ storage.setLocale('ar')
 *     ↳ directionService.apply('ar')
 *     ↳ manager.loadLocale('ar')
 *     ↳ store.setState({ locale, dir, isLoading: false })
 *     ↳ notify subscribers
 *   ```
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import {
  EVENT_EMITTER,
  I18N_DIRECTION_SERVICE,
  I18N_EVENTS,
  I18N_LOCALE_STORAGE,
  I18N_MANAGER,
  type IEventEmitter,
  type ILocaleStorage,
  type OnApplicationBootstrap,
  type OnModuleInit,
} from "@stackra/contracts";

import { DEFAULT_I18N_CONFIG, I18N_CONFIG } from "../constants";

import { DirectionService } from "./direction.service";
import { I18nManager } from "./i18n-manager.service";

import type { II18nConfig, II18nStore, LocaleItem } from "../interfaces";

/**
 * Reactive locale orchestrator.
 *
 * Coordinates locale switching across validation, persistence, direction,
 * and translation loading. Storage + reactive store are optional — the
 * service degrades gracefully when either is absent.
 */
@Injectable()
export class I18nLocaleService implements OnModuleInit, OnApplicationBootstrap {
  /** The currently active locale code. */
  private currentLocale: string;

  /** Supported locale codes — locales outside this list are rejected. */
  private readonly supportedLocales: string[];

  /**
   * Display metadata per supported locale (name + flag). Derived
   * from `config.locales` when set; falls back to
   * `supportedLocales.map(code => ({ code, name: code }))` so
   * every entry always has a label. Codes present in
   * `supportedLocales` but missing from `config.locales` get the
   * derived fallback; entries in `config.locales` for codes NOT
   * in `supportedLocales` are silently skipped.
   */
  private readonly localeItems: readonly LocaleItem[];

  /** Whether to persist locale changes to storage. */
  private readonly persist: boolean;

  /** Optional reactive state store — updated on every locale change. */
  private store?: II18nStore;

  /** Subscribers notified after each successful `setLocale`. */
  private readonly listeners = new Set<(locale: string) => void>();

  /** Unsubscribe function for peer-tab `I18N_EVENTS.LOCALE_CHANGED`. */
  private crossTabCleanup: (() => void) | null = null;

  /** Guard flag to prevent peer-echo → re-broadcast loops. */
  private applyingFromPeer = false;

  /**
   */
  public constructor(
    @Inject(I18N_CONFIG) config: II18nConfig,
    @Inject(I18N_DIRECTION_SERVICE)
    private readonly directionService: DirectionService,
    @Inject(I18N_MANAGER) private readonly manager: I18nManager,
    @Optional()
    @Inject(I18N_LOCALE_STORAGE)
    private readonly storage?: ILocaleStorage,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
  ) {
    // ADR-0063 — apply inline `??` fallbacks against
    // `DEFAULT_I18N_CONFIG` at read-sites (the module binds options
    // AS-IS via useValue — no merge step).
    const defaultLocale =
      config.defaultLocale ?? DEFAULT_I18N_CONFIG.defaultLocale;
    this.supportedLocales =
      config.supportedLocales && config.supportedLocales.length > 0
        ? config.supportedLocales
        : [defaultLocale];
    this.persist =
      config.persistLocale ?? DEFAULT_I18N_CONFIG.persistLocale ?? true;
    this.currentLocale = config.initialLocale ?? defaultLocale;

    // Build the display map — one item per supported locale.
    // Consumer-supplied entries win; codes without an entry fall
    // back to `{ code, name: code }`. Order follows
    // `supportedLocales` so pickers render in the order the app
    // author declared.
    const supplied = new Map<string, LocaleItem>();
    for (const item of config.locales ?? []) {
      supplied.set(item.code, item);
    }
    this.localeItems = this.supportedLocales.map(
      (code) => supplied.get(code) ?? { code, name: code },
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Wire the manager ↔ locale-service bridge — runs after both providers
   * have been constructed but before app bootstrap.
   *
   * The manager reads the current locale via a getter (closure over `this`)
   * so it never holds a stale value.
   */
  public onModuleInit(): void {
    this.manager.setLocaleGetter(() => this.currentLocale);
  }

  /**
   * Hydrate the persisted locale (when available) and fire the initial
   * translation load — runs after every module has finished
   * `onModuleInit`.
   */
  public async onApplicationBootstrap(): Promise<void> {
    const persisted = await this.getPersistedLocale();
    const initial = persisted ?? this.currentLocale;

    if (initial !== this.currentLocale) {
      // Persisted locale differs from the config default — perform the full
      // switch (validation, direction, load, notify).
      await this.setLocale(initial);
    } else {
      // Same locale as config default — just fire the initial load + direction.
      try {
        await this.manager.loadLocale(this.currentLocale);
      } catch {
        // Fail-open — a bad initial load must not block bootstrap.
      }
      this.directionService.apply(this.currentLocale);
    }

    // Attach the peer-tab listener AFTER hydration so a stale
    // in-flight peer emit from a previous session doesn't fight
    // the initial locale.
    this.subscribeToCrossTab();
  }

  // ══════════════════════════════════════════════════════════════════════
  // External wiring (kept for tests / feature composition)
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Attach a reactive state store (updated on every locale change).
   *
   * @param store - The `II18nStore` implementation (e.g. `@stackra/state`).
   */
  public setStore(store: II18nStore): void {
    this.store = store;
  }

  // ══════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════

  /** Currently active locale code. */
  public getLocale(): string {
    return this.currentLocale;
  }

  /** Text direction for the current locale. */
  public getDir(): "ltr" | "rtl" {
    return this.directionService.getDirection(this.currentLocale);
  }

  /** Whether the current locale is right-to-left. */
  public isRTL(): boolean {
    return this.directionService.isRtl(this.currentLocale);
  }

  /** Copy of the configured supported-locale array. */
  public getSupportedLocales(): string[] {
    return [...this.supportedLocales];
  }

  /**
   * Display metadata for every supported locale — the shape
   * `LanguageSelector` / `LanguageToggle` / custom zone adapters
   * read to render `[flag] [name]` pickers without hardcoding a
   * map at the call site.
   */
  public getLocales(): readonly LocaleItem[] {
    return this.localeItems;
  }

  /**
   * Switch to a new locale.
   *
   * Validates → sets loading → persists → applies direction → loads
   * translations → updates reactive state → notifies subscribers.
   *
   * @param locale - Target locale code.
   * @returns `true` when a restart is required (native direction change).
   * @throws When the locale is not supported.
   */
  public async setLocale(locale: string): Promise<boolean> {
    if (!this.supportedLocales.includes(locale)) {
      throw new Error(
        `[I18nLocaleService] Locale "${locale}" is not supported. ` +
          `Supported: ${this.supportedLocales.join(", ")}`,
      );
    }

    if (this.currentLocale === locale) return false;

    const previous = this.currentLocale;
    this.currentLocale = locale;

    // Loading state
    if (this.store) {
      this.store.setState((s) => ({ ...s, isLoading: true }));
    }

    // Persist
    if (this.persist && this.storage) {
      try {
        await this.storage.setLocale(locale);
      } catch {
        // Fail-open — persistence failures never block a locale switch.
      }
    }

    // Direction
    const needsRestart = this.directionService.apply(locale);

    // Translation load
    try {
      await this.manager.loadLocale(locale);
    } catch {
      // Fail-open — translation load errors already surface via the loader.
    }

    const dir = this.directionService.getDirection(locale);

    // Reactive state
    if (this.store) {
      this.store.setState((s) => ({
        ...s,
        locale,
        dir,
        isLoading: false,
      }));
    }

    // Notify subscribers
    for (const listener of this.listeners) {
      try {
        listener(locale);
      } catch {
        // Never let a rogue subscriber break subsequent ones.
      }
    }

    // Fire on the shared bus for cross-package listeners
    // + cross-tab relay. Skip when the switch was triggered by a
    // peer emit — `CoordinatorTransport` handles echo suppression
    // at the transport, but we also short-circuit here so peer
    // apply paths never re-broadcast.
    if (!this.applyingFromPeer) {
      this.emitEvent(I18N_EVENTS.LOCALE_CHANGED, {
        code: locale,
        previous,
        dir,
      });
    }

    return needsRestart;
  }

  /**
   * Read the persisted locale from storage.
   *
   * @returns The stored locale if valid + supported, otherwise `null`.
   */
  public async getPersistedLocale(): Promise<string | null> {
    if (!this.persist || !this.storage) return null;

    try {
      const stored = await this.storage.getLocale();
      return stored && this.supportedLocales.includes(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  /**
   * Subscribe to locale changes. Compatible with `useSyncExternalStore`.
   *
   * @param listener - Callback fired with the new locale after each switch.
   * @returns Unsubscribe function.
   */
  public subscribe(listener: (locale: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Stable snapshot for `useSyncExternalStore`. */
  public getSnapshot(): string {
    return this.currentLocale;
  }

  /**
   * Detach the peer-tab listener. Called by consumers that dispose
   * of the service; not part of the module lifecycle since the
   * service usually lives for the lifetime of the app.
   */
  public destroy(): void {
    if (this.crossTabCleanup) {
      this.crossTabCleanup();
      this.crossTabCleanup = null;
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // Cross-tab peer sync
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Subscribe to peer-tab `I18N_EVENTS.LOCALE_CHANGED` and apply the
   * change locally. The peer already wrote the new locale to shared-
   * origin storage; this handler applies it through the same code
   * path as a local switch, but with `applyingFromPeer = true` to
   * suppress re-broadcast.
   */
  private subscribeToCrossTab(): void {
    if (!this.events) return;

    this.crossTabCleanup = this.events.on(
      I18N_EVENTS.LOCALE_CHANGED,
      (payload) => {
        const code = this.readLocaleFromPayload(payload);
        if (!code || code === this.currentLocale) return;
        if (!this.supportedLocales.includes(code)) return;

        this.applyingFromPeer = true;
        void this.setLocale(code)
          .catch(() => {
            // Fail-open — peer sync errors must never crash the tab.
          })
          .finally(() => {
            this.applyingFromPeer = false;
          });
      },
    );
  }

  /**
   * Defensive shape extract — payload may be `{ code }` (canonical),
   * `{ locale }` (legacy), or a bare string (peer from an older
   * package version).
   */
  private readLocaleFromPayload(payload: unknown): string | null {
    if (typeof payload === "string") return payload;
    if (typeof payload === "object" && payload !== null) {
      const p = payload as { code?: unknown; locale?: unknown };
      if (typeof p.code === "string") return p.code;
      if (typeof p.locale === "string") return p.locale;
    }
    return null;
  }

  /**
   * Fire-and-forget emit on the shared bus. Fail-open — bus errors
   * must not break locale switching.
   */
  private emitEvent(event: string, payload: unknown): void {
    if (!this.events) return;
    try {
      void this.events.emit(event, payload);
    } catch {
      // Fail-open — event emission must never break i18n.
    }
  }
}
