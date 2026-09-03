# Mapped Types

[![npm version](https://img.shields.io/npm/v/@pixielity/mapped-types.svg)](https://www.npmjs.com/package/@pixielity/mapped-types)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/pixielity/mapped-types/workflows/CI/badge.svg)](https://github.com/pixielity/mapped-types/actions)
[![Coverage Status](https://coveralls.io/repos/github/pixielity/mapped-types/badge.svg?branch=main)](https://coveralls.io/github/pixielity/mapped-types?branch=main)

A utility library for creating mapped types in TypeScript with support for
class-validator and class-transformer metadata inheritance.

## Installation

```bash
npm install @pixielity/mapped-types
```

For validation and transformation features, install the optional peer
dependencies:

```bash
npm install class-validator class-transformer reflect-metadata
```

## Features

- Create new types by picking, omitting, or making properties optional
- Create intersection types from multiple classes
- Inherit validation metadata from class-validator
- Inherit transformation metadata from class-transformer
- Inherit property initializers from source classes
- Zero dependencies (class-validator and class-transformer are optional)

## Usage

### PickType

Creates a new type by picking a set of properties from an existing class.

```typescript
import { PickType } from "@pixielity/mapped-types";
import { IsString, IsEmail } from "class-validator";

class UserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// CreateUserDto will have name, email, and password properties
// with the same validation rules as UserDto
class CreateUserDto extends PickType(UserDto, ["name", "email", "password"]) {}
```

### OmitType

Creates a new type by omitting a set of properties from an existing class.

```typescript
import { OmitType } from "@pixielity/mapped-types";
import { IsString, IsEmail } from "class-validator";

class UserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// UserResponseDto will have name and email properties, but not password
// with the same validation rules as UserDto
class UserResponseDto extends OmitType(UserDto, ["password"]) {}
```

### PartialType

Creates a new type by making all properties of an existing class optional.

```typescript
import { PartialType } from "@pixielity/mapped-types";
import { IsString, IsEmail } from "class-validator";

class UserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

// UpdateUserDto will have optional name and email properties
// with the same validation rules as UserDto, but they'll only be
// applied if the properties are defined
class UpdateUserDto extends PartialType(UserDto) {}
```

### IntersectionType

Creates a new type by intersecting multiple existing classes.

```typescript
import { IntersectionType } from "@pixielity/mapped-types";
import { IsString } from "class-validator";

class UserDto {
  @IsString()
  name: string;
}

class AddressDto {
  @IsString()
  street: string;
}

// UserWithAddressDto will have both name and street properties
// with the same validation rules as the original classes
class UserWithAddressDto extends IntersectionType(UserDto, AddressDto) {}
```

## API Reference

For detailed API documentation, please visit our
[API Reference](https://pixielity.github.io/mapped-types/).

### PickType

```typescript
function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
): MappedType<RemoveFieldsWithType<Pick<T, K>, Function>>;
```

### OmitType

```typescript
function OmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
): MappedType<RemoveFieldsWithType<Omit<T, K>, Function>>;
```

### PartialType

```typescript
function PartialType<T>(
  classRef: Type<T>,
  options: {
    skipNullProperties?: boolean;
  } = {},
): MappedType<RemoveFieldsWithType<Partial<T>, Function>>;
```

### IntersectionType

```typescript
function IntersectionType<T extends Type[]>(
  ...classRefs: T
): MappedType<
  RemoveFieldsWithType<
    UnionToIntersection<ClassRefsToConstructors<T>[number]>,
    Function
  >
>;
```

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code
of conduct and the process for submitting pull requests.

## Versioning

We use [SemVer](http://semver.org/) for versioning and
[Changesets](https://github.com/changesets/changesets) to manage releases. For
the versions available, see the
[tags on this repository](https://github.com/pixielity/mapped-types/tags).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
