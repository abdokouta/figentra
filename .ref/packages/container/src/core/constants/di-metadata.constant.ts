/**
 * @file di-metadata.constant.ts
 * @module @stackra/container/core/constants
 * @description Reflection metadata keys read and written by the DI
 *   decorators (`@Module`, `@Injectable`, `@Inject`, `@Optional`).
 *   These strings form the contract between decorators (writers) and
 *   the injector / scanner (readers).
 */
export const MODULE_METADATA = {
  IMPORTS: "imports",
  PROVIDERS: "providers",
  CONTROLLERS: "controllers",
  EXPORTS: "exports",
};

/**
 * Marks a module class as `@Global()` — visible to every module in
 * the container graph without needing an explicit `imports:` entry.
 */
export const GLOBAL_MODULE_METADATA = "__module:global__";

/**
 * Set of constructor-parameter indices marked `@Optional()`.
 *
 * The injector reads this before resolving each dep — if the index
 * is present and the token cannot be resolved, the missing dep is
 * injected as `undefined` instead of throwing.
 */
export const OPTIONAL_DEPS_METADATA = "optional:paramtypes";

/**
 * Set of property-injected fields marked `@Optional()`.
 *
 * Same semantics as {@link OPTIONAL_DEPS_METADATA} but scoped to
 * property-injection metadata rather than constructor params.
 */
export const OPTIONAL_PROPERTY_DEPS_METADATA = "optional:properties_metadata";

/**
 * Provider-level scope (`SINGLETON` / `TRANSIENT` / `REQUEST`)
 * declared via `@Injectable({ scope })`. Read by the injector when
 * deciding whether to memoise the resolved instance.
 */
export const SCOPE_OPTIONS_METADATA = "scope:options";

/**
 * Watermark stamped on every class decorated with `@Injectable()`.
 *
 * Scanner uses it to distinguish DI-eligible classes from plain
 * value objects at bootstrap time.
 */
export const INJECTABLE_WATERMARK = "__injectable__";

/** TypeScript-emitted constructor parameter types. */
export const PARAMTYPES_METADATA = "design:paramtypes";

/** Explicitly declared dependencies via @Inject(). */
export const SELF_DECLARED_DEPS_METADATA = "self:paramtypes";

/** Property-injected dependencies via @Inject() on properties. */
export const PROPERTY_DEPS_METADATA = "self:properties_metadata";
