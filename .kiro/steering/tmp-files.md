# Temporary files & scratch space

Rules for where the agent writes throw-away files this session — drafts, diff
captures, log dumps, version-message drafts, generated fixtures, one-shot
scripts, anything the user did not ask to be checked in.

Read alongside `shell-commands.md` (the sibling guardrail for tool-invoked shell
commands) and `code-standards.md` (where committed source lives — never under
`.tmp/`).

## Rule — never write to `/tmp`; always use a workspace-local scratch dir

The system `/tmp` directory is off-limits for anything the agent produces via
its own tool calls. Every temporary file the agent writes MUST land inside the
workspace, under `.tmp/` at the repo root (preferred) or `tmp/` (fallback only
when a third-party tool cannot be redirected).

### Why

- **/tmp is invisible to the workspace.** `list_directory`, `read_file`,
  `grep_search`, the user's editor, git status, and every workspace-scoped hook
  cannot see `/tmp`. A draft the agent wrote to `/tmp/x.txt` is a draft the user
  cannot review with the same tools they read the rest of the project with.
- **/tmp is machine-global.** Two concurrent Kiro sessions in two different
  repos clobber each other. A file called `/tmp/version-msg.txt` is ambiguous;
  `.tmp/version-msg.txt` under this workspace is not.
- **/tmp is sandbox-hostile.** macOS sandboxes, Docker containers, and some CI
  runners either forbid `/tmp` writes or garbage-collect them mid-run.
- **A workspace-scoped scratch dir is grep-able, git-ignorable, auditable.**
  `ls .tmp/` enumerates everything the agent produced this session.

### The canonical location — `.tmp/`

`.tmp/` at the workspace root, with a leading dot:

- Matches every other workspace-tooling folder in the repo (`.kiro/`, `.turbo/`,
  `.husky/`, `.ref/`, `.changeset/`, `.doppler/`).
- Hidden from most editors' default file listings; the user never sees it unless
  they ask for it.
- Gitignored, so nothing under it can accidentally reach a commit.

`tmp/` (no dot) is an accepted fallback ONLY when a tool writes there and cannot
be redirected (e.g. some Playwright output dirs, some Docker compose-managed
volumes). Prefer `.tmp/` for every agent-authored file.

## Rule — create on demand, never assume it exists

`.tmp/` is not committed. Every command that writes into it creates the parent
first:

```sh
mkdir -p .tmp
git diff HEAD^ HEAD > .tmp/last-commit.diff
```

`fs_write` creates parent folders automatically, so
`fs_write path=".tmp/drafts/release-notes.md" text="..."` works without an
explicit `mkdir`.

## Rule — group by concern in subfolders

Anything larger than a single throw-away file groups by concern:

- `.tmp/diffs/` — captured `git diff` output, patches
- `.tmp/logs/` — command-output captures, dev-server logs
- `.tmp/drafts/` — draft commit messages, release notes, PR descriptions
- `.tmp/fixtures/` — throw-away test fixtures, seed data
- `.tmp/reports/` — generated audit or bench reports
- `.tmp/scripts/` — one-shot shell / TS scripts the agent wrote to prove a point
  but that are NOT meant to be committed

Committed reports (Kiro audit reports, ADRs, changesets) DO NOT belong under
`.tmp/`. They live under `.kiro/reports/`, `docs/adr/`, `.changeset/`
respectively.

## Rule — treat every file under `.tmp/` as throw-away

- Do not import from `.tmp/` in committed source.
- Do not reference `.tmp/` paths in docs, ADRs, or changesets — they are not
  stable.
- Do not rely on a file under `.tmp/` surviving between sessions.
- Clean up when a task completes and the artefact has been consumed (draft
  applied, diff reviewed, log inspected).

## Scope — what this rule governs

**Applies to** files the AGENT WRITES via its own tool calls:

- `fs_write`, `fs_append`
- `execute_bash` / `control_bash_process` command strings that write files
  (redirection, `tee`, `> file`)
- Hook `action.command` values that write files

**Does NOT apply to**:

- Files the user themselves opens or writes at `/tmp/*`. The editor context may
  surface a `/tmp/x.txt` the user opened; that is the user's editor state, not
  an agent write. Do not touch it. Produce the agent's own reply / draft in
  `.tmp/` and reference it back.
- Third-party tools that internally use `/tmp` (Doppler CLI temp files, system
  utilities, some Python venv helpers). Those are outside the agent's control
  and are not a violation.
- Files that BELONG in the repo and should be committed — those go to their
  canonical home per `code-standards.md`, never under `.tmp/`.

## Enforcement

- Grep every agent-authored shell command string (`execute_bash`,
  `control_bash_process`, hook `action.command`) and every `fs_write` /
  `fs_append` `path` for `/tmp/` — zero hits allowed.
- `.gitignore` must ignore both `.tmp/` and `tmp/`.
- Any file mentioned in an agent response with a `/tmp/...` path that the agent
  itself produced is a reviewable finding — rewrite to `.tmp/` or explain why
  the system path is required.

## When you're tempted

- **"But `/tmp` is one character shorter."** Consistency wins over one
  character. `.tmp/` is grep-able, workspace-scoped, and survives
  reboots-with-context intact.
- **"The file only lives for a few seconds."** Then it also fits in `.tmp/`. A
  file that lives for a few seconds in `.tmp/` costs zero; a file in `/tmp/`
  costs discoverability every time.
- **"The tool defaults to /tmp."** If the tool exposes an output path, redirect
  it to `.tmp/`. If it doesn't, document the exception in the task's reply so
  the user knows to look outside the workspace.

## Cross-references

- `shell-commands.md` — sibling guardrail for tool-invoked shell commands.
- `code-standards.md` — where committed source lives (never under `.tmp/`).
- `.kiro/hooks/session-start-no-tmp-folder.json` — the SessionStart hook that
  carries this rule into every session.
