# Turborepo Standard

The root `turbo.json` is the monorepo task graph contract.

## Rules

- Keep `$schema` enabled for editor validation.
- Pin the schema URL to the installed Turbo version.
- Cache deterministic build and test outputs.
- Use `cache: false` only for persistent development tasks and external
  side-effecting operations such as deployment.
- Declare real outputs for artifact-producing tasks.
- Use `dependsOn: ["^build"]` for dependency build ordering.
- Keep lint/typecheck/format checks side-effect free.
- Keep secrets out of `globalEnv`.
- Use `globalDependencies` for repository-wide inputs.
- Keep task names aligned with package scripts.
- Do not disable cache globally as a substitute for correct input/output
  declarations.

Turborepo caching is a build acceleration mechanism; correctness comes from
complete task inputs and outputs.
