/**
 * Test suite for DeleteFailedException class.
 *
 * @module __tests__/exceptions/delete-failed.exception.spec
 */

import { DeleteFailedException } from '@exceptions/delete-failed.exception';
import { StorageException } from '@exceptions/storage.exception';

describe('DeleteFailedException', () => {
  describe('constructor', () => {
    it('should create exception with path and error', () => {
      const path = 'files/file.pdf';
      const originalError = new Error('Permission denied');
      const exception = DeleteFailedException.make(path, originalError);

      expect(exception).toBeInstanceOf(StorageException);
      expect(exception).toBeInstanceOf(DeleteFailedException);
      expect(exception.message).toContain(path);
      expect(exception.message).toContain('Permission denied');
      expect(exception.name).toBe('DeleteFailedException');
    });
  });

  describe('error handling', () => {
    it('should be throwable and catchable', () => {
      const path = 'file.txt';
      const error = new Error('Test error');

      expect(() => {
        throw DeleteFailedException.make(path, error);
      }).toThrow(DeleteFailedException);
    });
  });
});
