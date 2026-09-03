/**
 * @file crud-resolver.factory.ts
 * @description Factory that generates a full CRUD GraphQL resolver.
 * Auto-generates queries (list, find, count, paginated) and mutations (create, update, delete).
 * Also generates @ResolveField() methods for @HasMany/@BelongsTo relations with DataLoader wiring.
 */

import { getMetadata } from '@vivtel/metadata';
import { IType } from '@nestjs/common';
import {
  Resolver,
  Query,
  Mutation,
  ResolveField,
  Parent,
  Args,
  ID,
  Int,
  ObjectType,
  Field,
  Context,
} from '@nestjs/graphql';
import { ICrudService } from '../interfaces/crud-service.interface';
import { GQL_ARG, GQL_DEFAULTS } from '../constants/graphql-args.constant';
import { RELATION_METADATA } from '../relations/constants/relation-tokens.constant';
import type { StoredRelation } from '../relations/interfaces/relation-options.interface';
import {
  RELATION_FIELD_METADATA,
  type IStoredRelationField,
} from '../decorators/relation-field.decorator';
import { getLoaderKey } from '../utils/get-loader-key.util';
import { attachSeoFieldIfApplicable } from '../graphql/seo-field-generator';

/**
 * Simple English pluralization for GraphQL operation names.
 */
function pluralize(word: string): string {
  if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }
  return word + 's';
}

// ─── Pagination GraphQL Types ─────────────────────────────────────────────────

@ObjectType({ isAbstract: true })
class PaginationMeta {
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
  @Field(() => Int) totalPages!: number;
  @Field(() => Int) count!: number;
  @Field(() => Boolean) hasNextPage!: boolean;
  @Field(() => Boolean) hasPreviousPage!: boolean;
}

@ObjectType({ isAbstract: true })
class PageInfo {
  @Field(() => Boolean) hasNextPage!: boolean;
  @Field(() => Boolean) hasPreviousPage!: boolean;
  @Field(() => String, { nullable: true }) startCursor?: string | null;
  @Field(() => String, { nullable: true }) endCursor?: string | null;
}

function createPageType<T>(classRef: IType<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PageType {
    @Field(() => [classRef]) items!: T[];
    @Field(() => PaginationMeta) meta!: any;
  }
  return PageType as IType<any>;
}

function createSimplePageType<T>(classRef: IType<T>) {
  @ObjectType({ isAbstract: true })
  abstract class SimplePageType {
    @Field(() => [classRef]) items!: T[];
    @Field(() => Int) page!: number;
    @Field(() => Int) limit!: number;
    @Field(() => Boolean) hasMore!: boolean;
  }
  return SimplePageType as IType<any>;
}

function createConnectionType<T>(classRef: IType<T>, entityName: string) {
  @ObjectType(`${entityName}Edge`, { isAbstract: true })
  abstract class EdgeType {
    @Field(() => classRef) node!: T;
    @Field(() => String) cursor!: string;
  }
  @ObjectType({ isAbstract: true })
  abstract class ConnectionType {
    @Field(() => [EdgeType]) edges!: any[];
    @Field(() => PageInfo) pageInfo!: any;
    @Field(() => Int) totalCount!: number;
  }
  return ConnectionType as IType<any>;
}

// ─── Options ──────────────────────────────────────────────────────────────────

/**
 * Factory that generates a full CRUD GraphQL resolver.
 *
 * @param options - Resolver configuration
 * @returns An abstract class to extend with your @Resolver() class
 *
 * @example
 * ```ts
 * const Base = defineResolver({ entity: Tenant, create: CreateTenantInput, ... });
 *
 * @Resolver(() => Tenant)
 * export class TenantResolver extends Base {
 *   constructor(service: TenantService) { super(); this.service = service as any; }
 * }
 * ```
 */
export function defineResolver(options: DefineResolverOptions) {
  const {
    entity: EntityClass,
    create: CreateInput,
    update: UpdateInput,
    filter: FilterInput,
    sort: SortInput,
    name,
    pluralName = pluralize(name),
  } = options;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const PageType = createPageType(EntityClass);
  const SimplePageType = createSimplePageType(EntityClass);
  const ConnectionType = createConnectionType(EntityClass, cap(name));

  @ObjectType(`${cap(name)}Page`)
  class NamedPage extends PageType {}
  @ObjectType(`${cap(name)}SimplePage`)
  class NamedSimplePage extends SimplePageType {}
  @ObjectType(`${cap(name)}Connection`)
  class NamedConnection extends ConnectionType {}

  // Use String as fallback type when filter/sort not provided (arg will be ignored)
  const FilterType = FilterInput || String;
  const SortType = SortInput || String;
  const hasFilter = !!FilterInput;
  const hasSort = !!SortInput;

  @Resolver(() => EntityClass)
  abstract class GeneratedCrudResolver {
    service!: ICrudService<any>;

    @Query(() => [EntityClass], { name: pluralName })
    async findAll(
      @Args(GQL_ARG.FILTER, { type: () => FilterType, nullable: true })
      filter?: any,
      @Args(GQL_ARG.SORT, { type: () => SortType, nullable: true })
      sort?: any
    ) {
      return this.service.findAll(hasFilter ? filter : undefined, hasSort ? sort : undefined);
    }

    @Query(() => EntityClass, { name, nullable: true })
    async findOne(@Args(GQL_ARG.ID, { type: () => ID }) id: string) {
      return this.service.findById(id);
    }

    @Query(() => Int, { name: `${pluralName}Count` })
    async count(
      @Args(GQL_ARG.FILTER, { type: () => FilterType, nullable: true })
      filter?: any
    ) {
      return this.service.count(hasFilter ? filter : undefined);
    }

    @Query(() => NamedPage, { name: `${pluralName}Paginated` })
    async findPaginated(
      @Args(GQL_ARG.PAGE, { type: () => Int, defaultValue: GQL_DEFAULTS.PAGE })
      page: number,
      @Args(GQL_ARG.LIMIT, {
        type: () => Int,
        defaultValue: GQL_DEFAULTS.LIMIT,
      })
      limit: number,
      @Args(GQL_ARG.FILTER, { type: () => FilterType, nullable: true })
      filter?: any,
      @Args(GQL_ARG.SORT, { type: () => SortType, nullable: true })
      sort?: any
    ) {
      return this.service.paginateLengthAware(
        page,
        limit,
        hasFilter ? filter : undefined,
        hasSort ? sort : undefined
      );
    }

    @Query(() => NamedSimplePage, { name: `${pluralName}Simple` })
    async findSimplePaginated(
      @Args(GQL_ARG.PAGE, { type: () => Int, defaultValue: GQL_DEFAULTS.PAGE })
      page: number,
      @Args(GQL_ARG.LIMIT, {
        type: () => Int,
        defaultValue: GQL_DEFAULTS.LIMIT,
      })
      limit: number,
      @Args(GQL_ARG.FILTER, { type: () => FilterType, nullable: true })
      filter?: any,
      @Args(GQL_ARG.SORT, { type: () => SortType, nullable: true })
      sort?: any
    ) {
      return this.service.paginateSimple(
        page,
        limit,
        hasFilter ? filter : undefined,
        hasSort ? sort : undefined
      );
    }

    @Query(() => NamedConnection, { name: `${pluralName}Connection` })
    async findConnection(
      @Args(GQL_ARG.FIRST, {
        type: () => Int,
        defaultValue: GQL_DEFAULTS.FIRST,
      })
      first: number,
      @Args(GQL_ARG.AFTER, { type: () => String, nullable: true })
      after?: string,
      @Args(GQL_ARG.FILTER, { type: () => FilterType, nullable: true })
      filter?: any,
      @Args(GQL_ARG.SORT, { type: () => SortType, nullable: true })
      sort?: any
    ) {
      return this.service.paginateCursor(
        first,
        after,
        hasFilter ? filter : undefined,
        hasSort ? sort : undefined
      );
    }

    @Mutation(() => EntityClass, { name: `create${cap(name)}` })
    async create(@Args(GQL_ARG.INPUT, { type: () => CreateInput }) input: any) {
      return this.service.create(input);
    }

    @Mutation(() => EntityClass, { name: `update${cap(name)}` })
    async update(@Args(GQL_ARG.INPUT, { type: () => UpdateInput }) input: any) {
      return this.service.update(input);
    }

    @Mutation(() => EntityClass, { name: `remove${cap(name)}` })
    async remove(@Args(GQL_ARG.ID, { type: () => ID }) id: string) {
      return this.service.softDelete(id);
    }

    @Mutation(() => EntityClass, { name: `restore${cap(name)}` })
    async restore(@Args(GQL_ARG.ID, { type: () => ID }) id: string) {
      return this.service.restore(id);
    }

    @Mutation(() => EntityClass, { name: `forceDelete${cap(name)}` })
    async forceDelete(@Args(GQL_ARG.ID, { type: () => ID }) id: string) {
      await this.service.forceDelete(id);
      return { id };
    }
  }

  // ─── Auto-generate @ResolveField() for declared relations ───────────────────
  // Priority: @RelationField() metadata > @HasMany/@BelongsTo inference

  const relationFields: IStoredRelationField[] =
    getMetadata<IStoredRelationField[]>(RELATION_FIELD_METADATA, EntityClass.prototype) || [];
  const relations: StoredRelation[] =
    getMetadata<StoredRelation[]>(RELATION_METADATA, EntityClass.prototype) || [];

  // Track which properties have explicit @RelationField to avoid double-registration
  const explicitFields = new Set(relationFields.map((rf) => rf.propertyKey));

  // Process @RelationField() decorated properties first (explicit, takes priority)
  for (const rf of relationFields) {
    const relatedEntity = rf.target();
    // Detect array wrapper: () => [Entity] returns an array with one element
    const isCollection = rf.options.many ?? Array.isArray(relatedEntity);
    const resolvedEntity = isCollection ? relatedEntity[0] : relatedEntity;
    const relatedKey =
      rf.options.loaderKey ??
      (isCollection
        ? `${getLoaderKey(resolvedEntity)}:${rf.options.foreignKey}`
        : getLoaderKey(resolvedEntity));
    const propertyKey = rf.propertyKey;
    const fk = rf.options.foreignKey;
    const nullable = rf.options.nullable ?? !isCollection;

    if (isCollection) {
      // HasMany: load array via FK-based DataLoader
      const resolveMethod = async function (this: any, parent: any, ctx: any) {
        const parentId = parent.id;
        if (!parentId) return [];
        const loaders = ctx?.__dataloaders__ as Map<string, any> | undefined;
        const loader = loaders?.get(relatedKey);
        if (loader) return loader.load(parentId);
        return [];
      };

      ResolveField(() => [resolvedEntity], { name: propertyKey })(
        GeneratedCrudResolver.prototype,
        propertyKey,
        { value: resolveMethod, writable: true, configurable: true, enumerable: false }
      );
      Object.defineProperty(GeneratedCrudResolver.prototype, propertyKey, {
        value: resolveMethod,
        writable: true,
        configurable: true,
        enumerable: false,
      });
      Parent()(GeneratedCrudResolver.prototype, propertyKey, 0);
      Context()(GeneratedCrudResolver.prototype, propertyKey, 1);
    } else {
      // BelongsTo: load single entity by FK value
      const resolveMethod = async function (this: any, parent: any, ctx: any) {
        const fkValue = parent[fk];
        if (!fkValue) return null;
        const loaders = ctx?.__dataloaders__ as Map<string, any> | undefined;
        const loader = loaders?.get(relatedKey);
        if (loader) return loader.load(fkValue);
        return null;
      };

      ResolveField(() => resolvedEntity, { name: propertyKey, nullable })(
        GeneratedCrudResolver.prototype,
        propertyKey,
        { value: resolveMethod, writable: true, configurable: true, enumerable: false }
      );
      Object.defineProperty(GeneratedCrudResolver.prototype, propertyKey, {
        value: resolveMethod,
        writable: true,
        configurable: true,
        enumerable: false,
      });
      Parent()(GeneratedCrudResolver.prototype, propertyKey, 0);
      Context()(GeneratedCrudResolver.prototype, propertyKey, 1);
    }
  }

  // Process @HasMany/@BelongsTo relations (only if not already handled by @RelationField)
  for (const relation of relations) {
    if (explicitFields.has(relation.propertyKey)) continue;

    const relatedEntity = relation.target();
    const relatedKey = getLoaderKey(relatedEntity);
    const propertyKey = relation.propertyKey;

    if (relation.type === 'belongsTo') {
      const fk = (relation.options as any).foreignKey || `${propertyKey}_id`;

      const resolveMethod = async function (this: any, parent: any, ctx: any) {
        const fkValue = parent[fk];
        if (!fkValue) return null;
        const loaders = ctx?.__dataloaders__ as Map<string, any> | undefined;
        const loader = loaders?.get(relatedKey);
        if (loader) return loader.load(fkValue);
        return null;
      };

      ResolveField(() => relatedEntity, { name: propertyKey, nullable: true })(
        GeneratedCrudResolver.prototype,
        propertyKey,
        { value: resolveMethod, writable: true, configurable: true, enumerable: false }
      );
      Object.defineProperty(GeneratedCrudResolver.prototype, propertyKey, {
        value: resolveMethod,
        writable: true,
        configurable: true,
        enumerable: false,
      });
      Parent()(GeneratedCrudResolver.prototype, propertyKey, 0);
      Context()(GeneratedCrudResolver.prototype, propertyKey, 1);
    } else if (relation.type === 'hasMany') {
      const fk = (relation.options as any).foreignKey || `${name}_id`;
      const fkLoaderKey = `${relatedKey}:${fk}`;

      const resolveMethod = async function (this: any, parent: any, ctx: any) {
        const parentId = parent.id;
        if (!parentId) return [];
        const loaders = ctx?.__dataloaders__ as Map<string, any> | undefined;
        const loader = loaders?.get(fkLoaderKey);
        if (loader) return loader.load(parentId);
        return [];
      };

      ResolveField(() => [relatedEntity], { name: propertyKey })(
        GeneratedCrudResolver.prototype,
        propertyKey,
        { value: resolveMethod, writable: true, configurable: true, enumerable: false }
      );
      Object.defineProperty(GeneratedCrudResolver.prototype, propertyKey, {
        value: resolveMethod,
        writable: true,
        configurable: true,
        enumerable: false,
      });
      Parent()(GeneratedCrudResolver.prototype, propertyKey, 0);
      Context()(GeneratedCrudResolver.prototype, propertyKey, 1);
    } else if (relation.type === 'manyToMany') {
      // ManyToMany: resolved via link DataLoader (pivot table)
      // Convention: link loader key is 'link:<LinkName>:source'
      // The linkName is derived from both entity names: Source + Target
      const linkName = `${cap(name)}${relatedEntity.name}`;
      const linkLoaderKey = `link:${linkName}:source`;

      const resolveMethod = async function (this: any, parent: any, ctx: any) {
        const parentId = parent.id;
        if (!parentId) return [];
        const loaders = ctx?.__dataloaders__ as Map<string, any> | undefined;
        const loader = loaders?.get(linkLoaderKey);
        if (loader) return loader.load(parentId);
        return [];
      };

      ResolveField(() => [relatedEntity], { name: propertyKey })(
        GeneratedCrudResolver.prototype,
        propertyKey,
        { value: resolveMethod, writable: true, configurable: true, enumerable: false }
      );
      Object.defineProperty(GeneratedCrudResolver.prototype, propertyKey, {
        value: resolveMethod,
        writable: true,
        configurable: true,
        enumerable: false,
      });
      Parent()(GeneratedCrudResolver.prototype, propertyKey, 0);
      Context()(GeneratedCrudResolver.prototype, propertyKey, 1);
    }
  }

  // ─── Auto-attach `seo: SeoMeta` field for entities with SEO columns ────────
  // Opt-out via @SkipSeoField(). When the entity declares no SEO columns the
  // attachment is a no-op so non-SEO entities never gain a noise field.
  attachSeoFieldIfApplicable(GeneratedCrudResolver as unknown as IType<any>, EntityClass);

  return GeneratedCrudResolver;
}
