// Internal assessment (IA) marks helpers.
// Scheme per subject: IA-1 /20, IA-2 /20, Assignment /10  →  Internal Total /50.
// Live values are held in MarksContext (localStorage); teachers can edit them.

import { CLASSES } from './attendance.js'

export const MARK_MAX = { ia1: 20, ia2: 20, assignment: 10 }
export const SUBJECT_MAX = 50

export function gradeFor(pct) {
  if (pct >= 90) return 'O'
  if (pct >= 80) return 'A+'
  if (pct >= 70) return 'A'
  if (pct >= 60) return 'B+'
  if (pct >= 55) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'P'
  return 'F'
}

export function marksBand(pct) {
  if (pct >= 60) return 'good'
  if (pct >= 40) return 'warn'
  return 'low'
}

// Deterministic initial marks so the portal isn't empty before any teacher edits.
export function seedMarks() {
  const records = {}
  CLASSES.forEach((cls) => {
    records[cls.id] = {}
    cls.subjects.forEach((subj, j) => {
      records[cls.id][subj] = {}
      cls.students.forEach((st, i) => {
        records[cls.id][subj][st.id] = {
          ia1: 12 + ((i * 2 + j) % 8), // 12..19
          ia2: 11 + ((i + j * 2) % 9), // 11..19
          assignment: 6 + ((i + j) % 5), // 6..10
        }
      })
    })
  })
  return records
}

// Pure: compute a student's marks summary from a records object, given the
// student's class id, student id and the list of subject names.
export function computeStudentMarks(records, classId, studentId, subjectNames) {
  const names = subjectNames || []

  const subjects = names.map((name) => {
    const m = records?.[classId]?.[name]?.[studentId] || { ia1: 0, ia2: 0, assignment: 0 }
    const total = (m.ia1 || 0) + (m.ia2 || 0) + (m.assignment || 0)
    const pct = Math.round((total / SUBJECT_MAX) * 1000) / 10
    return { name, ia1: m.ia1 || 0, ia2: m.ia2 || 0, assignment: m.assignment || 0, total, max: SUBJECT_MAX, pct, grade: gradeFor(pct) }
  })

  const obtained = subjects.reduce((s, x) => s + x.total, 0)
  const maxTotal = subjects.length * SUBJECT_MAX
  const percentage = maxTotal ? Math.round((obtained / maxTotal) * 1000) / 10 : 0
  return { subjects, obtained, maxTotal, percentage, grade: gradeFor(percentage) }
}
