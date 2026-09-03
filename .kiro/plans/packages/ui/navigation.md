---
status: canonical
component: package
package: "@stackra/navigation"
---
# Navigation — implementation plan

Cross-platform navigation state/composition for web/mobile/desktop. Router owns route semantics; navigation owns UX stack/tab/modal composition.

## API
Navigation container, stack/tab/modal primitives, typed actions/state, persistence/restore and platform adapters. No service implementation dependencies.

## Testing
State transitions, restore, back behavior, deep-link handoff, lifecycle and platform conformance.

## Exit criteria
Navigation is a reusable UI capability with deterministic state and no duplicate routing ownership.
