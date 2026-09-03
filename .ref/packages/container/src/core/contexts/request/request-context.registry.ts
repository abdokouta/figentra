import { InstanceWrapper } from "@/core/container/instance-wrapper";
import { RequestContext } from "@/core/contexts/request/request.context";

/** Tracks request contexts owned by an ApplicationContext. */
export class RequestContextRegistry {
  private readonly contexts = new Map<string, RequestContext>();

  public register(context: RequestContext): void {
    this.contexts.set(context.id, context);
  }

  public unregister(context: RequestContext): void {
    this.contexts.delete(context.id);
  }

  public getAll(): Iterable<RequestContext> {
    return this.contexts.values();
  }

  public clear(context: RequestContext, wrappers: Iterable<InstanceWrapper>): void {
    for (const wrapper of wrappers) {
      wrapper.clearRequestInstance(context.id);
    }
    this.unregister(context);
  }
}
