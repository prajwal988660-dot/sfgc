> ## 📦 Archived
>
> This is the **previous** SFGC website — React + Vite with an optional Supabase
> backend. It has been superseded by the platform in the repository root:
> a shared Express + Prisma API (`backend/`), a Next.js 14 site (`web/`), and
> Teacher and Student mobile apps (`apps/`). See the [root README](../README.md).
>
> It is kept here intact and still runs (`cd legacy-vite-site && npm run dev`),
> and its researched college content was carried over to
> `web/src/content/college.ts`. Nothing new should be built here.

# Seshadripuram First Grade College — Website (Inspired Redesign)

A modern, fully-interactive recreation of the [SFGC](https://www.sfgc.ac.in/) college
website, built with **React + Vite**. Same content as the original, reimagined with a
contemporary UI (glassmorphism, aurora-gradient hero, bento layouts, bold display type),
plus working student/faculty/admin portals.

## ✨ Features

- **Modern responsive UI** — sticky glass header, animated hero carousel, scroll-reveal
  sections, mobile mega-menu, ~110 routed pages generated from a nav data model.
- **Events & Fests** — listing → detail pages → participant **registration** (with a
  generated ticket ID).
- **Student Portal** (`/student`) — login → **attendance**, **internal marks**, and a
  printable **progress card**.
- **Teacher Portal** (`/teacher`) — faculty login → **mark attendance** and **enter
  internal marks**; changes appear live in the student portal.
- **Admin Panel** (`/admin`) — add/edit/delete events and view/export event
  **registrations** (CSV).
- **Offline-first data** with optional **Supabase** cloud sync (see below).

## 🚀 Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## 🗄️ Backend (optional — Supabase)

The app works out of the box using `localStorage`. To persist data in a real database
and sync across devices, connect a free Supabase project — see
[`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md). In short: create a project, run
[`supabase/schema.sql`](./supabase/schema.sql), and add your keys to `.env.local`
(template in [`.env.example`](./.env.example)).

## 🧭 Tech

React 18 · React Router (HashRouter) · Vite · Supabase (optional) · vanilla CSS design system.

## Demo logins

| Role | Path | Credentials |
|------|------|-------------|
| Student | `/student` | ID `SFGC101` · password `student123` |
| Teacher | `/teacher` | ID `T01` · password `teacher123` |
| Admin | `/admin` | passcode `sfgc-admin` |

> Demo credentials and permissive DB policies are for demonstration only — not for production.

---

This is an educational/portfolio recreation and is not affiliated with the official college.
