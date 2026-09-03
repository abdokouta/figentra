/**
 * @file example.interface.ts
 * @module {{PACKAGE_NAME}}/modules/example/interfaces
 * @description Request/response DTOs and domain interfaces for the example
 *   module. Every interface that crosses the HTTP boundary lives here.
 *
 *   Replace with your actual domain interfaces.
 */

/**
 * Shape of an example resource returned by the API.
 */
export interface IExampleResponse {
  /** Unique identifier. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
}

/**
 * Shape of a create-example request body.
 */
export interface ICreateExampleRequest {
  /** Human-readable name (required, 1–255 chars). */
  readonly name: string;
}

/**
 * Shape of an update-example request body.
 */
export interface IUpdateExampleRequest {
  /** Human-readable name (optional). */
  readonly name?: string;
}
