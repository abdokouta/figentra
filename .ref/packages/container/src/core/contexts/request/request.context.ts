import type { InjectionToken } from "@stackra/contracts";

/** Runtime values supplied to a request-scoped resolution context. */
export type RequestContextValues = ReadonlyMap<InjectionToken, unknown>;

export class RequestContext {
  public readonly id: string;
  public readonly values: RequestContextValues;

  public constructor(values: RequestContextValues = new Map()) {
    this.id = `request_${Math.random().toString(36).slice(2, 10)}`;
    this.values = values;
  }

  public has(token: InjectionToken): boolean {
    return this.values.has(token);
  }

  public get<T>(token: InjectionToken<T>): T | undefined {
    return this.values.get(token) as T | undefined;
  }
}
