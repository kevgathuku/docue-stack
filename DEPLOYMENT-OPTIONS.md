# Deployment options for Docue — research (2026-10-08)

Question behind bead `docue-repo-3kc` (Deploy to DigitalOcean with Kamal, the current choice):
what other VPS options exist, and can a built jar replace Docker?

## Short answer

- **Yes, an uberjar works.** `docue.core` already has `(:gen-class)`; what's missing is a
  `tools.build` alias + `build.clj` uber task, then `clojure -T:build uber` and `java -jar`
  on any modern JRE. Migrations run on boot (`-main` calls `migrate!`), so no release-phase
  scripting in any option. But jar ≠ no-ops: you still need a database, TLS, mail, and
  restarts — it only removes the container layer.
- **Jar vs Docker is orthogonal to Kamal vs Dokku vs plain.** Kamal/Dokku all assume
  containers. (Dokploy was evaluated and ruled out — see below.) The jar matters for the "plain VPS, no Docker" path — or as a *smaller Docker
  image* (`java -jar` on a JRE base instead of the current `clojure -M` source-run image).
- **Pinned: SQLite + Dokku.** The SQLite port is bounded (surface below) and deletes
  the database question — no accessory, no plugin, no managed-PG bill. Plain Compose
  (Option 3) and uberjar+systemd (Option 4) stay as fallbacks if necessary.
- **SMTP is not a hard requirement either** — most mail providers offer SMTP endpoints that
  need zero code change, and an HTTP API needs only a small seam change.

## What every option must provide (as built, from repo source)

- **SQLite** (decided; port surface below) — today's code targets Postgres (`text[]` +
  `ANY(tags)`, PG date functions: `clojure/src/docue/{db,notes,magic}.clj`; `postgres:17`
  in `clojure/compose.yaml`), portable but not as-is.
- `APP_ENV=prod`, 16-byte `SESSION_SECRET`, `APP_URL` (login/share links are absolute),
  `PORT` (`clojure/src/docue/{db,router,core}.clj`). Not substitutable, just env.
- **Outbound SMTP** (`SMTP_HOST/USER/PASS`, `MAIL_FROM`) — passwordless login breaks
  without mail (`clojure/src/docue/mail.clj` throws when unset). Substitutable — see
  "Outbound mail without running SMTP".
- `/api/health` returns 200 JSON — use it as the health check everywhere.

## SQLite instead of Postgres

No production Postgres exists yet (only dev/test databases), so a port means re-baselining
rather than migrating data. Exact PG-specific surface, from repo source:

- `notes.clj:20` — `? = ANY(tags)` over a `text[]` column (plus `with-tags` reading
  `java.sql.Array`). The one real redesign: a `note_tags` side table or a JSON column.
- `magic.clj:20,29,58` — `now()`, `make_interval(...)`, `expires_at > now()` → SQLite
  `datetime('now')` / `datetime('now','+15 minutes')`.
- `notes.clj:59` — the `?::timestamptz` cast → drop it, compare ISO-8601 strings.
- Migrations `0001/0002/0004` — `SERIAL`, `TIMESTAMPTZ DEFAULT now()`, `INTERVAL`, `text[]`
  → SQLite DDL equivalents; `0007` backfill `md5(random()::text)` → `hex(randomblob(6))`.
- `RETURNING` (used in `users.clj`, `notes.clj`, `magic.clj`) is fine — SQLite supports it
  since 3.35 and the Xerial driver bundles a modern SQLite.
- Deps/config: add `org.xerial/sqlite-jdbc`, teach `db-url` a `jdbc:sqlite:` branch.
- Migratus sits on next.jdbc and its README exercises file-backed H2 DBs, so the SQLite
  combo is a spike-then-commit, not a gamble:
  <https://github.com/yogthos/migratus>.

Workload fit: single-writer locking is a non-issue for one user's notes (enable WAL);
conflict detection compares timestamps, which survives as string comparison. What it unlocks:

- Every option below loses its Postgres moving part — no Kamal accessory, no Dokku plugin,
  no managed-PG bill.
- Backups become file copies; off-box replication via **Litestream** (separate process
  streaming SQLite changes to S3-compatible storage, no code changes):
  <https://litestream.io/>.
- The jar+systemd path becomes one binary + one file — the simplest possible production.

## Outbound mail without running SMTP

Two routes, cheapest first:

1. **External service over SMTP — zero code change.** Most mail providers (SES, Brevo,
   Mailgun, …) expose SMTP endpoints: their host/user/pass drop straight into the existing
   `SMTP_HOST/USER/PASS` env and `postal` carries on. Do this before writing any code.
2. **External service over HTTP API — small seam change.** E.g. Resend is
   `POST https://api.resend.com/emails` with `Authorization: Bearer <key>` and JSON
   `{from, to[], subject, text}` (verified:
   <https://resend.com/docs/api-reference/emails/send-email>;
   Postmark/Mailgun/Brevo follow the same shape with their own token header). The change
   stays behind the existing `send-login-link!` seam that tests already stub
   (`clojure/test/docue/test_helpers.clj`), env becomes `<SERVICE>_API_KEY` + `MAIL_FROM`,
   and the call can go through the JDK's built-in `java.net.http` client — no new dep.
   Bonus: the `postal` dependency drops out.

Either way, budget the unglamorous half-hour: sender-domain SPF/DKIM verification at the
provider, else login mail lands in spam and the app looks broken while being fine.

## Option 1: Kamal 2.x on a DO droplet (bead's current choice)

With SQLite decided, the accessory below drops out — read this as a compute+TLS comparison.

- Install: `gem install kamal` (or the Docker-contained runner), `kamal init`, `kamal setup`
  installs Docker on the box via SSH.
  Source: <https://kamal-deploy.org/docs/installation>
- `kamal-proxy` listens on 80/443; **automatic HTTPS via Let's Encrypt on a single host**
  (`ssl: true` + `host` set, port 443 open for the challenge).
  Source: <https://kamal-deploy.org/docs/configuration/proxy>
- Postgres runs as an **accessory** (plain container, managed separately from deploys, no
  zero-downtime on the accessory itself); app zero-downtime comes from the proxy waiting for
  a 200 health response (default `GET /up` — point it at `/api/health`).
  Sources: <https://kamal-deploy.org/docs/installation>,
  <https://kamal-deploy.org/docs/configuration/accessories>
- Needs a container registry; M-series Macs build amd64 under emulation (slow first build).
- Stays as-is if reproducible image builds + proxy zero-downtime matter most.

## Option 2: Dokku on the same droplet (closest alternative)

- Install: one `bootstrap.sh` via apt, 5–10 min; needs **Ubuntu 22.04/24.04 (or Debian 11+),
  1 GB RAM minimum** — fits a $6–12 droplet.
  Source: <https://dokku.com/docs/getting-started/installation/>
- **Dockerfile deploys are native** (`git push dokku main`); a non-root Dockerfile is set via
  `dokku builder-dockerfile:set <app> dockerfile-path clojure/Dockerfile`.
  Source: <https://dokku.com/docs/deployment/builders/dockerfiles/>
- **Postgres is an official plugin** (currently defaults to PG 18.6 — the app needs nothing
  version-specific; confirm `--image postgres:17` pinning at create time if you care), with
  **scheduled S3 backups + encryption** built in (`postgres:backup-schedule`). Unneeded
  entirely under SQLite.
  Source: <https://github.com/dokku/dokku-postgres> (README)
- **TLS via the official letsencrypt plugin**, app stays online during validation,
  `letsencrypt:cron-job --add` auto-renews.
  Source: <https://github.com/dokku/dokku-letsencrypt> (README)
- **Zero-downtime via a `CHECKS` file** — point it at `/api/health`.
  Source: <https://dokku.com/docs/deployment/zero-downtime-deploys/>
- No registry, no emulation (builds natively on the droplet), no dashboard — SSH + CLI only.
- Best fit if git-push simplicity beats pinned artifacts: history stays immutable
  (revert + push), but each deploy rebuilds — rollback re-runs the build rather than
  re-running a byte-identical image.

## Ruled out: Dokploy

Evaluated and ruled out: a self-hosted dashboard (apps, databases, backups, Traefik) is
too much control plane on the same 2 GB box for a single-service, single-user app — the
Dokku CLI covers everything needed with fewer moving parts.
Source: <https://docs.dokploy.com/>

## Option 3: Plain Compose + Caddy (current `DEPLOYMENT.md` Option A)

- What the repo already documents; add Caddy (automatic TLS) in front.
- Deploys are `git pull && docker compose up -d --build` — seconds of downtime, no
  zero-downtime story. Fine for a personal-notes app with one user.
- Kept as a viable fallback if Dokku is ever out.

## Option 4: Uberjar + systemd + Caddy, no Docker

- Build: add `com.github.clojure/tools.build` + a `build.clj` uber task
  (guide: <https://clojure.org/guides/tools_build>), run `java -jar docue.jar`
  under a systemd unit, Caddy for TLS, database via apt-installed Postgres — or no
  database to install at all under SQLite (one binary + one file).
- Smallest runtime, but you own the JDK, systemd unit, log rotation, and backup cron;
  deploys are copy + `systemctl restart` (downtime unless you blue-green it).
- Only worth it to drop Docker entirely. As a middle path, **uberjar-inside-Docker**
  (JRE-only base, no CLI at runtime) improves *every* container option and can be a
  follow-up bead regardless of orchestrator.
- Kept as a viable fallback if Dokku is ever out.

## Cost sketch (at time of writing)

- DO Basic 2 GB droplet ≈ $12/mo (per the bead); Dokku's 1 GB minimum opens the cheaper
  grade. DO *managed* Postgres ≈ $15/mo — more than the droplet — so a Postgres-based
  setup would self-host PG on the box. Moot now: SQLite deletes this line item entirely.

## Recommendation (non-binding — the bead owns the decision)

- **Pinned: SQLite + Dokku.** Port first (`docue-repo-b02`: port, green suite, file-DB
  smoke), then git-push deploys with no database to run, CHECKS zero-downtime, LE
  auto-renew.
- **Fallbacks if necessary:** plain Compose/Caddy (Option 3) when zero-downtime is overkill;
  uberjar+systemd (Option 4) when Docker itself should go; Kamal (Option 1) only if the
  SQLite port stalls.
- **Mail via the provider's SMTP endpoint** regardless — zero code change.
- File the **uberjar-in-Docker** improvement separately; it pays off under any orchestrator.
