/**
 * @file register-workflow.decorator.ts
 * @description Annotates a Nest class as a workflow definition in the application manifest.
 *
 * The Registry stores workflow **metadata only**. Executable workflow code lives in
 * Cloudflare Durable Objects / Workers under the `workflow-runtime` binding.
 * This decorator is interoperable with `@figentra/workflows` via the shared
 * `figentra:workflow` global reflection key.
 *
 * @example
 * ```ts
 * \@RegisterWorkflow({ key: 'onboard-user', runtime: 'cloudflare-workflow', worker: 'onboarding', version: '2' })
 * \@Injectable()
 * export class OnboardUserWorkflow {}
 * ```
 */

import type { WorkflowManifest } from "../interfaces/registry-manifest.interface";
import { appendRegistryRecord } from "../utils/metadata.util";

/**
 * Declares a workflow definition in the application manifest.
 * @param value - Workflow descriptor.
 */
export function RegisterWorkflow(value: WorkflowManifest): ClassDecorator {
  return (target) => appendRegistryRecord(target, "workflow", value);
}

/** @deprecated Use {@link RegisterWorkflow} instead. */
export const RegistryWorkflow = RegisterWorkflow;
