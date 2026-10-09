# Docue (Clojure)

Server-rendered document management. Hiccup views, Ring sessions,
SQLite. See the epic bead for direction.

## Layout

```
clojure/
├── deps.edn            # deps + :build/:test aliases
├── build.clj           # uberjar task (default run path)
├── src/docue/
│   ├── core.clj        # -main: migrate, serve Jetty
│   ├── router.clj      # Reitit routes (the app seam)
│   ├── views.clj       # Hiccup pages
│   ├── db.clj          # env-aware config + Migratus entry point
│   ├── users.clj       # user queries
│   ├── notes.clj       # note queries (owner-scoped)
│   └── markdown.clj    # render + sanitize pipeline
├── resources/migrations/  # Migratus SQL migrations
├── test/docue/         # HTTP-seam specs (ring-mock) + runner
├── target/docue.jar    # built artifact (gitignored)
├── Dockerfile          # source-run fallback (Dokku uses root Dockerfile)
```

## Commands

```bash
cd clojure
clojure -P                    # prefetch deps
clojure -T:build uber       # build the jar (rebuild after source changes)
java -jar target/docue.jar  # migrate + serve on :8000
APP_ENV=test clojure -M:test -m docue.runner   # tests (against the test DB)
clj-kondo --lint src test    # lint (zero warnings is the bar)
```

## Environment

| Var | Default | Notes |
|---|---|---|
| `PORT` | `8000` | Jetty listen port |
| `APP_URL` | `http://localhost:$PORT` | Public base URL used to build absolute login links |
| `APP_ENV` | `dev` | `dev`, `test`, or `prod` — selects the database |
| `SQLITE_FILE` | `docue.db` (`docue_test.db` under `test`); **required in prod** | SQLite file path |
| `SESSION_SECRET` | dev default; **required in prod** | 16-byte secret for encrypted session cookies |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | unset (console backend) | **Required in prod** — SMTP for login links (`SMTP_PORT` defaults 587) |

Tests assert at the HTTP boundary (status codes, bodies) — never internals.
