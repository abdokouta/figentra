/**
 * @file scheduler.config.ts
 * @module @stackra/scheduler/config
 */

import { registerAs } from "@stackra/config";
import { SCHEDULER_CONFIG } from "@stackra/contracts";

import type { ISchedulerModuleOptions } from "@stackra/scheduler";

export const schedulerConfig = registerAs<ISchedulerModuleOptions>(
  SCHEDULER_CONFIG,
  () => ({}),
);
