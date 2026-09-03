import { z } from 'zod';

/** Validates workflow invocation requests before creating durable instances. */
export const workflowInvocationSchema = z.object({
  workflow: z.string().regex(/^[a-z0-9][a-z0-9._-]{1,159}$/),
  version: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$/).optional(),
  payload: z.unknown(),
  id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/).optional(),
  metadata: z.record(z.string().max(100), z.unknown()).optional(),
});
