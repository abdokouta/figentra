/**
 * @file settings.registry.ts
 * @module @stackra/settings/core/registries
 * @description Central registry of every setting group.
 *
 *   Accepts BOTH client-declared DTO classes (via `registerClass`,
 *   which reads `@Setting()` / `@Field()` / `@Group()` / `@Section()`
 *   metadata) AND server-declared JSON schemas (via
 *   `registerFromSchema`). Both paths converge on the same
 *   `ISettingDefinition` shape so downstream code stays source-
 *   agnostic.
 *
 *   Extends {@link BaseRegistry} from `@stackra/support`. The two
 *   `register*` methods intentionally do NOT override
 *   {@link BaseRegistry.register} because they take domain-specific
 *   payloads (a DTO class / a JSON schema) rather than a
 *   `(key, definition)` pair — both delegate to the base's strict
 *   `register(key, definition)` internally, which throws
 *   `RegistryDuplicateError` on collisions. The
 *   {@link makeDuplicateError} hook re-throws that as a
 *   {@link SettingsError} so existing consumers keep observing the
 *   domain-specific error type.
 */

import { Injectable, Optional, Inject } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";
import {
  LOGGER_MANAGER,
  type ISettingDefinition,
  type ISettingsRegistry,
  type ISettingSection,
  type ILoggerManager,
  type Type,
} from "@stackra/contracts";

import {
  getFieldDescriptors,
  getGroupDescriptors,
  getSectionDescriptors,
  getSettingMetadata,
} from "../decorators";
import { SettingsError } from "../errors";

/**
 * In-memory registry of every registered setting group.
 *
 * Populated at boot by `SettingsModule.forFeature([Dto])` and / or by
 * `SettingsSchemaFetcher` when the API is configured. Read by the
 * service, the broadcast listener, and the React renderer.
 */
@Injectable()
export class SettingsRegistry
  extends BaseRegistry<string, ISettingDefinition>
  implements ISettingsRegistry
{
  /**
   * @param logger - Optional logger for warnings (e.g. a DTO with no
   *   `@Field()` properties, an overwrite via `registerFromSchema`).
   */
  public constructor(@Optional() @Inject(LOGGER_MANAGER) private readonly logger?: ILoggerManager) {
    super();
  }

  // ══════════════════════════════════════════════════════════════════
  // Registration
  // ══════════════════════════════════════════════════════════════════

  /**
   * Register a client-declared DTO decorated with `@Setting()`.
   *
   * @throws {SettingsError} When the class is not decorated with
   *   `@Setting()` or the group key is already registered.
   */
  public registerClass(dto: Type): void {
    const meta = getSettingMetadata(dto);
    if (!meta) {
      throw new SettingsError(
        `Class "${dto.name}" is not decorated with @Setting(). ` +
          `Add @Setting({ key, label, ... }) to the class.`,
      );
    }

    // Collect field / group / section metadata written by the
    // property decorators.
    const fields = getFieldDescriptors(dto);
    const groups = getGroupDescriptors(dto);
    const sectionMap = getSectionDescriptors(dto);

    if (fields.length === 0) {
      this.warn(`DTO "${dto.name}" (group "${meta.key}") has no @Field() properties.`);
    }

    // Serialize the section map into a plain record for the
    // ISettingDefinition contract shape.
    const sections: Record<string, ISettingSection> = {};
    for (const [key, section] of sectionMap) sections[key] = section;

    const definition: ISettingDefinition = {
      key: meta.key,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      order: meta.order ?? 0,
      scope: meta.scope,
      public: meta.public,
      permissions: meta.permissions,
      writePermissions: meta.writePermissions,
      dto,
      fields,
      groups,
      sections: Object.keys(sections).length > 0 ? sections : undefined,
      meta: meta.meta,
    };

    // Strict base-`register` — throws through the overridden
    // `makeDuplicateError` so consumers still catch `SettingsError`.
    super.register(meta.key, definition);
  }

  /**
   * Register a group from a plain JSON schema — typically the payload
   * returned by `GET /api/v1/settings/schema`.
   *
   * @throws {SettingsError} When the group key is already registered.
   */
  public registerFromSchema(schema: ISettingDefinition): void {
    // Schema-driven registrations never have a DTO — normalize the
    // field list to always be an array (schemas from the wire may
    // arrive with `undefined`).
    const definition: ISettingDefinition = {
      ...schema,
      dto: null,
      fields: schema.fields ?? [],
      groups: schema.groups ?? [],
    };

    // Strict base-`register` — throws through the overridden
    // `makeDuplicateError` so consumers still catch `SettingsError`.
    super.register(schema.key, definition);
  }

  /** Bulk-register a list of schemas. */
  public registerManyFromSchema(schemas: readonly ISettingDefinition[]): void {
    for (const schema of schemas) {
      // The single-item path throws on collision; catch and re-throw
      // wrapped so the caller sees which group in the batch failed.
      try {
        this.registerFromSchema(schema);
      } catch (error) {
        this.warn(`Failed to register group "${schema.key}" from schema.`, error);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // Lookup
  // ══════════════════════════════════════════════════════════════════

  /** @inheritDoc */
  public findByDto(dto: Type): ISettingDefinition | undefined {
    for (const definition of this.values()) {
      if (definition.dto === dto) return definition;
    }
    return undefined;
  }

  /** @inheritDoc */
  public all(): readonly ISettingDefinition[] {
    // Sort by `order` — the settings renderer expects a stable,
    // low-to-high ordering across every group.
    return this.values().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  /**
   * @inheritDoc
   *
   * Exposed as a getter for consumers that read `.size` directly
   * (matches the pre-migration shape). Delegates to the inherited
   * {@link BaseRegistry.count} method.
   */
  public get size(): number {
    return this.count();
  }

  // ══════════════════════════════════════════════════════════════════
  // BaseRegistry error-factory override
  // ══════════════════════════════════════════════════════════════════

  /**
   * Route duplicate-registration errors through the domain-specific
   * {@link SettingsError} so existing consumers keep observing the
   * expected error type. The message shape matches the two thrown
   * in the pre-migration `registerClass` / `registerFromSchema`.
   *
   * @param key - The duplicate group key.
   * @returns A ready-to-throw {@link SettingsError}.
   */
  protected override makeDuplicateError(key: string): Error {
    return new SettingsError(
      `Settings group "${key}" is already registered. Each group key must be unique.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════

  /**
   * Emit a warning through the optional logger. Fail-soft — never
   * throws if the logger fails.
   */
  private warn(message: string, cause?: unknown): void {
    if (!this.logger) return;
    try {
      const suffix = cause === undefined ? "" : `: ${formatCause(cause)}`;
      this.logger.create("settings").warn(`${message}${suffix}`);
    } catch {
      // Fail-soft — internal logging must never surface.
    }
  }
}

/**
 * Serialise an unknown thrown value into a readable log suffix. Errors
 * yield their `.message`; primitives coerce through `String`; objects
 * go through `JSON.stringify` so the log never carries the useless
 * `[object Object]` — which is what native template-string coercion
 * would produce (and what `@typescript-eslint/no-base-to-string`
 * legitimately flags).
 */
function formatCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === "string") return cause;
  if (typeof cause === "number" || typeof cause === "boolean") return String(cause);
  try {
    return JSON.stringify(cause);
  } catch {
    return "[unserialisable]";
  }
}
