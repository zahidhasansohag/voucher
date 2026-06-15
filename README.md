# My Hotspot Voucher Manager

A small personal voucher generator for your MikroTik router's WiFi Hotspot.
Generate WiFi vouchers (username/password pairs) in different durations
(1 hour, 1 day, 7 days, 30 days, etc.), printed as ticket stubs — and it
creates the matching Hotspot users directly on your router via the
RouterOS v7 REST API.

---

## 1. Prepare your MikroTik router

### 1.1 Enable Hotspot (if not already)
Use Winbox/WebFig: `IP > Hotspot > Hotspot Setup`, run the wizard on the
interface your WiFi clients connect through.

### 1.2 Create Hotspot User Profiles
`IP > Hotspot > User Profiles` — create one profile per package, e.g.:
- `default` (general profile, used for all packages by default in this app)

You can create more profiles (e.g. with different rate-limits / shared-users)
and reference them in `lib/voucher.ts` (see step 4).

### 1.3 Enable the REST API
RouterOS v7 ships the REST API over the same port as `www-ssl` (HTTPS, default 443)
or `www` (HTTP, default 80).

1. `IP > Services` — make sure `www-ssl` (or `www`) is **enabled**.
   - For HTTPS you'll need a certificate. Either:
     - Use a Let's Encrypt cert (RouterOS 7 supports this via `/certificate`), or
     - Use a self-signed cert (browsers/clients will warn, but the API still works).
2. Create a **dedicated API user** (don't use your main admin):
   - `System > Users > Add`
   - Group: create or use a group with `api`, `read`, `write`, `policy` permissions
     needed for `/ip/hotspot/user` (the `write` policy covers add/remove).
3. Make sure your router is reachable from the internet:
   - You said you already have DDNS/static IP — make sure the chosen port
     (443 or 80, or a custom port you forward) is open in `IP > Firewall`
     and forwarded if behind another NAT layer.

### 1.4 Test the API manually (optional but recommended)
```bash
curl -k -u api-user:yourpassword https://your-router.ddns.example.com:443/rest/ip/hotspot/user/profile
```
You should get back a JSON array of your hotspot user profiles.

---

## 2. Configure this app

### 2.1 Install dependencies
```bash
npm install
```

### 2.2 Set environment variables
Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Login for the voucher generator dashboard (this app, not the router) |
| `ADMIN_SESSION_SECRET` | Random long string used to sign the login session cookie |
| `ROUTER_HOST` | Your router's DDNS hostname or public IP (no `https://`, no port) |
| `ROUTER_PORT` | REST API port (443 for HTTPS, 80 for HTTP, or a custom forwarded port) |
| `ROUTER_USE_HTTPS` | `true` or `false` |
| `ROUTER_USER` / `ROUTER_PASS` | The dedicated API user you created in step 1.3 |

### 2.3 Customize voucher packages
Edit `lib/voucher.ts` → `VOUCHER_PLANS`. Each entry needs:
- `profile`: must match a Hotspot User Profile name on your router
- `limitUptime`: how long the voucher is valid once first used (e.g. `"1h"`, `"1d"`, `"7d"`)
- `label` / `durationLabel`: what's shown in the dashboard / printed ticket

### 2.4 Run locally
```bash
npm run dev
```
Visit `http://localhost:3000` → you'll be redirected to `/login`.

---

## 3. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel, "Add New Project" → import the repo.
3. In **Project Settings > Environment Variables**, add all the variables
   from `.env.example` with your real values.
4. Deploy.

⚠️ **Self-signed certificate note:** if your router uses a self-signed
HTTPS certificate, Node's `fetch` (used by Vercel's serverless functions)
will reject it by default. Options:
- Get a free Let's Encrypt certificate for your router's DDNS hostname
  (recommended), or
- As a workaround, set `ROUTER_USE_HTTPS=false` and use the plain HTTP
  REST API on a port you forward (less secure — only do this if you also
  restrict access, e.g. via firewall allow-list of Vercel's IP ranges,
  which change frequently and are hard to pin down — Let's Encrypt is
  strongly preferred).

---

## 4. Upload the Hotspot login page to your router

The file `hotspot-page/login.html` is the page your WiFi users see when
they connect and open a browser. Upload it to your router's Hotspot files:

1. Winbox → `Files` → drag `login.html` into the `hotspot` folder
   (it will overwrite the default `login.html`).
2. Optionally also copy any images/css you add there too.
3. Reconnect a device to your WiFi — you should see the new login page.

This page is static and runs on the **router itself** (not Vercel) — it's
what hotspot clients use to type in the voucher username/password that
your Vercel dashboard generated.

---

## 5. Daily usage

1. Open your Vercel app URL → log in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
2. Pick quantities for each package (e.g. 5× "1 Day", 2× "7 Days").
3. Click **Generate** — vouchers are created on your router instantly and
   shown as printable ticket stubs.
4. Click **Print tickets** to print and hand out / use yourself.

---

## Notes & limitations

- This is built for **personal/home use**: a single admin account, simple
  session auth. Don't expose `ADMIN_PASSWORD`/`ROUTER_PASS` or commit
  `.env.local` to git.
- Voucher list isn't stored in a database — the router itself is the
  source of truth (`/ip/hotspot/user`). The `/api/voucher/list` and
  `/api/voucher/delete` endpoints can be wired into a "manage vouchers"
  UI later if needed.
- If you rotate your router's DDNS/IP or change the API user, update the
  Vercel environment variables and redeploy.
