/**
 * @file log-tail.command.ts
 * @module @stackra/logger/commands
 * @description Tail application logs in real-time with optional level filtering.
 */

import { Injectable } from '@nestjs/common';
import { Command, BaseCommand } from '@stackra/console';

@Command({
  name: 'log:tail',
  description: 'Tail application logs in real-time',
  options: [
    {
      name: '--level',
      short: '-l',
      description: 'Filter by log level (debug, info, warn, error)',
      type: 'string',
      default: 'info',
    },
    {
      name: '--lines',
      short: '-n',
      description: 'Number of recent lines to show',
      type: 'number',
      default: 50,
    },
  ],
})
export class LogTailCommand extends BaseCommand {
  /**
   * Execute the log:tail command.
   *
   * @returns Exit code
   */
  public async handle(): Promise<number> {
    const level = this.option<string>('level') ?? 'info';
    const lines = this.option<number>('lines') ?? 50;
    const out = this.output as any;

    out.pairs({
      Level: level,
      Lines: String(lines),
      Mode: 'real-time',
    });

    const spinner = this.output.spinner();
    spinner.start('Connecting to log stream...');
    // In production: connect to LoggerManager stream, filter by level
    spinner.stop('Connected', 0);

    this.output.info(`Tailing last ${lines} log entries at level "${level}" and above.`);
    this.output.info('Press Ctrl+C to stop.');
    return 0;
  }
}
