import { createContext, useContext, useState, useEffect } from 'react'
import { CLASSES as SEED } from '../data/attendance.js'

// Source of truth for classes + students. Admin can add/remove classes and
// students; students get an auto unique id and are kept alphabetical with
// renumbered rolls. Persisted to localStorage (shared across the app).

const KEY = 'sfgc_classes_v1'
const ClassesContext = createContext(null)
const PHOTOS = ['👩‍🎓', '👨‍🎓', '👩‍💻', '👨‍💻', '👩‍🔬', '👨‍🔬']

// Normalise the seed classes (which use program/semester) to stream/year.
function normalizeSeed() {
  return SEED.map((c) => ({
    id: c.id,
    stream: c.program,
    year: c.semester,
    section: c.section,
    label: c.label,
    subjects: c.subjects || [],
    students: c.students.map((s) => ({ ...s })),
  }))
}
// Ensure every stored class has stream/year (migrate old program/semester shape).
function migrate(list) {
  return list.map((c) => ({
    ...c,
    stream: c.stream || c.program || '',
    year: c.year || c.semester || '',
    subjects: c.subjects || [],
  }))
}
function load() {
  try {
    const s = localStorage.getItem(KEY)
    if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length) return migrate(p) }
  } catch { /* ignore */ }
  return normalizeSeed()
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function nextStudentId(classes) {
  let max = 100
  classes.forEach((c) => c.students.forEach((s) => {
    const m = String(s.id).match(/(\d+)\s*$/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }))
  return 'SFGC' + (max + 1)
}

// Sort alphabetically by name and renumber rolls 01, 02, …
function resort(students) {
  return [...students]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s, i) => ({ ...s, roll: String(i + 1).padStart(2, '0') }))
}

export function ClassesProvider({ children }) {
  const [classes, setClasses] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(classes)) } catch { /* ignore */ }
  }, [classes])

  const getClass = (id) => classes.find((c) => c.id === id)
  const findStudent = (sid) => {
    const key = (sid || '').trim().toUpperCase()
    for (const c of classes) {
      const st = c.students.find((s) => s.id.toUpperCase() === key)
      if (st) return { cls: c, student: st }
    }
    return null
  }

  const streams = [...new Set(classes.map((c) => c.stream))]
  const yearsForStream = (stream) => [...new Set(classes.filter((c) => c.stream === stream).map((c) => c.year))]
  const classesFor = (stream, year) => classes.filter((c) => c.stream === stream && c.year === year)

  const addClass = ({ stream, year, section }) => {
    stream = (stream || '').trim(); year = (year || '').trim(); section = (section || 'A').trim()
    if (!stream || !year) return { error: 'Stream and year are required.' }
    const id = slugify(`${stream}-${year}-${section}`) || 'class'
    if (classes.some((c) => c.id === id)) return { error: 'That class already exists.' }
    const label = `${stream} ${year} — Section ${section}`
    setClasses((prev) => [...prev, { id, stream, year, section, label, subjects: [], students: [] }])
    return { id, label }
  }
  const removeClass = (id) => setClasses((prev) => prev.filter((c) => c.id !== id))

  const addStudent = (classId, nameRaw) => {
    const name = (nameRaw || '').trim()
    if (!name) return { error: 'Student name is required.' }
    const id = nextStudentId(classes)
    setClasses((prev) => prev.map((c) => {
      if (c.id !== classId) return c
      const photo = PHOTOS[c.students.length % PHOTOS.length]
      return { ...c, students: resort([...c.students, { id, roll: '', name, photo }]) }
    }))
    return { id }
  }
  const removeStudent = (classId, sid) =>
    setClasses((prev) => prev.map((c) => (c.id !== classId ? c : { ...c, students: resort(c.students.filter((s) => s.id !== sid)) })))

  return (
    <ClassesContext.Provider value={{ classes, getClass, findStudent, streams, yearsForStream, classesFor, addClass, removeClass, addStudent, removeStudent }}>
      {children}
    </ClassesContext.Provider>
  )
}

export function useClasses() {
  const ctx = useContext(ClassesContext)
  if (!ctx) throw new Error('useClasses must be used within ClassesProvider')
  return ctx
}
