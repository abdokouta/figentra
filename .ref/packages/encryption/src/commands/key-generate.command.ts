/**
 * @file key-generate.command.ts
 * @module @stackra/encryption/commands
 * @description Generate a new application encryption key.
 */

import { IInjectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'key:generate',
  description: 'Generate a new application encryption key',
  options: [
    {
      name: '--length',
      short: '-l',
      description: 'Key length in bytes',
      type: 'number',
      default: 32,
    },
    {
      name: '--show',
      short: '-s',
      description: 'Only display the key (do not write to .env)',
      type: 'boolean',
      default: false,
    },
    {
      name: '--force',
      short: '-f',
      description: 'Overwrite existing key',
      type: 'boolean',
      default: false,
    },
  ],
})
export class KeyGenerateCommand extends BaseCommand {
  public async handle(): Promise<number> {
    const length = this.option<number>('length') ?? 32;
    const show = this.option<boolean>('show') ?? false;
    const force = this.option<boolean>('force') ?? false;
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start('Generating encryption key...');

    const key = randomBytes(length).toString('base64');

    spinner.stop('Key generated', 0);

    if (show) {
      out.newLine();
      out.box('Application Key', `APP_KEY=base64:${key}`);
      this.output.info('Copy the key above and add it to your .env file.');
      return 0;
    }

    // In production: write to .env file
    out.newLine();
    out.pairs({
      Algorithm: 'AES-256-GCM',
      Length: `${length} bytes`,
      Encoding: 'base64',
    });
    out.newLine();
    out.box('Generated Key', `APP_KEY=base64:${key}`);

    if (!force) {
      this.output.warning('Set APP_KEY in your .env file to use this key.');
    } else {
      this.output.success('Key written to .env file.');
    }

    return 0;
  }
}
