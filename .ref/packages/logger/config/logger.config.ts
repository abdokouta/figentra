/**
 * @file logger.config.ts
 * @module @stackra/logger/config
 * @description Application-level logger configuration.
 *   Consumed by `LoggerModule.forRoot()` at bootstrap.
 *
 *   This file defines channels (named logger pipelines), each with a level,
 *   reporter, formatter, and optional enrichers. Multiple channels allow
 *   routing different concerns to different outputs (console, file, Datadog).
 */

import { defineConfig } from '@stackra/logger';

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Channel
  |--------------------------------------------------------------------------
  |
  | This option defines the default log channel that is used when writing
  | messages to the logs. The name specified here should match one of the
  | channels defined in the "channels" object below.
  |
  */
  default: 'app',

  /*
  |--------------------------------------------------------------------------
  | Log Channels
  |--------------------------------------------------------------------------
  |
  | Here you may configure the log channels for your application. Each channel
  | represents a destination or grouping for log messages. Each channel defines:
  |
  |   - level: Minimum severity to write ('debug','info','warn','error','fatal')
  |   - reporter: Output backend ('console','json','silent', or custom)
  |   - formatter: Message formatting strategy ('text','json','pretty')
  |   - enrichers: Extra processors applied before writing
  |
  */
  channels: {
    app: {
      level: 'info',
      reporter: 'console',
    },
    debug: {
      level: 'debug',
      reporter: 'console',
    },
    errors: {
      level: 'error',
      reporter: 'json',
    },
    silent: {
      level: 'info',
      reporter: 'silent',
    },
  },

  /*
  |--------------------------------------------------------------------------
  | Global Context
  |--------------------------------------------------------------------------
  |
  | Data merged into every log entry's metadata regardless of channel.
  | Useful for application-wide identifiers like app name, version, or
  | environment. Lowest priority — channel/entry-level context wins.
  |
  */
  globalContext: {
    // app: 'my-app',
    // version: '1.0.0',
  },

  /*
  |--------------------------------------------------------------------------
  | Redaction
  |--------------------------------------------------------------------------
  |
  | Configure automatic redaction of sensitive data in log entries.
  | Paths use dot-notation to match nested fields in the entry's meta
  | and context objects. Matched values are replaced with the mask string.
  |
  */
  redact: {
    paths: ['password', 'token', 'secret', 'authorization', 'cookie'],
    mask: '[REDACTED]',
  },

  /*
  |--------------------------------------------------------------------------
  | Sampling
  |--------------------------------------------------------------------------
  |
  | Control log volume by sampling. Each level maps to a keep-every-Nth
  | number: 1 = keep all (no sampling), 10 = keep 1 in every 10.
  | Only applies in production — all entries are kept in development.
  |
  */
  sampling: {
    debug: 1,
    info: 1,
    warn: 1,
    error: 1,
    fatal: 1,
  },

  /*
  |--------------------------------------------------------------------------
  | Capture Network Errors
  |--------------------------------------------------------------------------
  |
  | When true (browser/React Native only), the logger system installs a
  | global error handler to capture unhandled fetch/XHR failures and
  | log them automatically to the error channel.
  |
  */
  captureNetworkErrors: false,
});
