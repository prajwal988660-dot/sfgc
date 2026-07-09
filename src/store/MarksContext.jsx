import { createContext, useContext, useState, useEffect } from 'react'
import { seedMarks, computeStudentMarks } from '../data/marks.js'
import { isSupabaseEnabled } from '../lib/supabase.js'
import { fetchMarks, upsertMarksRows, rowsToMarks, marksToRows } from '../lib/db.js'

// Shared internal-marks store. `marks[classId][subject][studentId] = { ia1, ia2, assignment }`.
// Teachers edit marks per class+subject; students read their computed summary.

const KEY = 'sfgc_marks_v1'
const MarksContext = createContext(null)

function load() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    /* ignore */
  }
  return seedMarks()
}

export function MarksProvider({ children }) {
  const [marks, setMarks] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(marks)) } catch { /* ignore */ }
  }, [marks])

  // Cloud sync: load marks from Supabase on mount (seed if empty).
  useEffect(() => {
    if (!isSupabaseEnabled) return
    let active = true
    ;(async () => {
      const rows = await fetchMarks()
      if (!active || rows === null) return
      if (rows.length) setMarks(rowsToMarks(rows))
      else await upsertMarksRows(marksToRows(marks)) // first run — seed DB
    })()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Returns { studentId: {ia1, ia2, assignment} } for a class+subject.
  const getSubjectMarks = (classId, subject) => ({ ...(marks?.[classId]?.[subject] || {}) })

  // Bulk-save a subject's marks (map: studentId -> {ia1, ia2, assignment}).
  const saveSubjectMarks = (classId, subject, map) => {
    setMarks((prev) => ({
      ...prev,
      [classId]: { ...(prev[classId] || {}), [subject]: { ...map } },
    }))
    upsertMarksRows(
      Object.entries(map).map(([student_id, m]) => ({ class_id: classId, subject, student_id, ia1: m.ia1, ia2: m.ia2, assignment: m.assignment }))
    )
  }

  const getStudentMarks = (studentId) => computeStudentMarks(marks, studentId)

  return (
    <MarksContext.Provider value={{ marks, getSubjectMarks, saveSubjectMarks, getStudentMarks }}>
      {children}
    </MarksContext.Provider>
  )
}

export function useMarks() {
  const ctx = useContext(MarksContext)
  if (!ctx) throw new Error('useMarks must be used within MarksProvider')
  return ctx
}
