-- ============================================================
--  SFGC — Supabase schema
--  Run this in your Supabase project → SQL Editor → New query → Run.
--  It creates the tables the app syncs to and demo-friendly RLS policies.
-- ============================================================

-- ---------- EVENTS ----------
create table if not exists public.events (
  id            text primary key,
  title         text not null,
  type          text not null default 'Event',
  date          date,
  venue         text,
  fee           text,
  time          text,
  icon          text,
  tagline       text,
  cover         jsonb,
  about         jsonb,
  highlights    jsonb,
  schedule      jsonb,
  coordinator   jsonb,
  registration  text default 'open',
  created_at    timestamptz default now()
);

-- ---------- REGISTRATIONS ----------
create table if not exists public.registrations (
  ticket        text primary key,
  event_id      text,
  event_title   text,
  event_type    text,
  name          text,
  email         text,
  phone         text,
  college       text,
  team          text,
  members       text,
  registered_at timestamptz default now()
);

-- ---------- ATTENDANCE (per class / subject / student) ----------
create table if not exists public.attendance (
  class_id   text not null,
  subject    text not null,
  student_id text not null,
  present    int  not null default 0,
  total      int  not null default 0,
  primary key (class_id, subject, student_id)
);

-- ---------- ATTENDANCE SESSIONS (audit log of what teachers marked) ----------
create table if not exists public.attendance_sessions (
  id            text primary key,
  class_id      text,
  class_label   text,
  subject       text,
  date          date,
  time          text,
  present_count int,
  total_count   int,
  teacher_id    text,
  teacher_name  text,
  created_at    timestamptz default now()
);

-- ---------- CLASS SUBJECTS (teacher-managed subject list per class) ----------
create table if not exists public.class_subjects (
  class_id text not null,
  subject  text not null,
  primary key (class_id, subject)
);

-- ---------- MARKS (internal assessment per class / subject / student) ----------
create table if not exists public.marks (
  class_id   text not null,
  subject    text not null,
  student_id text not null,
  ia1        int  not null default 0,
  ia2        int  not null default 0,
  assignment int  not null default 0,
  primary key (class_id, subject, student_id)
);

-- ============================================================
--  Row Level Security
--  NOTE: these policies allow the public (anon) key full read/write.
--  That is fine for a DEMO. For production, replace them with policies
--  tied to Supabase Auth (e.g. only teachers may write marks/attendance,
--  students may read only their own row, etc.).
-- ============================================================
alter table public.events              enable row level security;
alter table public.registrations       enable row level security;
alter table public.attendance          enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.marks               enable row level security;
alter table public.class_subjects      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['events','registrations','attendance','attendance_sessions','marks','class_subjects']
  loop
    execute format('drop policy if exists "demo_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "demo_all_%1$s" on public.%1$s for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
