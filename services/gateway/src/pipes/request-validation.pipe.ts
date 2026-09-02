/** @file request-validation.pipe.ts @description Strict request validation pipe. */
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { z } from "zod";

/** Zod-backed pipe used by Gateway DTOs. */
@Injectable()
export class ZodValidationPipe implements PipeTransform<unknown> {
  /** @param schema - Schema that defines the accepted request contract. */
  public constructor(private readonly schema: z.ZodType) {}

  /** Validates and returns the normalized payload. */
  public transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) throw new BadRequestException({ code: "VALIDATION_ERROR", message: "Request validation failed", details: result.error.flatten() });
    return result.data;
  }
}
