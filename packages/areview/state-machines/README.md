# @figentra/state-machines

Typed domain state machines for business state, separate from durable workflow orchestration.

Inspired by the useful separation in Spatie Laravel Model States: state objects/configuration, allowed transitions, transition handlers, guards and state-change events. It does not depend on Laravel, NestJS, a database or a workflow provider.

Use this package for states such as `draft -> submitted -> approved -> rejected`. Use `@figentra/workflows` when the process itself must survive failures, sleep, wait for approvals or execute across time.
