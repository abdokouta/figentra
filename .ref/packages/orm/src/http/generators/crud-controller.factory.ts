/**
 * @file crud-controller.factory.ts
 * @module @stackra/nestjs-orm/http/generators
 * @description Factory that generates a full CRUD REST controller.
 *   Auto-generates GET, POST, PUT, DELETE endpoints with pagination,
 *   filtering, sorting, validation pipes, and proper HTTP status codes.
 *
 *   When `@nestjs/swagger` is available, auto-applies API documentation
 *   decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`).
 *
 *   ## Usage
 *
 *   ```typescript
 *   import { defineController } from '@stackra/nestjs-orm/http';
 *
 *   const BaseController = defineController({
 *     entity: Product,
 *     path: 'products',
 *     dto: { create: CreateProductDto, update: UpdateProductDto },
 *   });
 *
 *   @Controller('products')
 *   export class ProductController extends BaseController {
 *     constructor(service: ProductService) {
 *       super();
 *       this.service = service;
 *     }
 *   }
 *   ```
 */

import {
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UsePipes,
  ValidationPipe,
  type IType,
} from '@nestjs/common';
import type { ICrudService } from '../../interfaces';
import { formatPaginatedResponse } from '../utils/format-paginated-response.util';
import { formatEntityResponse } from '../utils/format-entity-response.util';
import { parsePaginationQuery } from '../utils/parse-pagination-query.util';
import { parseSortQuery } from '../utils/parse-sort-query.util';

// ============================================================================
// Swagger Detection (conditional)
// ============================================================================

let _swaggerAvailable: boolean | null = null;

function isSwaggerAvailable(): boolean {
  if (_swaggerAvailable === null) {
    try {
      require.resolve('@nestjs/swagger');
      _swaggerAvailable = true;
    } catch {
      _swaggerAvailable = false;
    }
  }
  return _swaggerAvailable;
}

/**
 * Conditionally apply Swagger decorators to the controller class and methods.
 * No-op when `@nestjs/swagger` is not installed.
 */
function applySwaggerDecorators(
  ControllerClass: any,
  entityName: string,
  resourceName: string,
  actions: Required<ControllerActions>
): void {
  if (!isSwaggerAvailable()) return;

  const {
    ApiTags,
    ApiOperation,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiNoContentResponse,
    ApiParam,
    ApiQuery: SwaggerApiQuery,
  } = require('@nestjs/swagger');

  // Apply @ApiTags to the class
  ApiTags(resourceName)(ControllerClass);

  const proto = ControllerClass.prototype;

  // List
  if (actions.list) {
    ApiOperation({ summary: `List all ${resourceName}s`, operationId: `list${entityName}s` })(
      proto,
      'list',
      Object.getOwnPropertyDescriptor(proto, 'list')!
    );
    ApiOkResponse({ description: `Paginated list of ${resourceName}s` })(
      proto,
      'list',
      Object.getOwnPropertyDescriptor(proto, 'list')!
    );
    SwaggerApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (1-indexed)',
    })(proto, 'list', Object.getOwnPropertyDescriptor(proto, 'list')!);
    SwaggerApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (1-100)',
    })(proto, 'list', Object.getOwnPropertyDescriptor(proto, 'list')!);
    SwaggerApiQuery({
      name: 'sort',
      required: false,
      type: String,
      description: 'Sort fields (-field for desc)',
    })(proto, 'list', Object.getOwnPropertyDescriptor(proto, 'list')!);
  }

  // Show
  if (actions.show) {
    ApiOperation({ summary: `Get ${resourceName} by ID`, operationId: `get${entityName}` })(
      proto,
      'show',
      Object.getOwnPropertyDescriptor(proto, 'show')!
    );
    ApiOkResponse({ description: `The ${resourceName} record` })(
      proto,
      'show',
      Object.getOwnPropertyDescriptor(proto, 'show')!
    );
    ApiNotFoundResponse({ description: `${resourceName} not found` })(
      proto,
      'show',
      Object.getOwnPropertyDescriptor(proto, 'show')!
    );
    ApiParam({ name: 'id', type: String, description: `${resourceName} UUID` })(
      proto,
      'show',
      Object.getOwnPropertyDescriptor(proto, 'show')!
    );
  }

  // Create
  if (actions.create) {
    ApiOperation({ summary: `Create ${resourceName}`, operationId: `create${entityName}` })(
      proto,
      'create',
      Object.getOwnPropertyDescriptor(proto, 'create')!
    );
    ApiCreatedResponse({ description: `${resourceName} created successfully` })(
      proto,
      'create',
      Object.getOwnPropertyDescriptor(proto, 'create')!
    );
  }

  // Update
  if (actions.update) {
    ApiOperation({ summary: `Update ${resourceName}`, operationId: `update${entityName}` })(
      proto,
      'update',
      Object.getOwnPropertyDescriptor(proto, 'update')!
    );
    ApiOkResponse({ description: `${resourceName} updated successfully` })(
      proto,
      'update',
      Object.getOwnPropertyDescriptor(proto, 'update')!
    );
    ApiNotFoundResponse({ description: `${resourceName} not found` })(
      proto,
      'update',
      Object.getOwnPropertyDescriptor(proto, 'update')!
    );
    ApiParam({ name: 'id', type: String, description: `${resourceName} UUID` })(
      proto,
      'update',
      Object.getOwnPropertyDescriptor(proto, 'update')!
    );
  }

  // Remove (soft delete)
  if (actions.delete) {
    ApiOperation({ summary: `Delete ${resourceName} (soft)`, operationId: `delete${entityName}` })(
      proto,
      'remove',
      Object.getOwnPropertyDescriptor(proto, 'remove')!
    );
    ApiOkResponse({ description: `${resourceName} soft-deleted` })(
      proto,
      'remove',
      Object.getOwnPropertyDescriptor(proto, 'remove')!
    );
    ApiNotFoundResponse({ description: `${resourceName} not found` })(
      proto,
      'remove',
      Object.getOwnPropertyDescriptor(proto, 'remove')!
    );
    ApiParam({ name: 'id', type: String, description: `${resourceName} UUID` })(
      proto,
      'remove',
      Object.getOwnPropertyDescriptor(proto, 'remove')!
    );
  }

  // Restore
  if (actions.restore) {
    ApiOperation({ summary: `Restore ${resourceName}`, operationId: `restore${entityName}` })(
      proto,
      'restore',
      Object.getOwnPropertyDescriptor(proto, 'restore')!
    );
    ApiOkResponse({ description: `${resourceName} restored` })(
      proto,
      'restore',
      Object.getOwnPropertyDescriptor(proto, 'restore')!
    );
    ApiNotFoundResponse({ description: `${resourceName} not found` })(
      proto,
      'restore',
      Object.getOwnPropertyDescriptor(proto, 'restore')!
    );
    ApiParam({ name: 'id', type: String, description: `${resourceName} UUID` })(
      proto,
      'restore',
      Object.getOwnPropertyDescriptor(proto, 'restore')!
    );
  }

  // Force delete
  if (actions.forceDelete) {
    ApiOperation({
      summary: `Permanently delete ${resourceName}`,
      operationId: `forceDelete${entityName}`,
    })(proto, 'forceDelete', Object.getOwnPropertyDescriptor(proto, 'forceDelete')!);
    ApiNoContentResponse({ description: `${resourceName} permanently deleted` })(
      proto,
      'forceDelete',
      Object.getOwnPropertyDescriptor(proto, 'forceDelete')!
    );
    ApiNotFoundResponse({ description: `${resourceName} not found` })(
      proto,
      'forceDelete',
      Object.getOwnPropertyDescriptor(proto, 'forceDelete')!
    );
    ApiParam({ name: 'id', type: String, description: `${resourceName} UUID` })(
      proto,
      'forceDelete',
      Object.getOwnPropertyDescriptor(proto, 'forceDelete')!
    );
  }
}

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Default Actions
// ============================================================================

const DEFAULT_ACTIONS: Required<ControllerActions> = {
  list: true,
  show: true,
  create: true,
  update: true,
  delete: true,
  restore: true,
  forceDelete: false,
};

// ============================================================================
// Validation Pipe (lazy-created to avoid crashing when class-validator not installed)
// ============================================================================

let _validationPipe: any = null;

function getValidationPipe(): any {
  if (!_validationPipe) {
    try {
      // ValidationPipe requires class-validator + class-transformer at runtime
      require.resolve('class-validator');
      _validationPipe = new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      });
    } catch {
      // class-validator not installed — skip validation pipe
      _validationPipe = null;
    }
  }
  return _validationPipe;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Generate a CRUD REST controller class for an entity.
 *
 * Features:
 * - Standard CRUD endpoints (list, show, create, update, delete, restore, forceDelete)
 * - Auto-applied `ValidationPipe` on create/update when DTOs are provided
 * - Auto-applied Swagger decorators when `@nestjs/swagger` is installed
 * - Consistent response formatting
 * - Action toggling (enable/disable individual endpoints)
 *
 * @param options - Controller configuration.
 * @returns An abstract controller class to extend.
 */
export function defineController(options: DefineControllerOptions): IType<any> {
  const { entity, path: _path, dto, resourceName = entity.name } = options;
  const actions = { ...DEFAULT_ACTIONS, ...options.actions };
  const entityName = entity.name;
  const hasCreateDto = !!dto?.create;
  const hasUpdateDto = !!dto?.update;

  abstract class GeneratedCrudController {
    protected service!: ICrudService<any>;

    @Get()
    @HttpCode(HttpStatus.OK)
    public async list(@Query() query: any): Promise<any> {
      if (!actions.list) throw new NotFoundException();
      const pagination = parsePaginationQuery(query);
      const sort = parseSortQuery(query.sort);
      const result = await this.service.paginateLengthAware(
        pagination.page,
        pagination.limit,
        query.filter,
        sort
      );
      return formatPaginatedResponse(result);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    public async show(@Param('id') id: string): Promise<any> {
      if (!actions.show) throw new NotFoundException();
      const found = await this.service.findById(id);
      if (!found) throw new NotFoundException(`${resourceName} not found`);
      return formatEntityResponse(found);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async create(@Body() input: any): Promise<any> {
      if (!actions.create) throw new NotFoundException();
      const created = await this.service.create(input);
      return formatEntityResponse(created, HttpStatus.CREATED);
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    public async update(@Param('id') id: string, @Body() input: any): Promise<any> {
      if (!actions.update) throw new NotFoundException();
      const updated = await this.service.update({ id, ...input });
      return formatEntityResponse(updated);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    public async remove(@Param('id') id: string): Promise<any> {
      if (!actions.delete) throw new NotFoundException();
      const deleted = await this.service.softDelete(id);
      return formatEntityResponse(deleted);
    }

    @Post(':id/restore')
    @HttpCode(HttpStatus.OK)
    public async restore(@Param('id') id: string): Promise<any> {
      if (!actions.restore) throw new NotFoundException();
      const restored = await this.service.restore(id);
      return formatEntityResponse(restored);
    }

    @Delete(':id/force')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async forceDelete(@Param('id') id: string): Promise<void> {
      if (!actions.forceDelete) throw new NotFoundException();
      await this.service.forceDelete(id);
    }
  }

  // ── Apply ValidationPipe on create/update when DTOs are provided ──────────
  const pipe = getValidationPipe();
  if (pipe) {
    if (hasCreateDto) {
      UsePipes(pipe)(
        GeneratedCrudController.prototype,
        'create',
        Object.getOwnPropertyDescriptor(GeneratedCrudController.prototype, 'create')!
      );
    }

    if (hasUpdateDto) {
      UsePipes(pipe)(
        GeneratedCrudController.prototype,
        'update',
        Object.getOwnPropertyDescriptor(GeneratedCrudController.prototype, 'update')!
      );
    }
  }

  // ── Apply Swagger decorators (conditional on @nestjs/swagger availability) ─
  applySwaggerDecorators(GeneratedCrudController, entityName, resourceName, actions);

  return GeneratedCrudController as any;
}
