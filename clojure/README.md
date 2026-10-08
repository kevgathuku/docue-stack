# Docue (Clojure)

Server-rendered document management. Hiccup views, Ring sessions,
Postgres. See the epic bead for direction.

## Layout

```
clojure/
├── deps.edn            # deps + :test alias (extra test path)
├── src/docue/
│   ├── core.clj        # -main: migrate, serve Jetty
│   ├── router.clj      # Reitit routes (the app seam)
│   ├── views.clj       # Hiccup pages
│   └── db.clj          # datasource + Migratus entry point
├── resources/migrations/  # Migratus SQL migrations
├── test/docue/
│   ├── router_test.clj # HTTP-seam specs (ring-mock)
│   └── runner.clj      # test entrypoint
├── Dockerfile
└── compose.yaml        # app + Postgres
```

## Commands

```bash
cd clojure
clojure -P                    # prefetch deps
APP_ENV=test clojure -M:test -m docue.runner   # tests (against the test DB)
docker compose up --build     # app on :8000 + Postgres
```

## Environment

| Var | Default | Notes |
|---|---|---|
| `PORT` | `8000` | Jetty listen port |
| `APP_ENV` | `dev` | `dev`, `test`, or `prod` — selects the database |
| `DATABASE_URL` | localhost `docue`; **required in prod** | JDBC URL for dev and prod |
| `TEST_DATABASE_URL` | localhost `docue_test` | JDBC URL used when `APP_ENV=test` |
| `SESSION_SECRET` | dev default; **required in prod** | 16-byte secret for encrypted session cookies |
| `ADMIN_PASSWORD` | unset (no seeding) | When set and no users exist, creates `admin` on boot |

Tests assert at the HTTP boundary (status codes, bodies) — never internals.
