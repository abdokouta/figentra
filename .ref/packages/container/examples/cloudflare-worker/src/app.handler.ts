import { Injectable, REQUEST_SCOPE } from "@stackra/container";
import { HealthService } from "./health.service";

@Injectable({ scope: REQUEST_SCOPE })
export class AppHandler {
  constructor(private readonly health: HealthService) {}

  public handle(): Response {
    return Response.json(this.health.check());
  }
}
