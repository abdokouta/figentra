---
status: canonical
component: package
package: "@stackra/state-machine"
---
# `@stackra/state-machine` — implementation plan

Generic typed state-machine engine for explicit lifecycle transitions. It is persisted through database/ORM adapters and does not contain business states.

## API
State/transition types, transition guards, effects, versioned transition context, `StateMachine`, transition result and errors. Persistence adapter records current state/version and transition history where the owner requires it.

## Correctness
Atomic compare-and-swap/version checks, idempotent transition commands, explicit terminal states and deterministic guards. No side effects inside pure transition evaluation.

## Testing
Transition matrices, invalid transitions, concurrent transitions, idempotency, persistence rollback and serialization compatibility.

## Exit criteria
Services can model lifecycle invariants without duplicating state-machine engines or hiding concurrency semantics.
