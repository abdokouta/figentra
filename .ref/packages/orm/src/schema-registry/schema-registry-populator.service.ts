/**
 * @file schema-registry-populator.service.ts
 * @module @stackra/nestjs-orm/schema-registry
 * @description Auto-populates the SchemaRegistry from @Entity/@Property decorator metadata.
 *   Runs on module init and registers all discovered entities into the schema registry
 *   so the frontend can fetch entity shapes at bootstrap.
 */

import { getMetadata } from '@vivtel/metadata';
import { IInjectable, Logger, IOnModuleInit } from '@nestjs/common';

import { SchemaRegistry } from './schema-registry.service';
import { entityToJsonSchema } from './entity-to-json-schema.util';
import type { IResourceSchema, IFieldSchema, IRelationSchema } from './schema-registry.interfaces';
import {
  ENTITY_METADATA,
  PROPERTY_METADATA,
  TRAIT_METADATA,
} from '../constants/metadata-keys.constant';
import { RELATION_METADATA } from '../relations/constants/relation-tokens.constant';
import type { StoredEntityMeta } from '../interfaces/stored-entity-meta.interface';
import type { StoredProperty } from '../interfaces/stored-property.interface';
import type { StoredRelation } from '../relations/interfaces/relation-options.interface';

// ============================================================================
// Constants
// ============================================================================

/**
 * Map of ORM property types to portable field types consumed by the frontend.
 */
const TYPE_MAP: Record<string, string> = {
  string: 'string',
  text: 'string',
  integer: 'number',
  decimal: 'number',
  boolean: 'boolean',
  datetime: 'date',
  json: 'json',
  uuid: 'uuid',
  enum: 'enum',
};

/**
 * Trait names that inject auto-generated fields.
 */
const TRAIT_FIELDS: Record<string, string[]> = {
  timestamps: ['createdAt', 'updatedAt'],
  softDeletes: ['deletedAt', 'deletedBy'],
  userstamps: ['createdBy', 'updatedBy'],
  versionable: ['version'],
  archivable: ['archivedAt', 'archivedBy'],
  sortable: ['sortOrder'],
  publishable: ['publishedAt', 'publishedBy'],
  expirable: ['expiresAt'],
};

// ============================================================================
// Service
// ============================================================================

/**
 * Auto-populates the SchemaRegistry from entity decorator metadata at boot.
 *
 * Iterates over all entity classes registered via OrmModule.forFeature() and
 * builds IResourceSchema objects from their @Entity, @Property, and relation
 * decorator metadata. Runs in onModuleInit to ensure all providers are resolved.
 *
 * Fail-open: if metadata reading fails for an entity, it logs a warning and
 * skips that entity rather than crashing the application.
 */
@IInjectable()
export class SchemaRegistryPopulator implements IOnModuleInit {
  private readonly logger = new Logger(SchemaRegistryPopulator.name);

  /** Entity classes pending registration (accumulated via registerEntity calls). */
  private readonly pendingEntities: Function[] = [];

  public constructor(private readonly schemaRegistry: SchemaRegistry) {}

  /**
   * Queue an entity class for schema population.
   *
   * Called by OrmModule.forFeature() during provider wiring so that all
   * entities are accumulated before onModuleInit fires.
   *
   * @param entityClass - The entity class to register
   */
  public addEntity(entityClass: Function): void {
    this.pendingEntities.push(entityClass);
  }

  /**
   * Populate the SchemaRegistry from all queued entity classes.
   *
   * Reads decorator metadata, builds IResourceSchema objects, and registers
   * them. Failures are logged and skipped (fail-open).
   */
  public onModuleInit(): void {
    for (const entityClass of this.pendingEntities) {
      try {
        const schema = this.buildSchema(entityClass);
        if (schema) {
          this.schemaRegistry.register(schema);
          this.logger.debug(`Registered schema: ${schema.resource}`);
        }
      } catch (error: unknown) {
        this.logger.warn(
          `Failed to build schema for ${entityClass.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    this.logger.debug(`Schema registry populated with ${this.schemaRegistry.count()} resources`);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Build an IResourceSchema from entity decorator metadata.
   *
   * @param entityClass - The entity class to introspect
   * @returns The built schema or null if metadata is missing
   */
  private buildSchema(entityClass: Function): IResourceSchema | null {
    const entityMeta: StoredEntityMeta | undefined = getMetadata<StoredEntityMeta>(
      ENTITY_METADATA,
      entityClass
    );

    if (!entityMeta) {
      this.logger.warn(`No @Entity metadata found on ${entityClass.name}`);
      return null;
    }

    const resource = entityMeta.tableName ?? entityMeta.name.toLowerCase();
    const properties = this.readProperties(entityClass);
    const relations = this.readRelations(entityClass);
    const traits = this.readTraits(entityClass);

    const fields = this.buildFields(properties, traits);
    const relationSchemas = this.buildRelations(relations);
    const validation = entityToJsonSchema(entityClass);

    return {
      resource,
      primaryKey: 'id',
      fields,
      relations: relationSchemas,
      validation,
      traits: {
        timestamps: traits.includes('timestamps'),
        softDeletes: traits.includes('softDeletes'),
        versionable: traits.includes('versionable'),
        archivable: traits.includes('archivable'),
        sortable: traits.includes('sortable'),
        publishable: traits.includes('publishable'),
        expirable: traits.includes('expirable'),
      },
      offline: {
        enabled: false,
        conflictStrategy: 'server-wins',
        timestampField: 'updatedAt',
        syncOnReconnect: true,
      },
    };
  }

  /**
   * Read @Property metadata from an entity class prototype.
   *
   * @param entityClass - The entity class
   * @returns Array of stored property definitions
   */
  private readProperties(entityClass: Function): StoredProperty[] {
    return getMetadata<StoredProperty[]>(PROPERTY_METADATA, entityClass.prototype) ?? [];
  }

  /**
   * Read relation metadata from an entity class prototype.
   *
   * @param entityClass - The entity class
   * @returns Array of stored relations
   */
  private readRelations(entityClass: Function): StoredRelation[] {
    return getMetadata<StoredRelation[]>(RELATION_METADATA, entityClass.prototype) ?? [];
  }

  /**
   * Read trait names from an entity class prototype.
   *
   * @param entityClass - The entity class
   * @returns Array of trait names
   */
  private readTraits(entityClass: Function): string[] {
    return getMetadata<string[]>(TRAIT_METADATA, entityClass.prototype) ?? [];
  }

  /**
   * Build IFieldSchema array from property metadata and trait information.
   *
   * @param properties - Stored property definitions from decorators
   * @param traits - Applied trait names
   * @returns Array of field schemas
   */
  private buildFields(properties: StoredProperty[], traits: string[]): IFieldSchema[] {
    const fields: IFieldSchema[] = [];

    // Add the primary key (always present via BaseEntity)
    fields.push({
      name: 'id',
      type: 'uuid',
      nullable: false,
      index: true,
      unique: true,
      primary: true,
      autoGenerated: true,
    });

    // Add declared properties
    for (const prop of properties) {
      fields.push({
        name: prop.key,
        type: TYPE_MAP[prop.type ?? 'string'] ?? 'string',
        nullable: prop.nullable ?? false,
        default: prop.default ?? prop.defaultValue,
        enum: this.resolveEnum(prop.enum),
        index: prop.index ?? false,
        unique: prop.unique ?? false,
        primary: prop.primary ?? false,
        autoGenerated: false,
      });
    }

    // Add trait-injected fields
    for (const trait of traits) {
      const traitFields = TRAIT_FIELDS[trait];
      if (!traitFields) continue;

      for (const fieldName of traitFields) {
        // Avoid duplicating if already declared
        if (fields.some((f) => f.name === fieldName)) continue;

        fields.push({
          name: fieldName,
          type: this.inferTraitFieldType(fieldName),
          nullable: this.isTraitFieldNullable(fieldName),
          index: false,
          unique: false,
          primary: false,
          autoGenerated: true,
        });
      }
    }

    return fields;
  }

  /**
   * Build IRelationSchema array from relation metadata.
   *
   * @param relations - Stored relation definitions
   * @returns Array of relation schemas
   */
  private buildRelations(relations: StoredRelation[]): IRelationSchema[] {
    return relations.map((rel) => {
      const targetClass = rel.target();
      const targetMeta: StoredEntityMeta | undefined = getMetadata<StoredEntityMeta>(
        ENTITY_METADATA,
        targetClass
      );
      const targetResource = targetMeta?.tableName ?? targetClass.name.toLowerCase();

      return {
        name: rel.propertyKey,
        type: rel.type as IRelationSchema['type'],
        resource: targetResource,
        foreignKey: (rel.options as any)?.foreignKey ?? `${rel.propertyKey}_id`,
        pivotTable: (rel.options as any)?.pivotTable,
      };
    });
  }

  /**
   * Resolve enum values from the enum option (function or object).
   *
   * @param enumOption - Enum reference from property options
   * @returns Array of enum value strings or undefined
   */
  private resolveEnum(enumOption?: (() => object) | object): string[] | undefined {
    if (!enumOption) return undefined;

    const enumObj = typeof enumOption === 'function' ? enumOption() : enumOption;
    return Object.values(enumObj).filter((v) => typeof v === 'string') as string[];
  }

  /**
   * Infer the portable type for a trait-injected field by name.
   *
   * @param fieldName - The trait field name
   * @returns The portable type string
   */
  private inferTraitFieldType(fieldName: string): string {
    if (fieldName.endsWith('At')) return 'date';
    if (fieldName.endsWith('By')) return 'string';
    if (fieldName === 'version' || fieldName === 'sortOrder') return 'number';
    return 'string';
  }

  /**
   * Determine if a trait-injected field should be nullable.
   *
   * @param fieldName - The trait field name
   * @returns True if the field is nullable
   */
  private isTraitFieldNullable(fieldName: string): boolean {
    // createdAt and updatedAt are always set; others may be null initially
    if (fieldName === 'createdAt' || fieldName === 'updatedAt') return false;
    if (fieldName === 'version' || fieldName === 'sortOrder') return false;
    return true;
  }
}
