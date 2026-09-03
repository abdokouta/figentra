import { STORAGE_UPLOAD_METADATA } from '@constants/storage-upload-metadata.constant';
import type { IStorageUploadOptions } from '@interfaces/storage-upload-options.interface';

/**
 * Decorator for marking file upload handler methods.
 *
 * This decorator attaches metadata to methods that handle file uploads,
 * allowing for declarative configuration of upload options. It can be
 * used with interceptors or guards to automatically process file uploads.
 *
 * @decorator
 *
 * @param options - Optional upload configuration to apply
 *
 * @example
 * ```typescript
 * @Controller('files')
 * export class FileController {
 *   constructor(
 *     @InjectStorage() private readonly storage: StorageService
 *   ) {}
 *
 *   @Post('upload')
 *   @UploadFile({
 *     visibility: StorageVisibility.PUBLIC,
 *     contentType: 'image/jpeg'
 *   })
 *   async uploadFile(@UploadedFile() file: Express.Multer.File) {
 *     const metadata = Reflect.getMetadata(
 *       STORAGE_UPLOAD_METADATA,
 *       this,
 *       'uploadFile'
 *     );
 *
 *     return await this.storage.upload(
 *       `uploads/${file.originalname}`,
 *       file.buffer,
 *       metadata
 *     );
 *   }
 * }
 * ```
 *
 * @example With custom interceptor
 * ```typescript
 * @Injectable()
 * export class StorageUploadInterceptor implements NestInterceptor {
 *   constructor(private readonly storage: StorageService) {}
 *
 *   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
 *     const handler = context.getHandler();
 *     const metadata = Reflect.getMetadata(
 *       STORAGE_UPLOAD_METADATA,
 *       context.getClass().prototype,
 *       handler.name
 *     );
 *
 *     // Use metadata to configure upload
 *     // ...
 *
 *     return next.handle();
 *   }
 * }
 *
 * @Post('upload')
 * @UseInterceptors(StorageUploadInterceptor)
 * @UploadFile({ visibility: StorageVisibility.PUBLIC })
 * async uploadFile(@UploadedFile() file: Express.Multer.File) {
 *   // File is automatically uploaded with configured options
 * }
 * ```
 */
export function UploadFile(options?: IStorageUploadOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(STORAGE_UPLOAD_METADATA, options || {}, target, propertyKey);
    return descriptor;
  };
}

/**
 * Gets upload metadata from a decorated method.
 *
 * This utility function retrieves the upload options that were attached
 * to a method using the @UploadFile() decorator.
 *
 * @param target - Target class instance or prototype
 * @param propertyKey - Method name
 *
 * @returns Upload options or undefined if not decorated
 *
 * @example
 * ```typescript
 * const metadata = getUploadMetadata(controller, 'uploadFile');
 * if (metadata) {
 *   console.log(`Visibility: ${metadata.visibility}`);
 * }
 * ```
 */
export function getUploadMetadata(
  target: any,
  propertyKey: string | symbol
): IStorageUploadOptions | undefined {
  return Reflect.getMetadata(STORAGE_UPLOAD_METADATA, target, propertyKey);
}
