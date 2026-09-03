# ADR-0010 — Service Authentication Uses Service Principals

**Status:** ACCEPTED

## Decision

Internal services authenticate as Figentra service principals using short-lived
audience-bound credentials.

## Default protocol

OAuth 2.0 Client Credentials is the preferred application-level mechanism.

## Consequence

Infrastructure identity remains separate from Figentra identity.
