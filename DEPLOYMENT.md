# Deploying the SFGC Platform

Local development is covered in the [README](./README.md). This is what you do when you
want other people — students on their phones, visitors on the web — to actually use it.

There is one hard dependency to get right first: **the API must be reachable over HTTPS at
a stable public address.** The website and both APKs are just clients of it. An APK built
against `http://192.168.1.5:4000` works only on your own Wi-Fi and will look broken to
everyone else.

---

## Order of operations

1. Deploy the **API** → get a public HTTPS URL
2. Point the **website** at it and deploy the site
3. Put that URL into `eas.json` for both apps
4. Build the **APKs**

Doing this out of order means rebuilding the APKs, which is the slowest step.

---

## 1 · The database

You are already on Supabase, so the database needs no separate deployment — only the right
connection strings.

In your Supabase dashboard → **Project Settings → Database → Connection string**:

- **Transaction** mode (port `6543`) → `DATABASE_URL`, used at runtime
- **Session** mode (port `5432`) → `DIRECT_URL`, used by Prisma Migrate

Keep `?pgbouncer=true&connection_limit=10&pool_timeout=20` on `DATABASE_URL`.

`pgbouncer=true` is what lets many short-lived connections share a few real ones; without it
you exhaust Supabase's connection limit and start seeing `too many connections` under load.

`connection_limit=10`, not 1. With a single connection the whole API is serialised through
it — `authenticate` reads the user row on every request before the handler runs, so one class
screen costs four sequential round trips, and every `Promise.all` in the codebase becomes
decorative because the pairs queue instead of overlapping. That is not theoretical: it took
the admin panel down at 47 users with Prisma `P2024` pool timeouts. Supabase's transaction
pooler serves 10 from a single Render instance comfortably.

`pool_timeout=20` because Prisma's default is 10 seconds, and a request that waits longer
**fails** rather than merely being slow.

Before the first deploy, create the schema from your machine:

```bash
npm run db:push      # or: npm run db:migrate  to keep versioned migrations
npm run db:seed      # optional — demo data
```

> For a real deployment, prefer `db:migrate` locally and `npx prisma migrate deploy` in the
> release step. `db:push` is convenient but keeps no history, so you cannot roll a schema
> change back.

---

## 2 · The API

The backend is a plain Node HTTP server, so anything that runs Node works. Render and
Railway are the least-friction options; both have usable free tiers.

### Render

Create a **Web Service** from the repository:

| Setting | Value |
| --- | --- |
| Root directory | *(leave blank — it is a monorepo)* |
| Build command | `npm install && npm run build --workspace backend` |
| Start command | `node backend/dist/server.js` |
| Health check path | `/api/health` |

The `postinstall` hook in `backend/package.json` runs `prisma generate`, so the client is
built automatically.

### Environment variables

Set these on the service — **never commit them**:

```env
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20
DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
JWT_SECRET=<a fresh 48-byte random string — NOT the one in your local .env>
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://your-site.vercel.app
```

Optional — only needed for picture uploads in the staff panel at `/admin`:

```env
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<the service_role key, NOT the anon key>
SUPABASE_MEDIA_BUCKET=media
```

Create the bucket first: **Storage → New bucket → `media` → tick "Public bucket"**. The
keys are under **Project Settings → API**.

Leave these unset and the API still boots and serves everything else; `/api/media/upload`
answers that it is not configured, and the panel disables its upload button and offers a
paste-a-URL field instead.

`service_role` bypasses row-level security. It belongs on the API only — never in
`web/.env.local`, and never in an `EXPO_PUBLIC_*` variable, both of which ship to the
client.

Generate the secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Two things the app enforces on boot, deliberately:

- it **refuses to start in production** with the placeholder `JWT_SECRET`
- it validates every variable and exits with a readable message rather than failing later
  on a confusing database error

### CORS

`CORS_ORIGINS` is a comma-separated allow-list of **browser** origins. Add your website's
domain, and any preview domain you use. The mobile apps send no `Origin` header, so they
are always allowed — they are authorised by their JWT, not their origin.

Verify after deploy:

```bash
curl https://your-api.onrender.com/api/health
# {"success":true,"data":{"status":"ok","uptime":12.3,"db":"up"}}
```

If `db` says `down`, the service is up but the connection string is wrong.

---

## 3 · The website

Vercel is the natural host for Next.js.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `web` |
| Install command | `npm install --prefix ../ ` *(monorepo — see note)* |
| Build command | `npm run build` |

> **Monorepo note.** Vercel needs to install from the repository root so the `@sfgc/shared`
> workspace link resolves. In the project settings, enable
> *"Include files outside the root directory"*. If the build cannot find `@sfgc/shared`,
> that setting is why.

Environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api
API_URL=https://your-api.onrender.com/api
```

Both are needed: `API_URL` is used by Server Components during rendering,
`NEXT_PUBLIC_API_URL` is inlined into the browser bundle for the registration form.

Then go back and add the resulting domain to the API's `CORS_ORIGINS`.

Event and notice pages use `export const revalidate = 60`, so new events appear within a
minute without a redeploy.

---

## 4 · The APKs

### One-time setup, per app

```bash
npm i -g eas-cli
eas login

cd apps/teacher-app
eas init          # writes a real projectId into app.json
```

`eas init` replaces the placeholder `extra.eas.projectId` (`00000000-…`). **Push
notifications do not work until this is a real id** — the Expo push service will not issue
a token without one.

Repeat for `apps/student-app`. They are separate Expo projects with separate ids and
separate Android package names (`in.ac.sfgc.teacher` and `in.ac.sfgc.student`), so both can
be installed on the same phone.

### Point them at the deployed API

Edit `eas.json` in **both** apps and replace the placeholder host:

```jsonc
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" },
  "env": { "EXPO_PUBLIC_API_URL": "https://your-api.onrender.com/api" }
}
```

The value in `eas.json` wins over the local `.env` during an EAS build, so this is the one
that ends up compiled into the APK.

### Build

```bash
cd apps/teacher-app
eas build --platform android --profile preview
```

EAS builds in the cloud and gives you a download link and a QR code. The `preview` and
`production` profiles both emit an **APK** you can sideload; `production-aab` emits an
Android App Bundle for the Play Store.

On first build EAS offers to generate an Android keystore — say yes and let it manage the
credentials, unless you already have a keystore you must keep.

### Monorepo builds

EAS detects the npm workspace and installs from the root automatically. The Metro configs
in both apps already set `watchFolders` and `nodeModulesPaths` for the monorepo, and
`disableHierarchicalLookup` so Metro cannot accidentally bundle the website's React 18
into a React 19 app.

### Installing

Send the APK link to a phone, open it, and allow "install from unknown sources". No Play
Store account is needed for internal distribution.

---

## 5 · Push notifications

When a teacher posts a notice, `backend/src/services/push.ts` fans out Expo push messages
to every matching student who has registered a token.

For this to work end to end:

1. The student app must have a real `projectId` (from `eas init`)
2. The student must grant the notification permission — the app asks on first sign-in, and
   the Profile screen has a retry for anyone who declined
3. It must be a **physical device** — Expo issues no push token to a simulator
4. For a standalone APK, EAS must hold your **FCM v1 credentials**. Run
   `eas credentials` → Android → *Push Notifications*, and upload the service-account JSON
   from your Firebase project. Without it, pushes work in Expo Go but silently stop working
   in the built APK.

The backend never fails a request because a push failed — `notifyNotice` catches
everything and returns a `{ sent, failed }` summary. A broken push setup degrades the
feature, it does not break posting notices.

---

## 6 · After deploying

Run the smoke test against the live API:

```bash
npm run smoke -- https://your-api.onrender.com/api
```

It checks health, all three logins, the full read surface — and asserts that a student
token is **rejected** from marking attendance, posting notices and entering marks. If those
three checks ever fail, stop and fix it before anyone uses the system.

---

## Security checklist before real students use this

- [ ] `JWT_SECRET` is freshly generated for production and differs from every local `.env`
- [ ] The seeded demo accounts (`admin@sfgc.ac.in` / `Admin@123`, `T01` / `teacher123`,
      `SFGC101` / `student123`) are **deleted or have their passwords changed**
- [ ] `CORS_ORIGINS` lists only domains you control
- [ ] `NODE_ENV=production` (this also stops stack traces being returned in errors)
- [ ] Database password is not in any committed file — check `git log -p` for a leaked
      `.env`
- [ ] Supabase Row Level Security is enabled on the tables, or database access is
      restricted to the API's credentials only
- [ ] The smoke test's three role-enforcement checks pass against production
