/**
 * @file logger-manager.service.ts
 * @module @stackra/logger/core/services
 * @description Backend-agnostic logger manager extending the Manager base class.
 *   Single entry-point for all logging operations. Resolves channels as drivers,
 *   filters by level, runs the enrichment pipeline, and dispatches to reporters.
 */

import { Injectable, Inject } from '@stackra/ts-container';
import { Manager } from '@stackra/ts-support';
import {
  LOGGER_CONFIG,
  LOGGER_EVENTS,
  type ILoggerManager,
  type ILogger,
  type ILogReporter,
  type ILogEntry,
  type ILogChannelConfig,
  type ILoggerModuleConfig,
  type ILogFormatter,
  type ILogEnricher,
  type LogContext,
  type IPubSubDriver,
  ILogLevel,
  LOG_LEVEL_PRIORITY,
} from '@stackra/contracts';

import type { ILogChannel } from '../interfaces/log-channel.interface';
import type { IChannelTap } from '../interfaces/channel-tap.interface';
import { EmergencyLogger } from './emergency-logger.service';
import { Logger } from './logger.service';

/**
 * Central logger manager — extends Manager for lazy channel resolution with caching.
 *
 * Channels are resolved as "drivers" via the Manager pattern. Each channel is
 * built from its config (reporter names → instances, formatter name → instance)
 * and cached for subsequent use.
 *
 * Features:
 * - Channel-based routing (multiple independent log streams)
 * - Stack channels (dispatch to multiple sub-channels)
 * - Reporter registry with auto-discovery via @Reporter decorator
 * - Enrichment pipeline (interpolation, redaction, global context, sampling)
 * - Formatter registry (pretty, JSON, custom)
 * - Level filtering per channel
 * - Global context injection
 * - Child logger support
 * - Mutable context (withContext/withoutContext)
 * - Performance timing (time/timeEnd)
 * - On-demand channels (build from inline config)
 * - Channel taps (post-resolution hooks)
 * - Emergency fallback on channel failure
 * - MessageLogged event emission (fire-and-forget)
 * - Graceful flush on shutdown
 *
 * @example
 * ```typescript
 * LoggerModule.forRoot({
 *   default: 'app',
 *   channels: {
 *     app: { level: 'debug', reporters: ['console'], formatter: 'pretty' },
 *     audit: { level: 'info', reporters: ['json'], formatter: 'json' },
 *     all: { type: 'stack', channels: ['app', 'audit'], level: 'debug', reporters: [] },
 *   },
 * });
 *
 * const manager = container.get(LOGGER_MANAGER);
 * const logger = manager.create('MyService');
 * logger.info('Hello', { key: 'value' });
 * ```
 */
@Injectable()
export class LoggerManager extends Manager<ILogChannel> implements ILoggerManager {
  /** Registry of all available reporters by name. */
  private readonly reporters = new Map<string, ILogReporter>();

  /** Registry of all available formatters by name. */
  private readonly formatters = new Map<string, ILogFormatter>();

  /** Ordered list of enrichers applied to every entry before dispatch. */
  private readonly enrichers: ILogEnricher[] = [];

  /** Global context merged into every log entry's meta. */
  private globalContext: LogContext = {};

  /** Channel taps registry — post-resolution hooks keyed by channel name. */
  private readonly channelTaps: Map<string, IChannelTap[]> = new Map();

  /** Counter for on-demand channel naming. */
  private onDemandCounter = 0;

  /** Optional PubSub driver for event emission. */
  private pubsub?: IPubSubDriver;

  /**
   * Static reference for the Logger facade to access without DI.
   * Set during module initialization. Required by coding-standards
   * for the `new Logger(ClassName.name)` pattern.
   */
  public static instance: LoggerManager | null = null;

  /**
   * @param config - Logger module configuration (channels, default, enrichers, redact)
   */
  public constructor(@Inject(LOGGER_CONFIG) private readonly config: ILoggerModuleConfig) {
    super();

    // Set static reference for Logger facade
    LoggerManager.instance = this;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Manager Abstract Implementation
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Returns the default channel name from configuration.
   *
   * @returns Default channel name (e.g., 'app')
   */
  public getDefaultDriver(): string {
    return this.config.default;
  }

  /**
   * Resolve a channel by name from the config map.
   *
   * Overrides Manager's convention-based `create{Name}Driver()` pattern because
   * channels are config-driven, not a fixed set of driver types.
   *
   * Supports stack channels (type: 'stack') which dispatch to multiple sub-channels.
   * Applies registered channel taps after resolution.
   *
   * @param name - Channel name to resolve
   * @returns Resolved ILogChannel with reporter instances and formatter
   * @throws Error if the channel name doesn't exist in config
   */
  protected override createDriver(name: string): ILogChannel {
    // Check custom creators first (via Manager.extend())
    const creator = this.customCreators.get(name);
    if (creator) {
      return this.applyTaps(creator(), name);
    }

    const channelConfig = this.config.channels[name];
    if (!channelConfig) {
      throw new Error(`Log channel [${name}] is not configured in [LoggerManager].`);
    }

    // Handle stack channels — dispatch to multiple sub-channels
    if (channelConfig.type === 'stack') {
      return this.applyTaps(this.createStackChannel(channelConfig), name);
    }

    // Resolve reporter instances from names
    const reporters: ILogReporter[] = [];
    for (const reporterName of channelConfig.reporters) {
      const reporter = this.reporters.get(reporterName);
      if (reporter) {
        reporters.push(reporter);
      }
    }

    // Resolve formatter if configured
    let formatter: ILogFormatter | undefined;
    if (channelConfig.formatter) {
      formatter = this.formatters.get(channelConfig.formatter);
    }

    const channel: ILogChannel = {
      config: channelConfig,
      reporters,
      formatter,
    };

    return this.applyTaps(channel, name);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ILoggerManager Implementation
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a context-bound Logger using the default channel.
   *
   * @param context - Context name (e.g., class name)
   * @returns Logger instance
   */
  public create(context: string): ILogger {
    return new Logger(context, this.getDefaultDriver(), this);
  }

  /**
   * Create a Logger bound to a specific named channel.
   *
   * @param context - Context name
   * @param channel - Channel name (must exist in config)
   * @returns Logger instance using the specified channel
   */
  public channel(context: string, channel: string): ILogger {
    return new Logger(context, channel, this);
  }

  /**
   * Build an on-demand Logger from an inline channel config.
   * The channel is temporary (not cached in the driver pool) and identified
   * with a special `__ondemand_N` name.
   *
   * @param channelConfig - Channel configuration to use
   * @returns A Logger instance bound to the temporary channel
   */
  public build(channelConfig: ILogChannelConfig): ILogger {
    const name = `__ondemand_${++this.onDemandCounter}`;

    // Resolve reporters for the on-demand channel
    const reporters: ILogReporter[] = [];
    for (const reporterName of channelConfig.reporters) {
      const reporter = this.reporters.get(reporterName);
      if (reporter) {
        reporters.push(reporter);
      }
    }

    let formatter: ILogFormatter | undefined;
    if (channelConfig.formatter) {
      formatter = this.formatters.get(channelConfig.formatter);
    }

    const channel: ILogChannel = {
      config: channelConfig,
      reporters,
      formatter,
    };

    // Register as a custom creator so dispatch can resolve it
    this.extend(name, () => channel);

    return new Logger('OnDemand', name, this);
  }

  /**
   * Dispatch a log entry to the appropriate channel's reporters.
   *
   * Pipeline: emergency fallback → level filter → enrichment → formatter → reporters → event
   *
   * Never throws — on channel resolution failure, uses the emergency fallback
   * logger and logs a warning about the misconfiguration.
   *
   * @param entry - Structured log entry
   * @param channelName - Target channel (uses default if omitted)
   */
  public dispatch(entry: ILogEntry, channelName?: string): void {
    const name = channelName ?? this.getDefaultDriver();

    let resolvedChannel: ILogChannel;
    try {
      resolvedChannel = this.driver(name);
    } catch (error: unknown) {
      // Emergency fallback — never throw from dispatch
      EmergencyLogger.log(entry);
      EmergencyLogger.warn(`Channel [${name}] failed to resolve`, error);
      return;
    }

    const { config: chConfig, reporters, formatter: _formatter } = resolvedChannel;

    // Level filter — suppress entries below the channel's minimum level
    if (LOG_LEVEL_PRIORITY[entry.level] < LOG_LEVEL_PRIORITY[chConfig.level]) {
      return;
    }

    // Merge global context (lowest priority — entry meta overrides)
    let enrichedEntry: ILogEntry = {
      ...entry,
      meta: { ...this.globalContext, ...(entry.meta ?? {}) },
    };

    // Run enrichment pipeline
    for (const enricher of this.enrichers) {
      try {
        const result = enricher.enrich(enrichedEntry);
        if (!result) return; // Enricher dropped the entry (e.g., sampling)
        enrichedEntry = result;
      } catch {
        // Skip failing enricher, continue pipeline
      }
    }

    // Dispatch to reporters
    for (const reporter of reporters) {
      try {
        reporter.write(enrichedEntry);
      } catch {
        // Fail-open — reporter errors must never crash the application
      }
    }

    // Emit MessageLogged event (fire-and-forget)
    this.emitMessageLogged(enrichedEntry, name);
  }

  /**
   * Get the configuration of a named channel.
   *
   * @param name - Channel name
   * @returns Channel config or undefined
   */
  public getChannel(name: string): ILogChannelConfig | undefined {
    return this.config.channels[name];
  }

  /**
   * Dynamically update the minimum level of a channel at runtime.
   * Invalidates the cached driver so it's rebuilt with the new level.
   *
   * @param channel - Channel name
   * @param level - New minimum level
   */
  public setLevel(channel: string, level: ILogLevel): void {
    const channelConfig = this.config.channels[channel];
    if (channelConfig) {
      channelConfig.level = level;
      // Invalidate cached driver so next access resolves fresh config
      this.forgetDriver(channel);
    }
  }

  /**
   * Set global context merged into every log entry's meta field.
   *
   * @param ctx - Context key-value pairs (e.g., { service: 'api', env: 'prod' })
   */
  public setGlobalContext(ctx: LogContext): void {
    this.globalContext = { ...ctx };
  }

  /**
   * Get the current global context.
   *
   * @returns Current global context object
   */
  public getGlobalContext(): LogContext {
    return { ...this.globalContext };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Channel Management
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Add a new channel at runtime.
   * Invalidates any cached driver for this channel name.
   *
   * @param name - Channel name
   * @param channelConfig - Channel configuration
   */
  public addChannel(name: string, channelConfig: ILogChannelConfig): void {
    this.config.channels[name] = channelConfig;
    this.forgetDriver(name);
  }

  /**
   * Remove a cached channel by name, forcing re-resolution on next access.
   * Alias for the underlying Manager's forgetDriver().
   *
   * @param name - Channel name to forget
   */
  public forgetChannel(name: string): void {
    this.forgetDriver(name);
  }

  /**
   * Get all resolved (cached) channels as a Map.
   *
   * @returns Map of channel names to their resolved ILogChannel instances
   */
  public getChannels(): Map<string, ILogChannel> {
    return this.getDrivers() as Map<string, ILogChannel>;
  }

  /**
   * Switch the default channel at runtime.
   * The new channel must exist in the configuration.
   *
   * @param name - Channel name to set as the new default
   */
  public setDefaultChannel(name: string): void {
    this.config.default = name;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Reporter Management
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Register a reporter instance by name. Called during module initialization
   * and by auto-discovery services.
   *
   * @param reporter - Reporter to register
   */
  public registerReporter(reporter: ILogReporter): void {
    this.reporters.set(reporter.name, reporter);
  }

  /**
   * Get all registered reporter names.
   *
   * @returns Array of reporter names
   */
  public getReporterNames(): string[] {
    return [...this.reporters.keys()];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Formatter Management
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Register a formatter instance by name.
   *
   * @param formatter - Formatter to register
   */
  public registerFormatter(formatter: ILogFormatter): void {
    this.formatters.set(formatter.name, formatter);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Enricher Management
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Add an enricher to the pipeline. Enrichers run in registration order.
   *
   * @param enricher - Enricher to add
   */
  public addEnricher(enricher: ILogEnricher): void {
    this.enrichers.push(enricher);
  }

  /**
   * Prepend an enricher to the beginning of the pipeline.
   * Used for enrichers that must run first (e.g., interpolation, sampling).
   *
   * @param enricher - Enricher to prepend
   */
  public prependEnricher(enricher: ILogEnricher): void {
    this.enrichers.unshift(enricher);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Channel Taps
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Register a channel tap for a specific channel name.
   * Taps run after channel resolution and before caching.
   *
   * @param channelName - Channel name to attach the tap to
   * @param tap - Channel tap instance
   */
  public registerTap(channelName: string, tap: IChannelTap): void {
    const existing = this.channelTaps.get(channelName) ?? [];
    existing.push(tap);
    this.channelTaps.set(channelName, existing);
    // Invalidate cached driver so taps apply on next resolution
    this.forgetDriver(channelName);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PubSub Integration
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Set the PubSub driver for event emission.
   * Called during module initialization if a PubSub driver is available.
   *
   * @param driver - PubSub driver instance
   */
  public setPubSub(driver: IPubSubDriver | undefined): void {
    this.pubsub = driver;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Flush all reporters — called during graceful shutdown.
   * Ensures all buffered log entries are written before process exit.
   *
   * @returns Promise that resolves when all reporters have flushed
   */
  public async flush(): Promise<void> {
    const flushes = [...this.reporters.values()].filter((r) => r.flush).map((r) => r.flush!());

    await Promise.allSettled(flushes);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a stack channel that dispatches to multiple sub-channels.
   *
   * @param config - Stack channel configuration with `channels` array
   * @returns Resolved ILogChannel with a composite reporter
   */
  private createStackChannel(config: ILogChannelConfig): ILogChannel {
    const subChannelNames = config.channels ?? [];
    const stackReporters: ILogReporter[] = [];

    for (const subName of subChannelNames) {
      try {
        const subChannel = this.driver(subName);
        stackReporters.push(...subChannel.reporters);
      } catch {
        // Skip misconfigured sub-channels — log warning via emergency logger
        EmergencyLogger.warn(`Stack channel sub-channel [${subName}] failed to resolve`);
      }
    }

    return {
      config,
      reporters: stackReporters,
      formatter: undefined,
    };
  }

  /**
   * Apply registered taps to a resolved channel.
   *
   * @param channel - Resolved channel
   * @param name - Channel name
   * @returns Channel after all taps have been applied
   */
  private applyTaps(channel: ILogChannel, name: string): ILogChannel {
    const taps = this.channelTaps.get(name);
    if (!taps || taps.length === 0) {
      return channel;
    }

    let result = channel;
    for (const tap of taps) {
      try {
        result = tap.tap(result, name);
      } catch {
        // Skip failing taps
      }
    }
    return result;
  }

  /**
   * Emit the MESSAGE_LOGGED event via PubSub (fire-and-forget).
   * Never blocks or fails logging — errors are silently swallowed.
   *
   * @param entry - The enriched log entry that was dispatched
   * @param channel - The channel name it was dispatched to
   */
  private emitMessageLogged(entry: ILogEntry, channel: string): void {
    if (!this.pubsub) return;

    try {
      const payload = {
        level: entry.level,
        message: entry.message,
        context: entry.context,
        channel,
        timestamp: entry.timestamp,
        meta: entry.meta,
      };

      this.pubsub.publish(LOGGER_EVENTS.MESSAGE_LOGGED, payload).catch(() => {
        // Fire-and-forget — never fail logging due to event emission
      });
    } catch {
      // Swallow all errors — event emission must never break logging
    }
  }
}
