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

/**
 * Mirrors the Role enum in backend/prisma/schema.prisma.
 *
 * ADMIN is deprecated and kept only while the live administrator account is
 * moved to SUPER_ADMIN. Clients must accept both until that has happened and
 * every build is deployed — a client that recognises only one of the two names
 * locks the administrator out at whichever moment the other one is in force.
 */
export type Role =
  | 'STUDENT'
  | 'TEACHER'
  | 'CONTENT_ADMIN'
  | 'ADMISSIONS_OFFICER'
  | 'SUPER_ADMIN'
  /** @deprecated use SUPER_ADMIN */
  | 'ADMIN'
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
  /** Which hour of the day this class ran. */
  periodNumber: number
  /** Null when the period was later removed from the timetable. */
  periodLabel: string | null
  /** "HH:mm", 24-hour. Null for the same reason as `periodLabel`. */
  startTime: string | null
  endTime: string | null
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
  /** Stream-scoped ID, e.g. "BCA26001". Null for students predating it. */
  studentCode?: string | null
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
  studentCode?: string | null
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
  /** Defaults to 1 server-side when omitted. */
  periodNumber?: number
  records: Array<{
    studentId: string
    status: AttendanceStatus
    remarks?: string | null
  }>
}

export interface MarkAttendanceResult {
  marked: number
  date: string
  periodNumber: number
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

// ------------------------------------------------- streams and classes ----

/** A programme of study. `code` prefixes every student ID in the stream. */
export interface Stream {
  id: string
  code: string
  name: string
  shortName: string | null
  department: string | null
  durationSemesters: number
  isActive: boolean
  classGroupCount?: number
  studentCount?: number
}

export interface StreamInput {
  code: string
  name: string
  shortName?: string | null
  department?: string | null
  durationSemesters?: number
  isActive?: boolean
}

export interface StreamRef {
  id: string
  code: string
  name: string
  shortName?: string | null
}

/** One teachable class: a stream, a semester and a section, for one year. */
export interface ClassGroup {
  id: string
  streamId: string
  semester: number
  section: string
  academicYear: string
  stream: StreamRef
  studentCount?: number
}

export interface ClassGroupInput {
  streamId: string
  semester: number
  section: string
  academicYear?: string
}

// --------------------------------------------------------------- periods ----

/** A slot in the daily timetable. `startTime`/`endTime` are 24-hour "HH:mm". */
export interface Period {
  id: string
  number: number
  label: string | null
  startTime: string
  endTime: string
  isActive: boolean
}

export interface PeriodInput {
  number: number
  label?: string | null
  startTime: string
  endTime: string
  isActive?: boolean
}

// -------------------------------------------------------------- students ----

export interface ManagedStudent {
  id: string
  name: string
  email: string
  phone: string | null
  registerNo: string | null
  studentCode: string | null
  program: string | null
  semester: number | null
  section: string | null
  admissionYear: number | null
  guardianName: string | null
  guardianPhone: string | null
  isActive: boolean
  streamId: string | null
  classGroupId: string | null
  stream?: StreamRef | null
  classGroup?: { id: string; semester: number; section: string } | null
  /**
   * Only present in the response that created the account, and only when the
   * caller let the server pick the password. Never readable afterwards.
   */
  initialPassword?: string
}

export interface CreateStudentInput {
  name: string
  email: string
  classGroupId: string
  password?: string
  phone?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
  admissionYear?: number
  registerNo?: string | null
}

export interface UpdateStudentInput {
  name?: string
  email?: string
  classGroupId?: string
  phone?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
  isActive?: boolean
  password?: string
}

// --------------------------------------------------------------- library ----

export type MaterialKind =
  | 'NOTES'
  | 'QUESTION_PAPER'
  | 'SOLVED_PAPER'
  | 'SYLLABUS'
  | 'REFERENCE'

export interface StudyMaterial {
  id: string
  title: string
  description: string | null
  kind: MaterialKind
  fileUrl: string
  fileLabel: string | null
  semester: number | null
  isPublished: boolean
  createdAt: string
  streamId: string | null
  subjectId: string | null
  stream: StreamRef | null
  subject: SubjectRef | null
  uploadedBy: { id: string; name: string } | null
}

export interface StudyMaterialInput {
  title: string
  description?: string | null
  kind?: MaterialKind
  fileUrl: string
  fileLabel?: string | null
  streamId?: string | null
  semester?: number | null
  subjectId?: string | null
  isPublished?: boolean
}

// ------------------------------------------------------------ admissions ----

export type AdmissionStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'ENROLLED'

export type AdmissionDocumentKind =
  | 'MARKS_CARD'
  | 'TRANSFER_CERTIFICATE'
  | 'MIGRATION_CERTIFICATE'
  | 'ID_PROOF'
  | 'PHOTO'
  | 'CASTE_CERTIFICATE'
  | 'OTHER'

/** One row of the office's queue. Deliberately without reviewNotes. */
export interface AdmissionListItem {
  id: string
  applicationNo: string
  name: string
  email: string
  phone: string
  programmeName: string
  status: AdmissionStatus
  createdAt: string
  stream: { id: string; code: string; name: string } | null
  documentCount: number
}

export interface AdmissionDocument {
  id: string
  kind: AdmissionDocumentKind
  fileName: string | null
  fileSize: number | null
  /**
   * A signed link valid for a few minutes, generated when the record is
   * opened. Null when document storage is not configured. Never a permanent
   * URL — these are identity documents.
   */
  fileUrl: string | null
}

/** The full record. `reviewNotes` is the office's private assessment. */
export interface Admission extends AdmissionListItem {
  dateOfBirth: string | null
  address: string | null
  guardianName: string | null
  guardianPhone: string | null
  qualifyingExam: string | null
  boardUniversity: string | null
  yearOfPassing: number | null
  marksObtained: string | null
  reviewNotes: string | null
  decidedAt: string | null
  reviewedBy: { id: string; name: string } | null
  documents: AdmissionDocument[]
}

/** What the public form sends. */
export interface AdmissionApplicationInput {
  name: string
  email: string
  phone: string
  dateOfBirth?: string
  address?: string
  guardianName?: string
  guardianPhone?: string
  streamId?: string
  programmeName: string
  qualifyingExam?: string
  boardUniversity?: string
  yearOfPassing?: number
  marksObtained?: string
}

/**
 * All an applicant gets back. No row id and no document URLs — returning a
 * storage URL to an anonymous caller would make the endpoint usable as file
 * hosting on the college's own infrastructure.
 */
export interface AdmissionSubmitResult {
  applicationNo: string
  message: string
}

// --------------------------------------------------------------- gallery ----

/** A photograph on the public site. */
export interface GalleryImage {
  id: string
  title: string
  caption: string | null
  imageUrl: string
  /** Alt text. Null when nobody supplied one — do not fall back to the title. */
  altText: string | null
  album: string
  sortOrder: number
  isPublished: boolean
  createdAt: string
  uploadedBy: { id: string; name: string } | null
}

export interface GalleryImageInput {
  title: string
  caption?: string | null
  imageUrl: string
  altText?: string | null
  album?: string
  sortOrder?: number
  isPublished?: boolean
}

/** An album name with how many images it holds. Derived, not stored. */
export interface GalleryAlbum {
  album: string
  count: number
}

/** What the server reports about its upload capability. */
export interface MediaConfig {
  /** False when the storage secrets are not set; uploads will be refused. */
  configured: boolean
  maxBytes: number
  allowedTypes: string[]
}

/** One stored image, as returned by a successful upload. */
export interface UploadedMedia {
  /** Public URL, ready to store in `coverImage` or `attachmentUrl`. */
  url: string
  /** Object name inside the bucket. */
  path: string
  size: number
  contentType: string
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
