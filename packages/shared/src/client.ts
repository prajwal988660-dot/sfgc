/**
 * Isomorphic API client for the SFGC backend.
 *
 * Uses only `fetch`, so the same code runs in the browser, in Next.js server
 * components and in React Native / Expo. Token retrieval is injected, because
 * each platform stores it differently (localStorage on web, SecureStore /
 * AsyncStorage on mobile, a cookie on the server).
 */

import type {
  ApiErrorCode,
  ApiErrorDetail,
  ApiResponse,
  AuthPayload,
  ClassAttendance,
  Event,
  EventRegistration,
  EventRegistrationInput,
  EventRegistrationResult,
  LoginInput,
  MarkAttendanceInput,
  MarkAttendanceResult,
  Notice,
  NoticeInput,
  PaginationMeta,
  ProgressCard,
  PublicStats,
  MediaConfig,
  UploadedMedia,
  Stream,
  StreamInput,
  ClassGroup,
  ClassGroupInput,
  Period,
  PeriodInput,
  ManagedStudent,
  CreateStudentInput,
  UpdateStudentInput,
  StudyMaterial,
  StudyMaterialInput,
  GalleryImage,
  GalleryImageInput,
  GalleryAlbum,
  Admission,
  AdmissionListItem,
  AdmissionStatus,
  AdmissionApplicationInput,
  AdmissionSubmitResult,
  MaterialKind,
  RegisterInput,
  SaveProgressInput,
  StudentAttendance,
  Subject,
  SubjectRoster,
  User,
} from './types'

/** Thrown by every client method when the API returns a non-2xx response. */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details?: ApiErrorDetail[]

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    details?: ApiErrorDetail[],
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }

  /** True when the caller should be bounced to the login screen. */
  get isAuthError(): boolean {
    return this.code === 'UNAUTHENTICATED' || this.code === 'INVALID_CREDENTIALS'
  }
}

export interface ApiClientOptions {
  /** e.g. "http://localhost:4000/api" — trailing slash optional. */
  baseUrl: string
  /** Returns the JWT to send, or null/undefined when signed out. */
  getToken?: () => string | null | undefined | Promise<string | null | undefined>
  /** Called whenever the API rejects the token, so the app can sign out. */
  onUnauthorized?: () => void | Promise<void>
  /** Extra headers merged into every request. */
  headers?: Record<string, string>
  /** Abort a request after this many ms. Default 20000. */
  timeoutMs?: number
}

type QueryValue = string | number | boolean | null | undefined

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  /** Skip attaching the Authorization header even if a token exists. */
  anonymous?: boolean
  signal?: AbortSignal
  /** Next.js fetch cache hints; ignored on React Native. */
  cache?: 'force-cache' | 'no-store'
  revalidate?: number
  /** Overrides the client-wide timeout for this one call. */
  timeoutMs?: number
}

/** A response that carried pagination metadata alongside its data. */
export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly options: ApiClientOptions

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.options = options
  }

  // ------------------------------------------------------------- core ----

  /**
   * Performs the request and unwraps the envelope, returning the raw
   * `ApiSuccess` so callers that need `meta` can read it.
   */
  private async raw<T>(path: string, opts: RequestOptions = {}) {
    const { method = 'GET', body, query, anonymous, signal } = opts
    const url = `${this.baseUrl}${path}${buildQuery(query)}`

    // FormData carries its own multipart Content-Type, including a boundary
    // only the runtime can generate. Setting the header by hand omits that
    // boundary and the server then parses zero fields out of a valid body.
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.options.headers,
    }
    if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'

    if (!anonymous && this.options.getToken) {
      const token = await this.options.getToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }

    // Combine the caller's signal with our own timeout.
    const controller = new AbortController()
    const timeoutMs = opts.timeoutMs ?? this.options.timeoutMs ?? 20_000
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    if (signal) {
      if (signal.aborted) controller.abort()
      else signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers,
        body:
          body === undefined
            ? undefined
            : isFormData
              ? (body as FormData)
              : JSON.stringify(body),
        signal: controller.signal,
        // Next.js-only hints; harmless elsewhere.
        ...(opts.cache ? { cache: opts.cache } : {}),
        ...(opts.revalidate !== undefined
          ? { next: { revalidate: opts.revalidate } }
          : {}),
      } as RequestInit)
    } catch (err) {
      clearTimeout(timer)
      const aborted = err instanceof Error && err.name === 'AbortError'
      throw new ApiError(
        'NETWORK_ERROR',
        aborted
          ? `Request timed out after ${timeoutMs}ms. Is the API reachable at ${this.baseUrl}?`
          : `Could not reach the server at ${this.baseUrl}. Check your connection.`,
        0,
      )
    }
    clearTimeout(timer)

    let payload: ApiResponse<T> | null = null
    const text = await response.text()
    if (text) {
      try {
        payload = JSON.parse(text) as ApiResponse<T>
      } catch {
        payload = null
      }
    }

    if (!response.ok || !payload || payload.success === false) {
      const error =
        payload && payload.success === false
          ? payload.error
          : {
              code: 'INTERNAL_ERROR' as ApiErrorCode,
              message: `Request failed with status ${response.status}`,
            }

      if (response.status === 401 && this.options.onUnauthorized) {
        await this.options.onUnauthorized()
      }
      throw new ApiError(error.code, error.message, response.status, error.details)
    }

    return payload
  }

  /** Performs the request and returns just `data`. */
  private async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const payload = await this.raw<T>(path, opts)
    return payload.data
  }

  /** Performs the request and returns `data` plus pagination `meta`. */
  private async paginated<T>(
    path: string,
    opts: RequestOptions = {},
  ): Promise<Paginated<T>> {
    const payload = await this.raw<T[]>(path, opts)
    return {
      items: payload.data,
      meta:
        payload.meta ?? {
          page: 1,
          limit: payload.data.length,
          total: payload.data.length,
          totalPages: 1,
        },
    }
  }

  // ------------------------------------------------------------- auth ----

  auth = {
    login: (input: LoginInput) =>
      this.request<AuthPayload>('/auth/login', {
        method: 'POST',
        body: input,
        anonymous: true,
      }),

    register: (input: RegisterInput) =>
      this.request<AuthPayload>('/auth/register', {
        method: 'POST',
        body: input,
      }),

    me: () => this.request<{ user: User }>('/auth/me').then((d) => d.user),

    updateMe: (input: Partial<Pick<User, 'name' | 'phone' | 'avatarUrl'>>) =>
      this.request<{ user: User }>('/auth/me', {
        method: 'PATCH',
        body: input,
      }).then((d) => d.user),

    savePushToken: (expoPushToken: string) =>
      this.request<{ ok: boolean }>('/auth/push-token', {
        method: 'POST',
        body: { expoPushToken },
      }),
  }

  // --------------------------------------------------------- subjects ----

  subjects = {
    list: (query?: {
      program?: string
      semester?: number
      section?: string
      teacherId?: string
      all?: boolean
    }) => this.request<Subject[]>('/subjects', { query }),

    get: (id: string) => this.request<Subject>(`/subjects/${id}`),

    roster: (id: string, date?: string, periodNumber?: number) =>
      this.request<SubjectRoster>(`/subjects/${id}/students`, {
        query: { date, periodNumber },
      }),

    create: (input: Partial<Subject> & { studentIds?: string[] }) =>
      this.request<Subject>('/subjects', { method: 'POST', body: input }),

    update: (id: string, input: Partial<Subject>) =>
      this.request<Subject>(`/subjects/${id}`, { method: 'PATCH', body: input }),

    remove: (id: string) =>
      this.request<{ id: string }>(`/subjects/${id}`, { method: 'DELETE' }),

    enroll: (id: string, studentIds: string[]) =>
      this.request<{ enrolled: number }>(`/subjects/${id}/enroll`, {
        method: 'POST',
        body: { studentIds },
      }),
  }

  // ------------------------------------------------------- attendance ----

  attendance = {
    /** Teacher-only. Bulk upsert for one subject on one day. */
    mark: (input: MarkAttendanceInput) =>
      this.request<MarkAttendanceResult>('/attendance/mark', {
        method: 'POST',
        body: input,
      }),

    forStudent: (
      studentId: string,
      query?: { subjectId?: string; from?: string; to?: string },
    ) => this.request<StudentAttendance>(`/attendance/student/${studentId}`, { query }),

    mine: (query?: { subjectId?: string; from?: string; to?: string }) =>
      this.request<StudentAttendance>('/attendance/me', { query }),

    forClass: (
      subjectId: string,
      query?: { date?: string; from?: string; to?: string },
    ) => this.request<ClassAttendance>(`/attendance/class/${subjectId}`, { query }),
  }

  // ----------------------------------------------------------- events ----

  events = {
    list: (query?: {
      upcoming?: boolean
      past?: boolean
      /** Staff only — the API ignores it for everyone else. */
      includeUnpublished?: boolean
      category?: string
      q?: string
      page?: number
      limit?: number
    }) => this.paginated<Event>('/events', { query }),

    get: (idOrSlug: string) => this.request<Event>(`/events/${idOrSlug}`),

    create: (input: Partial<Event>) =>
      this.request<Event>('/events', { method: 'POST', body: input }),

    update: (id: string, input: Partial<Event>) =>
      this.request<Event>(`/events/${id}`, { method: 'PATCH', body: input }),

    remove: (id: string) =>
      this.request<{ id: string }>(`/events/${id}`, { method: 'DELETE' }),

    /** Public — works signed out; links to the account when a token is set. */
    register: (id: string, input: EventRegistrationInput) =>
      this.request<EventRegistrationResult>(`/events/${id}/register`, {
        method: 'POST',
        body: input,
      }),

    registrations: (id: string, query?: { page?: number; limit?: number }) =>
      this.paginated<EventRegistration>(`/events/${id}/registrations`, { query }),

    myRegistrations: () =>
      this.request<EventRegistration[]>('/events/me/registrations'),
  }

  // ---------------------------------------------------------- notices ----

  notices = {
    list: (query?: { category?: string; q?: string; page?: number; limit?: number }) =>
      this.paginated<Notice>('/notices', { query }),

    get: (id: string) => this.request<Notice>(`/notices/${id}`),

    create: (input: NoticeInput) =>
      this.request<Notice>('/notices', { method: 'POST', body: input }),

    update: (id: string, input: Partial<NoticeInput>) =>
      this.request<Notice>(`/notices/${id}`, { method: 'PATCH', body: input }),

    remove: (id: string) =>
      this.request<{ id: string }>(`/notices/${id}`, { method: 'DELETE' }),
  }

  // ---------------------------------------------------------- academics ----

  streams = {
    list: () => this.request<Stream[]>('/streams'),

    create: (input: StreamInput) =>
      this.request<Stream>('/streams', { method: 'POST', body: input }),

    update: (id: string, input: Partial<StreamInput>) =>
      this.request<Stream>(`/streams/${id}`, { method: 'PATCH', body: input }),

    remove: (id: string) =>
      this.request<{ id: string }>(`/streams/${id}`, { method: 'DELETE' }),
  }

  classes = {
    list: (query?: { streamId?: string; semester?: number; academicYear?: string }) =>
      this.request<ClassGroup[]>('/classes', { query }),

    create: (input: ClassGroupInput) =>
      this.request<ClassGroup>('/classes', { method: 'POST', body: input }),

    update: (
      id: string,
      input: Partial<Pick<ClassGroupInput, 'semester' | 'section' | 'academicYear'>>,
    ) => this.request<ClassGroup>(`/classes/${id}`, { method: 'PATCH', body: input }),

    remove: (id: string) =>
      this.request<{ id: string }>(`/classes/${id}`, { method: 'DELETE' }),
  }

  periods = {
    list: () => this.request<Period[]>('/periods'),

    create: (input: PeriodInput) =>
      this.request<Period>('/periods', { method: 'POST', body: input }),

    update: (id: string, input: Partial<PeriodInput>) =>
      this.request<Period>(`/periods/${id}`, { method: 'PATCH', body: input }),

    remove: (id: string) =>
      this.request<{ id: string; attendanceRecordsAffected: number }>(`/periods/${id}`, {
        method: 'DELETE',
      }),
  }

  students = {
    list: (query?: {
      classGroupId?: string
      streamId?: string
      semester?: number
      section?: string
      q?: string
      page?: number
      limit?: number
    }) => this.paginated<ManagedStudent>('/students', { query }),

    create: (input: CreateStudentInput) =>
      this.request<ManagedStudent>('/students', { method: 'POST', body: input }),

    update: (id: string, input: UpdateStudentInput) =>
      this.request<ManagedStudent>(`/students/${id}`, { method: 'PATCH', body: input }),

    remove: (id: string) =>
      this.request<{ id: string; attendanceRecordsDeleted: number }>(`/students/${id}`, {
        method: 'DELETE',
      }),
  }

  // --------------------------------------------------------- admissions ----

  admissions = {
    /**
     * Public. Sends multipart so documents can ride along with the form in one
     * request — there is no second, token-authenticated upload step for an
     * applicant to get wrong or for an attacker to abuse separately.
     */
    submit: (input: AdmissionApplicationInput, documents: Blob[] = []) => {
      const form = new FormData()
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined && value !== null && value !== '') {
          form.append(key, String(value))
        }
      }
      for (const file of documents) {
        form.append('documents', file, (file as File).name ?? 'document')
      }
      return this.request<AdmissionSubmitResult>('/admissions', {
        method: 'POST',
        body: form,
        anonymous: true,
        // Uploads over a slow connection outlast the default.
        timeoutMs: 120_000,
      })
    },

    list: (query?: {
      status?: AdmissionStatus
      q?: string
      streamId?: string
      page?: number
      limit?: number
    }) => this.paginated<AdmissionListItem>('/admissions', { query }),

    get: (id: string) => this.request<Admission>(`/admissions/${id}`),

    review: (id: string, input: { status?: AdmissionStatus; reviewNotes?: string | null }) =>
      this.request<AdmissionListItem>(`/admissions/${id}`, { method: 'PATCH', body: input }),
  }

  // ------------------------------------------------------------ gallery ----

  gallery = {
    /** Public — readable without signing in. */
    list: (query?: {
      album?: string
      q?: string
      includeUnpublished?: boolean
      page?: number
      limit?: number
    }) => this.paginated<GalleryImage>('/gallery', { query, anonymous: !query?.includeUnpublished }),

    albums: () => this.request<GalleryAlbum[]>('/gallery/albums'),

    create: (input: GalleryImageInput) =>
      this.request<GalleryImage>('/gallery', { method: 'POST', body: input }),

    update: (id: string, input: Partial<GalleryImageInput>) =>
      this.request<GalleryImage>(`/gallery/${id}`, { method: 'PATCH', body: input }),

    remove: (id: string) =>
      this.request<{ id: string }>(`/gallery/${id}`, { method: 'DELETE' }),
  }

  // ---------------------------------------------------------- materials ----

  materials = {
    list: (query?: {
      streamId?: string
      semester?: number
      subjectId?: string
      kind?: MaterialKind
      q?: string
      includeUnpublished?: boolean
      page?: number
      limit?: number
    }) => this.paginated<StudyMaterial>('/materials', { query }),

    /** Scoped to the signed-in student's own stream and semester. */
    mine: () => this.request<StudyMaterial[]>('/materials/mine'),

    create: (input: StudyMaterialInput) =>
      this.request<StudyMaterial>('/materials', { method: 'POST', body: input }),

    update: (id: string, input: Partial<StudyMaterialInput>) =>
      this.request<StudyMaterial>(`/materials/${id}`, { method: 'PATCH', body: input }),

    remove: (id: string) =>
      this.request<{ id: string }>(`/materials/${id}`, { method: 'DELETE' }),
  }

  // ------------------------------------------------------------ media ----

  media = {
    /**
     * Whether the server can accept uploads at all, plus the limits it will
     * enforce. Lets a caller explain itself before the admin picks a file.
     */
    config: () =>
      this.request<MediaConfig>('/media/config'),

    /**
     * Uploads one image and returns its public URL, for storing in
     * `event.coverImage` or `notice.attachmentUrl`.
     *
     * Takes a `File` or `Blob` so the same call works from a browser file
     * input. The upload allowance is generous compared with a JSON request —
     * a phone photo over a college connection outlasts the default timeout.
     */
    upload: (file: Blob, filename?: string) => {
      const form = new FormData()
      form.append('file', file, filename ?? (file as File).name ?? 'upload')
      return this.request<UploadedMedia>('/media/upload', {
        method: 'POST',
        body: form,
        timeoutMs: 120_000,
      })
    },
  }

  // --------------------------------------------------------- progress ----

  progress = {
    forStudent: (
      studentId: string,
      query?: { semester?: number; academicYear?: string },
    ) => this.request<ProgressCard>(`/progress/${studentId}`, { query }),

    mine: (query?: { semester?: number; academicYear?: string }) =>
      this.request<ProgressCard>('/progress/me', { query }),

    save: (input: SaveProgressInput) =>
      this.request<{ saved: number }>('/progress', { method: 'POST', body: input }),
  }

  // ------------------------------------------------------------- misc ----

  stats = {
    public: () =>
      this.request<PublicStats>('/stats/public', {
        anonymous: true,
        revalidate: 300,
      }),
  }

  health = () =>
    this.request<{ status: string; uptime: number; db: string }>('/health', {
      anonymous: true,
      cache: 'no-store',
    })
}

/** Convenience factory. */
export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options)
}
