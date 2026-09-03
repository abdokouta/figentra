/**
 * @file index.ts
 * @module @stackra/nestjs-health/indicators
 * @description Barrel export for built-in foundational health indicators.
 *
 * Domain-specific indicators live in their owning packages:
 * - DatabaseHealthIndicator → @stackra/nestjs-orm
 * - RedisHealthIndicator → @stackra/nestjs-redis
 * - QueueHealthIndicator → @stackra/nestjs-queue
 * - HttpPingIndicator → @stackra/nestjs-connector
 * - DnsHealthIndicator → networking package
 * - CertificateExpiryIndicator → networking package
 */
export { MemoryHealthIndicator } from './memory.indicator';
export { DiskHealthIndicator } from './disk.indicator';
export { EventLoopLagIndicator } from './event-loop-lag.indicator';
export { ProcessUptimeIndicator } from './process-uptime.indicator';
