/**
 * @file terraform-job.schema.ts
 * @description Strict API schema for Terraform job requests.
 */
import { z } from "zod";

const environmentSchema = z.enum(["development", "staging", "production"]);

/**
 * Validates a safe Terraform job. The workspace is deliberately constrained
 * to the canonical environment so callers cannot target an unrelated state.
 */
export const terraformJobSchema = z.object({
  environment: environmentSchema,
  operation: z.enum(["plan", "apply", "destroy"]),
  revision: z.string().regex(/^[0-9a-f]{40}$/),
  workspace: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
  reason: z.string().min(10).max(500),
  approvalRef: z.string().min(3).max(128).optional(),
}).superRefine((value, ctx) => {
  if (value.workspace !== value.environment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["workspace"],
      message: "workspace must equal the canonical environment",
    });
  }
  if (value.environment !== "development" && value.operation !== "plan" && !value.approvalRef) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["approvalRef"],
      message: "staging and production mutations require an approval reference",
    });
  }
});
