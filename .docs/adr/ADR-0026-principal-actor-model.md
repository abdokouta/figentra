# ADR-0026 — Principal and Actor Model

## Status

Accepted pending final domain validation.

## Decision

Do not create separate generic `person` and `user` abstractions merely for
terminology. The authorization subject is a platform principal. A principal may
represent a human identity or a machine/service identity. Actor terminology is
used only where a domain action requires an actor/audit subject.

Identity owns authentication identity data. IAM owns authorization identity and
access relationships. Domain services own business profiles and domain
attributes.

## Consequences

The platform avoids duplicating user/person records while still supporting human
and machine authorization.
