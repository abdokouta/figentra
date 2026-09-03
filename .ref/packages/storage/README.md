# NestJS Storage

<p align="center">
  <a href="https://www.npmjs.com/package/@nestjs-storage/core"><img src="https://img.shields.io/npm/v/@nestjs-storage/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@nestjs-storage/core"><img src="https://img.shields.io/npm/l/@nestjs-storage/core.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@nestjs-storage/core"><img src="https://img.shields.io/npm/dm/@nestjs-storage/core.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/fulers-technologies/nestjs-storage"><img src="https://img.shields.io/github/stars/fulers-technologies/nestjs-storage.svg?style=social&label=Star" alt="GitHub Stars" /></a>
  <a href="https://github.com/fulers-technologies/nestjs-storage/actions"><img src="https://img.shields.io/github/workflow/status/fulers-technologies/nestjs-storage/CI" alt="Build Status" /></a>
  <a href="https://codecov.io/gh/fulers-technologies/nestjs-storage"><img src="https://img.shields.io/codecov/c/github/fulers-technologies/nestjs-storage.svg" alt="Coverage" /></a>
  <a href="https://github.com/fulers-technologies/nestjs-storage/blob/main/CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/code%20of-conduct-ff69b4.svg" alt="Code of Conduct" /></a>
</p>

## 📦 Description

A comprehensive, production-ready NestJS module for object storage with
pluggable driver support. Provides a unified, type-safe API for multiple storage
backends including AWS S3, MinIO, and more.

## ✨ Features

- 🔌 **Pluggable Architecture** - Support for multiple storage drivers (S3,
  MinIO)
- 🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🏗️ **NestJS Native** - Built specifically for NestJS with proper DI
  integration
- 🔧 **Flexible Configuration** - Sync and async configuration with
  ConfigService support
- 📝 **Comprehensive Documentation** - Detailed JSDoc comments on every method
  and interface
- 🎨 **Decorator Support** - `@InjectStorage()` and `@UploadFile()` decorators
- 🌍 **Global Module** - Optional global registration for app-wide availability
- ⚡ **High Performance** - Optimized for production workloads
- 🧪 **Well Tested** - Comprehensive test coverage
- 🔄 **Stream Support** - Efficient handling of large files with streams
- 🔐 **Security** - Built-in file validation and path sanitization
- 📊 **Metadata Management** - Full support for custom metadata
- 🔗 **Presigned URLs** - Generate temporary access URLs
- 👁️ **Visibility Control** - Public/private file access management

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Drivers](#-drivers)
- [API Reference](#-api-reference)
- [Examples](#-examples)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Installation

```bash
# Using npm
npm install @nestjs-storage/core

# Using yarn
yarn add @nestjs-storage/core

# Using pnpm
pnpm add @nestjs-storage/core
```

### Driver Dependencies

Install the peer dependencies for your chosen driver:

**AWS S3:**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**MinIO:**

```bash
npm install minio
```

## ⚡ Quick Start

### 1. Register the Module

```typescript
import { Module } from '@nestjs/common';
import { StorageModule, StorageDriverType } from '@nestjs-storage/core';

@Module({
  imports: [
    StorageModule.register({
      driver: StorageDriverType.S3,
      driverOptions: {
        region: 'us-east-1',
        bucket: 'my-bucket',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Inject and Use

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService, InjectStorage } from '@nestjs-storage/core';

@Injectable()
export class FileService {
  constructor(@InjectStorage() private readonly storage: StorageService) {}

  async uploadFile(file: Express.Multer.File) {
    return await this.storage.upload(
      `uploads/${file.originalname}`,
      file.buffer,
      {
        contentType: file.mimetype,
      }
    );
  }

  async downloadFile(path: string) {
    return await this.storage.download(path);
  }
}
```

## ⚙️ Configuration

### Synchronous Configuration

```typescript
StorageModule.register({
  driver: StorageDriverType.S3,
  driverOptions: {
    region: 'us-east-1',
    bucket: 'my-bucket',
    credentials: {
      accessKeyId: 'your-key',
      secretAccessKey: 'your-secret',
    },
  },
  global: true,
  autoConnect: true,
  defaultVisibility: StorageVisibility.PRIVATE,
});
```

### Asynchronous Configuration with ConfigService

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';
import { storageConfig } from '@nestjs-storage/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [storageConfig],
    }),
    StorageModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('storage'),
    }),
  ],
})
export class AppModule {}
```

### Environment Variables

Create a `.env` file:

```env
STORAGE_DRIVER=s3
STORAGE_AUTO_CONNECT=true
STORAGE_DEFAULT_VISIBILITY=private

S3_REGION=us-east-1
S3_BUCKET=my-bucket
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

## 💡 Usage

### Upload Files

```typescript
// Upload from buffer
const file = await storage.upload('documents/report.pdf', buffer, {
  contentType: 'application/pdf',
  visibility: StorageVisibility.PUBLIC,
});

// Upload from stream
const stream = fs.createReadStream('large-file.zip');
await storage.upload('backups/large-file.zip', stream);

// Upload multiple files
const files = await storage.uploadMultiple([
  { path: 'images/photo1.jpg', content: buffer1 },
  { path: 'images/photo2.jpg', content: buffer2 },
]);
```

### Download Files

```typescript
// Download as buffer
const buffer = await storage.download('documents/report.pdf');

// Download as stream (for large files)
const stream = await storage.downloadStream('videos/large-video.mp4');
stream.pipe(response);

// Download with range (partial content)
const buffer = await storage.download('file.bin', {
  range: { start: 0, end: 1024 },
});
```

### File Operations

```typescript
// Check if file exists
const exists = await storage.exists('documents/report.pdf');

// Delete file
await storage.delete('old-file.pdf');

// Delete multiple files
await storage.deleteMultiple(['file1.pdf', 'file2.pdf', 'file3.pdf']);

// Copy file
await storage.copy('original.pdf', 'backup/original-copy.pdf');

// Move file
await storage.move('temp/file.pdf', 'permanent/file.pdf');
```

### Metadata Management

```typescript
// Get metadata
const metadata = await storage.getMetadata('document.pdf');
console.log(metadata.contentType);
console.log(metadata.customMetadata);

// Set metadata
await storage.setMetadata('document.pdf', {
  cacheControl: 'max-age=31536000',
  customMetadata: {
    department: 'sales',
    uploadedBy: 'user123',
  },
});
```

### List Files

```typescript
// List all files in a directory
const files = await storage.list('uploads/');

// List with options
const files = await storage.list('uploads/', {
  maxResults: 100,
  recursive: true,
});

// Iterate through files
files.forEach((file) => {
  console.log(`${file.name}: ${file.size} bytes`);
});
```

### URLs and Access Control

```typescript
// Get public URL
const url = storage.getUrl('public/image.jpg');

// Generate presigned URL (temporary access)
const presignedUrl = await storage.getPresignedUrl('private/document.pdf', {
  expiresIn: 3600, // 1 hour
  responseHeaders: {
    'Content-Disposition': 'attachment; filename="document.pdf"',
  },
});

// Set visibility
await storage.setVisibility('document.pdf', StorageVisibility.PUBLIC);

// Get visibility
const visibility = await storage.getVisibility('document.pdf');
```

### Using Decorators

```typescript
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFile, StorageVisibility } from '@nestjs-storage/core';

@Controller('files')
export class FileController {
  constructor(@InjectStorage() private readonly storage: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @UploadFile({
    visibility: StorageVisibility.PUBLIC,
    contentType: 'image/jpeg',
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return await this.storage.upload(
      `uploads/${file.originalname}`,
      file.buffer
    );
  }
}
```

## 🔌 Drivers

### AWS S3

```typescript
StorageModule.register({
  driver: StorageDriverType.S3,
  driverOptions: {
    region: 'us-east-1',
    bucket: 'my-bucket',
    credentials: {
      accessKeyId: 'key',
      secretAccessKey: 'secret',
    },
    endpoint: 'https://s3.custom-endpoint.com', // Optional
    forcePathStyle: false, // Optional
    useSSL: true, // Optional
  },
});
```

### MinIO

```typescript
StorageModule.register({
  driver: StorageDriverType.MINIO,
  driverOptions: {
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    bucket: 'my-bucket',
  },
});
```

### Custom Driver

```typescript
import { IStorageDriver } from '@nestjs-storage/core';

class CustomStorageDriver implements IStorageDriver {
  // Implement all required methods
}

// Register custom driver
const factory = app.get(StorageFactoryService);
factory.registerDriver('custom', CustomStorageDriver);
```

## 📚 API Reference

### StorageService

Main service for storage operations.

#### Methods

- `upload(path, content, options?)` - Upload a file
- `uploadMultiple(files, options?)` - Upload multiple files
- `download(path, options?)` - Download file as buffer
- `downloadStream(path, options?)` - Download file as stream
- `exists(path)` - Check if file exists
- `delete(path)` - Delete a file
- `deleteMultiple(paths)` - Delete multiple files
- `copy(source, destination)` - Copy a file
- `move(source, destination)` - Move a file
- `getMetadata(path)` - Get file metadata
- `setMetadata(path, metadata)` - Set file metadata
- `list(prefix?, options?)` - List files
- `getUrl(path)` - Get public URL
- `getPresignedUrl(path, options?)` - Generate presigned URL
- `setVisibility(path, visibility)` - Set file visibility
- `getVisibility(path)` - Get file visibility

### Utilities

- `MimeTypeUtil` - MIME type detection and validation
- `PathNormalizerUtil` - Path normalization and security
- `FileValidatorUtil` - File validation helpers

## 📖 Examples

Complete examples are available in the `__examples__` directory:

- [S3 Example](./__examples__/s3/main.ts)
- [MinIO Example](./__examples__/minio/main.ts)
- [Config Example](./__examples__/config-example/main.ts)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## 🤝 Contributing

Contributions are welcome! Please read our
[Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE)
file for details.

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Inspired by Laravel's Filesystem abstraction
- Thanks to all contributors

## 📞 Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our community](https://discord.gg/example)
- 🐛 Issues:
  [GitHub Issues](https://github.com/fulers-technologies/nestjs-storage/issues)

---

<p align="center">Made with ❤️ by the NestJS community</p>
