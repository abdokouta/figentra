/**
 * @file cache-table.command.ts
 * @module @stackra/cache/commands
 * @description Display registered cache stores and their configuration.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@stackra/contracts';
import type { ICacheManager } from '@stackra/contracts';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'cache:table',
  description: 'Display registered cache stores and configuration',
})
export class CacheTableCommand extends BaseCommand {
  public constructor(@Optional() @Inject(CACHE_MANAGER) private readonly cache?: ICacheManager) {
    super();
  }

  public async handle(): Promise<void> {
    const out = this.output as any;

    if (!this.cache) {
      this.output.error('CacheManager is not available.');
      return;
    }

    out.separator(60, 'Cache Stores');

    const stores = this.cache.getStoreNames?.() ?? ['default'];
    const rows = stores.map((name: string) => {
      const store = this.cache!.store(name);
      return [name, store?.constructor?.name ?? 'unknown', name === 'default' ? '★ default' : ''];
    });

    out.table(['Store', 'Driver', 'Status'], rows);
    out.info(`${stores.length} cache store(s) registered`);
  }
}
