import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTeacher } from '../data/attendance.js'
import { MARK_MAX } from '../data/marks.js'
import { useAttendance } from '../store/AttendanceContext.jsx'
import { useMarks } from '../store/MarksContext.jsx'
import { useSubjects } from '../store/SubjectsContext.jsx'
import { useClasses } from '../store/ClassesContext.jsx'

const today = () => new Date().toISOString().slice(0, 10)
const nowTime = () => new Date().toTimeString().slice(0, 5)
const clamp = (v, max) => Math.max(0, Math.min(max, Number.isFinite(+v) ? Math.round(+v) : 0))

export default function Teacher() {
  const { markSession, sessionsForTeacher } = useAttendance()
  const { getSubjectMarks, saveSubjectMarks } = useMarks()
  const { getSubjects, addSubject, removeSubject } = useSubjects()
  const { getClass, streams, yearsForStream, classesFor } = useClasses()

  // Login
  const [teacher, setTeacher] = useState(null)
  const [tid, setTid] = useState('')
  const [pw, setPw] = useState('')
  const [loginErr, setLoginErr] = useState('')

  // Session controls
  const [mode, setMode] = useState('attendance') // 'attendance' | 'marks'
  const [stream, setStream] = useState('')
  const [year, setYear] = useState('')
  const [section, setSection] = useState('')
  const [subject, setSubject] = useState('')
  const [time, setTime] = useState(nowTime())
  const [date, setDate] = useState(today())
  const [newSubject, setNewSubject] = useState('')
  const [manageOpen, setManageOpen] = useState(false)
  const [flash, setFlash] = useState('')

  // Working state
  const [present, setPresent] = useState({})
  const [draft, setDraft] = useState({})

  const years = stream ? yearsForStream(stream) : []
  const sections = stream && year ? classesFor(stream, year).map((c) => c.section) : []
  const cls = classesFor(stream, year).find((c) => c.section === section) || null
  const classId = cls ? cls.id : null
  const subjects = classId ? getSubjects(classId) : []

  // Keep year/section valid when stream/year change
  useEffect(() => {
    if (!teacher) return
    if (!years.includes(year)) setYear(years[0] || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, teacher])
  useEffect(() => {
    if (!teacher) return
    if (!sections.includes(section)) setSection(sections[0] || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, year, teacher])

  // On class change: pick a default subject + reset roster
  useEffect(() => {
    if (!cls) return
    const list = getSubjects(cls.id)
    setSubject((cur) => (list.includes(cur) ? cur : list[0] || ''))
    const init = {}
    cls.students.forEach((s) => { init[s.id] = true })
    setPresent(init)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, teacher])

  // Load marks draft when class/subject changes
  useEffect(() => {
    if (!cls || !subject) { setDraft({}); return }
    const existing = getSubjectMarks(cls.id, subject)
    const d = {}
    cls.students.forEach((s) => {
      const m = existing[s.id] || { ia1: 0, ia2: 0, assignment: 0 }
      d[s.id] = { ia1: m.ia1 || 0, ia2: m.ia2 || 0, assignment: m.assignment || 0 }
    })
    setDraft(d)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, subject, teacher])

  const login = (e) => {
    e.preventDefault()
    const res = getTeacher(tid, pw)
    if (res.error) { setLoginErr(res.error); return }
    setLoginErr('')
    setTeacher(res.teacher)
    const s0 = streams[0] || ''
    const y0 = (s0 ? yearsForStream(s0) : [])[0] || ''
    const sec0 = (s0 && y0 ? classesFor(s0, y0).map((c) => c.section) : [])[0] || ''
    setStream(s0); setYear(y0); setSection(sec0)
  }
  const logout = () => { setTeacher(null); setTid(''); setPw(''); setStream(''); setYear(''); setSection(''); setSubject('') }
  const showFlash = (m) => { setFlash(m); window.clearTimeout(showFlash._t); showFlash._t = window.setTimeout(() => setFlash(''), 3500) }

  // Subject management
  const handleAddSubject = () => {
    const name = newSubject.trim()
    if (!name) return
    if (addSubject(classId, name)) { setSubject(name); setNewSubject(''); showFlash(`✅ Added subject “${name}”.`) }
    else showFlash('⚠️ That subject already exists.')
  }
  const handleRemoveSubject = (name) => {
    if (!window.confirm(`Delete subject “${name}” from ${cls.label}? Its attendance/marks records remain but it will no longer be listed.`)) return
    removeSubject(classId, name)
    if (subject === name) {
      const remaining = getSubjects(classId).filter((s) => s !== name)
      setSubject(remaining[0] || '')
    }
    showFlash(`🗑️ Removed subject “${name}”.`)
  }

  // Attendance
  const toggle = (id) => setPresent((p) => ({ ...p, [id]: !p[id] }))
  const allPresent = () => { const m = {}; cls.students.forEach((s) => { m[s.id] = true }); setPresent(m) }
  const allAbsent = () => { const m = {}; cls.students.forEach((s) => { m[s.id] = false }); setPresent(m) }
  const presentCount = cls ? cls.students.filter((s) => present[s.id]).length : 0
  const saveAttendance = () => {
    if (!subject) { showFlash('⚠️ Add/select a subject first.'); return }
    if (!date) { showFlash('⚠️ Please choose a date.'); return }
    const presentIds = cls.students.filter((s) => present[s.id]).map((s) => s.id)
    markSession({ classId: cls.id, subject, date, time, presentIds, teacherId: teacher.id, teacherName: teacher.name })
    showFlash(`✅ Attendance saved for ${subject} — ${presentIds.length}/${cls.students.length} present on ${date}${time ? ' at ' + time : ''}.`)
  }

  // Marks
  const setMark = (sid, field, value) => setDraft((d) => ({ ...d, [sid]: { ...d[sid], [field]: clamp(value, MARK_MAX[field]) } }))
  const saveMarks = () => {
    if (!subject) { showFlash('⚠️ Add/select a subject first.'); return }
    saveSubjectMarks(cls.id, subject, draft)
    showFlash(`✅ Internal marks saved for ${subject}.`)
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

  if (!cls) {
    return (
      <>
        <div className="page-hero">
          <div className="container page-hero__inner">
            <nav className="breadcrumb"><Link to="/">Home</Link><span className="sep">»</span><span>Teacher Portal</span></nav>
            <h1>Mark Attendance</h1>
          </div>
        </div>
        <section className="section">
          <div className="container">
            <div className="teacher-bar card">
              <div className="teacher-bar__who">
                <span className="teacher-bar__avatar">👩‍🏫</span>
                <div><strong>{teacher.name}</strong><span>{teacher.department} Department · ID {teacher.id}</span></div>
              </div>
              <button className="btn btn--outline btn--sm" onClick={logout}>Log out</button>
            </div>
            <div className="att-error" style={{ margin: 0 }}>
              No classes available yet. Ask the admin to add a class (with students) in the <Link to="/admin">Admin panel</Link>.
            </div>
          </div>
        </section>
      </>
    )
  }

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

          <div className="tabs" style={{ justifyContent: 'flex-start', margin: '0 0 26px' }}>
            <button className={`tab ${mode === 'attendance' ? 'active' : ''}`} onClick={() => setMode('attendance')}>📅 Attendance</button>
            <button className={`tab ${mode === 'marks' ? 'active' : ''}`} onClick={() => setMode('marks')}>📝 Internal Marks</button>
          </div>

          <div className="mark-grid">
            {/* Controls */}
            <div className="mark-controls card">
              <h3>{mode === 'marks' ? 'Marks Entry' : 'Session'}</h3>

              {/* Stream / Year / Section */}
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-row">
                  <label>Stream</label>
                  <select value={stream} onChange={(e) => setStream(e.target.value)}>
                    {streams.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label>Year</label>
                  <select value={year} onChange={(e) => setYear(e.target.value)}>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {sections.length > 1 && (
                <div className="form-row">
                  <label>Section</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)}>
                    {sections.map((sec) => <option key={sec} value={sec}>Section {sec}</option>)}
                  </select>
                </div>
              )}

              {/* Subject + manage */}
              <div className="form-row">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Subject</span>
                  <button type="button" className="subj-manage-toggle" onClick={() => setManageOpen((v) => !v)}>
                    {manageOpen ? 'Done' : '＋ Add / Delete'}
                  </button>
                </label>
                {subjects.length > 0 ? (
                  <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <div className="att-error" style={{ margin: 0, padding: '10px 14px' }}>No subjects yet — add one below.</div>
                )}
              </div>

              {manageOpen && (
                <div className="subj-manage">
                  <div className="subj-add">
                    <input
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                      placeholder="New subject name"
                    />
                    <button type="button" className="btn btn--primary btn--sm" onClick={handleAddSubject}>Add</button>
                  </div>
                  <div className="subj-list">
                    {subjects.map((s) => (
                      <span className={`subj-chip ${s === subject ? 'active' : ''}`} key={s}>
                        <button type="button" className="subj-chip__name" onClick={() => setSubject(s)}>{s}</button>
                        <button type="button" className="subj-chip__del" title="Delete subject" onClick={() => handleRemoveSubject(s)}>×</button>
                      </span>
                    ))}
                    {subjects.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No subjects yet.</span>}
                  </div>
                </div>
              )}

              {mode === 'attendance' ? (
                <>
                  {/* Time — chosen after subject */}
                  <div className="form-row">
                    <label>Time</label>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                  {/* Date — defaults to today, still selectable */}
                  <div className="form-row">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Date</span>
                      <button type="button" className="subj-manage-toggle" onClick={() => setDate(today())}>Today</button>
                    </label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>

                  <div className="mark-summary">
                    <div><span className="v" style={{ color: '#16a34a' }}>{presentCount}</span><span className="l">Present</span></div>
                    <div><span className="v" style={{ color: '#dc2626' }}>{cls.students.length - presentCount}</span><span className="l">Absent</span></div>
                    <div><span className="v">{cls.students.length}</span><span className="l">Total</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <button className="btn btn--outline btn--sm" style={{ flex: 1, justifyContent: 'center' }} onClick={allPresent}>All Present</button>
                    <button className="btn btn--outline btn--sm" style={{ flex: 1, justifyContent: 'center', color: '#dc2626', borderColor: '#fecaca' }} onClick={allAbsent}>All Absent</button>
                  </div>
                  <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveAttendance} disabled={!subject}>💾 Save Attendance</button>

                  {recent.length > 0 && (
                    <div className="mark-recent">
                      <h4>Recent sessions</h4>
                      {recent.map((s) => (
                        <div className="mark-recent__row" key={s.id}>
                          <span>{s.subject}</span>
                          <span>{s.date}{s.time ? ` · ${s.time}` : ''}</span>
                          <span><b>{s.presentCount}</b>/{s.totalCount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '4px 0 16px' }}>
                    Enter each student's <b>IA-1</b> (/20), <b>IA-2</b> (/20) and <b>Assignment</b> (/10). Values are capped automatically.
                  </p>
                  <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveMarks} disabled={!subject}>💾 Save Marks</button>
                  <p className="admin-note">Saving updates each student's <b>{subject || 'subject'}</b> internal marks in their <Link to="/student">progress card</Link>.</p>
                </>
              )}
            </div>

            {/* Roster / Marks table */}
            <div className="roster card">
              <div className="roster__head">
                <h3>{cls.label} · {subject || '—'}</h3>
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
                <p className="admin-note">💡 Saving increments each student's total for <b>{subject || 'the subject'}</b>. Students see it instantly in the <Link to="/student">student portal</Link>.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
