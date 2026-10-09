# Docue — private notes

A single-process web app for private notes: markdown editing with gated
preview, tags for organization, and read-only sharing by revocable link.

Every note is private to its author by default. No roles, no admin
interface, no public notes, no drafts. **Access rule: owner or token.**

Previously an Express + React system; rewritten in Clojure (see git history).
Documents previously visible within a role are now private to their author.

## Stack

Clojure (Reitit + Jetty + Hiccup), SQLite, Ring sessions, server-rendered
markdown. Details in [AGENTS.md](AGENTS.md) and [clojure/README.md](clojure/README.md).

## Run it

```bash
cd clojure
clojure -T:build uber      # build the jar (rebuild after source changes)
java -jar target/docue.jar # migrates + serves on :8000
```

## Test it

```bash
cd clojure
APP_ENV=test clojure -M:test -m docue.runner
clj-kondo --lint src test
```

## Use it

- `/` → your notes (sign up first, then log in)
- Write markdown, **Preview** button renders without saving, tag inline
- Note view → create/copy/regenerate/revoke the share link (`/s/:token`, read-only, no login)
