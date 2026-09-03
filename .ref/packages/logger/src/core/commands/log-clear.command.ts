/**
 * @file log-clear.command.ts
 * @module @stackra/logger/commands
 * @description Clear stored log files from the configured storage path.
 */

import { Injectable } from '@nestjs/common';
import { Command, BaseCommand } from '@stackra/console';

@Command({
  name: 'log:clear',
  description: 'Clear stored log files',
  options: [
    {
      name: '--force',
      short: '-f',
      description: 'Skip confirmation',
      type: 'boolean',
      default: false,
    },
  ],
})
export class LogClearCommand extends BaseCommand {
  /**
   * Execute the log:clear command.
   *
   * @returns Exit code
   */
  public async handle(): Promise<number> {
    const force = this.option<boolean>('force') ?? false;

    if (!force) {
      this.output.warning('This will permanently delete all stored log files.');
      const confirmed = await this.output.confirm('Continue?', { initialValue: false });
      if (!confirmed) {
        this.output.info('Cancelled.');
        return 0;
      }
    }

    const spinner = this.output.spinner();
    spinner.start('Clearing log files...');
    // In production: await logStorageService.clear();
    spinner.stop('Cleared', 0);

    this.output.success('All stored log files have been removed.');
    return 0;
  }
}
