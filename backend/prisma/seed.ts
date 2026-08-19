/**
 * SFGC platform — database seed.
 *
 * Run with `npm run db:seed` (tsx, so this file is excluded from the tsc build).
 *
 * Two properties matter here and are enforced deliberately:
 *
 *  1. **Idempotent.** Every write is an upsert keyed on a natural unique column
 *     (email, employeeId-bearing email, subject code, event slug, or a composite
 *     unique key). Nothing is ever deleted, so running this against a database
 *     that already has real rows is safe.
 *
 *  2. **Deterministic.** No `Math.random` anywhere. Every "random" value is
 *     derived from a fixed seed constant mixed with a stable string key
 *     (register number, subject code, calendar day), so the same input produces
 *     the same database — a re-run rewrites identical values rather than
 *     reshuffling every student's marks.
 *
 * The content is the real college: programmes, the principal's name, and event
 * and news titles all come from the live SFGC site.
 */

import type { AttendanceStatus, NoticeAudience, Prisma } from '@prisma/client'
import { env } from '../src/config/env'
import { prisma } from '../src/lib/prisma'
import { hashPassword } from '../src/lib/password'
import { gradeFor, rowPercentage } from '../src/lib/grading'
import { formatCalendarDay, todayCalendarDay } from '../src/validators/attendance.schema'
import { DEFAULT_ACADEMIC_YEAR } from '../src/validators/progress.schema'

// ---------------------------------------------------------------------------
// Deterministic pseudo-randomness
// ---------------------------------------------------------------------------

/** "SFGC" + 2026. The single constant every derived value hangs off. */
const SEED = 0x5f6c2026

/** School days of attendance generated per subject. */
const SCHOOL_DAYS = 30

const COLLEGE_NAME = 'Seshadripuram First Grade College'
const STAFF_DOMAIN = 'sfgc.ac.in'
const STUDENT_DOMAIN = 'student.sfgc.ac.in'
const COLLEGE_PHONE = '080-22955369'

/** Demo credentials. This is sample data — these are meant to be public. */
const TEACHER_PASSWORD = 'teacher123'
const STUDENT_PASSWORD = 'student123'

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a — small, fast, and good enough to spread keys across the seed space. */
function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * A stable value in [0, 1) for a key. Keying off the data rather than drawing
 * from a running stream means a student's attendance for a given day does not
 * change when the loop order or the number of students changes.
 */
function rand(key: string): number {
  return mulberry32((hashString(key) ^ SEED) >>> 0)()
}

function randInt(key: string, minInclusive: number, maxInclusive: number): number {
  const span = maxInclusive - minInclusive + 1
  return minInclusive + Math.floor(rand(key) * span)
}

function pick<T>(key: string, options: readonly T[]): T {
  const choice = options[Math.floor(rand(key) * options.length)]
  if (choice === undefined) throw new Error(`Cannot pick from an empty list (${key}).`)
  return choice
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size))
  }
  return out
}

function mustGet<K, V>(map: ReadonlyMap<K, V>, key: K, what: string): V {
  const value = map.get(key)
  if (value === undefined) {
    throw new Error(`Seed data is inconsistent: no ${what} for "${String(key)}".`)
  }
  return value
}

/** Midnight-UTC calendar days, most recent last, skipping Saturday and Sunday. */
function recentSchoolDays(count: number, endingOn: Date): Date[] {
  const days: Date[] = []
  const cursor = new Date(endingOn.getTime())
  while (days.length < count) {
    const weekday = cursor.getUTCDay()
    if (weekday !== 0 && weekday !== 6) days.push(new Date(cursor.getTime()))
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return days.reverse()
}

/**
 * An instant `days` from now at a given local wall-clock time. Events are
 * placed relative to today so "upcoming" stays upcoming however long after
 * writing this the seed is run.
 */
function daysFromNow(days: number, hour = 9, minute = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date
}

/** 10-digit Indian mobile number, stable for a given key. */
function phoneFor(key: string): string {
  let digits = ''
  for (let index = 0; index < 9; index += 1) {
    digits += String(randInt(`phone:${key}:${index}`, 0, 9))
  }
  return `9${digits}`
}

/** Base32-ish alphabet with no 0/O or 1/I, matching the events route. */
const TICKET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function ticketCodeFor(key: string, taken: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = ''
    for (let index = 0; index < 6; index += 1) {
      const position = Math.floor(rand(`ticket:${key}:${attempt}:${index}`) * TICKET_ALPHABET.length)
      code += TICKET_ALPHABET.charAt(position)
    }
    const ticket = `SFGC-${code}`
    if (!taken.has(ticket)) {
      taken.add(ticket)
      return ticket
    }
  }
  throw new Error(`Could not derive a unique ticket code for "${key}".`)
}

// ---------------------------------------------------------------------------
// Classes, staff and students
// ---------------------------------------------------------------------------

interface ClassSpec {
  key: string
  program: string
  semester: number
  section: string
  department: string
  admissionYear: number
}

const CLASSES: readonly ClassSpec[] = [
  {
    key: 'BCA-3-A',
    program: 'BCA',
    semester: 3,
    section: 'A',
    department: 'Computer Science',
    admissionYear: 2025,
  },
  {
    key: 'BCOM-3-A',
    program: 'B.Com',
    semester: 3,
    section: 'A',
    department: 'Commerce',
    admissionYear: 2025,
  },
  {
    key: 'BBA-1-A',
    program: 'BBA',
    semester: 1,
    section: 'A',
    department: 'Management',
    admissionYear: 2026,
  },
]

const CLASS_BY_KEY = new Map(CLASSES.map((entry) => [entry.key, entry]))

interface TeacherSpec {
  employeeId: string
  name: string
  email: string
  department: string
  designation: string
}

const TEACHERS: readonly TeacherSpec[] = [
  {
    employeeId: 'T01',
    name: 'Dr. Ramesh Nagaraj',
    email: `ramesh.nagaraj@${STAFF_DOMAIN}`,
    department: 'Computer Science',
    designation: 'Associate Professor & Head, Computer Applications',
  },
  {
    employeeId: 'T02',
    name: 'Prof. Lakshmi Narayan',
    email: `lakshmi.narayan@${STAFF_DOMAIN}`,
    department: 'Computer Science',
    designation: 'Assistant Professor',
  },
  {
    employeeId: 'T03',
    name: 'Prof. Naveen Kumar K S',
    email: `naveen.kumar@${STAFF_DOMAIN}`,
    department: 'Computer Science',
    designation: 'Assistant Professor & NSS Programme Officer',
  },
  {
    employeeId: 'T04',
    name: 'Prof. Anitha Raghavendra',
    email: `anitha.raghavendra@${STAFF_DOMAIN}`,
    department: 'Commerce',
    designation: 'Assistant Professor',
  },
  {
    employeeId: 'T05',
    name: 'Dr. Mahesh Prabhu',
    email: `mahesh.prabhu@${STAFF_DOMAIN}`,
    department: 'Commerce',
    designation: 'Associate Professor & Head, Commerce',
  },
  {
    employeeId: 'T06',
    name: 'Prof. Deepa Sridhar',
    email: `deepa.sridhar@${STAFF_DOMAIN}`,
    department: 'Management',
    designation: 'Assistant Professor',
  },
]

/** Register numbers run SFGC101 upward in this order. */
const STUDENT_NAMES: ReadonlyArray<{ name: string; classKey: string }> = [
  { name: 'Aditya Rao', classKey: 'BCA-3-A' },
  { name: 'Sneha Krishnamurthy', classKey: 'BCA-3-A' },
  { name: 'Rohan Shetty', classKey: 'BCA-3-A' },
  { name: 'Ananya Iyer', classKey: 'BCA-3-A' },
  { name: 'Karthik Gowda', classKey: 'BCA-3-A' },
  { name: 'Meghana Bhat', classKey: 'BCA-3-A' },
  { name: 'Vishal Nair', classKey: 'BCA-3-A' },
  { name: 'Divya Prakash', classKey: 'BCA-3-A' },
  { name: 'Sandeep Reddy', classKey: 'BCA-3-A' },
  { name: 'Pooja Hegde', classKey: 'BCA-3-A' },
  { name: 'Nikhil Kulkarni', classKey: 'BCA-3-A' },
  { name: 'Shreya Deshpande', classKey: 'BCA-3-A' },
  { name: 'Arjun Menon', classKey: 'BCA-3-A' },
  { name: 'Bhavana Rai', classKey: 'BCA-3-A' },
  { name: 'Tejas Patil', classKey: 'BCA-3-A' },
  { name: 'Nandini Murthy', classKey: 'BCA-3-A' },

  { name: 'Harshith Jain', classKey: 'BCOM-3-A' },
  { name: 'Kavya Srinivas', classKey: 'BCOM-3-A' },
  { name: 'Manoj Kumar', classKey: 'BCOM-3-A' },
  { name: 'Rakshitha Naik', classKey: 'BCOM-3-A' },
  { name: 'Suhas Kamath', classKey: 'BCOM-3-A' },
  { name: 'Anusha Pai', classKey: 'BCOM-3-A' },
  { name: 'Girish Belur', classKey: 'BCOM-3-A' },
  { name: 'Lavanya Shastri', classKey: 'BCOM-3-A' },
  { name: 'Praveen Chandra', classKey: 'BCOM-3-A' },
  { name: 'Sushmitha Rao', classKey: 'BCOM-3-A' },
  { name: 'Vinay Acharya', classKey: 'BCOM-3-A' },
  { name: 'Deepika Joshi', classKey: 'BCOM-3-A' },
  { name: 'Kiran Basavaraj', classKey: 'BCOM-3-A' },
  { name: 'Ramya Venkatesh', classKey: 'BCOM-3-A' },

  { name: 'Aakash Chowdhury', classKey: 'BBA-1-A' },
  { name: 'Ishita Sharma', classKey: 'BBA-1-A' },
  { name: 'Varun Malhotra', classKey: 'BBA-1-A' },
  { name: 'Neha Bansal', classKey: 'BBA-1-A' },
  { name: 'Yash Agarwal', classKey: 'BBA-1-A' },
  { name: 'Prerana Kadam', classKey: 'BBA-1-A' },
  { name: 'Siddharth Verma', classKey: 'BBA-1-A' },
  { name: 'Trisha Fernandes', classKey: 'BBA-1-A' },
  { name: 'Mohammed Ashfaq', classKey: 'BBA-1-A' },
  { name: 'Chaitra Hebbar', classKey: 'BBA-1-A' },
]

interface StudentSpec {
  name: string
  email: string
  registerNo: string
  classKey: string
  program: string
  semester: number
  section: string
  department: string
  admissionYear: number
  phone: string
  guardianName: string
  guardianPhone: string
}

function emailFromName(name: string, domain: string): string {
  const parts = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  return `${parts.join('.')}@${domain}`
}

const GUARDIAN_PREFIXES = ['Mr.', 'Mrs.'] as const

const STUDENTS: readonly StudentSpec[] = STUDENT_NAMES.map((entry, index) => {
  const klass = mustGet(CLASS_BY_KEY, entry.classKey, 'class')
  const registerNo = `SFGC${101 + index}`
  const surname = entry.name.split(/\s+/).filter(Boolean).slice(-1).join('') || entry.name
  return {
    name: entry.name,
    email: emailFromName(entry.name, STUDENT_DOMAIN),
    registerNo,
    classKey: klass.key,
    program: klass.program,
    semester: klass.semester,
    section: klass.section,
    department: klass.department,
    admissionYear: klass.admissionYear,
    phone: phoneFor(`student:${registerNo}`),
    guardianName: `${pick(`guardian:${registerNo}`, GUARDIAN_PREFIXES)} ${surname}`,
    guardianPhone: phoneFor(`guardian:${registerNo}`),
  }
})

const STUDENTS_BY_CLASS = new Map<string, StudentSpec[]>(
  CLASSES.map((klass) => [klass.key, STUDENTS.filter((s) => s.classKey === klass.key)]),
)

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

interface SubjectSpec {
  code: string
  name: string
  classKey: string
  teacherEmployeeId: string
  credits: number
}

const SUBJECTS: readonly SubjectSpec[] = [
  { code: 'BCA301', name: 'Database Management Systems', classKey: 'BCA-3-A', teacherEmployeeId: 'T01', credits: 4 },
  { code: 'BCA302', name: 'Data Structures and Algorithms', classKey: 'BCA-3-A', teacherEmployeeId: 'T02', credits: 4 },
  { code: 'BCA303', name: 'Object Oriented Programming with Java', classKey: 'BCA-3-A', teacherEmployeeId: 'T03', credits: 4 },
  { code: 'BCA304', name: 'Operating Systems', classKey: 'BCA-3-A', teacherEmployeeId: 'T01', credits: 3 },
  { code: 'BCM301', name: 'Corporate Accounting', classKey: 'BCOM-3-A', teacherEmployeeId: 'T04', credits: 4 },
  { code: 'BCM302', name: 'Business Statistics', classKey: 'BCOM-3-A', teacherEmployeeId: 'T05', credits: 4 },
  { code: 'BCM303', name: 'Income Tax Law and Practice', classKey: 'BCOM-3-A', teacherEmployeeId: 'T04', credits: 3 },
  { code: 'BBA101', name: 'Principles of Management', classKey: 'BBA-1-A', teacherEmployeeId: 'T06', credits: 4 },
  { code: 'BBA102', name: 'Financial Accounting', classKey: 'BBA-1-A', teacherEmployeeId: 'T05', credits: 4 },
]

// ---------------------------------------------------------------------------
// Attendance and marks model
// ---------------------------------------------------------------------------

/**
 * Each student gets one stable attendance rate in [0.62, 0.98]. The exponent
 * skews the distribution towards the top of that range, so most of the cohort
 * looks healthy while roughly six students sit under the 75% threshold the
 * apps warn about.
 */
function attendanceRate(registerNo: string): number {
  return 0.62 + Math.pow(rand(`rate:${registerNo}`), 0.55) * 0.36
}

const ABSENCE_REMARKS = ['Informed absence', 'No intimation'] as const
const EXCUSED_REMARKS = ['Medical leave', 'College duty — inter-collegiate fest'] as const

interface DayMark {
  status: AttendanceStatus
  remarks: string | null
}

function markFor(registerNo: string, subjectCode: string, day: string): DayMark {
  const key = `${registerNo}:${subjectCode}:${day}`
  if (rand(`att:${key}`) < attendanceRate(registerNo)) {
    // A small slice of attended classes are logged late rather than present;
    // the API counts both towards the attendance percentage.
    return rand(`late:${key}`) < 0.06
      ? { status: 'LATE', remarks: 'Arrived after roll call' }
      : { status: 'PRESENT', remarks: null }
  }
  if (rand(`excused:${key}`) < 0.12) {
    return { status: 'EXCUSED', remarks: pick(`excusedNote:${key}`, EXCUSED_REMARKS) }
  }
  return {
    status: 'ABSENT',
    remarks: rand(`absentNote:${key}`) < 0.3 ? pick(`absentText:${key}`, ABSENCE_REMARKS) : null,
  }
}

interface MarkSheetRow {
  internalMarks: number
  externalMarks: number
  grade: string
  remarks: string | null
}

/**
 * Marks track the student's attendance rate with per-subject variation, so the
 * dashboards show the correlation a real progress card has — the students who
 * turn up score better — without every subject being identical.
 */
function marksFor(registerNo: string, subjectCode: string): MarkSheetRow {
  const rate = attendanceRate(registerNo)
  const aptitude = (rand(`aptitude:${registerNo}:${subjectCode}`) - 0.5) * 0.24
  const performance = clamp(rate * 0.92 + 0.04 + aptitude, 0.28, 0.99)

  const internalMarks = Math.round(clamp(performance + 0.07, 0, 0.99) * 40)
  const externalMarks = Math.round(clamp(performance - 0.04, 0, 0.99) * 60)

  const percentage = rowPercentage({
    internalMarks,
    externalMarks,
    maxInternal: 40,
    maxExternal: 60,
  })
  const { grade } = gradeFor(percentage)

  let remarks: string | null = null
  if (grade === 'F') remarks = 'Must reappear — attend the remedial batch.'
  else if (grade === 'C') remarks = 'Improvement required in the external examination.'
  else if (grade === 'O') remarks = 'Excellent performance — keep it up.'

  return { internalMarks, externalMarks, grade, remarks }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

interface EventSpec {
  slug: string
  title: string
  description: string
  category: string
  startsInDays: number
  startHour: number
  durationHours: number
  venue: string
  fee: number
  capacity: number | null
  registrationOpen: boolean
  organizer: string
  contactName: string
  contactEmail: string
  contactPhone: string
  /** Employee id of the staff member who owns it, or null for the principal. */
  ownerEmployeeId: string | null
}

const EVENTS: readonly EventSpec[] = [
  {
    slug: 'data-analytics-with-python-workshop',
    title: 'Certificate Workshop — Data Analytics with Python',
    description:
      'A three-day hands-on add-on programme run by the Department of Computer Applications, covering Python fundamentals, pandas, data cleaning, visualisation with Matplotlib and a capstone dashboard project. Seats are limited to a single lab and every participant receives a certificate on completion.',
    category: 'Workshop',
    startsInDays: 5,
    startHour: 10,
    durationHours: 6,
    venue: 'ICT Block — Computer Lab 3',
    fee: 150,
    capacity: 60,
    registrationOpen: true,
    organizer: 'Dept. of Computer Applications',
    contactName: 'Dr. Ramesh Nagaraj',
    contactEmail: `ramesh.nagaraj@${STAFF_DOMAIN}`,
    contactPhone: COLLEGE_PHONE,
    ownerEmployeeId: 'T01',
  },
  {
    slug: 'silver-jubilee-guest-lecture-series',
    title: 'Silver Jubilee Guest Lecture Series',
    description:
      "Continuing SFGC's tradition of hosting thought leaders — from His Holiness the Dalai Lama to Dr. Sam Pitroda, Shri Kailash Satyarthi and Mrs. Sudha Murthy — the Silver Jubilee Guest Lecture Series brings a distinguished speaker to campus for a morning on education, innovation and nation-building, followed by an open Q&A and a panel discussion with students.",
    category: 'Seminar',
    startsInDays: 12,
    startHour: 11,
    durationHours: 2,
    venue: 'Sabhangana',
    fee: 0,
    capacity: 500,
    registrationOpen: true,
    organizer: 'IQAC Cell',
    contactName: 'IQAC Cell',
    contactEmail: `iqac@${STAFF_DOMAIN}`,
    contactPhone: COLLEGE_PHONE,
    ownerEmployeeId: null,
  },
  {
    slug: 'sambhram-cultural-fest-2026',
    title: 'Inter-Collegiate Cultural Fest — Sambhram 2026',
    description:
      "Sambhram is SFGC's flagship inter-collegiate cultural fest, drawing teams from colleges across Bengaluru for a celebration of music, dance, theatre, fashion and fine arts. Two stages and twenty events — group dance, solo singing, battle of bands, fashion show, street play (beedi nataka), painting, mehendi and rangoli — with trophies, cash prizes and the overall championship at stake.",
    category: 'Fest',
    startsInDays: 21,
    startHour: 9,
    durationHours: 9,
    venue: 'Open Air Theatre',
    fee: 200,
    capacity: 400,
    registrationOpen: true,
    organizer: 'Cultural Committee',
    contactName: 'Prof. Deepa Sridhar',
    contactEmail: `cultural@${STAFF_DOMAIN}`,
    contactPhone: COLLEGE_PHONE,
    ownerEmployeeId: 'T06',
  },
  {
    slug: 'techspardha-2026',
    title: 'National Tech Fest — TechSpardha 2026',
    description:
      'The annual national technical fest hosted by the Departments of Computer Science and Computer Applications. Teams compete across a six-hour hackathon, competitive coding, a project and startup idea expo, a web design and UI/UX challenge, e-sports and a tech quiz — with mentorship from industry professionals and recruiters scouting for talent.',
    category: 'Fest',
    startsInDays: 44,
    startHour: 9,
    durationHours: 8,
    venue: 'ICT Block & Laboratories',
    fee: 300,
    capacity: 250,
    registrationOpen: true,
    organizer: 'Dept. of Computer Science',
    contactName: 'Prof. Lakshmi Narayan',
    contactEmail: `techspardha@${STAFF_DOMAIN}`,
    contactPhone: COLLEGE_PHONE,
    ownerEmployeeId: 'T02',
  },
  {
    slug: 'independence-day-celebration-2026',
    title: 'Independence Day Celebration & NCC Parade',
    description:
      'SFGC commemorates Independence Day with flag hoisting by the chief guest, a ceremonial NCC guard of honour and parade, patriotic songs and cultural performances, closing with the felicitation of student achievers and the national anthem.',
    category: 'Cultural',
    startsInDays: -18,
    startHour: 8,
    durationHours: 3,
    venue: 'College Grounds',
    fee: 0,
    capacity: 800,
    registrationOpen: false,
    organizer: 'NCC Unit',
    contactName: 'Prof. Naveen Kumar K S',
    contactEmail: `ncc@${STAFF_DOMAIN}`,
    contactPhone: COLLEGE_PHONE,
    ownerEmployeeId: 'T03',
  },
  {
    slug: 'annual-inter-departmental-sports-meet',
    title: 'Annual Inter-Departmental Sports Meet',
    description:
      'The annual athletic meet brings every department onto the college grounds for track and field, throwball, volleyball, kabaddi, chess and carrom, opening with the march past and closing with the inter-departmental championship trophy.',
    category: 'Sports',
    startsInDays: -32,
    startHour: 8,
    durationHours: 9,
    venue: 'College Grounds',
    fee: 0,
    capacity: null,
    registrationOpen: false,
    organizer: 'Dept. of Physical Education',
    contactName: 'Dept. of Physical Education',
    contactEmail: `sports@${STAFF_DOMAIN}`,
    contactPhone: COLLEGE_PHONE,
    ownerEmployeeId: null,
  },
]

interface RegistrationSpec {
  eventSlug: string
  registerNo: string
  teamName: string | null
  teamMembers: string | null
}

/** Twelve registrations, all on events whose registration is still open. */
const REGISTRATIONS: readonly RegistrationSpec[] = [
  {
    eventSlug: 'sambhram-cultural-fest-2026',
    registerNo: 'SFGC104',
    teamName: 'Nrityanjali',
    teamMembers: 'Meghana Bhat, Pooja Hegde, Shreya Deshpande',
  },
  { eventSlug: 'sambhram-cultural-fest-2026', registerNo: 'SFGC118', teamName: 'Swaralaya', teamMembers: 'Anusha Pai' },
  {
    eventSlug: 'sambhram-cultural-fest-2026',
    registerNo: 'SFGC132',
    teamName: 'Beedi Nataka Crew',
    teamMembers: 'Varun Malhotra, Yash Agarwal, Trisha Fernandes',
  },
  { eventSlug: 'sambhram-cultural-fest-2026', registerNo: 'SFGC116', teamName: null, teamMembers: null },

  {
    eventSlug: 'techspardha-2026',
    registerNo: 'SFGC101',
    teamName: 'Null Pointers',
    teamMembers: 'Rohan Shetty, Karthik Gowda',
  },
  {
    eventSlug: 'techspardha-2026',
    registerNo: 'SFGC109',
    teamName: 'Stack Overflow',
    teamMembers: 'Nikhil Kulkarni, Tejas Patil',
  },
  { eventSlug: 'techspardha-2026', registerNo: 'SFGC113', teamName: 'Byte Me', teamMembers: 'Bhavana Rai' },

  { eventSlug: 'silver-jubilee-guest-lecture-series', registerNo: 'SFGC117', teamName: null, teamMembers: null },
  { eventSlug: 'silver-jubilee-guest-lecture-series', registerNo: 'SFGC126', teamName: null, teamMembers: null },
  { eventSlug: 'silver-jubilee-guest-lecture-series', registerNo: 'SFGC135', teamName: null, teamMembers: null },

  { eventSlug: 'data-analytics-with-python-workshop', registerNo: 'SFGC102', teamName: null, teamMembers: null },
  { eventSlug: 'data-analytics-with-python-workshop', registerNo: 'SFGC112', teamName: null, teamMembers: null },
]

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------

interface NoticeSpec {
  title: string
  body: string
  category: string
  audience: NoticeAudience
  pinned: boolean
  program: string | null
  semester: number | null
  publishedInDays: number
  expiresInDays: number | null
  /** Employee id of the author, or null for the principal. */
  authorEmployeeId: string | null
}

const NOTICES: readonly NoticeSpec[] = [
  {
    title: 'Odd Semester Internal Assessment I — Timetable Released',
    body:
      'The timetable for Internal Assessment I of all odd semester programmes (BCA, B.Com, BBA, BSc, MBA, MCA and M.Com) has been published on the notice board and the Cloud Campus portal. Examinations begin on the first working day of next month and run for six days. Students must carry their college identity card to every session; entry to the hall closes ten minutes after the paper starts.',
    category: 'Exam',
    audience: 'ALL',
    pinned: true,
    program: null,
    semester: null,
    publishedInDays: -4,
    expiresInDays: 30,
    authorEmployeeId: null,
  },
  {
    title: 'Placement Drive — Amazon, Deloitte and TCS on Campus This Month',
    body:
      'The Career Guidance and Placement Cell has confirmed on-campus drives with Amazon, Deloitte and TCS for final-year students across all programmes. Eligible students must register with the Placement Cell with an updated résumé and a copy of their marks cards. Pre-placement talks are scheduled in the Main Auditorium; attendance is compulsory for registered candidates.',
    category: 'Placement',
    audience: 'STUDENTS',
    pinned: true,
    program: null,
    semester: null,
    publishedInDays: -6,
    expiresInDays: 21,
    authorEmployeeId: null,
  },
  {
    title: 'BCA Semester 3 — DBMS Practical Examination Schedule',
    body:
      'The Database Management Systems (BCA301) practical examination for Semester 3, Section A will be held in Computer Lab 2 across two batches. Batch I reports at 9:30 AM and Batch II at 1:30 PM. Every candidate must bring a completed and certified laboratory record; records without the internal guide\'s signature will not be accepted at the examination desk.',
    category: 'Exam',
    audience: 'STUDENTS',
    pinned: false,
    program: 'BCA',
    semester: 3,
    publishedInDays: -2,
    expiresInDays: 18,
    authorEmployeeId: 'T01',
  },
  {
    title: 'College Holiday — Independence Day',
    body:
      'The college will remain closed on 15 August on account of Independence Day. Flag hoisting, the NCC guard of honour and the cultural programme begin at 8:00 AM on the college grounds. Students of the NCC and NSS units, the student council and cultural teams are required to report by 7:30 AM in uniform.',
    category: 'Holiday',
    audience: 'ALL',
    pinned: false,
    program: null,
    semester: null,
    publishedInDays: -22,
    expiresInDays: null,
    authorEmployeeId: null,
  },
  {
    title: 'Registrations Open — Sambhram Inter-Collegiate Cultural Fest',
    body:
      'Registrations are now open for Sambhram, the inter-collegiate cultural fest hosted at the Open Air Theatre. Events include group dance, solo singing, battle of bands, fashion show, street play and fine arts. The entry fee is ₹200 per team and includes lunch coupons for all participants. Team leaders should register through the events page or with the Cultural Committee.',
    category: 'Event',
    audience: 'ALL',
    pinned: false,
    program: null,
    semester: null,
    publishedInDays: -5,
    expiresInDays: 21,
    authorEmployeeId: 'T06',
  },
  {
    title: 'Admissions Open for the 2026–27 Academic Year',
    body:
      'Admissions are open across all UG and PG programmes — B.Com, B.Com with Big Data Analytics, BCA, BBA, BBA in Aviation Management, BSc (BBG), BSc (EMC), M.Com, MCA, MBA and the SAGE Global MBA. Application forms and the prospectus are available at the admission office and online. Merit and management quota seats are filled on a rolling basis, so early applications are encouraged.',
    category: 'General',
    audience: 'ALL',
    pinned: false,
    program: null,
    semester: null,
    publishedInDays: -14,
    expiresInDays: 60,
    authorEmployeeId: null,
  },
  {
    title: 'ATAL Faculty Development Programme — Registration Open',
    body:
      'The AICTE Training and Learning (ATAL) Academy Faculty Development Programme will be hosted by the college this term. Faculty across departments are invited to register through the ATAL portal and forward the confirmation to the IQAC Cell. Attendance across all six days is mandatory for the certificate.',
    category: 'Event',
    audience: 'TEACHERS',
    pinned: false,
    program: null,
    semester: null,
    publishedInDays: -9,
    expiresInDays: 25,
    authorEmployeeId: 'T05',
  },
  {
    title: 'SFGC NSS Unit Felicitated with Karnataka State Best NSS Unit Award',
    body:
      'The NSS Unit of Seshadripuram First Grade College has been honoured with the Karnataka State Best NSS Unit Award, and Prof. Naveen Kumar K S has been recognised as the Best NSS Programme Officer. The award recognises the unit\'s village adoption programme, blood donation camps and environmental drives. Congratulations to every volunteer who made this possible.',
    category: 'General',
    audience: 'ALL',
    pinned: false,
    program: null,
    semester: null,
    publishedInDays: -18,
    expiresInDays: null,
    authorEmployeeId: 'T03',
  },
  {
    title: 'Library — Return of Borrowed Books Before Semester Break',
    body:
      'All students must return borrowed volumes to the library before the semester break. Outstanding books attract a fine of ₹2 per day, and no-dues clearance will not be issued until every title is returned. Reference and reserved sections remain open during the break from 10:00 AM to 4:00 PM on working days.',
    category: 'General',
    audience: 'STUDENTS',
    pinned: false,
    program: null,
    semester: null,
    publishedInDays: -11,
    expiresInDays: 40,
    authorEmployeeId: null,
  },
  {
    title: 'Semester Fee Payment — Last Date Extended',
    body:
      'The last date for payment of semester fees was extended by one week at the request of the student council. Payments are accepted at the accounts section and through the online portal. Students who have already paid may collect their receipts from the accounts counter.',
    category: 'General',
    audience: 'STUDENTS',
    pinned: false,
    program: null,
    semester: null,
    publishedInDays: -30,
    // Already lapsed — proves the API's expiry filter hides it from listings.
    expiresInDays: -3,
    authorEmployeeId: null,
  },
]

// ---------------------------------------------------------------------------
// Seed steps
// ---------------------------------------------------------------------------

function assertUniqueEmails(emails: readonly string[]): void {
  const seen = new Set<string>()
  for (const email of emails) {
    if (seen.has(email)) throw new Error(`Duplicate seed email: ${email}`)
    seen.add(email)
  }
}

async function seedUsers(): Promise<{
  adminId: string
  teacherIdByEmployeeId: Map<string, string>
  studentIdByRegisterNo: Map<string, string>
}> {
  assertUniqueEmails([
    env.SEED_ADMIN_EMAIL,
    ...TEACHERS.map((teacher) => teacher.email),
    ...STUDENTS.map((student) => student.email),
  ])

  // The admin password has no default and must be supplied deliberately.
  //
  // This seed upserts the admin account, so running it silently rewrites that
  // password. When the value came from a default published in this repository,
  // every run quietly reset the live administrator back to a credential anyone
  // could look up. Refusing here is the last point at which that is catchable.
  const adminPassword = env.SEED_ADMIN_PASSWORD
  if (adminPassword && adminPassword.length < 12) {
    throw new Error(
      `SEED_ADMIN_PASSWORD is ${adminPassword.length} characters. Use at least 12.\n\n` +
        'This guards the administrator account, which can post as the college and\n' +
        'delete student records. Checked here rather than at API startup, so that a\n' +
        'short value left in a .env cannot stop the server booting over a variable it\n' +
        'never reads.',
    )
  }
  if (!adminPassword) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is not set.\n\n' +
        'The seed upserts the administrator account, so it needs a password to set.\n' +
        'Choose one (12+ characters) and pass it for this run only:\n\n' +
        '  SEED_ADMIN_PASSWORD="<your password>" npm run db:seed --workspace backend\n\n' +
        'To change the password without re-seeding everything, use:\n' +
        '  npm run user:password --workspace backend',
    )
  }

  // One bcrypt round per distinct demo password rather than per account —
  // hashing 47 times costs several seconds for no benefit in sample data.
  const [adminHash, teacherHash, studentHash] = await Promise.all([
    hashPassword(adminPassword),
    hashPassword(TEACHER_PASSWORD),
    hashPassword(STUDENT_PASSWORD),
  ])

  const admin = await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    update: {
      name: 'Dr. S. N. Venkatesh',
      role: 'ADMIN',
      passwordHash: adminHash,
      designation: 'Principal',
      department: 'Administration',
      phone: COLLEGE_PHONE,
      isActive: true,
    },
    create: {
      email: env.SEED_ADMIN_EMAIL,
      name: 'Dr. S. N. Venkatesh',
      role: 'ADMIN',
      passwordHash: adminHash,
      designation: 'Principal',
      department: 'Administration',
      phone: COLLEGE_PHONE,
    },
    select: { id: true },
  })

  const teacherIdByEmployeeId = new Map<string, string>()
  for (const teacher of TEACHERS) {
    const row = await prisma.user.upsert({
      where: { email: teacher.email },
      update: {
        name: teacher.name,
        role: 'TEACHER',
        passwordHash: teacherHash,
        employeeId: teacher.employeeId,
        designation: teacher.designation,
        department: teacher.department,
        phone: phoneFor(`teacher:${teacher.employeeId}`),
        isActive: true,
      },
      create: {
        email: teacher.email,
        name: teacher.name,
        role: 'TEACHER',
        passwordHash: teacherHash,
        employeeId: teacher.employeeId,
        designation: teacher.designation,
        department: teacher.department,
        phone: phoneFor(`teacher:${teacher.employeeId}`),
      },
      select: { id: true },
    })
    teacherIdByEmployeeId.set(teacher.employeeId, row.id)
  }

  const studentIdByRegisterNo = new Map<string, string>()
  for (const student of STUDENTS) {
    const row = await prisma.user.upsert({
      where: { email: student.email },
      update: {
        name: student.name,
        role: 'STUDENT',
        passwordHash: studentHash,
        registerNo: student.registerNo,
        program: student.program,
        semester: student.semester,
        section: student.section,
        department: student.department,
        admissionYear: student.admissionYear,
        phone: student.phone,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        isActive: true,
      },
      create: {
        email: student.email,
        name: student.name,
        role: 'STUDENT',
        passwordHash: studentHash,
        registerNo: student.registerNo,
        program: student.program,
        semester: student.semester,
        section: student.section,
        department: student.department,
        admissionYear: student.admissionYear,
        phone: student.phone,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
      },
      select: { id: true },
    })
    studentIdByRegisterNo.set(student.registerNo, row.id)
  }

  return { adminId: admin.id, teacherIdByEmployeeId, studentIdByRegisterNo }
}

interface Enrolment {
  student: StudentSpec
  userId: string
}

interface SeededSubject {
  id: string
  spec: SubjectSpec
  teacherId: string
  roster: Enrolment[]
}

async function seedSubjects(
  teacherIdByEmployeeId: ReadonlyMap<string, string>,
  studentIdByRegisterNo: ReadonlyMap<string, string>,
): Promise<SeededSubject[]> {
  const seeded: SeededSubject[] = []

  for (const spec of SUBJECTS) {
    const klass = mustGet(CLASS_BY_KEY, spec.classKey, 'class')
    const teacherId = mustGet(teacherIdByEmployeeId, spec.teacherEmployeeId, 'teacher')
    const roster: Enrolment[] = mustGet(STUDENTS_BY_CLASS, spec.classKey, 'class roster').map(
      (student) => ({
        student,
        userId: mustGet(studentIdByRegisterNo, student.registerNo, 'student'),
      }),
    )
    const connect = roster.map((entry) => ({ id: entry.userId }))

    const subject = await prisma.subject.upsert({
      where: { code: spec.code },
      update: {
        name: spec.name,
        program: klass.program,
        semester: klass.semester,
        section: klass.section,
        credits: spec.credits,
        department: klass.department,
        academicYear: DEFAULT_ACADEMIC_YEAR,
        isActive: true,
        teacher: { connect: { id: teacherId } },
        // `connect`, not `set`: connecting an already-enrolled student is a
        // no-op, whereas `set` would silently drop anyone enrolled outside the
        // seed. Nothing here removes data.
        students: { connect },
      },
      create: {
        code: spec.code,
        name: spec.name,
        program: klass.program,
        semester: klass.semester,
        section: klass.section,
        credits: spec.credits,
        department: klass.department,
        academicYear: DEFAULT_ACADEMIC_YEAR,
        teacher: { connect: { id: teacherId } },
        students: { connect },
      },
      select: { id: true },
    })

    seeded.push({ id: subject.id, spec, teacherId, roster })
  }

  return seeded
}

async function seedAttendance(subjects: readonly SeededSubject[]): Promise<number> {
  const days = recentSchoolDays(SCHOOL_DAYS, todayCalendarDay())
  const rows: Prisma.AttendanceCreateManyInput[] = []

  for (const subject of subjects) {
    for (const day of days) {
      const label = formatCalendarDay(day)
      for (const entry of subject.roster) {
        const mark = markFor(entry.student.registerNo, subject.spec.code, label)
        rows.push({
          studentId: entry.userId,
          subjectId: subject.id,
          date: day,
          status: mark.status,
          remarks: mark.remarks,
          markedById: subject.teacherId,
        })
      }
    }
  }

  let inserted = 0
  for (const batch of chunk(rows, 500)) {
    // The composite unique key (student, subject, day) plus fully deterministic
    // statuses makes skipDuplicates equivalent to an upsert here, at a fraction
    // of the round trips a per-row upsert of ~4k records would cost.
    const result = await prisma.attendance.createMany({ data: batch, skipDuplicates: true })
    inserted += result.count
  }
  return inserted
}

async function seedProgressCards(subjects: readonly SeededSubject[]): Promise<number> {
  const operations: Prisma.PrismaPromise<unknown>[] = []

  for (const subject of subjects) {
    const klass = mustGet(CLASS_BY_KEY, subject.spec.classKey, 'class')
    for (const entry of subject.roster) {
      const studentId = entry.userId
      const marks = marksFor(entry.student.registerNo, subject.spec.code)
      const shared = {
        internalMarks: marks.internalMarks,
        maxInternal: 40,
        externalMarks: marks.externalMarks,
        maxExternal: 60,
        grade: marks.grade,
        credits: subject.spec.credits,
        remarks: marks.remarks,
        isPublished: true,
        recordedById: subject.teacherId,
      }

      operations.push(
        prisma.progressCard.upsert({
          where: {
            studentId_subjectId_semester_academicYear: {
              studentId,
              subjectId: subject.id,
              semester: klass.semester,
              academicYear: DEFAULT_ACADEMIC_YEAR,
            },
          },
          update: shared,
          create: {
            studentId,
            subjectId: subject.id,
            semester: klass.semester,
            academicYear: DEFAULT_ACADEMIC_YEAR,
            ...shared,
          },
          select: { id: true },
        }),
      )
    }
  }

  for (const batch of chunk(operations, 50)) {
    await prisma.$transaction(batch)
  }
  return operations.length
}

async function seedEvents(
  adminId: string,
  teacherIdByEmployeeId: ReadonlyMap<string, string>,
): Promise<Map<string, string>> {
  const idBySlug = new Map<string, string>()

  for (const spec of EVENTS) {
    const startsAt = daysFromNow(spec.startsInDays, spec.startHour)
    const endsAt = new Date(startsAt.getTime() + spec.durationHours * 60 * 60 * 1000)
    const createdById =
      spec.ownerEmployeeId === null
        ? adminId
        : mustGet(teacherIdByEmployeeId, spec.ownerEmployeeId, 'event owner')

    const shared = {
      title: spec.title,
      description: spec.description,
      category: spec.category,
      startsAt,
      endsAt,
      venue: spec.venue,
      fee: spec.fee,
      capacity: spec.capacity,
      registrationOpen: spec.registrationOpen,
      isPublished: true,
      organizer: spec.organizer,
      contactName: spec.contactName,
      contactEmail: spec.contactEmail,
      contactPhone: spec.contactPhone,
      createdById,
    }

    const event = await prisma.event.upsert({
      where: { slug: spec.slug },
      update: shared,
      create: { slug: spec.slug, ...shared },
      select: { id: true },
    })
    idBySlug.set(spec.slug, event.id)
  }

  return idBySlug
}

const STUDENT_BY_REGISTER_NO = new Map(STUDENTS.map((student) => [student.registerNo, student]))

async function seedEventRegistrations(
  eventIdBySlug: ReadonlyMap<string, string>,
  studentIdByRegisterNo: ReadonlyMap<string, string>,
): Promise<number> {
  const taken = new Set<string>()
  let count = 0

  for (const spec of REGISTRATIONS) {
    const eventId = mustGet(eventIdBySlug, spec.eventSlug, 'event')
    const student = mustGet(STUDENT_BY_REGISTER_NO, spec.registerNo, 'student')
    const userId = mustGet(studentIdByRegisterNo, spec.registerNo, 'student account')
    const ticketCode = ticketCodeFor(`${spec.eventSlug}:${spec.registerNo}`, taken)

    await prisma.eventRegistration.upsert({
      where: { eventId_email: { eventId, email: student.email } },
      // ticketCode is deliberately left out of `update`: a ticket already
      // issued to a student is theirs, and rewriting it would invalidate the
      // pass they are holding.
      update: {
        name: student.name,
        phone: student.phone,
        college: COLLEGE_NAME,
        teamName: spec.teamName,
        teamMembers: spec.teamMembers,
        status: 'CONFIRMED',
        userId,
      },
      create: {
        ticketCode,
        eventId,
        userId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        college: COLLEGE_NAME,
        teamName: spec.teamName,
        teamMembers: spec.teamMembers,
        status: 'CONFIRMED',
      },
      select: { id: true },
    })
    count += 1
  }

  return count
}

async function seedNotices(
  adminId: string,
  teacherIdByEmployeeId: ReadonlyMap<string, string>,
): Promise<number> {
  for (const spec of NOTICES) {
    const authorId =
      spec.authorEmployeeId === null
        ? adminId
        : mustGet(teacherIdByEmployeeId, spec.authorEmployeeId, 'notice author')

    const data = {
      title: spec.title,
      body: spec.body,
      category: spec.category,
      audience: spec.audience,
      pinned: spec.pinned,
      program: spec.program,
      semester: spec.semester,
      publishedAt: daysFromNow(spec.publishedInDays, 9, 30),
      expiresAt: spec.expiresInDays === null ? null : daysFromNow(spec.expiresInDays, 23, 59),
      authorId,
    }

    // Notice has no natural unique column, so the title stands in for one —
    // it is unique across the seed set and lets a re-run refresh rather than
    // duplicate each announcement.
    const existing = await prisma.notice.findFirst({
      where: { title: spec.title },
      select: { id: true },
    })

    if (existing) {
      await prisma.notice.update({ where: { id: existing.id }, data })
    } else {
      await prisma.notice.create({ data })
    }
  }

  return NOTICES.length
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function renderTable(headers: readonly string[], rows: ReadonlyArray<readonly string[]>): string {
  const widths = headers.map((header, column) => {
    let width = header.length
    for (const row of rows) width = Math.max(width, (row[column] ?? '').length)
    return width
  })

  const rule = (left: string, join: string, right: string) =>
    `  ${left}${widths.map((width) => '─'.repeat(width + 2)).join(join)}${right}`

  const line = (cells: readonly string[]) =>
    `  │ ${widths.map((width, column) => (cells[column] ?? '').padEnd(width)).join(' │ ')} │`

  return [
    rule('┌', '┬', '┐'),
    line(headers),
    rule('├', '┼', '┤'),
    ...rows.map(line),
    rule('└', '┴', '┘'),
  ].join('\n')
}

function countLine(label: string, value: number, note = ''): string {
  const dots = '.'.repeat(Math.max(3, 22 - label.length))
  return `  ${label} ${dots} ${String(value).padStart(5)}${note ? `   ${note}` : ''}`
}

async function printSummary(): Promise<void> {
  const [admins, teachers, students, subjects, attendance, progress, events, registrations, notices] =
    await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.subject.count(),
      prisma.attendance.count(),
      prisma.progressCard.count(),
      prisma.event.count(),
      prisma.eventRegistration.count(),
      prisma.notice.count(),
    ])

  const atRisk = STUDENTS.filter((student) => attendanceRate(student.registerNo) < 0.75).length

  const firstTeacher = TEACHERS[0]
  const firstStudent = STUDENTS[0]
  if (!firstTeacher || !firstStudent) throw new Error('Seed data is empty.')

  const bar = '━'.repeat(64)

  console.log(`\n${bar}`)
  console.log(`  ${COLLEGE_NAME} — database seeded`)
  console.log(bar)
  console.log(countLine('Admins', admins))
  console.log(countLine('Teachers', teachers))
  console.log(countLine('Students', students, `${atRisk} below the 75% attendance mark`))
  console.log(countLine('Subjects', subjects))
  console.log(countLine('Attendance rows', attendance, `${SCHOOL_DAYS} school days per subject`))
  console.log(countLine('Progress cards', progress))
  console.log(countLine('Events', events))
  console.log(countLine('Registrations', registrations))
  console.log(countLine('Notices', notices))
  console.log('')
  console.log('  Demo logins — sign in with the email or the register/employee id:')
  console.log('')
  console.log(
    renderTable(
      ['Role', 'Identifier', 'Also accepts', 'Password'],
      [
        // Never echoed back. The operator supplied it moments ago and knows it;
        // printing it only risks it living on in a terminal scrollback or a CI log.
        ['ADMIN', env.SEED_ADMIN_EMAIL, '—', '(the one you supplied)'],
        ['TEACHER', firstTeacher.email, firstTeacher.employeeId, TEACHER_PASSWORD],
        ['STUDENT', firstStudent.email, firstStudent.registerNo, STUDENT_PASSWORD],
      ],
    ),
  )
  console.log('')
  console.log(`  All ${TEACHERS.length} teachers share the password "${TEACHER_PASSWORD}"`)
  console.log(`  and all ${STUDENTS.length} students "${STUDENT_PASSWORD}" — demo data only.`)
  console.log(`${bar}\n`)
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[seed] Seeding Seshadripuram First Grade College…')

  const { adminId, teacherIdByEmployeeId, studentIdByRegisterNo } = await seedUsers()
  console.log(`[seed] Accounts ready (1 admin, ${TEACHERS.length} teachers, ${STUDENTS.length} students).`)

  const subjects = await seedSubjects(teacherIdByEmployeeId, studentIdByRegisterNo)
  console.log(`[seed] ${subjects.length} subjects with rosters enrolled.`)

  const attendanceInserted = await seedAttendance(subjects)
  console.log(`[seed] Attendance generated (${attendanceInserted} new rows).`)

  const progressCount = await seedProgressCards(subjects)
  console.log(`[seed] ${progressCount} progress card rows written.`)

  const eventIdBySlug = await seedEvents(adminId, teacherIdByEmployeeId)
  console.log(`[seed] ${eventIdBySlug.size} events published.`)

  const registrationCount = await seedEventRegistrations(eventIdBySlug, studentIdByRegisterNo)
  console.log(`[seed] ${registrationCount} event registrations linked.`)

  const noticeCount = await seedNotices(adminId, teacherIdByEmployeeId)
  console.log(`[seed] ${noticeCount} notices posted.`)

  await printSummary()
}

main()
  .catch((error: unknown) => {
    console.error('\n[seed] Failed — nothing was deleted, so it is safe to fix and re-run.\n')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
