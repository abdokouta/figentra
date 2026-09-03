/**
 * @file example.service.test.ts
 * @description Unit tests for ExampleService. Tests the service in isolation
 *   without booting the NestJS module — pure function-level assertions.
 */

import { describe, expect, it } from "vitest";
import { ExampleService } from "../../services/example.service";

describe("ExampleService", () => {
  const service = new ExampleService();

  it("findAll returns the seed data", async () => {
    const result = await service.findAll();
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("name");
  });

  it("findOne returns the matching item", async () => {
    const result = await service.findOne("1");
    expect(result.id).toBe("1");
  });

  it("findOne throws NotFoundException for unknown ID", async () => {
    await expect(service.findOne("unknown")).rejects.toThrow("not found");
  });
});
