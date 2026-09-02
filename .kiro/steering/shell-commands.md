---
inclusion: always
---

# Shell command rules

Rules for shell commands executed through the agent's terminal tool —
`execute_bash`, `control_bash_process`, and hook `action.command` fields.

**Applies to every agent** — parent sessions AND sub-agents invoked via
`invoke_sub_agent`. Sub-agents inherit workspace steering; there is no opt-out.

## The one rule

**No `for` / `while` loops in tool-invoked shell commands.**

The `execute_bash` tool runs under the OS default shell (`zsh` on macOS) and
`zsh`'s word-splitting differs from `bash`'s. Loops that look identical between
shells silently misbehave in ways that leak past normal exit-code checks.

Failure modes:

- **Silent word-splitting.** In `zsh`, `for f in $(ls *.ts)` iterates ONCE over
  the whole space-joined string — not once per file. Exits `0`, does nothing.
- **Brittle `; do ... ; done` in one command string.** Stray globs matching
  nothing, empty variables, or non-zero exits inside the body hang, no-op, or
  time out.
- **Swallowed exit codes.** Loops without `set -e` mask failing iterations —
  tool returns success while the loop did nothing.
- **Stdin-blocked `read` in `while` loops** stall the whole tool call.

Zero exceptions to the ban. Every loop-shaped iteration lands in one of the five
alternatives below.

## The five alternatives — pick top-down

Reach for the FIRST option that fits. Every option below leaves shell
word-splitting out of the picture entirely.

### 1. Dedicated Kiro tools

If the goal is "iterate over files and read / grep / list them", the agent has
purpose-built tools with structured output:

- `grep_search` — regex across the workspace, returns `{ file, line, match }`.
- `file_search` — fuzzy filename search.
- `read_files` — read multiple files in one call.
- `list_directory` — one recursive listing.

**Never shell out to `grep -r`, `find`, `ls -R`, or `cat file1 file2`** when
these tools cover the case.

### 2. `xargs` / `find -exec` — single-command fan-out

For "run one command against N inputs" without conditionals:

```sh
# delete every dist folder
find . -type d -name dist -prune -exec rm -rf {} +

# prettier on every changed TS file
git diff --name-only --diff-filter=ACM \
  | grep -E '\.tsx?$' \
  | xargs -r pnpm prettier --write

# grep across explicit paths (no loop)
grep -rEln 'pattern' packages/framework/*/src
```

`xargs -r` (--no-run-if-empty) is important — otherwise `xargs` runs the command
once with no args when the pipe is empty.

### 3. Parallel `execute_bash` tool calls

For "N independent operations, want per-input attribution": issue N tool calls
in a single response. Kiro executes them in parallel and reports each output
separately.

```
# In one response:
execute_bash(command="git -C ~/dev/stackra status", ...)
execute_bash(command="git -C ~/dev/figentra-inc status", ...)
execute_bash(command="git -C ~/dev/academorix status", ...)
```

Better than any shell loop — each output is attributable, failures are per-call,
timeouts are per-call.

### 4. A `.tmp/scripts/*.mjs` Node script — CANONICAL for anything non-trivial

**When to reach for this**: > 3 items OR any conditional / aggregation / retry.
Node's `child_process.spawn` bypasses the shell entirely — zero word-splitting,
zero quoting hazards, cross-platform.

Copy-paste skeleton — literally rename `TODO`s and go:

```javascript
#!/usr/bin/env node
/**
 * @file TODO.mjs
 * @description TODO — one-line goal (e.g. "audit git status across every ~/dev repo").
 *
 * Runs via `node .tmp/scripts/TODO.mjs` — no shell involved.
 */
import { log, pool, sh, Reporter } from "../../scripts/_lib/index.mjs";

// The inputs to iterate over.
const items = ["TODO-1", "TODO-2", "TODO-3"];

const report = new Reporter("TODO");

await pool(items, 3 /* max parallel */, async (item) => {
  const handle = report.begin();
  try {
    // ── the actual work per item ──
    const result = await sh("echo", [item]);
    if (result.code !== 0) throw new Error(result.stderr || "non-zero exit");

    report.pass(`${item} — ${result.stdout.trim()}`, handle);
    log.success(`${item}`);
  } catch (err) {
    report.fail(item, err, handle);
    log.error(`${item}${err.message}`);
  }
});

report.print();
process.exit(report.exitCode);
```

`scripts/_lib/` already provides:

| Helper                      | What it does                                                   |
| --------------------------- | -------------------------------------------------------------- |
| `sh(cmd, args)`             | Run a command; returns `{ code, stdout, stderr }`. NO shell.   |
| `shOk(cmd, args)`           | Same, throws on non-zero.                                      |
| `pool(items, N, fn)`        | Parallel iteration with bounded concurrency.                   |
| `log.info/warn/error/...`   | Colorised, timestamped output.                                 |
| `log.section(name)`         | Section header.                                                |
| `Reporter`                  | Pass/fail/warn tally with pretty summary + non-zero exit code. |
| `loadSecrets()`             | Reads `.tmp/secrets/secrets.txt` into `process.env`.           |
| `parseArgs({ flags: ... })` | Typed CLI flag parsing.                                        |

Files under `.tmp/scripts/` are gitignored per `tmp-files.md` — the throw-away
tier. If a script proves useful more than once, promote it to `scripts/`.

### 5. `bash -c '...'` — the escape hatch, NOT a habit

When a genuine one-line shell operation absolutely requires bash-specific
behavior (rare — usually indicates option 1-4 was the correct choice):

```sh
bash -c 'set -euo pipefail; for f in packages/*/package.json; do jq -r .name "$f"; done'
```

Rules for the escape hatch:

- Wrap the entire pipeline in a single `bash -c '...'`.
- Always start with `set -euo pipefail` inside the wrapper — catches errors the
  outer `execute_bash` would miss.
- If the command grows past ~3 lines OR needs a variable set outside the
  wrapper, STOP — go to option 4 (Node script). The escape hatch is for
  one-liners only.

## When to reach for what — 30-second decision table

| Situation                                             | Use option                     |
| ----------------------------------------------------- | ------------------------------ |
| "Read / grep / list files"                            | 1 (Kiro tools)                 |
| "Run ONE command against every file matching X"       | 2 (xargs / find)               |
| "Run 2-5 independent commands, want per-call output"  | 3 (parallel tool calls)        |
| "Iterate 6+ items OR need retries / conditionals"     | 4 (Node script)                |
| "One-liner bash operation that xargs / find can't do" | 5 (bash -c)                    |
| "Any of the above under time pressure — pick fast"    | 4 (Node script — always works) |

## Scope

**Applies to** every `execute_bash` / `control_bash_process` invocation and
every hook `action.command` value — anything the agent hands to the OS shell as
a one-shot command string.

**Does NOT apply to** shell scripts the agent AUTHORS as file content (`.sh`
files under `scripts/`, fenced code blocks in documentation, `package.json`
script values). Those are read by humans and future shells; ordinary scripting
rules apply and quoting can be made bulletproof.

## Enforcement

Zero-hit greps that must pass:

- `\bfor\b .* do\b` or `\bwhile\b .* do\b` in any tool-invoked command string.
  Zero hits.
- `\bfor\b` / `\bwhile\b` inside a `bash -c '...'` block is ALLOWED (the escape
  hatch), but reviewers should verify option 4 wouldn't have been cleaner.

Sub-agent reviewers apply the same rule — invoke_sub_agent instructions inherit
this steering doc automatically.

## Cross-references

- [`tmp-files.md`](tmp-files.md) — where `.tmp/scripts/*.mjs` throw-away scripts
  live.
- [`code-standards.md`](code-standards.md) — where committed source lives (never
  under `.tmp/`).
- `scripts/_lib/index.mjs` — the `sh` / `pool` / `Reporter` helpers option 4
  uses.
- `scripts/dev/products.mjs`, `scripts/dev/backend.mjs`,
  `scripts/dev/frontend.mjs` — reference implementations of the pattern.
