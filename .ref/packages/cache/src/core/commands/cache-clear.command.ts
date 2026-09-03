/**
 * @file cache-clear.command.ts
 * @module @stackra/cache/commands
 * @description Flush all entries from a cache store or all stores.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@stackra/contracts';
import type { ICacheManager } from '@stackra/contracts';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'cache:clear',
  description: 'Flush all entries from a cache store',
  options: [
    {
      name: '--store',
      short: '-s',
      description: 'Store name to clear (default: all)',
      type: 'string',
    },
  ],
})
export class CacheClearCommand extends BaseCommand {
  public constructor(@Optional() @Inject(CACHE_MANAGER) private readonly cache?: ICacheManager) {
    super();
  }

  public async handle(): Promise<number> {
    const store = this.option<string>('store');
    const out = this.output as any;

    if (!this.cache) {
      this.output.error('CacheManager is not available. Ensure CacheModule is imported.');
      return 1;
    }

    const spinner = this.output.spinner();
    spinner.start(store ? `Flushing "${store}" store...` : 'Flushing all cache stores...');

    try {
      if (store) {
        await this.cache.store(store).flush();
      } else {
        await this.cache.flush();
      }

      spinner.stop('Cache flushed', 0);
      this.output.success(store ? `Store "${store}" cleared.` : 'All cache stores cleared.');
      return 0;
    } catch (error: Error | any) {
      spinner.stop('Failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
