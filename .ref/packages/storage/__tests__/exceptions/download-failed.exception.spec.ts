/**
 * Test suite for DownloadFailedException class.
 *
 * This test suite verifies the DownloadFailedException class behavior,
 * following the same patterns as UploadFailedException.
 *
 * Coverage:
 * - Constructor with path and error
 * - Error message formatting
 * - Exception throwing and catching
 * - Inheritance from StorageException
 *
 * @module __tests__/exceptions/download-failed.exception.spec
 */

import { DownloadFailedException } from '@exceptions/download-failed.exception';
import { StorageException } from '@exceptions/storage.exception';

describe('DownloadFailedException', () => {
  describe('constructor', () => {
    it('should create exception with path and error', () => {
      const path = 'downloads/file.pdf';
      const originalError = new Error('Network error');
      const exception = DownloadFailedException.make(path, originalError);

      expect(exception).toBeInstanceOf(StorageException);
      expect(exception).toBeInstanceOf(DownloadFailedException);
      expect(exception.message).toContain(path);
      expect(exception.message).toContain('Network error');
      expect(exception.name).toBe('DownloadFailedException');
    });

    it('should handle error without message', () => {
      const path = 'test.txt';
      const originalError = new Error();
      const exception = DownloadFailedException.make(path, originalError);

      expect(exception.message).toContain(path);
    });
  });

  describe('error handling', () => {
    it('should be throwable and catchable', () => {
      const path = 'file.txt';
      const error = new Error('Test error');

      expect(() => {
        throw DownloadFailedException.make(path, error);
      }).toThrow(DownloadFailedException);
    });

    it('should preserve information when caught', () => {
      const path = 'downloads/test.pdf';
      const error = new Error('Connection timeout');

      try {
        throw DownloadFailedException.make(path, error);
      } catch (caught) {
        expect(caught).toBeInstanceOf(DownloadFailedException);
        expect(caught.message).toContain(path);
        expect(caught.message).toContain('Connection timeout');
      }
    });
  });
});
