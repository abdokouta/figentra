/**
 * @file example.controller.ts
 * @module {{PACKAGE_NAME}}/modules/example/controllers
 * @description Example HTTP controller. Demonstrates the canonical handler
 *   shape: thin controller delegates to a service; validates input via DTOs;
 *   returns typed responses.
 *
 *   Replace with your actual domain controller.
 */

import { Controller, Get, Param } from "@nestjs/common";
import { ExampleService } from "../services/example.service";
import type { IExampleResponse } from "../interfaces/example.interface";

@Controller("examples")
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  /**
   * List all examples.
   *
   * @returns Array of example resources.
   */
  @Get()
  async findAll(): Promise<IExampleResponse[]> {
    return this.exampleService.findAll();
  }

  /**
   * Get a single example by ID.
   *
   * @param id - The example's unique identifier.
   * @returns The example resource.
   */
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<IExampleResponse> {
    return this.exampleService.findOne(id);
  }
}
