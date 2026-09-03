# ADR-0027 — Dynamic Scope and Tenancy

## Status

Accepted.

## Decision

Figentra does not hard-code a universal hierarchy such as tenant → organization
→ branch → team. Scope is a dynamic authorization/context primitive.

A scope has a stable scope type and scope identifier. Domain models may belong
to one or more supported scope dimensions according to their bounded context.
Scope relationships and inheritance are explicitly declared rather than inferred
from arbitrary database nesting.

Tenant and organization concepts may exist in business domains, but the Scope
service provides the common context/authorization substrate.

## Consequences

Different SaaS applications can model different hierarchies without changing the
core IAM architecture.
