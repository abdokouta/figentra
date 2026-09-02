# Documentation and Comments Standard

**Status: APPROVED**

## Principle

Figentra code is documentation-first.

The goal is not to add meaningless comments to every line. The goal is to make
architecture, contracts, invariants, security boundaries, configuration, and
public APIs self-explanatory.

## Required TSDoc

Every exported:

- class
- interface
- type
- function
- constant
- decorator
- Nest module
- controller
- provider
- DTO
- event
- command
- public adapter
- Worker handler/factory

must have a TSDoc block.

## File headers

Infrastructure/configuration/entrypoint files should have a short file-level
documentation block explaining:

1. what the file owns;
2. why it exists;
3. any non-obvious runtime constraint.

## Inline comments

Use comments for:

- security decisions;
- performance decisions;
- compatibility workarounds;
- Cloudflare binding semantics;
- migration constraints;
- data ownership;
- transactional/invariant boundaries.

Do not write comments that simply repeat the next line of code.

## Configuration

JSON files cannot contain comments. Document their intent in the nearest
README/standard and use JSONC where the tool explicitly supports it.

## Generated code

Generated framework boilerplate may be minimal, but once a file is owned by
Figentra it must follow this standard.

## Enforcement

The repository should eventually include an automated `docs:check` that verifies
TSDoc coverage for exported symbols. This check is intentionally separate from
Oxlint because documentation coverage is an architectural quality gate, not a
style rule.
