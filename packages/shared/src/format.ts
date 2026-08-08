/**
 * Presentation helpers shared by the website and both mobile apps, so that an
 * attendance percentage is coloured and a date is written the same way
 * everywhere.
 */

import type { AttendanceStatus } from './types'

/** Minimum attendance the university requires to sit for exams. */
export const ATTENDANCE_THRESHOLD = 75

export type AttendanceTone = 'good' | 'warning' | 'danger'

/** `good` >= 75, `warning` >= 65, otherwise `danger`. */
export function attendanceTone(percentage: number): AttendanceTone {
  if (percentage >= ATTENDANCE_THRESHOLD) return 'good'
  if (percentage >= 65) return 'warning'
  return 'danger'
}

export const ATTENDANCE_TONE_COLORS: Record<AttendanceTone, string> = {
  good: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
}

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  EXCUSED: 'Excused',
}

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: '#16a34a',
  ABSENT: '#dc2626',
  LATE: '#d97706',
  EXCUSED: '#2563eb',
}

/** "8 Aug 2026" */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** "8 Aug 2026, 10:30 am" */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Calendar day in the `YYYY-MM-DD` form the attendance API expects. */
export function toDateKey(value: Date = new Date()): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** "Free" or "₹200" */
export function formatFee(fee: number): string {
  if (!fee) return 'Free'
  return `₹${fee.toLocaleString('en-IN')}`
}

const RELATIVE_UNITS: Array<[label: string, ms: number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

/**
 * "in 3 days" / "2 hours ago"
 *
 * Written by hand rather than with `Intl.RelativeTimeFormat`, which Hermes does
 * NOT implement on Android — referencing it there yields `undefined`, and
 * `new undefined()` crashes the screen with "undefined cannot be used as a
 * constructor". This runs identically on Hermes, iOS and the browser.
 */
export function relativeTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'

  const diffMs = date.getTime() - Date.now()
  const future = diffMs > 0
  const absMs = Math.abs(diffMs)

  for (const [label, ms] of RELATIVE_UNITS) {
    if (absMs < ms) continue

    const amount = Math.round(absMs / ms)

    // "yesterday" / "tomorrow" read better than "1 day ago" / "in 1 day".
    if (label === 'day' && amount === 1) return future ? 'tomorrow' : 'yesterday'

    const unit = amount === 1 ? label : `${label}s`
    return future ? `in ${amount} ${unit}` : `${amount} ${unit} ago`
  }

  return 'just now'
}

/** Grade + grade point from a percentage, matching the backend's table. */
export function gradeFor(percentage: number): { grade: string; points: number } {
  if (percentage >= 90) return { grade: 'O', points: 10 }
  if (percentage >= 80) return { grade: 'A+', points: 9 }
  if (percentage >= 70) return { grade: 'A', points: 8 }
  if (percentage >= 60) return { grade: 'B+', points: 7 }
  if (percentage >= 50) return { grade: 'B', points: 6 }
  if (percentage >= 40) return { grade: 'C', points: 5 }
  return { grade: 'F', points: 0 }
}

/** "SFGC · BCA · Sem 3 · Sec A" style subtitle for a student. */
export function studentSubtitle(user: {
  program?: string | null
  semester?: number | null
  section?: string | null
}): string {
  return [
    user.program,
    user.semester ? `Sem ${user.semester}` : null,
    user.section ? `Sec ${user.section}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Slugify a title the same way the backend does. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}
