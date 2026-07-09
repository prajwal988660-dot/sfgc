import { createContext, useContext, useState, useEffect } from 'react'
import { CLASSES, MIN_ATTENDANCE, seedRecords, findClassByStudent, getClass } from '../data/attendance.js'
import { isSupabaseEnabled } from '../lib/supabase.js'
import {
  fetchAttendance, upsertAttendanceRows, rowsToAttendance, attendanceToRows,
  fetchSessions, insertSession,
} from '../lib/db.js'

// Shared attendance store. `records[classId][subject][studentId] = { present, total }`.
// Teachers mark sessions (which increment records); students read their summary.
// Persisted to localStorage so teacher-marked attendance shows in the student portal.

const REC_KEY = 'sfgc_attendance_v1'
const SES_KEY = 'sfgc_att_sessions_v1'
const AttendanceContext = createContext(null)

function loadRecords() {
  try {
    const saved = localStorage.getItem(REC_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    /* ignore */
  }
  return seedRecords()
}

function loadSessions() {
  try {
    const saved = localStorage.getItem(SES_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore */
  }
  return []
}

export function AttendanceProvider({ children }) {
  const [records, setRecords] = useState(loadRecords)
  const [sessions, setSessions] = useState(loadSessions)

  useEffect(() => {
    try { localStorage.setItem(REC_KEY, JSON.stringify(records)) } catch { /* ignore */ }
  }, [records])
  useEffect(() => {
    try { localStorage.setItem(SES_KEY, JSON.stringify(sessions)) } catch { /* ignore */ }
  }, [sessions])

  // Cloud sync: load records + sessions from Supabase on mount (seed if empty).
  useEffect(() => {
    if (!isSupabaseEnabled) return
    let active = true
    ;(async () => {
      const [rows, sess] = await Promise.all([fetchAttendance(), fetchSessions()])
      if (!active) return
      if (rows !== null) {
        if (rows.length) setRecords(rowsToAttendance(rows))
        else await upsertAttendanceRows(attendanceToRows(records)) // first run — seed DB
      }
      if (sess !== null) setSessions(sess)
    })()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Teacher marks one session. presentIds = array of student ids present.
  const markSession = ({ classId, subject, date, presentIds, teacherId, teacherName }) => {
    const cls = getClass(classId)
    if (!cls) return null
    const present = new Set(presentIds)

    // Compute the updated subject map from current records.
    const cur = records?.[classId]?.[subject] || {}
    const subjMap = {}
    cls.students.forEach((st) => {
      const c = cur[st.id] || { present: 0, total: 0 }
      subjMap[st.id] = { present: c.present + (present.has(st.id) ? 1 : 0), total: c.total + 1 }
    })
    setRecords((prev) => ({ ...prev, [classId]: { ...(prev[classId] || {}), [subject]: subjMap } }))
    upsertAttendanceRows(
      Object.entries(subjMap).map(([student_id, r]) => ({ class_id: classId, subject, student_id, present: r.present, total: r.total }))
    )

    const entry = {
      id: `${classId}-${subject}-${date}-${sessions.length + 1}`,
      classId, classLabel: cls.label, subject, date,
      presentCount: presentIds.length, totalCount: cls.students.length,
      teacherId, teacherName, when: new Date().toISOString(),
    }
    setSessions((list) => [entry, ...list])
    insertSession(entry)
    return entry
  }

  const recordFor = (classId, subject, studentId) =>
    records?.[classId]?.[subject]?.[studentId] || { present: 0, total: 0 }

  // Full summary for the student attendance portal.
  const getStudentSummary = (rawId) => {
    const found = findClassByStudent(rawId)
    if (!found) return null
    const { cls, student } = found
    const subjects = cls.subjects.map((name) => {
      const rec = recordFor(cls.id, name, student.id)
      const percent = rec.total ? Math.round((rec.present / rec.total) * 1000) / 10 : 0
      return { name, present: rec.present, total: rec.total, absent: rec.total - rec.present, percent }
    })
    const totalPresent = subjects.reduce((s, x) => s + x.present, 0)
    const totalClasses = subjects.reduce((s, x) => s + x.total, 0)
    const overall = totalClasses ? Math.round((totalPresent / totalClasses) * 1000) / 10 : 0
    // most recent session date affecting this class
    const lastSession = sessions.find((s) => s.classId === cls.id)
    return {
      id: student.id, name: student.name, photo: student.photo,
      program: cls.program, semester: cls.semester, section: cls.section,
      subjects, totalPresent, totalClasses, totalAbsent: totalClasses - totalPresent,
      overall, eligible: overall >= MIN_ATTENDANCE,
      updated: lastSession ? lastSession.date : '2026-07-04',
    }
  }

  const sessionsForTeacher = (teacherId) => sessions.filter((s) => s.teacherId === teacherId)

  return (
    <AttendanceContext.Provider
      value={{ records, sessions, markSession, getStudentSummary, recordFor, sessionsForTeacher }}
    >
      {children}
    </AttendanceContext.Provider>
  )
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext)
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider')
  return ctx
}

export { CLASSES }
