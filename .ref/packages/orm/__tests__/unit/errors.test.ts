/**
 * @file errors.test.ts
 * @description Unit tests for ORM exception classes and wrapFlushError utility.
 */

import { describe, it, expect } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import {
  OrmException,
  UniqueConstraintError,
  ReferenceConstraintError,
  OptimisticLockError,
  DatabaseConnectionError,
  wrapFlushError,
} from '@/errors';

// ============================================================================
// Exception Classes
// ============================================================================

describe('OrmException hierarchy', () => {
  describe('UniqueConstraintError', () => {
    it('should contain correct metadata', () => {
      const error = new UniqueConstraintError('users_email_unique', { email: 'test@test.com' });

      expect(error).toBeInstanceOf(OrmException);
      expect(error.code).toBe('ORM_UNIQUE_CONSTRAINT');
      expect(error.constraintName).toBe('users_email_unique');
      expect(error.fields).toEqual({ email: 'test@test.com' });
      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    });

    it('should support multiple conflicting fields', () => {
      const error = new UniqueConstraintError('users_tenant_email_unique', {
        owner_id: 'abc',
        email: 'test@test.com',
      });

      expect(error.fields).toEqual({ owner_id: 'abc', email: 'test@test.com' });
    });
  });

  describe('ReferenceConstraintError', () => {
    it('should contain correct metadata', () => {
      const error = new ReferenceConstraintError('posts_author_id_fkey', 'posts', 'users');

      expect(error).toBeInstanceOf(OrmException);
      expect(error.code).toBe('ORM_REFERENCE_CONSTRAINT');
      expect(error.constraintName).toBe('posts_author_id_fkey');
      expect(error.referencingTable).toBe('posts');
      expect(error.referencedTable).toBe('users');
      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    });
  });

  describe('OptimisticLockError', () => {
    it('should contain correct metadata', () => {
      const error = new OptimisticLockError('Product', 'abc-123', 3, 5);

      expect(error).toBeInstanceOf(OrmException);
      expect(error.code).toBe('ORM_OPTIMISTIC_LOCK');
      expect(error.entityName).toBe('Product');
      expect(error.entityId).toBe('abc-123');
      expect(error.expectedVersion).toBe(3);
      expect(error.actualVersion).toBe(5);
      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    });
  });

  describe('DatabaseConnectionError', () => {
    it('should contain correct metadata', () => {
      const error = new DatabaseConnectionError('default', 'ECONNREFUSED 127.0.0.1:5432');

      expect(error).toBeInstanceOf(OrmException);
      expect(error.code).toBe('ORM_CONNECTION_FAILED');
      expect(error.connectionName).toBe('default');
      expect(error.cause).toBe('ECONNREFUSED 127.0.0.1:5432');
      expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });
});

// ============================================================================
// wrapFlushError
// ============================================================================

describe('wrapFlushError', () => {
  it('should pass through on success', async () => {
    const result = await wrapFlushError(async () => 'success');
    expect(result).toBe('success');
  });

  it('should map PG 23505 to UniqueConstraintError', async () => {
    const pgError = Object.assign(new Error('duplicate key value'), {
      code: '23505',
      constraint: 'users_email_unique',
      detail: 'Key (email)=(test@test.com) already exists.',
    });

    await expect(
      wrapFlushError(async () => {
        throw pgError;
      })
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  it('should map PG 23503 to ReferenceConstraintError', async () => {
    const pgError = Object.assign(new Error('foreign key violation'), {
      code: '23503',
      constraint: 'posts_author_id_fkey',
      detail: 'Key (author_id)=(nonexistent) is not present on table "users".',
    });

    await expect(
      wrapFlushError(async () => {
        throw pgError;
      })
    ).rejects.toBeInstanceOf(ReferenceConstraintError);
  });

  it('should map MikroORM OptimisticLockError', async () => {
    const ormError = Object.assign(new Error('optimistic lock'), {
      name: 'OptimisticLockError',
      entityName: 'Product',
      entity: { id: 'abc' },
      expectedLockVersion: 2,
      actualLockVersion: 3,
    });

    await expect(
      wrapFlushError(async () => {
        throw ormError;
      })
    ).rejects.toBeInstanceOf(OptimisticLockError);
  });

  it('should map connection errors', async () => {
    const connError = Object.assign(new Error('connection refused'), {
      code: 'ECONNREFUSED',
    });

    await expect(
      wrapFlushError(async () => {
        throw connError;
      })
    ).rejects.toBeInstanceOf(DatabaseConnectionError);
  });

  it('should pass through unmapped errors unchanged', async () => {
    const genericError = new Error('unknown error');

    await expect(
      wrapFlushError(async () => {
        throw genericError;
      })
    ).rejects.toBe(genericError);
  });

  it('should handle nested driverError from MikroORM wrapper', async () => {
    const driverError = Object.assign(new Error('duplicate'), {
      code: '23505',
      constraint: 'idx_unique',
      detail: 'Key (slug)=(hello) already exists.',
    });
    const wrapped = Object.assign(new Error('flush failed'), { driverError });

    await expect(
      wrapFlushError(async () => {
        throw wrapped;
      })
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });
});
