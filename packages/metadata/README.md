# @vivel/metadata

[![npm version](https://img.shields.io/npm/v/@vivel/metadata.svg)](https://www.npmjs.com/package/@vivel/metadata)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/akouta/vivel/workflows/CI/badge.svg)](https://github.com/akouta/vivel/actions)

A lightweight utility library for enhanced metadata operations in TypeScript
with improved reflect-metadata extensions.

## Installation

```bash
npm install @vivel/metadata
```

This package requires reflect-metadata as a peer dependency:

```bash
npm install reflect-metadata
```

## Features

- Enhanced metadata operations beyond basic reflect-metadata
- Get metadata from the entire prototype chain
- Define and update metadata with type safety
- Clear metadata selectively or completely
- Check metadata existence with granular control
- Lightweight with minimal dependencies

## Usage

### Basic Operations

```typescript
import { defineMetadata, getMetadata, hasMetadata } from '@vivel/metadata';
import 'reflect-metadata';

class Example {
  property: string;
}

// Define metadata
defineMetadata('custom:key', 'value', Example, 'property');

// Get metadata
const value = getMetadata('custom:key', Example, 'property');
console.log(value); // 'value'

// Check if metadata exists
if (hasMetadata('custom:key', Example, 'property')) {
  console.log('Metadata exists!');
}
```

### Getting All Metadata

```typescript
import { getAllMetadata } from '@vivel/metadata';

class Parent {
  @Reflect.metadata('parent:key', 'parent-value')
  property: string;
}

class Child extends Parent {
  @Reflect.metadata('child:key', 'child-value')
  property: string;
}

// Get all metadata from prototype chain
const allMetadata = getAllMetadata('property', Child);
console.log(allMetadata); // Contains metadata from both Parent and Child
```

### Updating Metadata

```typescript
import { updateMetadata } from '@vivel/metadata';

// Update existing metadata or create new
updateMetadata('config', { timeout: 5000 }, Example, 'property');
```

### Clearing Metadata

```typescript
import { clearMetadata } from '@vivel/metadata';

// Clear specific metadata
clearMetadata('custom:key', Example, 'property');

// Clear all metadata for a property
clearMetadata(undefined, Example, 'property');
```

## API Reference

### getMetadata

```typescript
function getMetadata<T = any>(
  metadataKey: any,
  target: any,
  propertyKey?: string | symbol
): T | undefined;
```

Gets metadata value for the specified key from target or target's property.

### getAllMetadata

```typescript
function getAllMetadata<T = any>(
  propertyKey: string | symbol,
  target: any
): Map<any, T>;
```

Gets all metadata for a property from the entire prototype chain.

### defineMetadata

```typescript
function defineMetadata(
  metadataKey: any,
  metadataValue: any,
  target: any,
  propertyKey?: string | symbol
): void;
```

Defines metadata for the specified key on target or target's property.

### updateMetadata

```typescript
function updateMetadata<T = any>(
  metadataKey: any,
  metadataValue: T,
  target: any,
  propertyKey?: string | symbol
): void;
```

Updates existing metadata or creates new metadata for the specified key.

### clearMetadata

```typescript
function clearMetadata(
  metadataKey?: any,
  target?: any,
  propertyKey?: string | symbol
): void;
```

Clears metadata. If no parameters provided, clears all metadata.

### hasMetadata

```typescript
function hasMetadata(
  metadataKey: any,
  target: any,
  propertyKey?: string | symbol
): boolean;
```

Checks if metadata exists for the specified key on target or target's property.

### hasOwnMetadata

```typescript
function hasOwnMetadata(
  metadataKey: any,
  target: any,
  propertyKey?: string | symbol
): boolean;
```

Checks if metadata exists directly on target (not inherited from prototype
chain).

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code
of conduct and the process for submitting pull requests.

## Versioning

We use [SemVer](http://semver.org/) for versioning and
[Changesets](https://github.com/changesets/changesets) to manage releases. For
the versions available, see the
[tags on this repository](https://github.com/akouta/vivel/tags).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
