/**
 * @file registry.discovery.spec.ts
 * @description Unit tests for the RegistryDiscoveryService decorator scanning.
 */

import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { DiscoveryModule } from "@nestjs/core";
import { Injectable } from "@nestjs/common";
import { RegistryDiscoveryService } from "../../src/services/registry-discovery.service";
import {
  RegisterModule,
  RegisterResource,
  RegisterAction,
  RegisterNavigation,
  RegisterEvent,
  RegisterWorkflow,
} from "../../src/decorators";

@RegisterModule({ key: "audit", description: "Audit log management" })
@RegisterResource({ key: "audit-entry", moduleKey: "audit" })
@RegisterAction({ key: "audit-entry:read", resourceKey: "audit-entry", permission: "audit:read" })
@RegisterNavigation({ key: "audit-log", path: "/audit", label: "Audit Log", permission: "audit:read" })
@Injectable()
class MockAuditService {}

@RegisterEvent({ key: "audit.log.created", direction: "produces", topic: "audit.log.created" })
@Injectable()
class MockAuditEventService {}

@RegisterWorkflow({
  key: "audit-retention-cleanup",
  runtime: "cloudflare-workflow",
  worker: "audit-worker",
  version: "1",
})
@Injectable()
class MockWorkflowService {}

describe("RegistryDiscoveryService", () => {
  let discovery: RegistryDiscoveryService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [
        RegistryDiscoveryService,
        MockAuditService,
        MockAuditEventService,
        MockWorkflowService,
      ],
    }).compile();

    discovery = moduleRef.get(RegistryDiscoveryService);
  });

  it("should collect module, resource, action, and navigation records from a single class", () => {
    const records = discovery.collect();
    const kinds = records.map((r) => r.kind);
    expect(kinds).toContain("module");
    expect(kinds).toContain("resource");
    expect(kinds).toContain("action");
    expect(kinds).toContain("navigation");
  });

  it("should collect event records", () => {
    const records = discovery.collect();
    const events = records.filter((r) => r.kind === "event");
    expect(events).toHaveLength(1);
    expect((events[0] as { kind: "event"; value: { key: string } }).value.key).toBe("audit.log.created");
  });

  it("should collect workflow records", () => {
    const records = discovery.collect();
    const workflows = records.filter((r) => r.kind === "workflow");
    expect(workflows).toHaveLength(1);
  });

  it("should deduplicate classes registered multiple times", () => {
    const records = discovery.collect();
    const modules = records.filter((r) => r.kind === "module");
    // MockAuditService has exactly 1 @RegisterModule
    expect(modules).toHaveLength(1);
  });

  it("should return module key correctly", () => {
    const records = discovery.collect();
    const [mod] = records.filter((r) => r.kind === "module");
    expect((mod as { kind: "module"; value: { key: string } }).value.key).toBe("audit");
  });
});
