import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTeacher, getClass } from '../data/attendance.js'
import { MARK_MAX } from '../data/marks.js'
import { useAttendance } from '../store/AttendanceContext.jsx'
import { useMarks } from '../store/MarksContext.jsx'

const today = () => new Date().toISOString().slice(0, 10)
const clamp = (v, max) => Math.max(0, Math.min(max, Number.isFinite(+v) ? Math.round(+v) : 0))

export default function Teacher() {
  const { markSession, sessionsForTeacher } = useAttendance()
  const { getSubjectMarks, saveSubjectMarks } = useMarks()

  // Login
  const [teacher, setTeacher] = useState(null)
  const [tid, setTid] = useState('')
  const [pw, setPw] = useState('')
  const [loginErr, setLoginErr] = useState('')

  // Shared session controls
  const [mode, setMode] = useState('attendance') // 'attendance' | 'marks'
  const [assignIdx, setAssignIdx] = useState(0)
  const [date, setDate] = useState(today())
  const [flash, setFlash] = useState('')

  // Attendance + marks working state
  const [present, setPresent] = useState({})
  const [draft, setDraft] = useState({}) // studentId -> {ia1, ia2, assignment}

  const assignment = teacher ? teacher.assignments[assignIdx] : null
  const cls = assignment ? getClass(assignment.classId) : null

  // Reset attendance (all present) when class changes
  useEffect(() => {
    if (cls) {
      const init = {}
      cls.students.forEach((s) => { init[s.id] = true })
      setPresent(init)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignIdx, teacher])

  // Load marks draft from store when class/subject changes
  useEffect(() => {
    if (cls && assignment) {
      const existing = getSubjectMarks(cls.id, assignment.subject)
      const d = {}
      cls.students.forEach((s) => {
        const m = existing[s.id] || { ia1: 0, ia2: 0, assignment: 0 }
        d[s.id] = { ia1: m.ia1 || 0, ia2: m.ia2 || 0, assignment: m.assignment || 0 }
      })
      setDraft(d)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignIdx, teacher])

  const login = (e) => {
    e.preventDefault()
    const res = getTeacher(tid, pw)
    if (res.error) { setLoginErr(res.error); return }
    setLoginErr(''); setTeacher(res.teacher); setAssignIdx(0)
  }
  const logout = () => { setTeacher(null); setTid(''); setPw(''); setAssignIdx(0) }
  const showFlash = (m) => { setFlash(m); window.clearTimeout(showFlash._t); showFlash._t = window.setTimeout(() => setFlash(''), 3500) }

  // Attendance actions
  const toggle = (id) => setPresent((p) => ({ ...p, [id]: !p[id] }))
  const allPresent = () => { const m = {}; cls.students.forEach((s) => { m[s.id] = true }); setPresent(m) }
  const allAbsent = () => { const m = {}; cls.students.forEach((s) => { m[s.id] = false }); setPresent(m) }
  const presentCount = cls ? cls.students.filter((s) => present[s.id]).length : 0
  const saveAttendance = () => {
    if (!date) { showFlash('⚠️ Please choose a date.'); return }
    const presentIds = cls.students.filter((s) => present[s.id]).map((s) => s.id)
    markSession({ classId: cls.id, subject: assignment.subject, date, presentIds, teacherId: teacher.id, teacherName: teacher.name })
    showFlash(`✅ Attendance saved — ${presentIds.length}/${cls.students.length} present on ${date}.`)
  }

  // Marks actions
  const setMark = (sid, field, value) => {
    setDraft((d) => ({ ...d, [sid]: { ...d[sid], [field]: clamp(value, MARK_MAX[field]) } }))
  }
  const saveMarks = () => {
    saveSubjectMarks(cls.id, assignment.subject, draft)
    showFlash(`✅ Internal marks saved for ${assignment.subject}.`)
  }

  // ── Login screen ──
  if (!teacher) {
    return (
      <>
        <div className="page-hero">
          <div className="container page-hero__inner">
            <nav className="breadcrumb"><Link to="/">Home</Link><span className="sep">»</span><span>Faculty</span></nav>
            <h1>Teacher Portal</h1>
          </div>
        </div>
        <section className="section">
          <div className="container">
            <div className="att-search" style={{ maxWidth: 480, flexDirection: 'column', textAlign: 'center' }}>
              <div className="att-search__icon">👩‍🏫</div>
              <div className="att-search__body" style={{ width: '100%' }}>
                <h2>Faculty Login</h2>
                <p>Sign in with your Teacher ID to mark attendance and enter internal marks.</p>
                <form onSubmit={login}>
                  <div className="form-row"><label>Teacher ID</label><input value={tid} onChange={(e) => setTid(e.target.value)} placeholder="e.g. T01" /></div>
                  <div className="form-row"><label>Password</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" /></div>
                  <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>Log In</button>
                </form>
                {loginErr && <div className="att-error" style={{ margin: '14px 0 0' }}>⚠️ {loginErr}</div>}
                <div className="att-hint" style={{ justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <div>Demo logins (password <b>teacher123</b>):</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button type="button" className="att-chip" onClick={() => { setTid('T01'); setPw('teacher123') }}>T01 · Naveen (B.Com)</button>
                    <button type="button" className="att-chip" onClick={() => { setTid('T02'); setPw('teacher123') }}>T02 · Meera (BCA)</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  const recent = sessionsForTeacher(teacher.id).slice(0, 6)

  return (
    <>
      <div className="page-hero">
        <div className="container page-hero__inner">
          <nav className="breadcrumb"><Link to="/">Home</Link><span className="sep">»</span><span>Teacher Portal</span></nav>
          <h1>{mode === 'marks' ? 'Enter Internal Marks' : 'Mark Attendance'}</h1>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {flash && <div className="admin-flash">{flash}</div>}

          <div className="teacher-bar card">
            <div className="teacher-bar__who">
              <span className="teacher-bar__avatar">👩‍🏫</span>
              <div>
                <strong>{teacher.name}</strong>
                <span>{teacher.department} Department · ID {teacher.id}</span>
              </div>
            </div>
            <button className="btn btn--outline btn--sm" onClick={logout}>Log out</button>
          </div>

          {/* Mode tabs */}
          <div className="tabs" style={{ justifyContent: 'flex-start', margin: '0 0 26px' }}>
            <button className={`tab ${mode === 'attendance' ? 'active' : ''}`} onClick={() => setMode('attendance')}>📅 Attendance</button>
            <button className={`tab ${mode === 'marks' ? 'active' : ''}`} onClick={() => setMode('marks')}>📝 Internal Marks</button>
          </div>

          <div className="mark-grid">
            {/* Controls */}
            <div className="mark-controls card">
              <h3>{mode === 'marks' ? 'Marks Entry' : 'Session'}</h3>
              <div className="form-row">
                <label>Class &amp; Subject</label>
                <select value={assignIdx} onChange={(e) => setAssignIdx(Number(e.target.value))}>
                  {teacher.assignments.map((a, i) => {
                    const c = getClass(a.classId)
                    return <option key={i} value={i}>{c.label} — {a.subject}</option>
                  })}
                </select>
              </div>

              {mode === 'attendance' ? (
                <>
                  <div className="form-row"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                  <div className="mark-summary">
                    <div><span className="v" style={{ color: '#16a34a' }}>{presentCount}</span><span className="l">Present</span></div>
                    <div><span className="v" style={{ color: '#dc2626' }}>{cls.students.length - presentCount}</span><span className="l">Absent</span></div>
                    <div><span className="v">{cls.students.length}</span><span className="l">Total</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <button className="btn btn--outline btn--sm" style={{ flex: 1, justifyContent: 'center' }} onClick={allPresent}>All Present</button>
                    <button className="btn btn--outline btn--sm" style={{ flex: 1, justifyContent: 'center', color: '#dc2626', borderColor: '#fecaca' }} onClick={allAbsent}>All Absent</button>
                  </div>
                  <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveAttendance}>💾 Save Attendance</button>

                  {recent.length > 0 && (
                    <div className="mark-recent">
                      <h4>Recent sessions</h4>
                      {recent.map((s) => (
                        <div className="mark-recent__row" key={s.id}><span>{s.subject}</span><span>{s.date}</span><span><b>{s.presentCount}</b>/{s.totalCount}</span></div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '4px 0 16px' }}>
                    Enter each student's <b>IA-1</b> (/20), <b>IA-2</b> (/20) and <b>Assignment</b> (/10). Values are capped automatically.
                  </p>
                  <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveMarks}>💾 Save Marks</button>
                  <p className="admin-note">Saving updates each student's <b>{assignment.subject}</b> internal marks in their <Link to="/student">progress card</Link>.</p>
                </>
              )}
            </div>

            {/* Roster / Marks table */}
            <div className="roster card">
              <div className="roster__head">
                <h3>{cls.label} · {assignment.subject}</h3>
                <span className="roster__count">{cls.students.length} students</span>
              </div>

              {mode === 'attendance' ? (
                <div className="roster__list">
                  {cls.students.map((s) => {
                    const isPresent = present[s.id]
                    return (
                      <div className={`roster__item ${isPresent ? 'present' : 'absent'}`} key={s.id}>
                        <span className="roster__avatar">{s.photo}</span>
                        <div className="roster__info">
                          <span className="roster__name">{s.name}</span>
                          <span className="roster__meta">Roll {s.roll} · {s.id}</span>
                        </div>
                        <button className={`roster__toggle ${isPresent ? 'on' : 'off'}`} onClick={() => toggle(s.id)}>{isPresent ? '✓ Present' : '✕ Absent'}</button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="data-table marks-entry">
                    <thead>
                      <tr><th>Student</th><th>IA-1<small>/20</small></th><th>IA-2<small>/20</small></th><th>Assign.<small>/10</small></th><th>Total<small>/50</small></th></tr>
                    </thead>
                    <tbody>
                      {cls.students.map((s) => {
                        const m = draft[s.id] || { ia1: 0, ia2: 0, assignment: 0 }
                        const total = (m.ia1 || 0) + (m.ia2 || 0) + (m.assignment || 0)
                        return (
                          <tr key={s.id}>
                            <td className="sub">{s.name}<small style={{ display: 'block', color: 'var(--muted)', fontWeight: 400 }}>Roll {s.roll}</small></td>
                            <td><input className="mark-input" type="number" min="0" max="20" value={m.ia1} onChange={(e) => setMark(s.id, 'ia1', e.target.value)} /></td>
                            <td><input className="mark-input" type="number" min="0" max="20" value={m.ia2} onChange={(e) => setMark(s.id, 'ia2', e.target.value)} /></td>
                            <td><input className="mark-input" type="number" min="0" max="10" value={m.assignment} onChange={(e) => setMark(s.id, 'assignment', e.target.value)} /></td>
                            <td><b>{total}</b></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {mode === 'attendance' && (
                <p className="admin-note">💡 Saving increments each student's total for <b>{assignment.subject}</b>. Students see it instantly in the <Link to="/student">student portal</Link>.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
