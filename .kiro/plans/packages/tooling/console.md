---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
type: tooling
package: "@stackra/console"
anchor_adrs: [ADR-0051, ADR-0090, ADR-0091, ADR-0092]
depends_on: ["@stackra/container", "@stackra/contracts", "@stackra/support", "@stackra/logger"]
---
# `@stackra/console` — CLI framework

**Status:** Planned — implementation contract

## Purpose

The workspace CLI framework. Ships a `bin/stackra` executable, `ConsoleModule`, command decorators, auto-discovery, interactive prompts, typed arguments/options, rendering helpers, config publishing and deterministic exit-code handling. CLI runtime dependencies are isolated to the CLI boundary per ADR-0051.

## Runtime dependencies

- `@clack/prompts` — prompts.
- `boxen` — boxes.
- `cli-table3` — tables.
- `ejs` — config template rendering.
- `picocolors` — terminal colors.
- `terminal-link` — terminal links.

## Non-goals

- Browser/mobile CLI runtime.
- Full-screen TUI framework.
- Business logic owned by the CLI; commands invoke service/package APIs.

## Public API — locked

```ts
@Command({ name:string, description:string, aliases?:string[], hidden?:boolean })
class CreateUserCommand extends BaseCommand {
  @Argument({ name:string, required?:boolean, description?:string }) email!: string;
  @Option({ name:string, short?:string, default?:unknown, type?:'string'|'boolean'|'number' }) role!: string;
  async handle(): Promise<void> {}
}

abstract class BaseCommand {
  info(message:string):void; warn(message:string):void; error(message:string):void;
  success(message:string):void; debug(message:string):void;
  prompt(question:string):Promise<string>; confirm(question:string):Promise<boolean>;
  select<T>(question:string, choices:readonly T[]):Promise<T>;
  multiselect<T>(question:string, choices:readonly T[]):Promise<T[]>;
  password(question:string):Promise<string>; text(question:string, options?:object):Promise<string>;
  table(rows:readonly unknown[]):void; box(content:string, options?:object):void;
  spinner(message:string):Spinner; progress(total:number):Progress;
}

interface CommandRegistry { register(command:CommandMetadata):void; get(name:string):CommandMetadata; list():CommandMetadata[]; }
interface ConsoleKernel { run(argv:readonly string[]):Promise<number>; }
```

## Command execution flow

1. Bootstrap the CLI container.
2. Discover `@Command`, `@Argument` and `@Option` metadata.
3. Validate command uniqueness and option definitions.
4. Parse argv with support for positional args, long/short options and `--` termination.
5. Resolve the command class from `CommandRegistry` through DI.
6. Populate validated arguments/options.
7. Invoke `handle()`.
8. Map known errors to safe terminal output and exit code.
9. Flush logger/telemetry and terminate with the command's exit code.

Exit codes: `0` success, `1` execution failure, `2` invalid usage. `--stack` enables diagnostic stack output.

## Source tree

```text
packages/console/
├── package.json
├── bin/stackra
├── src/
│   ├── core/
│   │   ├── console.module.ts
│   │   ├── kernel/{kernel.ts,argv-parser.ts,exit-code.enum.ts}
│   │   ├── base/base.command.ts
│   │   ├── decorators/{command.decorator.ts,argument.decorator.ts,option.decorator.ts,prompt.decorator.ts}
│   │   ├── registries/{command.registry.ts,discovery-loader.ts}
│   │   ├── services/{prompt.service.ts,render.service.ts,spinner.service.ts}
│   │   ├── constants/{command-metadata-key.ts,default-options.ts}
│   │   ├── errors/{command-not-found.error.ts,invalid-argument.error.ts,command-execution.error.ts}
│   │   ├── interfaces/{command.interface.ts,argument-metadata.interface.ts,option-metadata.interface.ts,console-options.interface.ts}
│   │   ├── publishing/{publish.command.ts,publisher.service.ts,ejs-renderer.ts}
│   │   ├── commands/{list.command.ts,help.command.ts,version.command.ts}
│   │   └── index.ts
│   └── testing/{console-tester.ts,captured-output.ts,prompt-mocker.ts,index.ts}
└── __tests__/unit/{kernel.test.ts,command-registry.test.ts,argv-parser.test.ts,base-command.test.ts,console-tester.test.ts}
```

## Discovery and validation

`CommandDiscoveryLoader` scans the DI graph at bootstrap for command metadata. Duplicate command names/aliases are fatal configuration errors. Argument and option metadata is validated before first command execution. Hidden commands remain callable by exact name but are omitted from default help.

## Config publishing

`stackra publish <package>` reads package metadata under `stackra.publish.config`, renders EJS templates and writes into the consuming application's config tree. Overwrite conflicts require explicit confirmation unless `--force` is supplied by a non-interactive CI policy. Published configuration never includes resolved secrets.

## Security

Terminal output is redacted by the same rules as `@stackra/logger`. Password prompts disable echo. Commands must not print credentials or tokens. Config publishing refuses writes outside the declared workspace root after canonical path validation. Package execution is not allowed to dynamically require arbitrary user-controlled paths.

## Reliability/performance

Interactive operations have cancellation support. Long-running commands expose progress but do not allocate unbounded output buffers. Non-interactive CI mode must work without TTY. Prompt operations return explicit cancellation rather than hanging indefinitely.

## Testing

`createConsoleTester(module)` boots a test module, executes commands, captures stdout/stderr, injects answers and returns exit code. Tests cover parsing, aliases, defaults, validation, prompt cancellation, rendering, publishing, exit codes and error mapping. Integration tests execute the built `bin/stackra` on supported Node versions.

## Implementation phases

1. Package scaffold, binary and ConsoleModule.
2. Kernel, argv parser and exit-code policy.
3. BaseCommand prompt/render/progress services.
4. Decorators, discovery and validation.
5. Config publishing and built-ins (`list`, `help`, `version`).
6. Testing harness and CI integration.
7. Security, failure injection and cross-platform verification.

## Exit criteria

- `stackra list`, `help`, `version` and command execution work from built artifacts.
- Decorated commands auto-register without manual wiring.
- Interactive and non-interactive modes are tested.
- `stackra publish` is deterministic, path-safe and secret-safe.
- Exit codes are stable and documented.
- No legacy barrel is required for new consumers.
