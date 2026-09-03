/**
 * @file seo-field-generator.ts
 * @module @stackra/nestjs-orm/graphql
 * @description Auto-generates a nested `seo: SeoMeta` GraphQL field on
 *   any entity ObjectType whose schema declares at least one of the
 *   standard SEO columns (`seo_title`, `seo_description`, `og_image`,
 *   `og_type`, `twitter_card`, `twitter_image`, `canonical`).
 *
 *   The generator hooks into `defineResolver()` (and equivalent
 *   pathways) so consumers do not write any boilerplate per entity —
 *   the same column shape that backs the `SeoMetaFields` GraphQL
 *   fragment from `@stackra/seo` automatically becomes a queryable
 *   nested object.
 *
 *   Entities can opt out by applying `@SkipSeoField()` at the class
 *   level — useful when an app uses a different SEO column naming
 *   convention.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { Field, ObjectType, ResolveField, Parent } from '@nestjs/graphql';
import { IType } from '@nestjs/common';

// ============================================================================
// Constants
// ============================================================================

export const SEO_COLUMNS = [
  'seo_title',
  'seo_description',
  'og_image',
  'og_type',
  'twitter_card',
  'twitter_image',
  'canonical',
] as const;

// ============================================================================
// Decorator — opt-out
// ============================================================================

/**
 * Class decorator that opts an entity out of the auto-generated `seo`
 * GraphQL field.
 *
 * Use when the entity ships its own SEO fields under a different
 * naming convention or when the auto-generated nested object would
 * conflict with manual schema work.
 *
 * @returns A class decorator that sets the skip metadata flag
 *
 * @example
 * ```ts
 * @SkipSeoField()
 * @Entity({ tableName: 'legacy_pages' })
 * export class LegacyPage extends BaseEntity {
 *   // ...declares its own seo_meta_legacy column instead
 * }
 * ```
 */
export function SkipSeoField(): ClassDecorator {
  return (target) => {
    defineMetadata(SKIP_SEO_FIELD_KEY, true, target);
  };
}

// ============================================================================
// Shared SeoMeta GraphQL ObjectType
// ============================================================================

/**
 * Shared GraphQL ObjectType for the SEO meta nested object. Registered
 * once at module load and reused across every entity that gains the
 * generated `seo` field.
 *
 * Field names match the `SeoMetaFields` fragment exported from
 * `@stackra/seo` — keep the two in sync.
 */
@ObjectType('SeoMeta', {
  description: 'Standard SEO column bag exposed automatically on entities with SEO columns.',
})
export class SeoMetaType {
  /** Page title used in `<title>` and `og:title`. */
  @Field(() => String, { nullable: true })
  public seo_title?: string | null;

  /** Page description used in `<meta name="description">` and `og:description`. */
  @Field(() => String, { nullable: true })
  public seo_description?: string | null;

  /** Open Graph image URL. */
  @Field(() => String, { nullable: true })
  public og_image?: string | null;

  /** Open Graph type (e.g. `website`, `article`). */
  @Field(() => String, { nullable: true })
  public og_type?: string | null;

  /** Twitter card variant (e.g. `summary`, `summary_large_image`). */
  @Field(() => String, { nullable: true })
  public twitter_card?: string | null;

  /** Twitter card image URL. */
  @Field(() => String, { nullable: true })
  public twitter_image?: string | null;

  /** Canonical URL for the page. */
  @Field(() => String, { nullable: true })
  public canonical?: string | null;
}

// ============================================================================
// Detection
// ============================================================================

/**
 * Check whether an entity declares at least one of the standard SEO
 * columns. Reads the property names from the prototype-stored ORM
 * metadata so it works for both `@Property()` columns and trait-added
 * columns.
 *
 * @param entity - The entity class to inspect
 * @returns `true` when at least one SEO column is declared
 */
export function entityHasSeoColumns(entity: Function): boolean {
  if (getMetadata<boolean>(SKIP_SEO_FIELD_KEY, entity) === true) return false;

  const properties = readPropertyKeys(entity);
  if (properties.size === 0) return false;

  for (const col of SEO_COLUMNS) {
    if (properties.has(col)) return true;
  }
  return false;
}

/**
 * Walk the entity's prototype-stored property metadata and return the
 * set of property keys. Done locally to avoid a hard dependency on the
 * caller passing the property list.
 *
 * @param entity - The entity class
 * @returns Set of declared property keys
 */
function readPropertyKeys(entity: Function): Set<string> {
  const PROPERTY_METADATA = 'orm:properties';
  const stored = getMetadata<Array<{ key: string }>>(PROPERTY_METADATA, entity.prototype) ?? [];
  return new Set(stored.map((p) => p.key));
}

// ============================================================================
// Generator hook
// ============================================================================

/**
 * Attach a nested `seo: SeoMeta` field to the resolver class for the
 * given entity, whenever the entity declares at least one of the
 * standard SEO columns AND has not opted out via `@SkipSeoField()`.
 *
 * The field value is computed by reading the SEO columns directly off
 * the parent entity row — no separate database fetch is required. The
 * shape returned matches the `SeoMetaFields` GraphQL fragment from
 * `@stackra/seo`, so consumers can spread the fragment without any
 * mapping at the call site.
 *
 * Idempotent — repeat calls for the same resolver class are no-ops.
 *
 * @param resolverClass - The auto-generated CRUD resolver class
 *   produced by `defineResolver()`. The function mutates its prototype.
 * @param entity - The entity class the resolver targets
 * @returns `true` when the field was attached, `false` when skipped
 */
export function attachSeoFieldIfApplicable(resolverClass: IType<any>, entity: Function): boolean {
  if (!entityHasSeoColumns(entity)) return false;
  if (getMetadata<boolean>(SEO_FIELD_ATTACHED, resolverClass) === true) return false;

  const proto = resolverClass.prototype;

  // Resolver method: reads each SEO column off the parent entity row
  // and bundles the bag into the SeoMeta shape. Missing columns are
  // returned as `null` so consumers can rely on the field shape.
  const resolveSeo = function (this: unknown, parent: Record<string, unknown>) {
    return {
      seo_title: (parent.seo_title as string | null | undefined) ?? null,
      seo_description: (parent.seo_description as string | null | undefined) ?? null,
      og_image: (parent.og_image as string | null | undefined) ?? null,
      og_type: (parent.og_type as string | null | undefined) ?? null,
      twitter_card: (parent.twitter_card as string | null | undefined) ?? null,
      twitter_image: (parent.twitter_image as string | null | undefined) ?? null,
      canonical: (parent.canonical as string | null | undefined) ?? null,
    };
  };

  Object.defineProperty(proto, 'seo', {
    value: resolveSeo,
    writable: true,
    configurable: true,
    enumerable: false,
  });

  ResolveField(() => SeoMetaType, { name: 'seo', nullable: true })(proto, 'seo', {
    value: resolveSeo,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  Parent()(proto, 'seo', 0);

  defineMetadata(SEO_FIELD_ATTACHED, true, resolverClass);
  return true;
}

/** Internal flag used to avoid double-registering the SEO field. */
const SEO_FIELD_ATTACHED = Symbol.for('@stackra/orm:seo-field-attached');
