# Deployment Guide

One process (uberjar) plus a SQLite file. Local dev needs only Java +
the Clojure CLI — no Docker. The prod image builds the jar in-stage.

> Options comparison (Kamal vs Dokku vs jar):
> see [DEPLOYMENT-OPTIONS.md](./DEPLOYMENT-OPTIONS.md).

## Environment

Required in prod (the app throws at boot without them, except `PORT`):

| Var | Example | Notes |
|---|---|---|
| `APP_ENV` | `prod` | `dev` default prints login links to the console instead of mailing |
| `SQLITE_FILE` | `/data/docue.db` | Must live on persistent storage (Dokku mount) |
| `SESSION_SECRET` | output of `openssl rand -hex 8` | Exactly 16 bytes; sessions invalidate on change |
| `APP_URL` | `https://notes.yourdomain.com` | Base for absolute login/share links in mail |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | `smtp.resend.com` / `resend` / `re_xxx` | Port 587 + TLS by default (`SMTP_PORT` overrides; port 25 is blocked on DO) |
| `MAIL_FROM` | `login@yourdomain.com` | Domain must be verified in Resend |
| `PORT` | `8000` | Optional; must match the image `EXPOSE` — leave default |

## Option A: Dokku on a VPS (pinned path)

On the server (Dokku already set up):

```bash
dokku apps:create docue
dokku storage:ensure-directory docue
dokku storage:mount docue /var/lib/dokku/data/storage/docue:/data
dokku domains:add docue notes.yourdomain.com   # optional; wildcard covers docue.<vhost>
dokku config:set docue APP_ENV=prod SQLITE_FILE=/data/docue.db \
  SESSION_SECRET=$(openssl rand -hex 8) APP_URL=https://notes.yourdomain.com \
  SMTP_HOST=smtp.resend.com SMTP_USER=resend SMTP_PASS=re_xxx \
  MAIL_FROM=login@yourdomain.com
```

Without the storage mount the SQLite file dies on every redeploy. The root
`Dockerfile`, `Procfile` (`web: java -jar docue.jar`), and `app.json` (startup
check on `/api/health:8000`) are the deploy contract.

From the laptop:

```bash
git remote add dokku dokku@<droplet-ip>:docue   # once
git push dokku feat/dokku-deploy:main           # migrations run on boot
```

TLS only after the first HTTP deploy answers:

```bash
dokku letsencrypt:set docue email you@yourdomain.com
dokku letsencrypt:enable docue
```

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
