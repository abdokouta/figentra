# Architecture Change Control

## Changing an approved decision

1. Create ADR amendment or superseding ADR.
2. Explain the problem.
3. Explain current behavior.
4. Explain alternatives.
5. Explain migration.
6. Record consequences.
7. Mark old ADR SUPERSEDED.
8. Update architecture index.
9. Update affected standards/rules.
10. Update implementation plan.

## No silent architecture drift

Code must not silently introduce:
- new identity abstractions
- new authorization systems
- alternate query frameworks
- alternate UI architectures
- cross-service database dependencies

without an ADR.
