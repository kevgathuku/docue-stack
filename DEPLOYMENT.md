# Deployment Guide

One process plus a SQLite file. No build step for the app itself (Clojure runs
from source via the CLI); the Docker image bakes dependencies.

> Options comparison (Kamal vs Dokku vs Dokploy vs jar vs Fly):
> see [DEPLOYMENT-OPTIONS.md](./DEPLOYMENT-OPTIONS.md).

## Environment

```
PORT=8000
APP_ENV=prod                  # dev | test | prod
SQLITE_FILE=/data/docue.db    # required in prod
SESSION_SECRET=<16-byte secret>    # required
```

## Option A: Compose on a VPS

```bash
# set env in clojure/compose.yaml (or an env_file), then:
cd clojure
docker compose up -d --build
```

SQLite data lives in the `sqlite-data` volume. Back it up.

## Option B: Fly.io

```bash
cd clojure
fly launch                    # answers Docker automatically
fly secrets set SQLITE_FILE=/data/docue.db SESSION_SECRET=...
fly deploy
```

SQLite rides along as a file — mount a volume at the `SQLITE_FILE` path.

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
- [ ] SQLite file persisted (volume) and backed up
- [ ] HTTPS in front (platform-provided or reverse proxy)
