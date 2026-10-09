# AI Agent Development Guide

This document provides essential context for AI agents working on the Docue private-notes codebase.

## Project Overview

Docue is a single-process web app for private notes: markdown editing with
gated preview, tags, and read-only sharing by revocable link. Every note is
private to its author by default. No roles, no admin interface, no public
notes, no drafts.

**Access rule, one sentence:** owner or token.

## Architecture

```
clojure/
├── deps.edn            # deps + :test alias
├── src/docue/
│   ├── core.clj        # -main: migrate, serve Jetty
│   ├── router.clj      # Reitit routes (the app seam)
│   ├── views.clj       # Hiccup pages
│   ├── db.clj          # env-aware config + Migratus entry point
│   ├── users.clj       # user queries
│   ├── notes.clj       # note queries (owner-scoped) + share tokens
│   └── markdown.clj    # render + sanitize pipeline
├── resources/migrations/  # Migratus SQL
├── test/docue/         # ring-mock HTTP specs + shared helpers
├── Dockerfile
└── compose.yaml        # app + SQLite file
```

### Tech Stack

- **Language**: Clojure 1.12 (CLI + deps.edn)
- **HTTP**: Reitit + Jetty, Hiccup views (no client JS)
- **Database**: SQLite via next.jdbc + Xerial, Migratus migrations
- **Auth**: passwordless magic-link login, Ring cookie sessions
- **Markdown**: flexmark-java + OWASP sanitizer, rendered server-side at write time
- **Testing**: clojure.test + ring-mock at the HTTP seam
- **Lint**: clj-kondo, zero warnings (`clj-kondo --lint src test` from `clojure/`)
- **CI/CD**: GitHub Actions (tests + lint, no services)

## Key Patterns

- **Seam**: HTTP boundary. Tests assert status codes, redirects, rendered
  content — never internals. One seam; no new ones without agreement.
- **TDD**: red → green in vertical slices, one test + minimal code per cycle.
- **Ownership**: every note query scopes by owner; non-owners get not-found
  (existence is never disclosed). Share routes are read-only; nothing
  writes through a token.
- **Markdown**: source in, sanitized HTML out, both persisted. Preview posts
  unsaved markdown and renders without persisting.
- **Tags**: JSON array column, comma-separated input, `?tag=` filter.

## Environment Configuration

| Var | Default | Notes |
|---|---|---|
| `PORT` | `8000` | Jetty listen port |
| `APP_ENV` | `dev` | `dev`, `test`, or `prod` — selects the database |
| `SQLITE_FILE` | `docue.db` (`docue_test.db` under `test`); **required in prod** | SQLite file path |
| `SESSION_SECRET` | dev default; **required in prod** | 16-byte secret for session cookies |

## Development Workflow

### Starting Development

```bash
cd clojure
clojure -P                  # prefetch deps (once / after deps.edn changes)
clojure -M -m docue.core    # migrate + serve on :8000
```

### Running Tests

```bash
cd clojure
APP_ENV=test clojure -M:test -m docue.runner   # full suite (test DB only)
clj-kondo --lint src test                       # lint, zero warnings
```

The suite refuses to run without `APP_ENV=test` so fixtures can't wipe dev data.

### Paren emergencies (fixed sequence, in order)

1. `clj-kondo --lint src test` — pinpoints the exact line/col. Trust it over
   eyeballing; cascades below the first error are usually noise.
2. `clj-paren-repair <file>` — auto-fixes delimiter errors and reformats.
   Re-run kondo after; repeat 1–2 until clean.
3. Manual only if the tool leaves errors: count brackets by char code
   (`od -c`), never by eye — `]` vs `)` confusion is how these happen.

`rewrite-clj` was evaluated for this pipeline and deliberately excluded:
it parses broken code without complaint, so it contributes no error
signal beyond what kondo already gives. Its job is codemods, not repair.

### Before Committing

```bash
cd clojure
cljfmt check src test             # format gate (also enforced by hook + CI)
APP_ENV=test clojure -M:test -m docue.runner
clj-kondo --lint src test
```

Enable the pre-commit hook once per clone (runs the format gate on every commit):

```bash
git config core.hooksPath .githooks
```

## Getting Help

- Product spec: epic bead (user stories live there)
- Task tracking: beads (`bd ready`, `bd show <id>`, `bd close <id>`)
- Clojure specifics: `clojure/README.md`

## Key Principles

1. **Test everything** - Maintain 100% passing tests
2. **Format before commit** - cljfmt (hook + CI enforce it)
3. **Session validation** - Every note query scopes by owner (`owner or token`)
4. **Environment variables** - Never commit secrets (`.env` files, `.kamal/secrets`)
5. **Smallest complete change** - No abstraction, options, or "for later" code

---

**Last Updated:** Clojure single-process rewrite merged; Node system decommissioned
(archived at tag `js-final`).

**Status:** Working in `main`, awaiting deploy (`docue-repo-3kc`)

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:46cd31e7 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->

## Agent skills

### Issue tracker

Issues live in beads (`bd`), a Dolt-backed tracker in `.beads/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-label vocabulary (`needs-triage` … `wontfix`) applied to beads. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Definition of done

TDD in slices, self-review via `code-review`, gates green, then close. See `docs/agents/definition-of-done.md`.
