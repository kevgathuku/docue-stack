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
clojure -M:test -m docue.runner   # tests (no DB needed for current specs)
docker compose up --build     # app on :8000 + Postgres
```

## Environment

| Var | Default | Notes |
|---|---|---|
| `PORT` | `8000` | Jetty listen port |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/docue` | JDBC URL; migrations run on boot |

Tests assert at the HTTP boundary (status codes, bodies) — never internals.
