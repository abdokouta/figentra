/** @file authenticated-request.interface.ts @description Request augmentation contract. */
import type { FastifyRequest } from "fastify";
import type { GatewayRequestContext } from "../types/request-context.type";

/** Fastify request enriched with trusted Gateway context. */
export interface AuthenticatedGatewayRequest extends FastifyRequest {
  /** Context established by the Gateway middleware/guard. */
  gatewayContext?: GatewayRequestContext;
}
