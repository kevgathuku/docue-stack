# Deployment Guide

One process (uberjar) plus a SQLite file. Local dev needs only Java +
the Clojure CLI — no Docker. The prod image builds the jar in-stage.

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
sudo ufw allow 80,443/tcp        # on-box firewall; mirror both in the DO cloud firewall
dokku storage:ensure-directory docue
dokku storage:mount docue /var/lib/dokku/data/storage/docue:/data
dokku domains:add docue notes.yourdomain.com   # optional; wildcard covers docue.<vhost>
dokku ports:set docue http:80:8000         # required: auto-map is host 8000, proxy must be 80
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

## Troubleshooting

**Domain connects but returns empty reply / times out while the app is healthy.**
Dokku auto-detects the port mapping from the image `EXPOSE` as `http:8000:8000`,
so nginx binds 8000 — never 80 — and port-80 requests fall through to the default
server, which closes them. Symptom: `curl http://<domain>/api/health` → empty
reply (52) or timeout, while the app answers fine at its container port.

Check: `dokku ports:report docue` (want `http:80:8000`) and
`dokku nginx:show-config docue | grep listen` (want `listen 80`).

Fix: `dokku ports:set docue http:80:8000`, re-verify the `listen` line, re-curl.
Host-port 8000 goes away with the explicit mapping — use the domain afterwards.
`letsencrypt:enable` adds the 443 mapping itself.

## Security checklist

- [ ] Strong `SESSION_SECRET` (exactly 16 bytes) and secrets only via env
- [ ] SQLite file persisted (volume) and backed up
- [ ] HTTPS in front (platform-provided or reverse proxy)
- [ ] Ports 80 + 443 open in *both* firewalls (UFW on-box *and* DO cloud panel) —
  a missing rule shows as TLS handshake reset, not a clean refusal
