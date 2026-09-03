import type { InjectionToken } from "@stackra/contracts";
import { RequestContext } from "@/core/contexts/request/request.context";

export type RequestContextInput =
  | ReadonlyMap<InjectionToken, unknown>
  | Iterable<readonly [InjectionToken, unknown]>;

export class RequestContextFactory {
  public create(values: RequestContextInput = []): RequestContext {
    return new RequestContext(
      values instanceof Map ? values : new Map(values),
    );
  }
}
