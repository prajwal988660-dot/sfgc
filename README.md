# SFGC Platform

A complete college platform for **Seshadripuram First Grade College** — one backend, three
front ends.

| Part | Stack | Location |
| --- | --- | --- |
| **API backend** | Node · Express · Prisma · PostgreSQL (Supabase) | [`backend/`](./backend) |
| **Official website** | Next.js 14 App Router · Tailwind · Framer Motion | [`web/`](./web) |
| **Teacher app** | Expo (SDK 57) · React Native · React Navigation | [`apps/teacher-app/`](./apps/teacher-app) |
| **Student app** | Expo (SDK 57) · React Native · Expo Notifications | [`apps/student-app/`](./apps/student-app) |
| **Shared SDK** | TypeScript types + isomorphic API client | [`packages/shared/`](./packages/shared) |
| _Previous site_ | React + Vite (archived, still runnable) | [`legacy-vite-site/`](./legacy-vite-site) |

All four apps talk to the **same** API, configured entirely through environment variables.
The interface between them is frozen in **[`API_CONTRACT.md`](./API_CONTRACT.md)** — read
that before changing a response shape.

---

## 1 · Prerequisites

- **Node.js 18.18+** (this repo was built on Node 24)
- A **Supabase** project — you already have one: `omqvpahtcuwxpvdnxjlq`
- For APKs: a free [Expo](https://expo.dev) account and `npm i -g eas-cli`

---

## 2 · Install

```bash
npm install          # installs every workspace at once
```

This is an npm-workspaces monorepo. The website runs React 18 and the mobile apps run
React 19; npm nests them correctly and Metro is configured to match, so don't be alarmed
by two React versions in the tree.

---

## 3 · Configure the database

Open your Supabase dashboard → **Project Settings → Database → Connection string**, and
copy your database password into `backend/.env` (already created, with a generated
`JWT_SECRET`):

```env
DATABASE_URL="postgresql://postgres.omqvpahtcuwxpvdnxjlq:YOUR-PASSWORD@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.omqvpahtcuwxpvdnxjlq:YOUR-PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

> Two URLs on purpose: `DATABASE_URL` is the **pooled** connection (port 6543) used at
> runtime; `DIRECT_URL` is the **direct** connection (port 5432) that Prisma Migrate needs.
> Check the region in the host — the template assumes `ap-south-1`.

Then create the tables and fill them with realistic demo data:

```bash
npm run db:deploy                          # apply migrations
SEED_ADMIN_PASSWORD="choose-a-long-one"   npm run db:seed                          # 1 admin, 6 teachers, 40 students, 9 subjects,
                                           # ~30 days of attendance, marks, events and notices
npm run db:backfill --workspace backend    # derive streams, sections, periods and student IDs
```

`db:seed` is idempotent — safe to re-run. It has no default admin password on
purpose: it upserts the administrator account, so a default committed here would
be a published credential for every install. Pass one for the run.

### Changing the schema

The schema is managed by **migration files** under `backend/prisma/migrations`, not
by `db push`. `0_init` is a baseline: it describes the tables as they already
existed and was recorded with `migrate resolve --applied`, so it has never been
executed against the production database.

`prisma migrate dev` — the usual authoring command — wants a **shadow database** it
can create and drop, which Supabase does not permit over the pooler. Generate
migrations by diffing instead:

```bash
cd backend
# 1. edit prisma/schema.prisma, then:
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_describe_the_change
npx prisma migrate diff   --from-schema-datasource prisma/schema.prisma   --to-schema-datamodel prisma/schema.prisma   --script > prisma/migrations/<the-folder>/migration.sql

# 2. READ the generated SQL before running it
npx prisma migrate deploy
```

Always read the generated SQL. `migrate diff` will happily emit a `DROP COLUMN`
for a rename, which destroys the data in it.

---

## 4 · Run it

Open a terminal per part.

```bash
npm run dev:backend    # http://localhost:4000/api   (health: /api/health)
npm run dev:web        # http://localhost:3000
npm run dev:teacher    # Expo — scan the QR with Expo Go
npm run dev:student    # Expo — scan the QR with Expo Go
```

### Demo logins

The seed prints these when it finishes:

| Role | Identifier | Password |
| --- | --- | --- |
| Admin | `admin@sfgc.ac.in` | the `SEED_ADMIN_PASSWORD` you supplied |
| Teacher | `T01` | `teacher123` |
| Student | `SFGC101` | `student123` |

> The teacher and student passwords are **demo credentials for sample data** and are
> published in this repository. Before real students use this, change them — or
> replace the seeded accounts. To change one account's password without re-running
> the seed:
>
> ```bash
> NEW_PASSWORD="..." npm run user:password --workspace backend -- admin@sfgc.ac.in
> ```

Login accepts an **email, a register number, or an employee ID** as the identifier.

### ⚠️ Phones cannot reach `localhost`

`localhost` on a phone means *the phone*. For the mobile apps, set your computer's LAN IP:

```bash
# find it: Windows -> ipconfig | macOS/Linux -> ifconfig
# apps/teacher-app/.env and apps/student-app/.env
EXPO_PUBLIC_API_URL=http://192.168.1.5:4000/api
```

Then restart the bundler with a cleared cache: `npx expo start -c`. Both the computer and
the phone must be on the same Wi-Fi.

---

## 5 · Building the APKs

### Locally (no Expo account)

If this machine has Android Studio — or just the Android SDK plus a JDK — build
straight from here:

```bash
./scripts/build-apk.sh student
./scripts/build-apk.sh teacher
```

Each run generates the native project, applies the release signing config, runs
Gradle, and copies the finished APK to `web/public/downloads/`, which is exactly
where the website's download section looks. The first build takes 10–20 minutes
while Gradle fetches dependencies; later ones are far quicker.

The script refuses to build quietly against a LAN address, because an APK with
`192.168.x.x` baked in only works on the developer's wifi.

**Signing.** Each app has its own release keystore under
`apps/<app>/credentials/`, generated on first setup and **gitignored**. Keep a
backup somewhere safe: Android will refuse to install an update signed with a
different key, so losing it means every student has to uninstall and reinstall.

### Via EAS (cloud build)

Useful when you have no Android toolchain, or want iOS later.

```bash
npm i -g eas-cli
eas login

cd apps/teacher-app
eas init                  # links the project and writes a real projectId into app.json
eas build -p android --profile preview     # -> installable APK
```

Repeat for `apps/student-app`.

Full instructions — including deploying the API and wiring FCM credentials for push — are
in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

The `preview` and `production` profiles both produce an **APK** (`buildType: "apk"`);
`production-aab` produces an App Bundle for the Play Store. Each profile sets
`EXPO_PUBLIC_API_URL` — **edit `eas.json` to point at your deployed API** before building,
because a phone in the wild cannot reach your laptop.

> **`extra.eas.projectId` is a placeholder** (`00000000-…`) in both `app.json` files.
> `eas init` replaces it. Push notifications will not work until it is a real id.

---

## 6 · Roles and permissions

Three roles — `ADMIN`, `TEACHER`, `STUDENT` — enforced by middleware on every route
(`backend/src/middleware/auth.ts`).

|  | Admin | Teacher | Student |
| --- | :-: | :-: | :-: |
| Mark attendance | ✅ | ✅ *(own subjects only)* | ❌ |
| View own attendance | ✅ | ✅ | ✅ |
| View class attendance | ✅ | ✅ *(own subjects only)* | ❌ |
| Enter marks | ✅ | ✅ *(own subjects only)* | ❌ |
| View own progress card | ✅ | ✅ | ✅ |
| Post notices | ✅ | ✅ | ❌ |
| Create/edit events | ✅ | ✅ *(own events)* | ❌ |
| Register for events | ✅ | ✅ | ✅ *(also public, no login)* |
| Manage subjects & enrolment | ✅ | ❌ | ❌ |

A student calling a write endpoint gets `403 FORBIDDEN`. A teacher touching a subject they
do not teach gets the same — the role check alone is not treated as sufficient.

---

## 7 · Project layout

```
sfgc/
├── API_CONTRACT.md          the frozen interface — start here
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    User, Subject, Attendance, Event,
│   │   │                    EventRegistration, Notice, ProgressCard
│   │   └── seed.ts          idempotent demo data
│   └── src/
│       ├── config/env.ts    validated at boot; refuses to start if wrong
│       ├── lib/             prisma, jwt, password, errors, respond, grading
│       ├── middleware/      auth + role guards, validation, error envelope
│       ├── routes/          auth, subjects, attendance, events, notices, progress
│       ├── services/push.ts Expo push fan-out for new notices
│       └── validators/      zod schemas per route group
├── web/src/
│   ├── app/                 App Router pages
│   ├── components/          ui/ (shadcn-style), motion/, layout/, home/, events/, notices/
│   ├── content/college.ts   ALL editorial copy — edit facts here, not in components
│   └── lib/api.ts           server + browser API clients
├── apps/{teacher,student}-app/src/
│   ├── screens/             one file per screen
│   ├── navigation/types.ts  typed route params
│   ├── components/ui.tsx    the shared RN component kit
│   ├── store/auth.tsx       session, restore-on-launch, role gate
│   └── lib/                 api, storage, notifications (student)
└── packages/shared/src/     types.ts · client.ts · format.ts
```

---

## 8 · Useful scripts

| Command | What it does |
| --- | --- |
| `npm run db:studio` | Prisma Studio — browse and edit the database |
| `npm run db:deploy` | Apply pending migrations (this is the one to use) |
| `npm run db:backfill --workspace backend` | Derive streams, sections, periods and student IDs from existing data |
| `NEW_PASSWORD=... npm run user:password --workspace backend -- <identifier>` | Set one account's password |
| `npm run build` | Build shared, backend and web |
| `npm run typecheck` | Typecheck every workspace |

---

## 9 · Notes and known limits

- **The contact form does not submit anywhere.** It validates and confirms, then asks the
  visitor to email or call. Wiring it to an endpoint is a deliberate follow-up.
- **Push notifications need a real EAS `projectId`** and a physical device — the Expo push
  service issues no token to a simulator.
- **Placement figures** in `web/src/content/college.ts` (92% rate, 8.5 LPA highest) are
  editorial placeholders in the college's own published style. Replace them with verified
  numbers before this is used as the real site.
- **The gallery uses generated gradient tiles**, not photographs, because no photo library
  was available. Drop real images into `web/public/` and swap them in.
- This is a recreation built for the college; it is not affiliated with, nor an official
  property of, Seshadripuram First Grade College.
