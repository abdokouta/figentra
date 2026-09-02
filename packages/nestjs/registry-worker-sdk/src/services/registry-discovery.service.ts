/**
 * @file registry-discovery.service.ts
 * @description NestJS DiscoveryService-backed registry metadata collector.
 *
 * Inspects all instantiated Nest providers and controllers for registry decorator metadata,
 * and collects cross-package metadata from @figentra/workflows and @figentra/events.
 */

import { Injectable, Logger } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import "reflect-metadata";
import type { IRegistryDiscoveryService, RegistryDiscoveryRecord } from "../interfaces";
import {
  REGISTRY_DISCOVERY_METADATA,
  FIGENTRA_WORKFLOW_METADATA,
  FIGENTRA_EVENT_METADATA,
} from "../constants/registry.constants";

/**
 * Collects registry discovery records from the NestJS DI container at bootstrap.
 */
@Injectable()
export class RegistryDiscoveryService implements IRegistryDiscoveryService {
  private readonly logger = new Logger(RegistryDiscoveryService.name);

  constructor(private readonly discovery: DiscoveryService) {}

  /**
   * Scans providers and controllers for declared registry metadata.
   *
   * @returns Deduplicated array of typed discovery records.
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

      const metadata = Reflect.getMetadata(
        REGISTRY_DISCOVERY_METADATA,
        metatype,
      ) as RegistryDiscoveryRecord[] | undefined;
      if (metadata?.length) records.push(...metadata);

      const workflow = Reflect.getMetadata(FIGENTRA_WORKFLOW_METADATA, metatype) as
        | {
            name: string;
            version?: string;
            description?: string;
            runtime?: "cloudflare-workflow";
            worker?: string;
            binding?: string;
            trigger?: Record<string, unknown>;
            permissions?: string[];
          }
        | undefined;

      if (workflow) {
        records.push({
          kind: "workflow",
          value: {
            key: workflow.name,
            version: workflow.version,
            description: workflow.description,
            runtime: workflow.runtime ?? "cloudflare-workflow",
            worker: workflow.worker ?? "workflow-runtime",
            binding: workflow.binding ?? "WORKFLOW_RUNTIME",
            trigger: workflow.trigger,
            permissions: workflow.permissions,
          },
        });
      }

      const event = Reflect.getMetadata(FIGENTRA_EVENT_METADATA, metatype) as
        | {
            type: string;
            version?: string;
            topic?: string;
            description?: string;
            direction?: "produces" | "consumes";
          }
        | undefined;

      if (event) {
        records.push({
          kind: "event",
          value: {
            key: event.type,
            version: event.version ?? "1",
            topic: event.topic ?? event.type,
            direction: event.direction ?? "produces",
            metadata: event.description ? { description: event.description } : undefined,
          },
        });
      }
    }

    this.logger.debug(`Collected ${records.length} registry metadata records.`);
    return records;
  }
}
