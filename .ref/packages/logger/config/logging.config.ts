/**
 * @file logging.config.ts
 * @module @stackra/logger/config
 * @description Application-level logging configuration.
 *   Consumed by `LoggerModule.forRoot()` at bootstrap.
 *   Defines channels (where logs go), levels (what gets written),
 *   stacks (combine channels), redaction, and global context.
 *
 *   This is the ONLY place to control logging verbosity.
 *   Individual packages do not have their own log level config.
 *   When `app.debug = true`, the default channel level is forced to DEBUG.
 *
 *   Inspired by: Laravel config/logging.php
 */

import { defineConfig } from '@stackra/logger';
import { ILogLevel } from '@stackra/logger';

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Log Channel
  |--------------------------------------------------------------------------
  |
  | This option defines the default log channel that gets used when writing
  | messages to the logs. The name specified here should match one of the
  | channels defined in the "channels" configuration below.
  |
  | You may use a "stack" type channel to combine multiple channels together.
  |
  */
  default: 'stack',

  /*
  |--------------------------------------------------------------------------
  | Log Channels
  |--------------------------------------------------------------------------
  |
  | Here you may configure the log channels for your application. Each
  | channel represents a specific way of writing log information.
  |
  | Channel types:
  | - (default)  — standard channel with one or more reporters
  | - "stack"    — combines multiple channels (fan-out to all)
  |
  | Each channel has:
  | - level: minimum log level (DEBUG, INFO, WARN, ERROR)
  | - reporters: array of reporter names (console, json, silent)
  | - formatter: output format (pretty, json, minimal)
  | - type: "stack" for aggregate channels
  | - channels: (stack only) list of channel names to combine
  |
  */
  channels: {
    /*
    |----------------------------------------------------------------------
    | Stack Channel
    |----------------------------------------------------------------------
    |
    | Aggregates multiple channels into one. Messages sent to the stack
    | are forwarded to ALL listed channels. Each sub-channel applies its
    | own level filter independently.
    |
    */
    stack: {
      level: ILogLevel.DEBUG,
      reporters: [],
      type: 'stack',
      channels: ['console', 'json'],
    },

    /*
    |----------------------------------------------------------------------
    | Console Channel
    |----------------------------------------------------------------------
    |
    | Outputs colorized, human-readable logs to stdout. Ideal for local
    | development. Shows timestamp, level, context, and message.
    |
    */
    console: {
      level: ILogLevel.DEBUG,
      reporters: ['console'],
      formatter: 'pretty',
    },

    /*
    |----------------------------------------------------------------------
    | JSON Channel
    |----------------------------------------------------------------------
    |
    | Outputs structured JSON log lines to stdout. Ideal for production
    | environments where logs are consumed by aggregators (CloudWatch,
    | Datadog, ELK, Loki). Each line is one parseable JSON object.
    |
    */
    json: {
      level: ILogLevel.INFO,
      reporters: ['json'],
      formatter: 'json',
    },

    /*
    |----------------------------------------------------------------------
    | Silent Channel
    |----------------------------------------------------------------------
    |
    | Discards all output. Use for testing or to completely disable logging
    | without changing application code.
    |
    */
    silent: {
      level: ILogLevel.DEBUG,
      reporters: ['silent'],
    },

    /*
    |----------------------------------------------------------------------
    | Error Channel
    |----------------------------------------------------------------------
    |
    | A dedicated channel that only captures error-level and above.
    | Useful for error alerting (Slack, PagerDuty) or separate error files.
    |
    */
    error: {
      level: ILogLevel.ERROR,
      reporters: ['json'],
      formatter: 'json',
    },
  },

  /*
  |--------------------------------------------------------------------------
  | Global Context
  |--------------------------------------------------------------------------
  |
  | Data attached to every log entry automatically. Useful for identifying
  | the application instance in distributed or multi-tenant environments.
  |
  */
  globalContext: {
    app: process.env.APP_NAME ?? 'stackra',
    env: process.env.NODE_ENV ?? 'development',
    version: process.env.APP_VERSION ?? '0.0.0',
  },

  /*
  |--------------------------------------------------------------------------
  | Redaction
  |--------------------------------------------------------------------------
  |
  | Field paths to redact from log entry metadata. Prevents sensitive data
  | from appearing in log output. Applied to ALL channels.
  |
  */
  redact: {
    paths: ['password', 'token', 'secret', 'authorization', 'cookie', 'creditCard'],
    mask: '[REDACTED]',
  },

  /*
  |--------------------------------------------------------------------------
  | Sampling
  |--------------------------------------------------------------------------
  |
  | Control how many log entries of each level are actually written.
  | A value of 1 means keep every entry (no sampling). A value of 10
  | means keep every 10th entry (90% dropped). Useful for high-throughput
  | debug logs in production where you only need a sample.
  |
  */
  sampling: {
    debug: 1,
    info: 1,
    warn: 1,
    error: 1,
  },
});
