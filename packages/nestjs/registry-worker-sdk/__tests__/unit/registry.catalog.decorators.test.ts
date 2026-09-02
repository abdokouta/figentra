/**
 * @file registry.catalog.decorators.test.ts
 * @description Verifies that catalog-category decorators correctly append discovery records
 * in declaration order (bottom-up due to decorator application order).
 */

import "reflect-metadata";
import { REGISTRY_DISCOVERY_METADATA } from "../../src/constants/registry.constants";
import { RegisterWorkflow } from "../../src/decorators/register-workflow.decorator";
import { RegisterEvent } from "../../src/decorators/register-event.decorator";
import { RegisterFeature } from "../../src/decorators/register-feature.decorator";

@RegisterWorkflow({
  key: "identity.sync-users",
  version: "1",
  runtime: "cloudflare-workflow",
  worker: "workflow-runtime",
})
@RegisterEvent({
  key: "identity.users.synced",
  direction: "produces",
  topic: "identity.users.synced",
})
@RegisterFeature({ key: "identity.bulk-sync", defaultEnabled: true })
class RegistryMetadataFixture {}

describe("registry catalog decorators", () => {
  it("collects first-class day-one categories as metadata", () => {
    const records = Reflect.getMetadata(
      REGISTRY_DISCOVERY_METADATA,
      RegistryMetadataFixture,
    ) as Array<{ kind: string }>;

    // Decorators run bottom-up, so order is: feature → event → workflow
    expect(records).toBeDefined();
    expect(records.map((r) => r.kind)).toEqual(["feature", "event", "workflow"]);
  });

  it("should record the correct workflow key", () => {
    const records = Reflect.getMetadata(
      REGISTRY_DISCOVERY_METADATA,
      RegistryMetadataFixture,
    ) as Array<{ kind: string; value: { key: string } }>;

    const workflow = records.find((r) => r.kind === "workflow");
    expect(workflow?.value.key).toBe("identity.sync-users");
  });

  it("should record the correct event direction", () => {
    const records = Reflect.getMetadata(
      REGISTRY_DISCOVERY_METADATA,
      RegistryMetadataFixture,
    ) as Array<{ kind: string; value: { direction?: string } }>;

    const event = records.find((r) => r.kind === "event");
    expect(event?.value.direction).toBe("produces");
  });

  it("should record defaultEnabled for feature flags", () => {
    const records = Reflect.getMetadata(
      REGISTRY_DISCOVERY_METADATA,
      RegistryMetadataFixture,
    ) as Array<{ kind: string; value: { defaultEnabled?: boolean } }>;

    const feature = records.find((r) => r.kind === "feature");
    expect(feature?.value.defaultEnabled).toBe(true);
  });
});
