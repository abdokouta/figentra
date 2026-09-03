# Documentation and Docblock Standard

## Required documentation

Document every:

- exported class
- exported function
- exported interface
- exported type
- exported enum
- exported constant
- public/protected class method
- class property
- non-trivial private method
- non-trivial private property
- route factory/handler
- service/use-case entrypoint
- decorator
- schema
- event/command/query contract
- important configuration block

Interface/type/enum/constant members should have member documentation when their
semantics are not obvious; platform code may require every member to be
documented for generated API documentation.

## Class example

```ts
/**
 * Coordinates durable infrastructure job execution.
 *
 * @remarks
 * This class owns orchestration concerns and must not contain Terraform
 * business rules.
 */
export class JobService {
  /** Durable persistence adapter used for job state. */
  private readonly repository: JobRepository;

  /**
   * Creates the job service.
   *
   * @param repository - Durable job persistence adapter.
   */
  constructor(repository: JobRepository) {
    this.repository = repository;
  }

  /**
   * Creates a new queued infrastructure job.
   *
   * @param input - Validated job request.
   * @returns Newly created job identifier.
   */
  async create(input: CreateJobInput): Promise<string> {
    // ...
  }
}
```

## Rules

A docblock must describe intent, contract, security assumptions, side effects,
or invariants. Do not write comments that merely repeat the identifier.

The standard is intentionally stricter than normal TypeScript because Figentra
is designed for large-scale AI-assisted development, static scanning, generated
documentation, and long-lived platform maintenance.
