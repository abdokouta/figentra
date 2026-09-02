/**
 * @file audit.service.test.ts
 * @description Unit tests for append-only audit behavior.
 */
import { describe, expect, it, vi } from "vitest";
import { AuditService } from "../../src/audit/application/audit.service.js";

/**
 * Verifies audit hash chaining with a mocked transaction context.
 */
describe("AuditService", () => {
  it("appends a record linked to the previous stream hash", async () => {
    const created: any[] = [];
    const em: any = {
      transactional: async (fn: any) =>
        fn({
          getConnection: () => ({
            execute: vi.fn().mockResolvedValue(undefined),
          }),
          findOne: vi.fn().mockResolvedValue({
            recordHash: "previous-hash",
          }),
          create: (_entity: unknown, value: any) => value,
          persistAndFlush: async (value: any) => created.push(value),
        }),
    };

    const service = new AuditService(em);
    const result = await service.append({
      tenantId: "ten_1",
      action: "iam.permission.grant",
      outcome: "success",
      sourceService: "iam",
    });

    expect(result.previousHash).toBe("previous-hash");
    expect(result.recordHash).toMatch(/^[a-f0-9]{64}$/);
    expect(created).toHaveLength(1);
  });
});
