# Connecting the SFGC site to Supabase

The app works **without** a backend (it stores data in your browser). Connecting
Supabase makes events, registrations, attendance and internal marks **persist in a
real database and sync across devices/users**.

It's an **offline-first** design: if Supabase isn't configured, everything falls
back to `localStorage`. So these steps are optional but recommended.

---

## 1. Create a Supabase project (free)

1. Go to <https://supabase.com> and sign in (create an account if needed).
2. Click **New project**. Pick a name (e.g. `sfgc`), a database password, and a region.
3. Wait ~2 minutes for it to provision.

## 2. Create the tables

1. In the project, open **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this repo, copy its entire contents, paste, and click **Run**.
3. You should see the tables under **Table Editor**: `events`, `registrations`,
   `attendance`, `attendance_sessions`, `marks`.

## 3. Get your API keys

1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon / public** key.
   *(The anon key is meant to be used in the browser — it's protected by the Row
   Level Security policies the schema created.)*

## 4. Add them to the app

1. In the project root (`E:\sfgc`), copy `.env.example` to **`.env.local`**.
2. Fill in your values:

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

3. **Restart** the dev server (`npm run dev`) so Vite picks up the new env file.

## 5. Verify

- Open the **Admin** page (`/admin`). The badge in the top-right should read
  **“☁️ Cloud synced”** instead of “💾 Offline (local)”.
- Add an event, or have a teacher mark attendance / enter marks. Refresh — the data
  is still there. Open the site in another browser/device — the same data appears.
- In Supabase **Table Editor**, you'll see the rows.

---

## How the sync works

| Data | Table | Written by |
|------|-------|-----------|
| Events / fests | `events` | Admin panel |
| Registrations | `registrations` | Event registration modal |
| Attendance totals | `attendance` | Teacher portal (mark attendance) |
| Attendance sessions log | `attendance_sessions` | Teacher portal |
| Internal marks | `marks` | Teacher portal (enter marks) |

On first run against an empty database, the app **seeds** each table from its
built-in demo data, then reads/writes from Supabase thereafter. All writes are
optimistic (the UI updates immediately and pushes to Supabase in the background).

## Security note (for production)

The included RLS policies allow the public anon key **full read/write** — fine for a
demo, **not** for production. Before going live, replace them with policies tied to
**Supabase Auth**: e.g. only authenticated teachers may write `marks`/`attendance`,
students may read only their own rows, and only admins may modify `events`.
