/**
 * @file inject-repository.decorator.ts
 * @description Re-exports MikroORM's InjectRepository for convenience.
 * Users import from @stackra/nestjs-orm instead of @mikro-orm/nestjs directly.
 */

export { InjectRepository } from '@mikro-orm/nestjs';
