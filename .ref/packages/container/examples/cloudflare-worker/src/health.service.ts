import { Inject, Injectable, REQUEST_SCOPE } from "@stackra/container";
import { WORKER_ENV } from "@stackra/container/worker";

export interface Env {
  APP_NAME?: string;
}

@Injectable({ scope: REQUEST_SCOPE })
export class HealthService {
  constructor(@Inject(WORKER_ENV) private readonly env: Env) {}

  public check(): { ok: true; app: string } {
    return { ok: true, app: this.env.APP_NAME ?? "stackra-worker" };
  }
}
