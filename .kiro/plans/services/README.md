# Service Plans

Deployable NestJS bounded-context plans. Services own control-plane APIs, synchronous decisions, and their durable domain state. They consume platform packages and communicate through canonical contracts/transports.

Current Kiro service specifications: identity, tenant, scope, IAM, policy, approval, monetization, entitlements, usage, notifications, audit, files, integrations, reporting, search, and workflow.

Each service gets an implementation plan tied to its `.kiro/specs/figentra-platform/services/*` specification.
