# SFGC Platform — API Contract

**This document is the single source of truth.** The backend implements it; the
website and both mobile apps consume it. Do not change a shape here without
updating `packages/shared/src/types.ts` in the same edit.

Base URL: `${API_URL}` — e.g. `http://localhost:4000/api`

---

## Conventions

### Envelope

Every response is JSON with a consistent envelope.

**Success**

```jsonc
{ "success": true, "data": <payload> }
```

Paginated collections add `meta`:

```jsonc
{
  "success": true,
  "data": [ /* items */ ],
  "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

**Error**

```jsonc
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable summary",
    "details": [ { "path": "email", "message": "Invalid email" } ]  // optional
  }
}
```

### Error codes and HTTP status

| code                  | status | when                                             |
| --------------------- | ------ | ------------------------------------------------ |
| `VALIDATION_ERROR`    | 400    | body/query failed schema validation               |
| `UNAUTHENTICATED`     | 401    | missing / malformed / expired token               |
| `INVALID_CREDENTIALS` | 401    | wrong email or password on login                  |
| `FORBIDDEN`           | 403    | authenticated but role not permitted              |
| `NOT_FOUND`           | 404    | resource does not exist                           |
| `CONFLICT`            | 409    | unique constraint (duplicate email, ticket, …)    |
| `RATE_LIMITED`        | 429    | too many requests                                 |
| `INTERNAL_ERROR`      | 500    | unhandled                                         |

### Auth

`Authorization: Bearer <jwt>` on every protected route.

JWT payload: `{ sub: userId, role: Role, email: string, iat, exp }`.

### Roles

`ADMIN` | `TEACHER` | `STUDENT`

**Hard rule:** students can never write attendance, notices, progress or events.

### Dates

All timestamps are ISO-8601 UTC strings. Attendance `date` is a calendar day:
`"YYYY-MM-DD"`.

---

## Auth — `/auth`

### `POST /auth/register`

Public. Creates a user. Registering as `ADMIN` is rejected; registering as
`TEACHER` requires an admin token (a self-serve teacher signup would let anyone
mark attendance).

Body:

```jsonc
{
  "name": "Anita Rao",
  "email": "anita@sfgc.ac.in",
  "password": "secret123",       // min 8 chars
  "role": "STUDENT",             // STUDENT (public) | TEACHER (admin only)
  "phone": "9876543210",         // optional
  // student only:
  "registerNo": "SFGC101",
  "program": "BCA", "semester": 3, "section": "A", "department": "Computer Science",
  // teacher only:
  "employeeId": "T01", "designation": "Assistant Professor"
}
```

→ `201` `{ success: true, data: { token, user } }`

### `POST /auth/login`

Public. Accepts **either** `email` **or** `registerNo`/`employeeId` as
`identifier`.

```jsonc
{ "identifier": "anita@sfgc.ac.in", "password": "secret123" }
```

→ `200` `{ success: true, data: { token, user } }`
→ `401 INVALID_CREDENTIALS`

### `GET /auth/me`

Any authenticated role. → `200` `{ success: true, data: { user } }`

### `PATCH /auth/me`

Update own `name`, `phone`, `avatarUrl`. → `200` `{ data: { user } }`

### `POST /auth/push-token`

Any authenticated role. Stores the Expo push token for the current user.

```jsonc
{ "expoPushToken": "ExponentPushToken[xxxxxxxx]" }
```

→ `200` `{ success: true, data: { ok: true } }`

### `User` object (never includes `passwordHash`)

```jsonc
{
  "id": "clx…", "email": "…", "name": "…", "role": "STUDENT",
  "phone": null, "avatarUrl": null, "isActive": true,
  "registerNo": "SFGC101", "program": "BCA", "semester": 3, "section": "A",
  "admissionYear": 2024, "department": "Computer Science",
  "employeeId": null, "designation": null,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

## Subjects — `/subjects`

### `GET /subjects`

Authenticated. Role-scoped by default:

- `TEACHER` → subjects they teach
- `STUDENT` → subjects they are enrolled in
- `ADMIN` → all

Query: `?program=BCA&semester=3&section=A&teacherId=…&all=true` (`all=true`
honoured for admin/teacher only).

→ `200` `{ data: Subject[] }`

```jsonc
// Subject
{
  "id": "…", "code": "BCA301", "name": "Database Management Systems",
  "program": "BCA", "semester": 3, "section": "A", "credits": 4,
  "department": "Computer Science", "academicYear": "2026-27", "isActive": true,
  "teacher": { "id": "…", "name": "…", "email": "…" } | null,
  "studentCount": 42          // present on list responses
}
```

### `GET /subjects/:id`

→ `200` `{ data: Subject }`

### `GET /subjects/:id/students`

`TEACHER` (must own the subject) or `ADMIN`. The roster for marking attendance.

→ `200`

```jsonc
{
  "data": {
    "subject": { /* Subject */ },
    "students": [
      { "id": "…", "name": "…", "registerNo": "SFGC101", "avatarUrl": null,
        "todayStatus": "PRESENT" | null }   // status already marked for ?date
    ]
  }
}
```

Query: `?date=YYYY-MM-DD` (defaults to today) — drives `todayStatus` so the
teacher app can pre-fill an already-marked day.

### `POST /subjects` · `PATCH /subjects/:id` · `DELETE /subjects/:id`

`ADMIN` only. Body mirrors the Subject fields; `POST` also accepts
`studentIds: string[]` to enrol.

### `POST /subjects/:id/enroll`

`ADMIN` only. `{ "studentIds": ["…"] }` → `200` `{ data: { enrolled: 12 } }`

---

## Attendance — `/attendance`

### `POST /attendance/mark`

**`TEACHER` only** (and only for a subject they teach); `ADMIN` may mark any.
Bulk upsert — re-submitting the same day overwrites.

```jsonc
{
  "subjectId": "…",
  "date": "2026-08-08",                      // optional, defaults to today
  "records": [
    { "studentId": "…", "status": "PRESENT" },
    { "studentId": "…", "status": "ABSENT", "remarks": "informed" }
  ]
}
```

→ `200` `{ data: { marked: 42, date: "2026-08-08", subjectId: "…" } }`
→ `403 FORBIDDEN` if the caller is a `STUDENT`, or a teacher who does not own
the subject.

### `GET /attendance/student/:id`

`STUDENT` may only pass their **own** id (otherwise `403`). `TEACHER`/`ADMIN`
may pass any.

Query: `?subjectId=…&from=YYYY-MM-DD&to=YYYY-MM-DD`

→ `200`

```jsonc
{
  "data": {
    "student": { "id": "…", "name": "…", "registerNo": "…" },
    "overall": { "present": 120, "absent": 14, "late": 2, "total": 136, "percentage": 89.7 },
    "bySubject": [
      { "subjectId": "…", "code": "BCA301", "name": "DBMS",
        "present": 24, "absent": 3, "late": 0, "total": 27, "percentage": 88.9 }
    ],
    "records": [
      { "id": "…", "date": "2026-08-08", "status": "PRESENT",
        "subject": { "id": "…", "code": "BCA301", "name": "DBMS" } }
    ]
  }
}
```

`percentage` counts `PRESENT` + `LATE` as attended, rounded to 1 decimal.

### `GET /attendance/me`

Convenience alias for the student app — same payload as above for `req.user.id`.

### `GET /attendance/class/:subjectId`

`TEACHER` (owns subject) or `ADMIN`.

Query: `?date=YYYY-MM-DD` for one day, or `?from=&to=` for a range.

→ `200`

```jsonc
{
  "data": {
    "subject": { /* Subject */ },
    "date": "2026-08-08",
    "summary": { "present": 38, "absent": 4, "late": 0, "total": 42, "percentage": 90.5 },
    "students": [
      { "id": "…", "name": "…", "registerNo": "…",
        "status": "PRESENT" | null,
        "stats": { "present": 24, "total": 27, "percentage": 88.9 } }
    ]
  }
}
```

---

## Events — `/events`

### `GET /events`

Public. Query: `?upcoming=true&past=true&category=Fest&page=1&limit=20&q=search`
Default: published only, sorted by `startsAt` ascending for upcoming.

→ `200` `{ data: Event[], meta: {…} }`

```jsonc
// Event
{
  "id": "…", "slug": "tech-fest-2026", "title": "…", "description": "…",
  "category": "Fest", "startsAt": "…", "endsAt": "…", "venue": "…",
  "coverImage": "…", "fee": 200, "capacity": 300,
  "registrationOpen": true, "isPublished": true,
  "organizer": "…", "contactName": "…", "contactEmail": "…", "contactPhone": "…",
  "registrationCount": 187,
  "seatsLeft": 113 | null,        // null when capacity is null
  "isRegistered": false           // only present for authenticated requests
}
```

### `GET /events/:idOrSlug`

Public. → `200` `{ data: Event }`

### `POST /events` · `PATCH /events/:id` · `DELETE /events/:id`

`ADMIN` (and `TEACHER` for `POST`/`PATCH` of their own events). `slug` is
generated from `title` when omitted.

### `POST /events/:id/register`

**Public** — the website form works without login. If a Bearer token is
present, the registration is linked to that user and `name`/`email` default to
the account.

```jsonc
{ "name": "…", "email": "…", "phone": "…", "college": "…",
  "teamName": "…", "teamMembers": "Ravi, Meera" }
```

→ `201` `{ data: { ticketCode: "SFGC-8FJ2KD", registration: {…}, event: {…} } }`
→ `409 CONFLICT` if that email already registered for the event
→ `400 VALIDATION_ERROR` if registration is closed or the event is full

### `GET /events/:id/registrations`

`ADMIN`, or the `TEACHER` who created the event — a registration list carries
names, emails and phone numbers, so role alone is not sufficient.
→ `200` `{ data: EventRegistration[], meta: {…} }`
→ `403 FORBIDDEN` for a teacher who did not create the event

### `GET /events/me/registrations`

Authenticated. The current user's registrations, each with its event.

---

## Notices — `/notices`

### `GET /notices`

Public read for `audience: ALL`; authenticated callers additionally see notices
targeting their role, and students only see notices matching their
`program`/`semester` when a notice narrows to those.

Query: `?category=Exam&page=1&limit=20&q=…`
Sort: pinned first, then `publishedAt` descending. Expired notices are excluded.

→ `200` `{ data: Notice[], meta: {…} }`

```jsonc
// Notice
{
  "id": "…", "title": "…", "body": "…", "category": "Exam",
  "audience": "ALL", "pinned": true, "attachmentUrl": null,
  "program": null, "semester": null,
  "publishedAt": "…", "expiresAt": null,
  "author": { "id": "…", "name": "…", "role": "TEACHER" }
}
```

### `GET /notices/:id`

→ `200` `{ data: Notice }`

### `POST /notices`

`ADMIN` or `TEACHER`. Students receive `403`.

```jsonc
{ "title": "…", "body": "…", "category": "Exam", "audience": "STUDENTS",
  "pinned": false, "program": "BCA", "semester": 3, "expiresAt": null }
```

→ `201` `{ data: Notice }` — also fires Expo push to matching users.

### `PATCH /notices/:id` · `DELETE /notices/:id`

Author, or `ADMIN`. Otherwise `403`.

---

## Progress — `/progress`

### `GET /progress/:studentId`

`STUDENT` may only read their own; `TEACHER`/`ADMIN` any.

Query: `?semester=3&academicYear=2026-27`

→ `200`

```jsonc
{
  "data": {
    "student": { "id": "…", "name": "…", "registerNo": "…", "program": "BCA",
                 "semester": 3, "section": "A" },
    "semester": 3,
    "academicYear": "2026-27",
    "rows": [
      { "id": "…", "subject": { "id": "…", "code": "BCA301", "name": "DBMS" },
        "internalMarks": 34, "maxInternal": 40,
        "externalMarks": 51, "maxExternal": 60,
        "total": 85, "maxTotal": 100, "grade": "A", "credits": 4,
        "remarks": null, "isPublished": true }
    ],
    "summary": {
      "totalObtained": 425, "totalMax": 500, "percentage": 85.0,
      "sgpa": 8.5, "resultStatus": "PASS", "subjectCount": 5
    }
  }
}
```

Unpublished rows are hidden from `STUDENT` callers and shown to staff.

### `GET /progress/me`

Convenience alias for the student app.

### `POST /progress`

`TEACHER` (own subject) or `ADMIN`. Bulk upsert of marks.

```jsonc
{
  "subjectId": "…", "semester": 3, "academicYear": "2026-27",
  "isPublished": true,
  "records": [
    { "studentId": "…", "internalMarks": 34, "externalMarks": 51, "remarks": null }
  ]
}
```

→ `200` `{ data: { saved: 42 } }`

Grade is derived server-side from the total percentage:

| % | ≥90 | ≥80 | ≥70 | ≥60 | ≥50 | ≥40 | <40 |
|---|-----|-----|-----|-----|-----|-----|-----|
| grade | O | A+ | A | B+ | B | C | F |
| points | 10 | 9 | 8 | 7 | 6 | 5 | 0 |

`sgpa` = Σ(points × credits) ÷ Σ(credits), rounded to 2 decimals.

---

## Misc

### `GET /health`

Public. → `200` `{ success: true, data: { status: "ok", uptime, db: "up" } }`

### `GET /stats/public`

Public. Counters for the website's animated stats section.

→ `200` `{ data: { students, teachers, events, notices, placementRate } }`
