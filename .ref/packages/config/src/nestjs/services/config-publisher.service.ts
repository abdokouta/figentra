/**
 * @file config-publisher.service.ts
 * @module @stackra/config/nestjs/services
 * @description Config publisher — copies package default configs to the
 *   application's config/ directory (Laravel vendor:publish pattern).
 */

import { IInjectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Config publisher service.
 *
 * Copies default configuration files from installed packages to the
 * application's `config/` directory, allowing developers to customize
 * package defaults without modifying node_modules.
 *
 * Follows the Laravel `vendor:publish` pattern.
 *
 * @example
 * ```typescript
 * const publisher = app.get(ConfigPublisher);
 * await publisher.publish('@stackra/nestjs-orm', { force: false });
 * ```
 */
@IInjectable()
export class ConfigPublisher {
  /** Base directory for published configs (relative to cwd). */
  private readonly configDir: string;

  public constructor() {
    this.configDir = path.resolve(process.cwd(), 'config');
  }

  /**
   * Publish a package's default config to the app's config directory.
   *
   * @param packageName - The package to publish config from
   * @param options - Publishing options
   * @returns Array of published file paths
   */
  public async publish(packageName: string, options: { force?: boolean } = {}): Promise<string[]> {
    const published: string[] = [];
    const sourceDir = this.resolvePackageConfigDir(packageName);

    if (!sourceDir || !fs.existsSync(sourceDir)) {
      return published;
    }

    // Ensure target config/ directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir);

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(this.configDir, file);

      // Skip if target exists and force is not set
      if (fs.existsSync(targetPath) && !options.force) {
        continue;
      }

      fs.copyFileSync(sourcePath, targetPath);
      published.push(targetPath);
    }

    return published;
  }

  /**
   * List all publishable config files from a package.
   *
   * @param packageName - The package to inspect
   * @returns Array of file names available for publishing
   */
  public listPublishable(packageName: string): string[] {
    const sourceDir = this.resolvePackageConfigDir(packageName);
    if (!sourceDir || !fs.existsSync(sourceDir)) {
      return [];
    }
    return fs
      .readdirSync(sourceDir)
      .filter((f) => f.endsWith('.config.ts') || f.endsWith('.config.js'));
  }

  /**
   * Check if a config has already been published.
   *
   * @param fileName - The config file name
   * @returns True if the file exists in the app's config directory
   */
  public isPublished(fileName: string): boolean {
    return fs.existsSync(path.join(this.configDir, fileName));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Resolve the config directory for a given package.
   */
  private resolvePackageConfigDir(packageName: string): string | null {
    try {
      const packageJsonPath = require.resolve(`${packageName}/package.json`);
      const packageDir = path.dirname(packageJsonPath);
      const configDir = path.join(packageDir, 'config');
      return fs.existsSync(configDir) ? configDir : null;
    } catch {
      return null;
    }
  }
}
