import type { InjectionToken } from "@stackra/contracts";
import type { IApplicationFactoryOptions } from "@/core/interfaces/application-factory-options.interface";

export interface WorkerFactoryOptions {
  /** Provider token/class resolved for every request. */
  readonly handler: InjectionToken;
  /** Application bootstrap options; Worker overrides shutdown/debug defaults. */
  readonly application?: Omit<IApplicationFactoryOptions, "shutdownHooks"> & {
    shutdownHooks?: false;
  };
}
