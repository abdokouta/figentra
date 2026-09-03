---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://console-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/console` — CLI framework

**Status:** Planned (already used by workspace scripts; needs plan of record)
**Anchor ADRs:** [ADR-0051](../../.docs/adr/ADR-0051-cli-package-dependencies-exception.md),
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md)
**Reference:** `.ref/packages/console/`
**Depends on:** `@stackra/container` (Task 13), `@stackra/contracts` (Task 6),
`@stackra/support`, `@stackra/logger` (optional)
**Design effort:** 18 days across 8 phases

## Purpose

The workspace CLI framework. Ships a `bin/stackra` binary + a
`ConsoleModule` DI module + auto-discovery of `@Command()`-decorated classes.
Consumers author commands as classes; the kernel resolves them via
`@stackra/container` + wires interactive prompts + typed args.

CLI runtime is the canonical exception to the zero-runtime-deps rule per
ADR-0051 — the six deps listed below are CLI-time only + the binary IS their
sole caller.

**Runtime dependencies (per ADR-0051):**

- `@clack/prompts` — interactive prompts.
- `boxen` — bordered output.
- `cli-table3` — table rendering.
- `ejs` — template rendering (config publishing).
- `picocolors` — colored output.
- `terminal-link` — clickable terminal links.

## Non-goals

- General-purpose Node CLI framework — this is workspace-scoped; commands live
  in workspace packages + auto-discover via `@stackra/container`.
- Interactive TUI (full-screen apps) — that's a different concern; stick to
  prompt-driven command execution.
- Cross-runtime (browser CLI) — CLI runs on Node/Bun. Browser doesn't need it.

## Public API — locked

### `@Command(options)` decorator

```typescript
@Command({
  name: "user:create",
  description: "Create a new user",
  aliases: ["u:c"],
  hidden: false,     // hide from help; default false
})
export class CreateUserCommand extends BaseCommand {
  @Argument({ name: "email", required: true, description: "User email" })
  email!: string;

  @Option({ name: "role", short: "r", default: "member", description: "User role" })
  role!: string;

  @Option({ name: "verbose", short: "v", type: "boolean" })
  verbose!: boolean;

  async handle(): Promise<void> {
    // this.info(), this.error(), this.prompt() — inherited
    const confirmed = await this.confirm(`Create user ${this.email}?`);
    if (!confirmed) return this.warn("Cancelled");

    await this.userService.create({ email: this.email, role: this.role });
    this.success("User created");
  }
}
```

### `BaseCommand`

Every command extends this. Provides:

- **Output helpers** — `.info()`, `.warn()`, `.error()`, `.success()`,
  `.debug()` (respects `verbose` flag).
- **Prompts** — `.prompt(question)`, `.confirm(question)`, `.select(question,
  choices)`, `.multiselect(question, choices)`, `.password(question)`,
  `.text(question, options?)`.
- **Rendering** — `.table(rows)`, `.box(content, options?)`, `.spinner(msg)`.
- **Progress** — `.progress(total).increment().finish()`.
- **DI access** — `this.container` returns the resolver; injected services
  available via `@Inject`.

### `ConsoleModule`

```typescript
@Module({
  imports: [ConsoleModule.forRoot({ commandsDir: "./commands" })],
})
export class AppModule {}
```

Auto-discovers every `@Command()`-decorated class in the module graph +
registers them in `CommandRegistry`.

### `stackra <command>` binary

- `stackra list` — list every registered command.
- `stackra help <command>` — help for one command.
- `stackra <command:name> [args] [options]` — execute.
- `stackra --version` — package version.
- `stackra --stack` — full stack trace on failure.

### `Kernel` service

The command execution orchestrator. Every request routes through here:

1. Parse argv (via `yargs-parser` or hand-rolled — TBD).
2. Look up command in `CommandRegistry`.
3. Instantiate via container.
4. Populate `@Argument()` + `@Option()` fields from parsed argv.
5. Invoke `.handle()`.
6. Handle exit code.
7. Persist telemetry (optional — via `@stackra/logger`).

### `@stackra/console/testing`

- `createConsoleTester(module)` — boot the module + run commands in a test.
- `.execute("user:create foo@bar.com --role=admin")` — returns exit code +
  captured stdout / stderr.
- `.answer(question, answer)` — auto-answers `prompt`/`confirm`/`select`.
- `assertOutput(matcher)`.

## Subpath layout

```
packages/console/
├── package.json                          # 3 subpath exports + bin
├── bin/
│   └── stackra                           # #!/usr/bin/env node — bootstraps Kernel
├── src/
│   ├── core/                             # ".": platform-agnostic runtime
│   │   ├── console.module.ts
│   │   ├── kernel/
│   │   │   ├── kernel.ts
│   │   │   ├── argv-parser.ts
│   │   │   └── exit-code.enum.ts
│   │   ├── base/
│   │   │   └── base.command.ts
│   │   ├── decorators/
│   │   │   ├── command.decorator.ts
│   │   │   ├── argument.decorator.ts
│   │   │   ├── option.decorator.ts
│   │   │   └── prompt.decorator.ts
│   │   ├── registries/
│   │   │   ├── command.registry.ts
│   │   │   └── discovery-loader.ts       # OnApplicationBootstrap
│   │   ├── services/
│   │   │   ├── prompt.service.ts         # wraps @clack/prompts
│   │   │   ├── render.service.ts         # wraps boxen/cli-table3
│   │   │   └── spinner.service.ts
│   │   ├── constants/
│   │   │   ├── command-metadata-key.ts
│   │   │   └── default-options.ts
│   │   ├── errors/
│   │   │   ├── command-not-found.error.ts
│   │   │   ├── invalid-argument.error.ts
│   │   │   └── command-execution.error.ts
│   │   ├── interfaces/
│   │   │   ├── command.interface.ts
│   │   │   ├── argument-metadata.interface.ts
│   │   │   ├── option-metadata.interface.ts
│   │   │   └── console-options.interface.ts
│   │   ├── publishing/                   # config publishing (Laravel-style)
│   │   │   ├── publish.command.ts        # bundled: `stackra publish <package>`
│   │   │   ├── publisher.service.ts
│   │   │   └── ejs-renderer.ts
│   │   ├── commands/                     # built-in commands
│   │   │   ├── list.command.ts
│   │   │   ├── help.command.ts
│   │   │   └── version.command.ts
│   │   └── index.ts
│   ├── testing/                          # "./testing"
│   │   ├── console-tester.ts
│   │   ├── captured-output.ts
│   │   ├── prompt-mocker.ts
│   │   └── index.ts
│   └── testing.ts                        # legacy barrel — deprecated (kept for compat)
└── __tests__/
    └── unit/
        ├── kernel.test.ts
        ├── command-registry.test.ts
        ├── argv-parser.test.ts
        ├── base-command.test.ts
        └── console-tester.test.ts
```

## Discovery loader

`CommandDiscoveryLoader implements OnApplicationBootstrap` — scans the
container for every provider carrying the `COMMAND_METADATA` symbol and
registers each in `CommandRegistry`. Follows the ADR-0092 auto-registration
convention.

## Config publishing

`stackra publish <package>` command copies EJS-rendered configs from a
package's `config/` folder into the consuming app's config dir. Enables the
"publish config to override defaults" workflow Laravel-style consumers expect.

Every `@stackra/*` package that ships defaults declares:

```jsonc
// package.json
{
  "stackra": {
    "publish": {
      "config": "./config/**/*.ejs"
    }
  }
}
```

Consumers run `stackra publish @stackra/cache` and get the config files copied
into their `config/` dir.

## Phases

### Phase 1 — Scaffold (1 day)

- [ ] Package skeleton + `bin/stackra` entry.
- [ ] `ConsoleModule.forRoot()` + `CommandRegistry`.

### Phase 2 — Kernel + argv (3 days)

- [ ] `Kernel.run(argv)` — resolves command + executes.
- [ ] Argv parser — long + short opts, positional args, `--` terminator.
- [ ] Exit code handling — `0` success, `1` error, `2` invalid usage.

### Phase 3 — BaseCommand + services (3 days)

- [ ] `BaseCommand` w/ every output helper.
- [ ] `PromptService` wraps `@clack/prompts`.
- [ ] `RenderService` wraps `boxen` + `cli-table3` + `picocolors`.
- [ ] `SpinnerService` — indefinite + finite progress.

### Phase 4 — Decorators + discovery (2 days)

- [ ] `@Command`, `@Argument`, `@Option`, `@Prompt` decorators.
- [ ] `CommandDiscoveryLoader` at bootstrap.
- [ ] Reflection-based param injection.

### Phase 5 — Config publishing (2 days)

- [ ] `stackra publish <package>` command.
- [ ] EJS renderer for tokenised configs.
- [ ] Conflict resolution — prompts on overwrite.

### Phase 6 — Built-in commands (1 day)

- [ ] `list`, `help`, `version`.
- [ ] Formatted help output using RenderService.

### Phase 7 — Testing (2 days)

- [ ] `createConsoleTester()` — captures stdout / stderr.
- [ ] `PromptMocker` — auto-answers prompts in tests.
- [ ] Every built-in command tested.

### Phase 8 — Verification (4 days)

- [ ] Every workspace-authored script that currently invokes `node scripts/*.mjs`
      migrates to `stackra <cmd>` OR documents why not.
- [ ] `stackra publish` verified end-to-end (cache config → project's
      `config/cache.ts`).
- [ ] Cross-runtime — CLI runs on Node 24, verified in CI.
- [ ] 85% branch coverage (CLIs are hard to reach 95%).

## Exit criteria

- [ ] `stackra list` outputs every command in the workspace.
- [ ] `stackra <cmd> --help` produces formatted help.
- [ ] Interactive prompts work (verified w/ manual test + `PromptMocker`).
- [ ] `stackra publish @stackra/cache` copies configs correctly.
- [ ] Testing helpers work — every consumer package's commands testable
      without a real terminal.
- [ ] Exit codes correct: 0 success, 1 error, 2 invalid usage.
- [ ] Every ref-package command migrated (if any).

## Cross-refs

- ADR-0051 — CLI runtime dependencies exception.
- `.ref/packages/console/` — reference implementation.
- `@stackra/container` — DI foundation.
- `@stackra/logger` — optional command-execution logging.
- Every package's `stackra.publish` field — config publishing contract.
