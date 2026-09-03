/**
 * @file resolve-graphql-type.util.ts
 * @description Maps property type definitions to their corresponding GraphQL scalar types.
 */

import { GraphQLScalarType, GraphQLString } from 'graphql';
import { Float, ID, Int } from '@nestjs/graphql';

// Use GraphQLString as fallback for JSON type when graphql-scalars is not available
let GraphQLJSON: GraphQLScalarType;
try {
  GraphQLJSON = require('graphql-scalars').GraphQLJSON;
} catch {
  GraphQLJSON = GraphQLString as any;
}

/**
 * Resolves a property type string or constructor to a GraphQL scalar type.
 * Falls back to String for unknown types.
 *
 * @param type - The type string (e.g., 'string', 'number') or constructor function.
 * @returns The corresponding GraphQL type function or scalar.
 */
export function resolveGraphQLType(type?: string | Function): Function | GraphQLScalarType {
  if (!type) return String;

  if (typeof type === 'function') return type;

  switch (type.toLowerCase()) {
    case 'string':
    case 'text':
      return String;
    case 'number':
    case 'float':
    case 'double':
    case 'decimal':
      return Float;
    case 'int':
    case 'integer':
      return Int;
    case 'boolean':
    case 'bool':
      return Boolean;
    case 'date':
    case 'datetime':
      return Date;
    case 'id':
    case 'uuid':
      return ID;
    case 'json':
    case 'jsonb':
      return GraphQLJSON as any;
    default:
      return String;
  }
}
