# DARKX-MD — Multi-Session WhatsApp Bot Panel

A multi-tenant WhatsApp bot (Baileys-based) with a web panel for pairing,
a voucher-gated access system, an admin panel, and a per-user settings
panel. Sessions are stored in MongoDB so it works on Heroku's ephemeral
filesystem and survives dyno restarts.

## How it works

**1. Pairing (`/pair`)**
A visitor types their WhatsApp number and taps **Pair**. This reveals a
voucher input field. They enter the voucher code an admin gave them and
tap **Connect**. If the voucher is valid (not expired, not over its
connection limit, and matches the number if it's locked to one), the
server starts a Baileys session for that number and requests a pairing
code using the constant custom code **`DARKXXMD`** — the same 8‑character
code every time, per Baileys' custom pairing code feature. The user enters
that code in WhatsApp → Linked Devices → Link with phone number.

**2. Vouchers (`/admin`)**
Admin logs in with `ADMIN_PASSWORD`. From the dashboard they generate a
voucher: optionally lock it to one phone number, set how many connections
it allows, and how many days it stays valid. The system generates a random
14-digit code. Each successful pairing consumes one connection; once the
limit is hit the voucher auto-deactivates.

**3. User login & settings (`/user/login`)**
A user enters their number. If that number has an active bot session, the
server sends a 6-digit OTP **as a WhatsApp message to that same number**
(so only someone holding that phone can read it). Entering the correct
OTP opens their **settings panel**, where they can customize their bot:
name, prefix, public/self mode, auto-read, auto status view, anti-delete,
and welcome message. Changes apply immediately to their running session.

## Project structure

```
index.js                  Boots MongoDB, web server, restores sessions
config/db.js               Mongoose connection
models/                    User, Session, Voucher schemas
lib/authState.js           MongoDB-backed Baileys auth state (creds/keys)
lib/sessionManager.js      Multi-session manager (start/stop/restore)
lib/otp.js                 OTP generation + delivery via WhatsApp
web/server.js               Express app + session middleware
web/routes/                 pair.js, admin.js, user.js
web/views/                  EJS templates for all pages
web/public/style.css        Shared styling
settings/config.js          Global branding + setPair constant
library/, plugins/          Original bot command logic (unchanged)
message.js                  Command router (lightly patched for per-user settings)
```

## Setup

1. Copy `.env.example` to `.env` and fill in:
   - `MONGO_URI` — your MongoDB connection string
   - `ADMIN_PASSWORD` — password for `/admin/login`
   - `SESSION_SECRET` — any long random string
2. `npm install`
3. `npm start`
4. Visit `http://localhost:3000/pair` to pair a number, `/admin/login` for
   the admin panel, `/user/login` for the user settings panel.

## Deploying to Heroku

```bash
heroku create your-darkx-md-app
heroku config:set MONGO_URI="mongodb+srv://..." ADMIN_PASSWORD="..." SESSION_SECRET="..."
git push heroku main
```

`Procfile` and `app.json` are already included, so `heroku create` +
`git push heroku main` (or the "Deploy to Heroku" button using `app.json`)
is enough. Since sessions are stored in MongoDB (not the local disk),
restarting the dyno won't log out already-connected numbers — the bot
auto-reconnects on boot via `restoreAllSessions()`.

## Notes / things to double-check before going live

- The MongoDB URI you shared earlier is a **real credential** — rotate it
  (change the database user's password in MongoDB Atlas) before putting
  this in any public repo or shared Heroku app, and only ever put it in
  environment variables, never committed to git (`.gitignore` already
  excludes `.env`).
- `setPair: "DARKXXMD"` in `settings/config.js` is the constant custom
  pairing code. Baileys requires this to be a plain alphanumeric string
  up to 8 characters — `DARKXXMD` fits that.
- The voucher and OTP flows are basic but functional; consider adding
  rate-limiting (e.g. `express-rate-limit`) on `/pair/connect` and
  `/user/login` before exposing this publicly, to avoid abuse.
- Only a handful of the original plugins were touched (`message.js`) to
  read prefix/branding from each user's saved settings; the rest of the
  command plugins are unchanged and still work per-session.
