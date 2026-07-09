import { supabase, isSupabaseEnabled } from './supabase.js'

// Central Supabase data-access layer. Every function is a no-op (returns
// null / [] ) when Supabase is not configured, so stores can call them
// unconditionally and simply fall back to their local state.

const warn = (label, error) => {
  if (error) console.warn(`[SFGC][supabase] ${label}:`, error.message || error)
}

/* ───────────── EVENTS ───────────── */
const stripEvent = ({ created_at, ...ev }) => ev // eslint-disable-line no-unused-vars

export async function fetchEvents() {
  if (!isSupabaseEnabled) return null
  const { data, error } = await supabase.from('events').select('*')
  warn('fetchEvents', error)
  return error ? null : data.map(stripEvent)
}
export async function upsertEvent(ev) {
  if (!isSupabaseEnabled) return
  const { error } = await supabase.from('events').upsert(ev)
  warn('upsertEvent', error)
}
export async function deleteEventRow(id) {
  if (!isSupabaseEnabled) return
  const { error } = await supabase.from('events').delete().eq('id', id)
  warn('deleteEvent', error)
}
export async function seedEvents(events) {
  if (!isSupabaseEnabled) return
  const { error } = await supabase.from('events').upsert(events)
  warn('seedEvents', error)
}

/* ───────────── REGISTRATIONS ───────────── */
const regToRow = (r) => ({
  ticket: r.ticket, event_id: r.eventId, event_title: r.eventTitle, event_type: r.eventType,
  name: r.name, email: r.email, phone: r.phone, college: r.college, team: r.team,
  members: r.members, registered_at: r.registeredAt,
})
const rowToReg = (r) => ({
  ticket: r.ticket, eventId: r.event_id, eventTitle: r.event_title, eventType: r.event_type,
  name: r.name, email: r.email, phone: r.phone, college: r.college, team: r.team,
  members: r.members, registeredAt: r.registered_at,
})

export async function fetchRegistrations() {
  if (!isSupabaseEnabled) return null
  const { data, error } = await supabase.from('registrations').select('*').order('registered_at', { ascending: false })
  warn('fetchRegistrations', error)
  return error ? null : data.map(rowToReg)
}
export async function insertRegistration(reg) {
  if (!isSupabaseEnabled) return
  const { error } = await supabase.from('registrations').insert(regToRow(reg))
  warn('insertRegistration', error)
}
export async function deleteRegistrationRow(ticket) {
  if (!isSupabaseEnabled) return
  const { error } = await supabase.from('registrations').delete().eq('ticket', ticket)
  warn('deleteRegistration', error)
}
export async function clearRegistrationsTable() {
  if (!isSupabaseEnabled) return
  const { error } = await supabase.from('registrations').delete().neq('ticket', '')
  warn('clearRegistrations', error)
}

/* ───────────── ATTENDANCE ───────────── */
// nested records[classId][subject][studentId] = {present,total}  <->  flat rows
export function attendanceToRows(records) {
  const rows = []
  for (const classId in records)
    for (const subject in records[classId])
      for (const student_id in records[classId][subject]) {
        const r = records[classId][subject][student_id]
        rows.push({ class_id: classId, subject, student_id, present: r.present, total: r.total })
      }
  return rows
}
export function rowsToAttendance(rows) {
  const rec = {}
  rows.forEach((r) => {
    rec[r.class_id] = rec[r.class_id] || {}
    rec[r.class_id][r.subject] = rec[r.class_id][r.subject] || {}
    rec[r.class_id][r.subject][r.student_id] = { present: r.present, total: r.total }
  })
  return rec
}

export async function fetchAttendance() {
  if (!isSupabaseEnabled) return null
  const { data, error } = await supabase.from('attendance').select('*')
  warn('fetchAttendance', error)
  return error ? null : data
}
export async function upsertAttendanceRows(rows) {
  if (!isSupabaseEnabled || !rows.length) return
  const { error } = await supabase.from('attendance').upsert(rows)
  warn('upsertAttendance', error)
}
export async function fetchSessions() {
  if (!isSupabaseEnabled) return null
  const { data, error } = await supabase.from('attendance_sessions').select('*').order('created_at', { ascending: false })
  warn('fetchSessions', error)
  return error ? null : data.map((s) => ({
    id: s.id, classId: s.class_id, classLabel: s.class_label, subject: s.subject, date: s.date,
    presentCount: s.present_count, totalCount: s.total_count, teacherId: s.teacher_id,
    teacherName: s.teacher_name, when: s.created_at,
  }))
}
export async function insertSession(s) {
  if (!isSupabaseEnabled) return
  const { error } = await supabase.from('attendance_sessions').insert({
    id: s.id, class_id: s.classId, class_label: s.classLabel, subject: s.subject, date: s.date,
    present_count: s.presentCount, total_count: s.totalCount, teacher_id: s.teacherId, teacher_name: s.teacherName,
  })
  warn('insertSession', error)
}

/* ───────────── MARKS ───────────── */
export function marksToRows(marks) {
  const rows = []
  for (const classId in marks)
    for (const subject in marks[classId])
      for (const student_id in marks[classId][subject]) {
        const m = marks[classId][subject][student_id]
        rows.push({ class_id: classId, subject, student_id, ia1: m.ia1, ia2: m.ia2, assignment: m.assignment })
      }
  return rows
}
export function rowsToMarks(rows) {
  const rec = {}
  rows.forEach((r) => {
    rec[r.class_id] = rec[r.class_id] || {}
    rec[r.class_id][r.subject] = rec[r.class_id][r.subject] || {}
    rec[r.class_id][r.subject][r.student_id] = { ia1: r.ia1, ia2: r.ia2, assignment: r.assignment }
  })
  return rec
}

export async function fetchMarks() {
  if (!isSupabaseEnabled) return null
  const { data, error } = await supabase.from('marks').select('*')
  warn('fetchMarks', error)
  return error ? null : data
}
export async function upsertMarksRows(rows) {
  if (!isSupabaseEnabled || !rows.length) return
  const { error } = await supabase.from('marks').upsert(rows)
  warn('upsertMarks', error)
}
