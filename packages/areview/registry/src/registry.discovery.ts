/**
 * @file registry.discovery.ts
 * @description NestJS DiscoveryService-backed registry metadata collector.
 */
import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import 'reflect-metadata';
import { REGISTRY_DISCOVERY_METADATA } from './registry.decorators.js';
import type { RegistryDiscoveryAdapter, RegistryDiscoveryRecord } from './discovery.types.js';

/** Collects registry metadata from instantiated Nest providers. */
@Injectable()
export class RegistryDiscoveryService implements RegistryDiscoveryAdapter {
  private readonly logger = new Logger(RegistryDiscoveryService.name);

  constructor(private readonly discovery: DiscoveryService) {}

  /**
   * Collects decorators attached to discovered Nest providers and controllers.
   * Discovery is producer-side only; the Registry Worker remains authoritative.
   */
  collect(): RegistryDiscoveryRecord[] {
    const records: RegistryDiscoveryRecord[] = [];
    const wrappers = [
      ...this.discovery.getProviders(),
      ...this.discovery.getControllers(),
    ];

    const seen = new Set<Function>();
    for (const wrapper of wrappers) {
      const metatype = wrapper.metatype;
      if (!metatype || seen.has(metatype)) continue;
      seen.add(metatype);

      const metadata = Reflect.getMetadata(REGISTRY_DISCOVERY_METADATA, metatype) as
        | Array<RegistryDiscoveryRecord>
        | undefined;
      if (metadata) records.push(...metadata);

      // @figentra/workflows is intentionally not a hard dependency of Registry.
      // Both packages share the stable global reflection key so Registry can
      // automatically expose workflow metadata when the workflow package is installed.
      const workflow = Reflect.getMetadata(Symbol.for('figentra:workflow'), metatype) as
        | { name: string; version?: string; description?: string; runtime?: 'cloudflare-workflow'; worker?: string; binding?: string; trigger?: Record<string, unknown>; permissions?: string[] }
        | undefined;
      if (workflow) {
        records.push({
          kind: 'workflow',
          value: {
            key: workflow.name,
            version: workflow.version,
            description: workflow.description,
            runtime: workflow.runtime ?? 'cloudflare-workflow',
            worker: workflow.worker ?? 'workflow-runtime',
            binding: workflow.binding ?? 'WORKFLOW_RUNTIME',
            trigger: workflow.trigger,
            permissions: workflow.permissions,
          },
        });
      }

      const event = Reflect.getMetadata(Symbol.for('figentra:event'), metatype) as
        | { type: string; version?: string; topic?: string; description?: string; direction?: 'produces' | 'consumes' }
        | undefined;
      if (event) {
        records.push({
          kind: 'event',
          value: {
            key: event.type,
            version: event.version ?? '1',
            topic: event.topic ?? event.type,
            direction: event.direction ?? 'produces',
            metadata: event.description ? { description: event.description } : undefined,
          },
        });
      }
    }

    this.logger.debug(`Collected ${records.length} registry metadata records.`);
    return records;
  }
}
