/**
 * Shared response and domain types.
 *
 * These mirror `API_CONTRACT.md` exactly. If you change a shape here, change it
 * there and in the backend in the same edit.
 */

// ------------------------------------------------------------- envelope ----

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'

export interface ApiErrorDetail {
  path: string
  message: string
}

export interface ApiFailure {
  success: false
  error: {
    code: ApiErrorCode
    message: string
    details?: ApiErrorDetail[]
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

// --------------------------------------------------------------- domain ----

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
export type NoticeAudience = 'ALL' | 'STUDENTS' | 'TEACHERS'
export type RegistrationStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  phone: string | null
  avatarUrl: string | null
  isActive: boolean
  registerNo: string | null
  program: string | null
  semester: number | null
  section: string | null
  admissionYear: number | null
  department: string | null
  employeeId: string | null
  designation: string | null
  createdAt: string
}

export interface AuthPayload {
  token: string
  user: User
}

export interface TeacherRef {
  id: string
  name: string
  email: string
}

export interface Subject {
  id: string
  code: string
  name: string
  program: string
  semester: number
  section: string | null
  credits: number
  department: string | null
  academicYear: string
  isActive: boolean
  teacher: TeacherRef | null
  studentCount?: number
}

export interface SubjectRef {
  id: string
  code: string
  name: string
}

export interface RosterStudent {
  id: string
  name: string
  registerNo: string | null
  avatarUrl: string | null
  todayStatus: AttendanceStatus | null
}

export interface SubjectRoster {
  subject: Subject
  students: RosterStudent[]
}

// ----------------------------------------------------------- attendance ----

export interface AttendanceStats {
  present: number
  absent: number
  late: number
  total: number
  percentage: number
}

export interface AttendanceRecord {
  id: string
  date: string
  status: AttendanceStatus
  remarks?: string | null
  subject: SubjectRef
}

export interface SubjectAttendance extends AttendanceStats {
  subjectId: string
  code: string
  name: string
}

export interface StudentRef {
  id: string
  name: string
  registerNo: string | null
}

export interface StudentAttendance {
  student: StudentRef
  overall: AttendanceStats
  bySubject: SubjectAttendance[]
  records: AttendanceRecord[]
}

export interface ClassAttendanceStudent {
  id: string
  name: string
  registerNo: string | null
  status: AttendanceStatus | null
  stats: { present: number; total: number; percentage: number }
}

export interface ClassAttendance {
  subject: Subject
  date: string
  summary: AttendanceStats
  students: ClassAttendanceStudent[]
}

export interface MarkAttendanceInput {
  subjectId: string
  date?: string
  records: Array<{
    studentId: string
    status: AttendanceStatus
    remarks?: string | null
  }>
}

export interface MarkAttendanceResult {
  marked: number
  date: string
  subjectId: string
}

// --------------------------------------------------------------- events ----

export interface Event {
  id: string
  slug: string
  title: string
  description: string
  category: string
  startsAt: string
  endsAt: string | null
  venue: string | null
  coverImage: string | null
  fee: number
  capacity: number | null
  registrationOpen: boolean
  isPublished: boolean
  organizer: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  registrationCount: number
  seatsLeft: number | null
  isRegistered?: boolean
}

export interface EventRegistration {
  id: string
  ticketCode: string
  eventId: string
  userId: string | null
  name: string
  email: string
  phone: string | null
  college: string | null
  teamName: string | null
  teamMembers: string | null
  status: RegistrationStatus
  createdAt: string
  event?: Event
}

export interface EventRegistrationInput {
  name: string
  email: string
  phone?: string
  college?: string
  teamName?: string
  teamMembers?: string
}

export interface EventRegistrationResult {
  ticketCode: string
  registration: EventRegistration
  event: Event
}

// -------------------------------------------------------------- notices ----

export interface NoticeAuthor {
  id: string
  name: string
  role: Role
}

export interface Notice {
  id: string
  title: string
  body: string
  category: string
  audience: NoticeAudience
  pinned: boolean
  attachmentUrl: string | null
  program: string | null
  semester: number | null
  publishedAt: string
  expiresAt: string | null
  author: NoticeAuthor
}

export interface NoticeInput {
  title: string
  body: string
  category?: string
  audience?: NoticeAudience
  pinned?: boolean
  attachmentUrl?: string | null
  program?: string | null
  semester?: number | null
  expiresAt?: string | null
}

// ------------------------------------------------------------- progress ----

export interface ProgressRow {
  id: string
  subject: SubjectRef
  internalMarks: number | null
  maxInternal: number
  externalMarks: number | null
  maxExternal: number
  total: number
  maxTotal: number
  grade: string | null
  credits: number
  remarks: string | null
  isPublished: boolean
}

export interface ProgressSummary {
  totalObtained: number
  totalMax: number
  percentage: number
  sgpa: number
  resultStatus: 'PASS' | 'FAIL' | 'PENDING'
  subjectCount: number
}

export interface ProgressCard {
  student: StudentRef & {
    program: string | null
    semester: number | null
    section: string | null
  }
  semester: number | null
  academicYear: string
  rows: ProgressRow[]
  summary: ProgressSummary
}

export interface SaveProgressInput {
  subjectId: string
  semester: number
  academicYear?: string
  isPublished?: boolean
  records: Array<{
    studentId: string
    internalMarks?: number | null
    externalMarks?: number | null
    remarks?: string | null
  }>
}

// ----------------------------------------------------------------- misc ----

export interface PublicStats {
  students: number
  teachers: number
  events: number
  notices: number
  placementRate: number
}

export interface LoginInput {
  identifier: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  role?: Role
  phone?: string
  registerNo?: string
  program?: string
  semester?: number
  section?: string
  department?: string
  employeeId?: string
  designation?: string
}
