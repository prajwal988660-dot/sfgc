# SFGC Platform — Full-Stack College Management System

> One backend, three front-ends. A complete, production-grade platform for a college:
> a secure REST API, a public website, and dedicated teacher and student mobile apps —
> all sharing a single typed SDK in an npm-workspaces monorepo.

<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-5FA04E?logo=nodedotjs&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js%2014-000000?logo=nextdotjs&logoColor=white">
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-61DAFB?logo=react&logoColor=black">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white">
</p>

---

## ✨ Highlights

- **Full-stack monorepo** — a single Express + Prisma + PostgreSQL API powering a Next.js 14 website and two React Native (Expo) mobile apps, with a shared TypeScript SDK that keeps types honest across every client.
- **Security-first auth** — JWT authentication, bcrypt password hashing, rate limiting, and Helmet security headers. Authorization is **permission-based, not role-string-based**, with row-level ownership checks (a teacher can only touch their own subjects) backed by 52 unit tests.
- **Five roles, real access control** — Student, Teacher, Content Admin, Admissions Officer, Super Admin — each with a precise, tested permission matrix.
- **Push notifications** — Expo push fan-out so students are notified the moment a notice is posted.
- **Frozen API contract** — the interface between all four apps is documented and version-controlled in [`API_CONTRACT.md`](./API_CONTRACT.md).
- **Production tooling** — typed env validation that refuses to boot if misconfigured, idempotent database seeding, migration-based schema management, and native APK build scripts.

## 🏗️ Architecture

```
                        ┌──────────────────────────────┐
                        │   REST API  (backend/)        │
                        │   Node · Express · Prisma     │
                        │   PostgreSQL · JWT · Zod       │
                        └──────────────┬───────────────┘
                                       │  one frozen API contract
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
   ┌──────┴───────┐            ┌────────┴────────┐          ┌────────┴────────┐
   │  Website     │            │  Teacher App    │          │  Student App    │
   │  Next.js 14  │            │  React Native   │          │  React Native   │
   │  Tailwind    │            │  Expo           │          │  Expo + Push    │
   └──────────────┘            └─────────────────┘          └─────────────────┘
                     all share  ►  packages/shared  (TypeScript types + API client)
```

## 🧰 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Backend** | Node.js, Express, Prisma ORM, PostgreSQL, JWT, bcrypt, Zod, Helmet, rate-limiting |
| **Website** | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion |
| **Mobile** | React Native, Expo (SDK 57), React Navigation, Expo Notifications |
| **Shared** | TypeScript, isomorphic API client, shared types |
| **Tooling** | npm workspaces (monorepo), Vitest, ESLint, Prettier, EAS Build |

## 🚀 Quick Start

```bash
npm install          # installs every workspace at once
npm run dev:backend  # http://localhost:4000/api
npm run dev:web      # http://localhost:3000
npm run dev:teacher  # Expo — scan the QR with Expo Go
npm run dev:student  # Expo — scan the QR with Expo Go
```

Full setup (database, seeding, mobile config, APK builds, deployment) is documented in detail below.

> **Note:** This is a platform built as a real-world project for Seshadripuram First Grade College.
> It is an independent engineering project and is not an official property of the college.

---

<details>
<summary><strong>📖 Full setup &amp; engineering documentation</strong> (click to expand)</summary>


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
- A **Supabase** project — you already have one: `<your-supabase-project-ref>`
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
DATABASE_URL="postgresql://postgres.<your-supabase-project-ref>:YOUR-PASSWORD@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<your-supabase-project-ref>:YOUR-PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres"
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

> **These are published passwords.** They are written here, in `prisma/seed.ts`, and in
> every copy of this repository — so anyone who has read it can sign in as any seeded
> teacher or student. That is fine while the only data is invented, and not fine the
> moment a real student's marks exist. Before real people use this:
>
> ```bash
> npm run db:rotate-demo --workspace backend
> ```
>
> It gives every account still using a published password a unique one and writes them to
> a CSV outside the repository. A fresh install can avoid creating them at all with
> `SEED_TEACHER_PASSWORD=... SEED_STUDENT_PASSWORD=... npm run db:seed`.

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

> **`extra.eas.projectId` is set** in both `app.json` files — student `f658a032-…`,
> teacher `f9d52fb8-…`, both under the `prajzo` Expo account. They were placeholders of
> all zeros until `eas init` linked them; a fork will need its own `eas init`.

---

## 6 · Roles and permissions

Five roles — `STUDENT`, `TEACHER`, `CONTENT_ADMIN`, `ADMISSIONS_OFFICER`, `SUPER_ADMIN`.
(`ADMIN` still exists in the enum and is deprecated; no account holds it.)

Routes do **not** check role names. They name a *permission*, and
`backend/src/auth/permissions.ts` decides which roles hold it:

```ts
router.post('/', authenticate, requirePermission('gallery:write'), ...)
```

That indirection exists because role checks fail silently in both directions. A guard
written as `role !== 'STUDENT'` **admits** every role added later — which is how an
admissions officer would have been handed every student's attendance and marks the day
that role was created. One written as `role === 'ADMIN'` **denies** `SUPER_ADMIN`, which
is the same account under a new name. Neither shows up at the call site.

Permissions alone are never sufficient where the answer depends on the row. `attendance:mark`
gets a teacher to the endpoint; `canManageSubject` in `backend/src/auth/ownership.ts` decides
whether *that* subject is theirs. Those rules are pure functions with tests.

|  | Super admin | Teacher | Content admin | Admissions | Student |
| --- | :-: | :-: | :-: | :-: | :-: |
| Mark attendance | ✅ | ✅ *(own subjects)* | ❌ | ❌ | ❌ |
| View any attendance / marks | ✅ | ✅ | ❌ | ❌ | ❌ *(own only)* |
| Enter marks | ✅ | ✅ *(own subjects)* | ❌ | ❌ | ❌ |
| Post notices | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create / edit events | ✅ | ✅ *(own)* | ✅ *(any)* | ❌ | ❌ |
| Gallery & library | ✅ | ✅ *(library)* | ✅ | ❌ | ❌ |
| Admission applications | ✅ | ❌ | ❌ | ✅ | ❌ |
| Streams, classes, students | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage users and roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Register for events | ✅ | ✅ | ✅ | ✅ | ✅ *(also public, no login)* |

Note the two empty columns on student records: a content admin and an admissions officer
have **no** access to attendance or marks. That is the grant the old "not a student" checks
got wrong.

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
| `npm run test --workspace backend` | Run the test suite (52 tests over the permission and ownership rules) |
| `npm run db:rotate-demo --workspace backend` | Replace every published demo password with a unique one. **Run before real students use this.** |

---

## 9 · Notes and known limits

- **The contact form does not submit anywhere.** It validates and confirms, then asks the
  visitor to email or call. Wiring it to an endpoint is a deliberate follow-up.
- **Push notifications are wired but unproven on a device.** Both apps now carry real EAS
  project ids and v1.4.0 APKs are published with them compiled in, so `getExpoPushTokenAsync`
  can mint a token. What has not happened is an end-to-end test: install v1.4.0 on a physical
  Android phone, sign in, then post a notice and confirm it arrives. A simulator cannot be
  used — the Expo push service issues no token to one.
- **Placement figures** in `web/src/content/college.ts` (92% rate, 8.5 LPA highest) are
  editorial placeholders in the college's own published style. Replace them with verified
  numbers before this is used as the real site.
- **The homepage's facilities grid uses generated gradient tiles**, not photographs. The
  real photo gallery is a separate feature at `/gallery`, managed from `/admin/gallery`.
- **File uploads need Supabase Storage configured.** Without `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` the upload button is disabled and pasting a URL still works.
  Admission documents need a *separate, private* bucket (`SUPABASE_ADMISSIONS_BUCKET`) —
  the code refuses to fall back to the public one, because a scan of an applicant's ID must
  not be world-readable.
- This is a recreation built for the college; it is not affiliated with, nor an official
  property of, Seshadripuram First Grade College.

</details>
