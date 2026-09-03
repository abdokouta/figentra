# ADR-0011 — Services Own Their Data

**Status:** ACCEPTED

## Decision

No service directly mutates another service's database.

## Communication

Use:

- APIs
- events
- projections
- references

## Rationale

Preserves bounded contexts and allows independent evolution.
