# @stackra/nestjs-swagger

Production-ready Swagger/OpenAPI documentation module for NestJS with
authentication schemes, theming, branding, and a standardized response envelope
interceptor.

## Installation

```bash
yarn add @stackra/nestjs-swagger

# Required peers
yarn add @nestjs/swagger

# Optional (for UI themes)
yarn add swagger-themes
```

---

## Quick Start

### 1. Register the module

```typescript
// app.module.ts
import { NestSwaggerModule } from '@stackra/nestjs-swagger';

@Module({
  imports: [
    NestSwaggerModule.forRoot({
      title: 'My API',
      description: 'API documentation',
      version: '1.0.0',
      apiPath: 'api/docs',
      enabled: process.env.NODE_ENV !== 'production',
      serverUrl: process.env.API_URL || 'http://localhost:3000',
      security: {
        jwt: {
          enabled: true,
          name: 'JWT-auth',
          description: 'JWT Bearer token',
        },
        apiKey: {
          enabled: true,
          name: 'api-key',
          headerName: 'X-API-KEY',
          description: 'API Key',
        },
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Mount in main.ts

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerSetupService } from '@stackra/nestjs-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swagger = app.get(SwaggerSetupService);
  swagger.setup(app);

  await app.listen(3000);
}
```

### 3. Access documentation

Open `http://localhost:3000/api/docs` in your browser.

---

## Async Configuration

```typescript
NestSwaggerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    title: config.get('SWAGGER_TITLE'),
    description: config.get('SWAGGER_DESCRIPTION'),
    version: config.get('API_VERSION'),
    apiPath: 'api/docs',
    enabled: config.get('SWAGGER_ENABLED') === 'true',
    serverUrl: config.get('API_URL'),
    security: {
      jwt: { enabled: true, name: 'JWT-auth', description: 'JWT' },
      apiKey: {
        enabled: false,
        name: 'api-key',
        headerName: 'X-API-KEY',
        description: '',
      },
    },
  }),
});
```

---

## Response Envelope Interceptor

Apply globally for consistent response formatting:

```typescript
// main.ts
import { ApiResponseInterceptor } from '@stackra/nestjs-swagger';

app.useGlobalInterceptors(new ApiResponseInterceptor());
```

All responses are wrapped:

```json
{
  "data": { "id": "abc", "name": "Widget" },
  "statusCode": 200,
  "timestamp": "2026-06-05T12:00:00.000Z",
  "path": "/api/products/abc"
}
```

Paginated responses (objects with `data` + `meta`) are preserved:

```json
{
  "data": [...],
  "meta": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 },
  "links": { "self": "?page=1", "next": "?page=2" },
  "statusCode": 200,
  "timestamp": "...",
  "path": "/api/products"
}
```

---

## Integration with `@stackra/nestjs-orm`

Generated controllers from `defineController()` auto-apply Swagger decorators
when `@nestjs/swagger` is installed:

```typescript
import { OrmModule } from '@stackra/nestjs-orm';

OrmModule.forFeature([
  {
    entity: Product,
    dto: { create: CreateProductDto, update: UpdateProductDto },
    controller: { path: 'products' },
  },
]);
```

This auto-generates:

- `@ApiTags('Product')` on the controller
- `@ApiOperation()` with summary + operationId per endpoint
- `@ApiOkResponse()` / `@ApiCreatedResponse()` / `@ApiNotFoundResponse()`
- `@ApiParam({ name: 'id' })` on `:id` routes
- `@ApiQuery()` for pagination/sort/filter on list endpoint
- `@UsePipes(ValidationPipe)` on create/update when DTOs are provided

---

## Configuration Reference

| Property            | Type              | Default  | Description          |
| ------------------- | ----------------- | -------- | -------------------- |
| `title`             | string            | —        | API title            |
| `description`       | string            | —        | Markdown description |
| `version`           | string            | —        | Semver version       |
| `apiPath`           | string            | —        | UI mount path        |
| `enabled`           | boolean           | —        | Enable/disable       |
| `serverUrl`         | string            | —        | Primary server URL   |
| `additionalServers` | ISwaggerServer[]  | `[]`     | Extra environments   |
| `security`          | ISwaggerSecurity  | —        | Auth scheme config   |
| `tags`              | ISwaggerTag[]     | `[]`     | API grouping         |
| `ui`                | ISwaggerUIOptions | defaults | UI behavior          |
| `branding`          | ISwaggerBranding  | —        | Theme/logo/CSS       |

---

## Security Schemes

```typescript
security: {
  jwt: { enabled: true, name: 'JWT-auth', description: 'Bearer token' },
  apiKey: { enabled: true, name: 'api-key', headerName: 'X-API-KEY', description: 'Machine key' },
  oauth2: {
    enabled: true,
    name: 'oauth2',
    description: 'OAuth2 flow',
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    scopes: { 'read:users': 'Read users', 'write:users': 'Modify users' },
  },
}
```

---

## Re-exported Decorators

All `@nestjs/swagger` decorators are re-exported for single-import convenience:

```typescript
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@stackra/nestjs-swagger';
```

---

## License

MIT © Stackra L.L.C
