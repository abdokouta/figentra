/**
 * @file file.ts
 * @module @stackra/ts-support
 * @description Static file system utility class wrapping Node's `fs` and `path`.
 *   Provides a clean, chainable API for common file operations.
 *   Used internally by @stackra/filesystem's local disk driver.
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

/**
 * File utility — static helper for common filesystem operations.
 *
 * Wraps Node's `fs` and `path` modules into a clean, Laravel-inspired API.
 * All methods are static — no instantiation needed.
 *
 * @example
 * ```typescript
 * import { File } from '@stackra/ts-support';
 *
 * if (File.exists('config/app.ts')) {
 *   const content = await File.get('config/app.ts');
 * }
 *
 * await File.put('output/report.json', JSON.stringify(data));
 * ```
 */
export class File {
  // ══════════════════════════════════════════════════════════════════════════════
  // Read Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Check if a file or directory exists.
   *
   * @param filePath - Path to check
   * @returns True if the path exists on disk
   */
  public static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Get file contents as string (async).
   *
   * @param filePath - Path to the file to read
   * @param encoding - Character encoding to use
   * @returns The file content as a string
   */
  public static async get(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    return fsp.readFile(filePath, { encoding });
  }

  /**
   * Get file contents as string (sync).
   *
   * @param filePath - Path to the file to read
   * @param encoding - Character encoding to use
   * @returns The file content as a string
   */
  public static getSync(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
    return fs.readFileSync(filePath, { encoding });
  }

  /**
   * Get file contents as Buffer.
   *
   * @param filePath - Path to the file to read
   * @returns The raw file content as a Buffer
   */
  public static async getBuffer(filePath: string): Promise<Buffer> {
    return fsp.readFile(filePath);
  }

  /**
   * Get file contents as JSON (parsed).
   *
   * @param filePath - Path to the JSON file
   * @returns The parsed JSON content
   */
  public static async getJson<T = unknown>(filePath: string): Promise<T> {
    const content = await File.get(filePath);
    return JSON.parse(content) as T;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Write Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Write content to a file (creates parent directories if needed).
   *
   * @param filePath - Destination file path
   * @param content - Content to write (string or Buffer)
   */
  public static async put(filePath: string, content: string | Buffer): Promise<void> {
    await File.ensureDirectoryExists(path.dirname(filePath));
    await fsp.writeFile(filePath, content);
  }

  /**
   * Write content to a file (sync, creates parent directories).
   *
   * @param filePath - Destination file path
   * @param content - Content to write (string or Buffer)
   */
  public static putSync(filePath: string, content: string | Buffer): void {
    File.ensureDirectoryExistsSync(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
  }

  /**
   * Append content to a file.
   *
   * @param filePath - Path to the file to append to
   * @param content - Content to append
   */
  public static async append(filePath: string, content: string | Buffer): Promise<void> {
    await fsp.appendFile(filePath, content);
  }

  /**
   * Write JSON to a file (stringified with configurable indent).
   *
   * @param filePath - Destination file path
   * @param data - Data to serialize as JSON
   * @param indent - Number of spaces for indentation
   */
  public static async putJson(filePath: string, data: unknown, indent = 2): Promise<void> {
    await File.put(filePath, JSON.stringify(data, null, indent));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Delete Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Delete a file. Returns true if deleted, false if not found.
   *
   * @param filePath - Path to the file to delete
   * @returns True if the file was deleted, false otherwise
   */
  public static async delete(filePath: string): Promise<boolean> {
    try {
      await fsp.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a file (sync). Returns true if deleted, false if not found.
   *
   * @param filePath - Path to the file to delete
   * @returns True if the file was deleted, false otherwise
   */
  public static deleteSync(filePath: string): boolean {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a directory recursively.
   *
   * @param dirPath - Path to the directory to remove
   * @returns True if the directory was deleted, false otherwise
   */
  public static async deleteDirectory(dirPath: string): Promise<boolean> {
    try {
      await fsp.rm(dirPath, { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Copy / Move
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Copy a file. Creates destination directory if needed.
   *
   * @param src - Source file path
   * @param dest - Destination file path
   */
  public static async copy(src: string, dest: string): Promise<void> {
    await File.ensureDirectoryExists(path.dirname(dest));
    await fsp.copyFile(src, dest);
  }

  /**
   * Move (rename) a file. Creates destination directory if needed.
   *
   * @param src - Source file path
   * @param dest - Destination file path
   */
  public static async move(src: string, dest: string): Promise<void> {
    await File.ensureDirectoryExists(path.dirname(dest));
    await fsp.rename(src, dest);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Metadata
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get file size in bytes. Returns 0 if file doesn't exist.
   *
   * @param filePath - Path to the file
   * @returns File size in bytes, or 0 if not found
   */
  public static async size(filePath: string): Promise<number> {
    try {
      const stat = await fsp.stat(filePath);
      return stat.size;
    } catch {
      return 0;
    }
  }

  /**
   * Get file extension (without dot).
   *
   * @param filePath - Path to extract extension from
   * @returns The file extension without the leading dot
   */
  public static extension(filePath: string): string {
    return path.extname(filePath).slice(1);
  }

  /**
   * Get the filename without extension.
   *
   * @param filePath - Path to extract the name from
   * @returns The filename without its extension
   */
  public static name(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Get the filename with extension.
   *
   * @param filePath - Path to extract the basename from
   * @returns The filename including its extension
   */
  public static basename(filePath: string): string {
    return path.basename(filePath);
  }

  /**
   * Get the directory name.
   *
   * @param filePath - Path to extract the directory from
   * @returns The directory portion of the path
   */
  public static dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Get the last modified time.
   *
   * @param filePath - Path to the file
   * @returns The last modified Date, or null if not found
   */
  public static async lastModified(filePath: string): Promise<Date | null> {
    try {
      const stat = await fsp.stat(filePath);
      return stat.mtime;
    } catch {
      return null;
    }
  }

  /**
   * Get MIME type based on file extension.
   *
   * @param filePath - Path to determine MIME type for
   * @returns The MIME type string, or 'application/octet-stream' for unknown extensions
   */
  public static mimeType(filePath: string): string {
    const ext = File.extension(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      json: 'application/json',
      js: 'application/javascript',
      ts: 'text/typescript',
      html: 'text/html',
      css: 'text/css',
      txt: 'text/plain',
      md: 'text/markdown',
      xml: 'application/xml',
      csv: 'text/csv',
      yaml: 'application/x-yaml',
      yml: 'application/x-yaml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      pdf: 'application/pdf',
      zip: 'application/zip',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      woff2: 'font/woff2',
    };
    return mimeMap[ext] ?? 'application/octet-stream';
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Directory Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Check if path is a directory.
   *
   * @param filePath - Path to check
   * @returns True if the path is a directory
   */
  public static isDirectory(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if path is a file.
   *
   * @param filePath - Path to check
   * @returns True if the path is a regular file
   */
  public static isFile(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Ensure a directory exists (creates recursively if not).
   *
   * @param dirPath - Directory path to ensure exists
   */
  public static async ensureDirectoryExists(dirPath: string): Promise<void> {
    await fsp.mkdir(dirPath, { recursive: true });
  }

  /**
   * Ensure a directory exists (sync).
   *
   * @param dirPath - Directory path to ensure exists
   */
  public static ensureDirectoryExistsSync(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  /**
   * List files in a directory.
   *
   * @param dirPath - Directory to list files from
   * @returns Array of full file paths
   */
  public static async files(dirPath: string): Promise<string[]> {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => path.join(dirPath, e.name));
  }

  /**
   * List directories in a directory.
   *
   * @param dirPath - Directory to list subdirectories from
   * @returns Array of full directory paths
   */
  public static async directories(dirPath: string): Promise<string[]> {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => path.join(dirPath, e.name));
  }

  /**
   * List all files matching a glob pattern (simple extension-based implementation).
   *
   * @param pattern - Glob-like pattern (filters by extension)
   * @param cwd - Working directory to resolve relative patterns
   * @returns Array of matching file paths
   */
  public static async glob(pattern: string, cwd = '.'): Promise<string[]> {
    const ext = path.extname(pattern);
    const dir = path.dirname(pattern) === '.' ? cwd : path.join(cwd, path.dirname(pattern));

    if (!File.exists(dir)) return [];

    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile()).map((e) => path.join(dir, e.name));

    if (ext) {
      return files.filter((f) => path.extname(f) === ext);
    }
    return files;
  }

  /**
   * Check if a file is empty (0 bytes).
   *
   * @param filePath - Path to the file to check
   * @returns True if the file has zero bytes
   */
  public static async isEmpty(filePath: string): Promise<boolean> {
    return (await File.size(filePath)) === 0;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Path Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Join path segments.
   *
   * @param segments - Path segments to join
   * @returns The joined path
   */
  public static join(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Resolve to absolute path.
   *
   * @param segments - Path segments to resolve
   * @returns The resolved absolute path
   */
  public static resolve(...segments: string[]): string {
    return path.resolve(...segments);
  }

  /**
   * Get relative path from one path to another.
   *
   * @param from - Base path
   * @param to - Target path
   * @returns The relative path between the two
   */
  public static relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Normalize a path (resolve . and ..).
   *
   * @param filePath - Path to normalize
   * @returns The normalized path
   */
  public static normalize(filePath: string): string {
    return path.normalize(filePath);
  }
}
