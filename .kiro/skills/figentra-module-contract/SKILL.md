---
name: figentra-module-contract
description: Define a new Figentra module contract before implementation, including ownership, invariants, dependencies, APIs, events, persistence, jobs, schedules, security, observability, and tests.
---

# Figentra Module Contract

A module is a business ownership boundary, not merely a folder.

Define before coding:
1. purpose and authoritative owner;
2. entities/value objects and invariants;
3. commands, queries and application interfaces;
4. HTTP/OpenAPI routes and DTOs where applicable;
5. emitted and consumed events/messages;
6. repository ports, persistence schema and transactions;
7. dependencies and forbidden dependencies;
8. IAM permissions and tenant isolation rules;
9. jobs, consumers and schedules;
10. retries, idempotency, DLQ and recovery;
11. notifications and audit hooks;
12. logs, metrics, traces and health/readiness;
13. unit, integration, contract, architecture, security and failure tests;
14. deployment/configuration/secrets and migration strategy.

Keep all implementation concerns under the module. Cross-module access goes through explicit application contracts or typed messages, never another module's repository or infrastructure.