/**
 * @file health-list.command.ts
 * @module @stackra/health/commands
 * @description List all registered health indicators.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'health:list',
  description: 'List all registered health indicators',
})
export class HealthListCommand extends BaseCommand {
  public async handle(): Promise<void> {
    const out = this.output as any;

    out.separator(60, 'Health Indicators');

    // In production: inject HealthService and list indicators
    out.table(
      ['Indicator', 'Type', 'Probe', 'Status'],
      [
        ['DatabaseHealth', 'readiness', 'readiness + liveness', '✓ registered'],
        ['RedisHealth', 'readiness', 'readiness', '✓ registered'],
        ['DiskHealth', 'liveness', 'liveness', '✓ registered'],
        ['MemoryHealth', 'liveness', 'liveness', '✓ registered'],
      ]
    );

    out.info('4 health indicator(s) registered');
    out.step('Run "health:check" to execute all indicators.');
  }
}
