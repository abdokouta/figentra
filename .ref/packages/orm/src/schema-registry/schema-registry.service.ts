/**
 * @file schema-registry.service.ts
 * @module @stackra/nestjs-orm/schema-registry
 * @description Runtime registry of all entity schemas.
 *   Built from @Entity + @Property decorator metadata at boot time.
 *   Exposes resource schemas for frontend consumption via REST endpoint.
 */

import { IInjectable } from '@nestjs/common';
import type { IResourceSchema, IFieldSchema, IRelationSchema } from './schema-registry.interfaces';

/**
 * Schema registry — holds runtime metadata for all registered entities.
 *
 * Populated automatically during OrmModule.forFeature() from entity decorator
 * metadata. The frontend fetches this at bootstrap to drive the data layer,
 * query builder, sync engine, and form generation.
 */
@IInjectable()
export class SchemaRegistry {
  /** All registered resource schemas. */
  private readonly schemas: Map<string, IResourceSchema> = new Map();

  /**
   * Register a resource schema.
   *
   * @param schema - The resource schema to register
   */
  public register(schema: IResourceSchema): void {
    this.schemas.set(schema.resource, schema);
  }

  /**
   * Get a resource schema by name.
   *
   * @param resource - Resource name
   * @returns The schema or undefined
   */
  public get(resource: string): IResourceSchema | undefined {
    return this.schemas.get(resource);
  }

  /**
   * List all registered resource schemas.
   *
   * @returns All schemas
   */
  public listAll(): IResourceSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Get all field schemas for a resource.
   *
   * @param resource - Resource name
   * @returns Field schemas or empty array
   */
  public getFields(resource: string): IFieldSchema[] {
    return this.schemas.get(resource)?.fields ?? [];
  }

  /**
   * Get all relation schemas for a resource.
   *
   * @param resource - Resource name
   * @returns Relation schemas or empty array
   */
  public getRelations(resource: string): IRelationSchema[] {
    return this.schemas.get(resource)?.relations ?? [];
  }

  /**
   * Get the JSON Schema (validation) for a resource.
   *
   * @param resource - Resource name
   * @returns JSON Schema object or undefined
   */
  public getValidationSchema(resource: string): Record<string, unknown> | undefined {
    return this.schemas.get(resource)?.validation;
  }

  /**
   * Check if a resource is registered.
   *
   * @param resource - Resource name
   * @returns True if registered
   */
  public has(resource: string): boolean {
    return this.schemas.has(resource);
  }

  /**
   * Get the total count of registered schemas.
   *
   * @returns Schema count
   */
  public count(): number {
    return this.schemas.size;
  }
}
