import { Inject } from '@nestjs/common';
import { STORAGE_SERVICE } from '@constants/storage-service.constant';

/**
 * Decorator for injecting the StorageService into classes.
 *
 * This decorator provides a convenient way to inject the StorageService
 * without needing to remember the injection token. It's a shorthand for
 * @Inject(STORAGE_SERVICE).
 *
 * @decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class FileService {
 *   constructor(
 *     @InjectStorage() private readonly storage: StorageService
 *   ) {}
 *
 *   async uploadFile(file: Express.Multer.File) {
 *     return await this.storage.upload(
 *       `uploads/${file.originalname}`,
 *       file.buffer
 *     );
 *   }
 * }
 * ```
 */
export const InjectStorage = (): ParameterDecorator => {
  return Inject(STORAGE_SERVICE);
};
