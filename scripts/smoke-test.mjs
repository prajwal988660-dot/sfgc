#!/usr/bin/env node
/**
 * End-to-end smoke test for the SFGC API.
 *
 *   node scripts/smoke-test.mjs [baseUrl]
 *
 * Defaults to http://localhost:4000/api. Run it after `npm run db:seed` with the
 * backend running. It exercises the real routes with the seeded demo accounts and,
 * critically, asserts that a student CANNOT write attendance, notices or marks.
 *
 * Read-only apart from one attendance mark and one notice, both of which the
 * seed data expects to change.
 */

const BASE = (process.argv[2] ?? 'http://localhost:4000/api').replace(/\/+$/, '')

const ACCOUNTS = {
  admin: { identifier: 'admin@sfgc.ac.in', password: 'Admin@123' },
  teacher: { identifier: 'T01', password: 'teacher123' },
  student: { identifier: 'SFGC101', password: 'student123' },
}

let passed = 0
let failed = 0
const failures = []

const green = (s) => `\x1b[32m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  ${green('PASS')} ${name}`)
  } else {
    failed += 1
    failures.push(name)
    console.log(`  ${red('FAIL')} ${name}${detail ? dim(`  — ${detail}`) : ''}`)
  }
}

async function call(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    return { status: 0, payload: null, networkError: error.message }
  }

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }
  return { status: response.status, payload }
}

function section(title) {
  console.log(`\n${bold(title)}`)
}

async function main() {
  console.log(bold(`\nSFGC API smoke test`))
  console.log(dim(`  ${BASE}\n`))

  // ---------------------------------------------------------------- health --
  section('Health')
  const health = await call('/health')
  if (health.networkError) {
    console.log(
      red(`\n  Cannot reach the API at ${BASE}\n`) +
        dim(`  ${health.networkError}\n\n`) +
        `  Start it with:  npm run dev:backend\n`,
    )
    process.exit(1)
  }
  check('GET /health returns 200', health.status === 200, `got ${health.status}`)
  check(
    'database is reachable',
    health.payload?.data?.db === 'up',
    `db reported "${health.payload?.data?.db}" — check DATABASE_URL in backend/.env`,
  )

  const stats = await call('/stats/public')
  check('GET /stats/public returns counts', stats.status === 200 && stats.payload?.success)

  // ------------------------------------------------------------------ auth --
  section('Authentication')
  const tokens = {}
  for (const [role, credentials] of Object.entries(ACCOUNTS)) {
    const result = await call('/auth/login', { method: 'POST', body: credentials })
    const token = result.payload?.data?.token
    tokens[role] = token
    check(
      `${role} signs in with "${credentials.identifier}"`,
      result.status === 200 && Boolean(token),
      result.payload?.error?.message ?? `status ${result.status}`,
    )
  }

  const badPassword = await call('/auth/login', {
    method: 'POST',
    body: { identifier: 'SFGC101', password: 'wrong-password' },
  })
  check(
    'wrong password is rejected with INVALID_CREDENTIALS',
    badPassword.status === 401 && badPassword.payload?.error?.code === 'INVALID_CREDENTIALS',
  )

  const unknownUser = await call('/auth/login', {
    method: 'POST',
    body: { identifier: 'NOT-A-REAL-ID', password: 'wrong-password' },
  })
  check(
    'unknown identifier gives the SAME error as a wrong password',
    unknownUser.payload?.error?.code === badPassword.payload?.error?.code,
    'differing errors let an attacker enumerate accounts',
  )

  const noToken = await call('/auth/me')
  check('GET /auth/me without a token is 401', noToken.status === 401)

  const me = await call('/auth/me', { token: tokens.student })
  check('GET /auth/me returns the student', me.payload?.data?.user?.role === 'STUDENT')
  check(
    'the user object never contains passwordHash',
    me.payload?.data?.user && !('passwordHash' in me.payload.data.user),
  )

  // -------------------------------------------------------- ROLE SECURITY --
  section('Role enforcement — a student must not be able to write')

  const studentMarks = await call('/attendance/mark', {
    method: 'POST',
    token: tokens.student,
    body: { subjectId: 'anything', records: [{ studentId: 'x', status: 'PRESENT' }] },
  })
  check(
    'student POST /attendance/mark is 403 FORBIDDEN',
    studentMarks.status === 403 && studentMarks.payload?.error?.code === 'FORBIDDEN',
    `got ${studentMarks.status} ${studentMarks.payload?.error?.code ?? ''}`,
  )

  const studentNotice = await call('/notices', {
    method: 'POST',
    token: tokens.student,
    body: { title: 'Should never post', body: 'This must be rejected.' },
  })
  check(
    'student POST /notices is 403 FORBIDDEN',
    studentNotice.status === 403,
    `got ${studentNotice.status}`,
  )

  const studentProgress = await call('/progress', {
    method: 'POST',
    token: tokens.student,
    body: { subjectId: 'x', semester: 3, records: [] },
  })
  check(
    'student POST /progress is 403 FORBIDDEN',
    studentProgress.status === 403,
    `got ${studentProgress.status}`,
  )

  const teacherSubjects = await call('/subjects', { token: tokens.teacher })
  const subjects = teacherSubjects.payload?.data ?? []
  check('teacher GET /subjects returns their classes', subjects.length > 0)

  const otherStudent = await call('/auth/me', { token: tokens.admin })
  const adminId = otherStudent.payload?.data?.user?.id
  if (adminId) {
    const crossRead = await call(`/attendance/student/${adminId}`, { token: tokens.student })
    check(
      "student cannot read another person's attendance",
      crossRead.status === 403,
      `got ${crossRead.status}`,
    )
  }

  // ------------------------------------------------------------ attendance --
  section('Attendance')
  const studentAttendance = await call('/attendance/me', { token: tokens.student })
  const attendance = studentAttendance.payload?.data
  check('GET /attendance/me returns a summary', studentAttendance.status === 200)
  check(
    'the summary has overall, bySubject and records',
    Boolean(attendance?.overall && attendance?.bySubject && attendance?.records),
  )
  check(
    'percentage is a number between 0 and 100',
    typeof attendance?.overall?.percentage === 'number' &&
      attendance.overall.percentage >= 0 &&
      attendance.overall.percentage <= 100,
    `got ${attendance?.overall?.percentage}`,
  )
  check(
    'record dates are YYYY-MM-DD, not full timestamps',
    !attendance?.records?.length ||
      /^\d{4}-\d{2}-\d{2}$/.test(attendance.records[0].date),
    `got "${attendance?.records?.[0]?.date}"`,
  )

  const subject = subjects[0]
  if (subject) {
    const roster = await call(`/subjects/${subject.id}/students`, { token: tokens.teacher })
    const students = roster.payload?.data?.students ?? []
    check(`teacher can load the roster for ${subject.code}`, students.length > 0)

    if (students.length) {
      const today = new Date().toISOString().slice(0, 10)
      const marked = await call('/attendance/mark', {
        method: 'POST',
        token: tokens.teacher,
        body: {
          subjectId: subject.id,
          date: today,
          records: students.map((s) => ({ studentId: s.id, status: 'PRESENT' })),
        },
      })
      check(
        'teacher can mark attendance for their own subject',
        marked.status === 200 && marked.payload?.data?.marked === students.length,
        marked.payload?.error?.message ?? `status ${marked.status}`,
      )

      // Re-marking the same day must overwrite, not duplicate.
      const remarked = await call('/attendance/mark', {
        method: 'POST',
        token: tokens.teacher,
        body: {
          subjectId: subject.id,
          date: today,
          records: students.map((s) => ({ studentId: s.id, status: 'PRESENT' })),
        },
      })
      check(
        're-marking the same day is idempotent',
        remarked.status === 200 && remarked.payload?.data?.marked === students.length,
      )

      const classView = await call(`/attendance/class/${subject.id}?date=${today}`, {
        token: tokens.teacher,
      })
      check(
        'teacher can read the class register',
        classView.status === 200 && classView.payload?.data?.students?.length === students.length,
      )
    }
  }

  // -------------------------------------------------------------- progress --
  section('Progress card')
  const progress = await call('/progress/me', { token: tokens.student })
  const card = progress.payload?.data
  check('GET /progress/me returns a card', progress.status === 200)
  check('the card has rows and a summary', Boolean(card?.rows && card?.summary))
  check(
    'SGPA is between 0 and 10',
    typeof card?.summary?.sgpa === 'number' && card.summary.sgpa >= 0 && card.summary.sgpa <= 10,
    `got ${card?.summary?.sgpa}`,
  )

  // ---------------------------------------------------------------- events --
  section('Events')
  const events = await call('/events?upcoming=true')
  check('GET /events is public (no token needed)', events.status === 200)
  check('events come back with pagination meta', Boolean(events.payload?.meta))
  const event = events.payload?.data?.[0]
  check('at least one upcoming event is seeded', Boolean(event))

  if (event) {
    check(
      'events carry registrationCount and seatsLeft',
      'registrationCount' in event && 'seatsLeft' in event,
    )
    const bySlug = await call(`/events/${event.slug}`)
    check('an event resolves by slug as well as id', bySlug.payload?.data?.id === event.id)

    const email = `smoke-test-${Date.now()}@example.com`
    const registration = await call(`/events/${event.id}/register`, {
      method: 'POST',
      body: { name: 'Smoke Test', email, phone: '9876543210' },
    })
    check(
      'anyone can register for an event without signing in',
      registration.status === 201 && Boolean(registration.payload?.data?.ticketCode),
      registration.payload?.error?.message ?? `status ${registration.status}`,
    )
    check(
      'the ticket code looks like SFGC-XXXXXX',
      /^SFGC-[A-Z0-9]{6}$/.test(registration.payload?.data?.ticketCode ?? ''),
      `got "${registration.payload?.data?.ticketCode}"`,
    )

    const duplicate = await call(`/events/${event.id}/register`, {
      method: 'POST',
      body: { name: 'Smoke Test', email },
    })
    check(
      'registering the same email twice is a 409 CONFLICT',
      duplicate.status === 409 && duplicate.payload?.error?.code === 'CONFLICT',
      `got ${duplicate.status}`,
    )
  }

  // --------------------------------------------------------------- notices --
  section('Notices')
  const publicNotices = await call('/notices')
  check('GET /notices is readable signed out', publicNotices.status === 200)

  const teacherNotice = await call('/notices', {
    method: 'POST',
    token: tokens.teacher,
    body: {
      title: 'Smoke test notice',
      body: 'Posted by the smoke test. Safe to delete.',
      category: 'General',
      audience: 'ALL',
    },
  })
  check(
    'teacher can post a notice',
    teacherNotice.status === 201,
    teacherNotice.payload?.error?.message ?? `status ${teacherNotice.status}`,
  )

  const noticeId = teacherNotice.payload?.data?.id
  if (noticeId) {
    const deleted = await call(`/notices/${noticeId}`, {
      method: 'DELETE',
      token: tokens.teacher,
    })
    check('the notice author can delete it', deleted.status === 200)
  }

  const missing = await call('/notices/does-not-exist')
  check('an unknown notice is 404 NOT_FOUND', missing.status === 404)

  // ----------------------------------------------------------------- done --
  console.log(
    `\n${bold('Result')}  ${green(`${passed} passed`)}` +
      (failed ? `, ${red(`${failed} failed`)}` : '') +
      '\n',
  )
  if (failed) {
    console.log(red('Failed checks:'))
    failures.forEach((name) => console.log(`  • ${name}`))
    console.log()
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(red(`\nSmoke test crashed: ${error.message}\n`))
  process.exit(1)
})
