/**
 * Enum representing Access Control List (ACL) permissions for storage objects.
 *
 * This enum defines the various ACL settings that can be applied to objects
 * in S3-compatible storage systems. ACLs control who can access objects and
 * what operations they can perform.
 *
 * @enum {string}
 *
 * @example
 * ```typescript
 * import { StorageACL } from '@nestjs-storage/core';
 *
 * await storage.upload('file.pdf', buffer, {
 *   acl: StorageACL.PUBLIC_READ
 * });
 * ```
 */
export enum StorageACL {
  /**
   * Private ACL - only the owner has access.
   *
   * The object owner gets full control. No one else has access rights.
   * This is the default ACL for most storage systems.
   */
  PRIVATE = 'private',

  /**
   * Public read ACL - anyone can read the object.
   *
   * The owner gets full control. All users (authenticated and anonymous)
   * have read access to the object and its metadata.
   */
  PUBLIC_READ = 'public-read',

  /**
   * Public read-write ACL - anyone can read or write the object.
   *
   * The owner gets full control. All users have read and write access.
   * Not recommended for most use cases due to security concerns.
   */
  PUBLIC_READ_WRITE = 'public-read-write',

  /**
   * Authenticated read ACL - authenticated users can read.
   *
   * The owner gets full control. All authenticated AWS users have
   * read access to the object.
   */
  AUTHENTICATED_READ = 'authenticated-read',

  /**
   * Bucket owner read ACL - bucket owner can read.
   *
   * The object owner gets full control. The bucket owner gets read access.
   * Useful when uploading objects to buckets owned by other accounts.
   */
  BUCKET_OWNER_READ = 'bucket-owner-read',

  /**
   * Bucket owner full control ACL - bucket owner has full control.
   *
   * Both the object owner and bucket owner get full control over the object.
   * Useful for cross-account scenarios where the bucket owner needs control.
   */
  BUCKET_OWNER_FULL_CONTROL = 'bucket-owner-full-control',
}
