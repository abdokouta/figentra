/**
 * @file cache-forget.command.ts
 * @module @stackra/cache/commands
 * @description Remove a specific key from the cache.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@stackra/contracts';
import type { ICacheManager } from '@stackra/contracts';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'cache:forget',
  description: 'Remove a specific key from the cache',
  arguments: [{ name: 'key', description: 'Cache key to remove', required: true }],
  options: [{ name: '--store', short: '-s', description: 'Store name', type: 'string' }],
})
export class CacheForgetCommand extends BaseCommand {
  public constructor(@Optional() @Inject(CACHE_MANAGER) private readonly cache?: ICacheManager) {
    super();
  }

  public async handle(): Promise<number> {
    const key = this.argument<string>('key');
    const store = this.option<string>('store');
    const out = this.output as any;

    if (!this.cache) {
      this.output.error('CacheManager is not available.');
      return 1;
    }

    const spinner = this.output.spinner();
    spinner.start(`Removing key "${key}"...`);

    try {
      const target = store ? this.cache.store(store) : this.cache;
      const existed = await target.forget(key);

      spinner.stop('Done', 0);

      if (existed) {
        this.output.success(`Key "${key}" removed from cache.`);
      } else {
        this.output.info(`Key "${key}" was not found in cache.`);
      }

      return 0;
    } catch (error: Error | any) {
      spinner.stop('Failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
