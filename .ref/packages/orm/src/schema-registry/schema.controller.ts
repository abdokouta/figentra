/**
 * @file schema.controller.ts
 * @module @stackra/nestjs-orm/schema-registry
 * @description REST endpoint exposing resource schemas to the frontend.
 *   The frontend fetches this at bootstrap to drive the data layer.
 */

import { Controller, Get, Param } from '@nestjs/common';
import { SchemaRegistry } from './schema-registry.service';

/**
 * Schema REST controller.
 *
 * Exposes the SchemaRegistry contents via HTTP for frontend consumption.
 * Enabled via `OrmModule.forRoot({ exposeSchema: true })`.
 */
@Controller('schema')
export class SchemaController {
  public constructor(private readonly registry: SchemaRegistry) {}

  /**
   * Get all resource schemas.
   *
   * @returns Array of all registered IResourceSchema
   */
  @Get()
  public listAll() {
    return this.registry.listAll();
  }

  /**
   * Get a single resource schema by name.
   *
   * @param resource - Resource name (e.g., 'orders', 'products')
   * @returns The resource schema or 404
   */
  @Get(':resource')
  public getOne(@Param('resource') resource: string) {
    const schema = this.registry.get(resource);
    if (!schema) {
      return { error: `Resource "${resource}" not found`, statusCode: 404 };
    }
    return schema;
  }
}
