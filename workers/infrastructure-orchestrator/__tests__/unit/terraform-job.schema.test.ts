import { describe, expect, it } from 'vitest';
import { terraformJobSchema } from '../../src/schemas/terraform-job.schema.js';

describe('terraform job policy', () => {
  const base = { revision: 'a'.repeat(40), reason: 'scheduled infrastructure change', approvalRef: 'CHG-123' };

  it('requires canonical environment/workspace identity', () => {
    expect(terraformJobSchema.safeParse({ ...base, environment: 'production', workspace: 'production', operation: 'plan' }).success).toBe(true);
    expect(terraformJobSchema.safeParse({ ...base, environment: 'production', workspace: 'staging', operation: 'plan' }).success).toBe(false);
  });

  it('requires approval for staging and production mutations', () => {
    expect(terraformJobSchema.safeParse({ ...base, environment: 'staging', workspace: 'staging', operation: 'apply' }).success).toBe(true);
    expect(terraformJobSchema.safeParse({ ...base, approvalRef: undefined, environment: 'staging', workspace: 'staging', operation: 'apply' }).success).toBe(false);
    expect(terraformJobSchema.safeParse({ ...base, approvalRef: undefined, environment: 'development', workspace: 'development', operation: 'apply' }).success).toBe(true);
  });
});
