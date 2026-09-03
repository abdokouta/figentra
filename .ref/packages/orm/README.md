# @stackra/nestjs-orm

NestJS ORM infrastructure module — entity decorators, auto-generated services,
resolvers, controllers, and MikroORM integration.

## Installation

```bash
yarn add @stackra/nestjs-orm
```

### Peer Dependencies

```bash
# Required
yarn add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql @nestjs/common @nestjs/core reflect-metadata

# Optional (for GraphQL subpath)
yarn add @nestjs/graphql graphql graphql-scalars
```

---

## Subpath Exports

This package provides three entry points — import only what you need:

| Subpath                       | Purpose                              | Required Peers                          |
| ----------------------------- | ------------------------------------ | --------------------------------------- |
| `@stackra/nestjs-orm`         | Core: entities, services, module, DB | `@mikro-orm/*`, `@nestjs/common`        |
| `@stackra/nestjs-orm/graphql` | GraphQL: resolvers, types, filters   | `@nestjs/graphql`, `graphql`            |
| `@stackra/nestjs-orm/http`    | HTTP/REST: controllers, pagination   | `@nestjs/common` (no extra deps needed) |

### Core (`@stackra/nestjs-orm`)

Everything needed for the data layer — entity definition, service generation,
module registration, schema generation, and database connection.

```typescript
import {
  Entity,
  Property,
  Timestamps,
  SoftDeletes,
  BaseEntity,
  defineService,
  OrmModule,
} from '@stackra/nestjs-orm';

@Entity({ tableName: 'products' })
@Timestamps()
@SoftDeletes()
class Product extends BaseEntity {
  @Property() name!: string;
  @Property({ type: 'decimal', precision: 10, scale: 2 }) price!: number;
}
```

### GraphQL (`@stackra/nestjs-orm/graphql`)

Resolver generation, filter input types, pagination types (Relay connections),
and DTO auto-generation for GraphQL schemas.

```typescript
import {
  defineResolver,
  generateDtos,
  StringFilter,
  NumberFilter,
  createConnectionType,
  GQL_ARG,
} from '@stackra/nestjs-orm/graphql';

// Auto-generate a full CRUD resolver
const BaseResolver = defineResolver({
  entity: Product,
  create: CreateProductInput,
  update: UpdateProductInput,
  filter: ProductFilter,
  sort: ProductSort,
  name: 'product',
});

// Or auto-generate DTOs from entity metadata
const { CreateInput, UpdateInput, FilterInput, SortInput } =
  generateDtos(Product);
```

### HTTP (`@stackra/nestjs-orm/http`)

REST controller generation, response formatting, and query parameter parsing for
pagination, filtering, and sorting.

```typescript
import {
  defineController,
  parsePaginationQuery,
  parseSortQuery,
  parseFilterQuery,
  formatPaginatedResponse,
  ApiPaginated,
  ApiFilterable,
  ApiSortable,
} from '@stackra/nestjs-orm/http';

// Auto-generate a full CRUD REST controller
const BaseController = defineController({
  entity: Product,
  path: 'products',
  dto: { create: CreateProductDto, update: UpdateProductDto },
  actions: { forceDelete: true },
});

@Controller('products')
class ProductController extends BaseController {
  constructor(productService: ProductService) {
    super();
    this.service = productService;
  }
}
```

---

## Quick Start

### 1. Define an entity

```typescript
import {
  Entity,
  Property,
  Timestamps,
  SoftDeletes,
  BaseEntity,
} from '@stackra/nestjs-orm';

@Entity({ tableName: 'products' })
@Timestamps()
@SoftDeletes()
export class Product extends BaseEntity {
  @Property() name!: string;
  @Property({ type: 'text', nullable: true }) description?: string;
  @Property({ type: 'decimal', precision: 10, scale: 2 }) price!: number;
  @Property({ type: 'boolean', default: true }) isActive!: boolean;
}
```

### 2. Register in a module

```typescript
import { Module } from '@nestjs/common';
import { OrmModule } from '@stackra/nestjs-orm';

@Module({
  imports: [
    OrmModule.forFeature([
      {
        entity: Product,
        dto: { create: CreateProductInput, update: UpdateProductInput },
        // Auto-generates: service + GraphQL resolver
        // Add controller for REST:
        controller: { path: 'products' },
      },
    ]),
  ],
})
export class ProductModule {}
```

### 3. Root module setup

```typescript
import { Module } from '@nestjs/common';
import { OrmModule } from '@stackra/nestjs-orm';

@Module({
  imports: [
    OrmModule.forRoot({
      entities: [Product],
      connections: {
        default: {
          dbName: 'my_app',
          host: 'localhost',
          port: 5432,
          user: 'postgres',
          password: 'postgres',
        },
      },
    }),
    ProductModule,
  ],
})
export class AppModule {}
```

---

## Controller Registration Options

The `controller` field in `EntityRegistration` accepts three shapes:

```typescript
// 1. Boolean — auto-generate with pluralized entity name as path
{ entity: Product, controller: true }
// → generates endpoints at /products

// 2. Options object — custom path and action control
{ entity: Product, controller: { path: 'admin/products', actions: { forceDelete: true } } }

// 3. Custom class — use your own controller
{ entity: Product, controller: ProductController }
```

### Available Actions

| Action        | HTTP Method & Path  | Default |
| ------------- | ------------------- | ------- |
| `list`        | `GET /`             | ✅      |
| `show`        | `GET /:id`          | ✅      |
| `create`      | `POST /`            | ✅      |
| `update`      | `PUT /:id`          | ✅      |
| `delete`      | `DELETE /:id`       | ✅      |
| `restore`     | `POST /:id/restore` | ✅      |
| `forceDelete` | `DELETE /:id/force` | ❌      |

---

## HTTP Query Parameters

The generated controllers accept standard REST query parameters:

```
GET /products?page=2&limit=25&sort=-price,name&filter={"isActive":true}
```

| Parameter | Format                                     | Example               |
| --------- | ------------------------------------------ | --------------------- |
| `page`    | Integer (1-indexed)                        | `page=3`              |
| `limit`   | Integer (1-100, default 20)                | `limit=50`            |
| `sort`    | Comma-separated, `-` prefix for descending | `sort=-createdAt`     |
| `filter`  | JSON string or nested object               | `filter={"name":"x"}` |

---

## License

MIT © Stackra L.L.C
