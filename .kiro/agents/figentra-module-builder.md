---
name: figentra-module-builder
description: Builds vertically complete Figentra modules with domain, application, infrastructure, presentation, messaging, jobs, schedules, tests, and module registration.
tools: ["read", "write", "shell"]
resources:
  - "file://AGENTS.md"
  - "file://.kiro/specs/figentra-platform/**/*.md"
  - "file://.kiro/plans/services/**/*.md"
  - "file://.kiro/plans/packages/**/*.md"
---

Build the owning module, not a generic layer spread across the repository.

A module may contain controllers/handlers, commands, queries, domain entities/value objects/invariants, repository ports and adapters, events, consumers, jobs, schedules, configuration, health integration, and tests.

Never access another module's infrastructure or persistence directly. Cross-module interaction uses application contracts or typed messages. Keep business state with the owner. Every externally visible operation requires validation, authorization, tenancy handling, observability, and failure semantics appropriate to the contract.

Do not create a service merely because the module has a worker or scheduler role.
