# Deployment Guide

One process plus Postgres. No build step for the app itself (Clojure runs
from source via the CLI); the Docker image bakes dependencies.

## Environment

```
PORT=8000
APP_ENV=prod                  # dev | test | prod
DATABASE_URL=<postgres jdbc url>   # required
SESSION_SECRET=<16-byte secret>    # required
ADMIN_PASSWORD=<set once>          # creates admin on empty DB, then unset
```

## Option A: Compose on a VPS

```bash
# set env in clojure/compose.yaml (or an env_file), then:
cd clojure
docker compose up -d --build
```

Postgres data lives in the `pgdata` volume. Back it up.

## Option B: Fly.io

```bash
cd clojure
fly launch                    # answers Docker automatically
fly secrets set DATABASE_URL=... SESSION_SECRET=... ADMIN_PASSWORD=...
fly deploy
```

Use a managed Postgres (or Fly Postgres) — set its JDBC URL as `DATABASE_URL`.

## Post-deploy checks

```bash
curl https://your-app.example.com/api/health
# {"status":"ok",...}

curl -s https://your-app.example.com/ | head -c 100
# login page HTML (302 to /login when anonymous)
```

Log in, create a markdown note, preview it, tag it, share-link round trip,
log out.

## Security checklist

- [ ] Strong `SESSION_SECRET` (exactly 16 bytes) and secrets only via env
- [ ] Postgres authenticated, network-restricted
- [ ] HTTPS in front (platform-provided or reverse proxy)
- [ ] `ADMIN_PASSWORD` unset after first boot
