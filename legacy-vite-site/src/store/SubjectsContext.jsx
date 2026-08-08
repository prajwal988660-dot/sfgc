import { createContext, useContext, useState, useEffect } from 'react'
import { CLASSES } from '../data/attendance.js'
import { isSupabaseEnabled } from '../lib/supabase.js'
import { fetchSubjects, seedSubjects, insertSubject, deleteSubjectRow } from '../lib/db.js'

// Teacher-managed subject list per class. Seeded from CLASSES, persisted to
// localStorage (+ Supabase when configured). Drives the subject dropdowns in
// the teacher portal and the subject rows students see.

const KEY = 'sfgc_subjects_v1'
const SubjectsContext = createContext(null)

function seed() {
  const map = {}
  CLASSES.forEach((c) => { map[c.id] = [...c.subjects] })
  return map
}
function load() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch { /* ignore */ }
  return seed()
}
function toRows(map) {
  const rows = []
  for (const classId in map) map[classId].forEach((subject) => rows.push({ class_id: classId, subject }))
  return rows
}
function fromRows(rows) {
  const map = {}
  rows.forEach((r) => { map[r.class_id] = map[r.class_id] || []; if (!map[r.class_id].includes(r.subject)) map[r.class_id].push(r.subject) })
  return map
}

export function SubjectsProvider({ children }) {
  const [subjects, setSubjects] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(subjects)) } catch { /* ignore */ }
  }, [subjects])

  useEffect(() => {
    if (!isSupabaseEnabled) return
    let active = true
    ;(async () => {
      const rows = await fetchSubjects()
      if (!active || rows === null) return
      if (rows.length) setSubjects(fromRows(rows))
      else await seedSubjects(toRows(subjects))
    })()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getSubjects = (classId) => subjects[classId] || []

  const addSubject = (classId, nameRaw) => {
    const name = (nameRaw || '').trim()
    if (!name) return false
    const list = subjects[classId] || []
    if (list.some((s) => s.toLowerCase() === name.toLowerCase())) return false
    setSubjects((prev) => ({ ...prev, [classId]: [...(prev[classId] || []), name] }))
    insertSubject(classId, name)
    return true
  }

  const removeSubject = (classId, name) => {
    setSubjects((prev) => ({ ...prev, [classId]: (prev[classId] || []).filter((s) => s !== name) }))
    deleteSubjectRow(classId, name)
  }

  return (
    <SubjectsContext.Provider value={{ subjects, getSubjects, addSubject, removeSubject }}>
      {children}
    </SubjectsContext.Provider>
  )
}

export function useSubjects() {
  const ctx = useContext(SubjectsContext)
  if (!ctx) throw new Error('useSubjects must be used within SubjectsProvider')
  return ctx
}
