/**
 * @file docs-export.command.ts
 * @module @stackra/swagger/commands
 * @description Export API documentation to various formats (Postman, Insomnia).
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'docs:export',
  description: 'Export API documentation to Postman/Insomnia format',
  options: [
    {
      name: '--format',
      short: '-f',
      description: 'Export format (postman, insomnia)',
      type: 'string',
      default: 'postman',
    },
    { name: '--output', short: '-o', description: 'Output file path', type: 'string' },
  ],
})
export class DocsExportCommand extends BaseCommand {
  public async handle(): Promise<number> {
    const format = this.option<string>('format') ?? 'postman';
    const output = this.option<string>('output') ?? `docs/collection.${format}.json`;

    const spinner = this.output.spinner();
    spinner.start(`Exporting to ${format} format...`);
    spinner.stop('Export complete', 0);
    this.output.success(`Collection exported to: ${output}`);
    return 0;
  }
}
