/**
 * @file example.service.ts
 * @module {{PACKAGE_NAME}}/modules/example/services
 * @description Example business-logic service. Demonstrates the canonical
 *   service shape: an @Injectable class that owns the domain logic.
 *   Controllers are thin — they delegate here.
 *
 *   Replace with your actual domain service.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import type { IExampleResponse } from "../interfaces/example.interface";

@Injectable()
export class ExampleService {
  /**
   * In-memory seed data. Replace with a repository / database call.
   */
  private readonly items: IExampleResponse[] = [
    { id: "1", name: "Example One", createdAt: new Date().toISOString() },
    { id: "2", name: "Example Two", createdAt: new Date().toISOString() },
  ];

  /**
   * List all example resources.
   *
   * @returns All items in the store.
   */
  async findAll(): Promise<IExampleResponse[]> {
    return this.items;
  }

  /**
   * Find a single example by ID.
   *
   * @param id - The unique identifier.
   * @returns The matching item.
   * @throws NotFoundException when no item matches.
   */
  async findOne(id: string): Promise<IExampleResponse> {
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      throw new NotFoundException(`Example with id "${id}" not found`);
    }
    return item;
  }
}
