import { useState } from 'react'
import { Link } from 'react-router-dom'
import { STUDENT_PASSWORD, band, MIN_ATTENDANCE, SAMPLE_IDS } from '../data/attendance.js'
import { marksBand } from '../data/marks.js'
import { useAttendance } from '../store/AttendanceContext.jsx'
import { useMarks } from '../store/MarksContext.jsx'
import { useClasses } from '../store/ClassesContext.jsx'
import Ring from '../components/Ring.jsx'

const bandColor = (b) => (b === 'good' ? '#16a34a' : b === 'warn' ? '#f59e0b' : '#dc2626')

const TABS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'attendance', label: 'Attendance', icon: '📅' },
  { id: 'marks', label: 'Internal Marks', icon: '📝' },
  { id: 'progress', label: 'Progress Card', icon: '🎓' },
]

export default function StudentPortal() {
  const { getStudentSummary } = useAttendance()
  const { getStudentMarks } = useMarks()
  const { findStudent } = useClasses()
  const [sid, setSid] = useState(null)
  const [tab, setTab] = useState('overview')

  // login form
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  const login = (e) => {
    e.preventDefault()
    const found = findStudent(id)
    if (!found) { setErr('No student found with that ID.'); return }
    if (pw !== STUDENT_PASSWORD) { setErr('Incorrect password.'); return }
    setErr(''); setSid(found.student.id); setTab('overview')
  }
  const logout = () => { setSid(null); setId(''); setPw(''); }

  // ── Login screen ──
  if (!sid) {
    return (
      <>
        <div className="page-hero">
          <div className="container page-hero__inner">
            <nav className="breadcrumb"><Link to="/">Home</Link><span className="sep">»</span><span>Student Portal</span></nav>
            <h1>Student Portal</h1>
          </div>
        </div>
        <section className="section">
          <div className="container">
            <div className="att-search" style={{ maxWidth: 480, flexDirection: 'column', textAlign: 'center' }}>
              <div className="att-search__icon">🎓</div>
              <div className="att-search__body" style={{ width: '100%' }}>
                <h2>Student Login</h2>
                <p>Sign in with your ID card number to view attendance, internal marks and your progress card.</p>
                <form onSubmit={login}>
                  <div className="form-row"><label>ID Card Number</label><input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. SFGC101" /></div>
                  <div className="form-row"><label>Password</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" /></div>
                  <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>Log In</button>
                </form>
                {err && <div className="att-error" style={{ margin: '14px 0 0' }}>⚠️ {err}</div>}
                <div className="att-hint" style={{ justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <div>Demo logins (password <b>student123</b>):</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {SAMPLE_IDS.map((s) => (
                      <button key={s} type="button" className="att-chip" onClick={() => { setId(s); setPw('student123') }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  // ── Logged-in portal ──
  const att = getStudentSummary(sid)
  const marks = getStudentMarks(sid)

  return (
    <>
      <div className="page-hero">
        <div className="container page-hero__inner">
          <nav className="breadcrumb"><Link to="/">Home</Link><span className="sep">»</span><span>Student Portal</span></nav>
          <h1>Welcome, {att.name.split(' ')[0]}</h1>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Profile bar */}
          <div className="teacher-bar card">
            <div className="teacher-bar__who">
              <span className="teacher-bar__avatar">{att.photo}</span>
              <div>
                <strong>{att.name}</strong>
                <span>{att.id} · {att.program} · Sem {att.semester} · Sec {att.section}</span>
              </div>
            </div>
            <button className="btn btn--outline btn--sm" onClick={logout}>Log out</button>
          </div>

          {/* Tabs */}
          <div className="tabs student-tabs" style={{ justifyContent: 'flex-start', margin: '0 0 28px', flexWrap: 'wrap' }}>
            {TABS.map((t) => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && <Overview att={att} marks={marks} setTab={setTab} />}
          {tab === 'attendance' && <AttendanceTab att={att} />}
          {tab === 'marks' && <MarksTab marks={marks} />}
          {tab === 'progress' && <ProgressCard att={att} marks={marks} />}
        </div>
      </section>
    </>
  )
}

// ── Overview ──
function Overview({ att, marks, setTab }) {
  const attColor = bandColor(band(att.overall))
  const mkColor = bandColor(marksBand(marks.percentage))
  return (
    <div className="student-overview">
      <div className="stu-cards">
        <button className="stu-card" onClick={() => setTab('attendance')}>
          <Ring percent={att.overall} size={104} stroke={11} color={attColor} label={`${att.overall}%`} />
          <div className="stu-card__meta">
            <h3>Attendance</h3>
            <p>{att.totalPresent}/{att.totalClasses} classes</p>
            <span className={`att-status att-status--${att.eligible ? 'ok' : 'low'}`}>
              {att.eligible ? 'Eligible' : 'Shortage'}
            </span>
          </div>
        </button>

        <button className="stu-card" onClick={() => setTab('marks')}>
          <Ring percent={marks.percentage} size={104} stroke={11} color={mkColor} label={marks.grade} sub={`${marks.percentage}%`} />
          <div className="stu-card__meta">
            <h3>Internal Marks</h3>
            <p>{marks.obtained}/{marks.maxTotal} marks</p>
            <span className="att-status att-status--ok">Grade {marks.grade}</span>
          </div>
        </button>

        <button className="stu-card" onClick={() => setTab('progress')}>
          <div className="stu-card__big">🎓</div>
          <div className="stu-card__meta">
            <h3>Progress Card</h3>
            <p>{marks.subjects.length} subjects</p>
            <span className="att-status att-status--ok">View report →</span>
          </div>
        </button>
      </div>

      <div className="att-error" style={{ margin: 0, background: 'var(--bg-tint)', border: '1px solid var(--line)', color: 'var(--ink-soft)' }}>
        👋 Use the tabs above to view your subject-wise attendance, internal assessment marks, and a printable progress card.
      </div>
    </div>
  )
}

// ── Attendance tab ──
function AttendanceTab({ att }) {
  const color = bandColor(band(att.overall))
  return (
    <div className="att-result" style={{ margin: 0 }}>
      <div className="att-top">
        <div className="att-profile">
          <div className="att-avatar">{att.photo}</div>
          <div>
            <h3>{att.name}</h3>
            <div className="att-profile__meta">
              <span><b>ID:</b> {att.id}</span>
              <span><b>Programme:</b> {att.program}</span>
              <span><b>Semester:</b> {att.semester}</span>
            </div>
            <div className={`att-status att-status--${att.eligible ? 'ok' : 'low'}`}>
              {att.eligible ? `✅ Eligible — above ${MIN_ATTENDANCE}%` : `⚠️ Shortage — below ${MIN_ATTENDANCE}%`}
            </div>
          </div>
        </div>
        <Ring percent={att.overall} color={color} label={`${att.overall}%`} sub="Overall" />
      </div>

      <div className="att-tiles">
        <div className="att-tile"><span className="v">{att.totalClasses}</span><span className="l">Total Classes</span></div>
        <div className="att-tile att-tile--green"><span className="v">{att.totalPresent}</span><span className="l">Present</span></div>
        <div className="att-tile att-tile--red"><span className="v">{att.totalAbsent}</span><span className="l">Absent</span></div>
        <div className="att-tile"><span className="v">{att.subjects.length}</span><span className="l">Subjects</span></div>
      </div>

      <h3 className="att-section-title">Subject-wise Attendance</h3>
      <div className="att-subjects">
        {att.subjects.map((s) => {
          const b = band(s.percent)
          return (
            <div className="att-subject" key={s.name}>
              <div className="att-subject__head">
                <span className="att-subject__name">{s.name}</span>
                <span className={`att-subject__pct att-subject__pct--${b}`}>{s.percent}%</span>
              </div>
              <div className="att-bar"><div className={`att-bar__fill att-bar__fill--${b}`} style={{ width: `${Math.min(s.percent, 100)}%` }} /></div>
              <div className="att-subject__foot"><span>{s.present}/{s.total} attended</span><span>{s.absent} absent</span></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Internal marks tab ──
function MarksTab({ marks }) {
  return (
    <div className="marks-wrap">
      <div className="marks-summary card">
        <div>
          <span className="l">Internal Assessment</span>
          <span className="v">{marks.obtained}<small>/{marks.maxTotal}</small></span>
        </div>
        <div>
          <span className="l">Percentage</span>
          <span className="v" style={{ color: bandColor(marksBand(marks.percentage)) }}>{marks.percentage}%</span>
        </div>
        <div>
          <span className="l">Overall Grade</span>
          <span className="v grade-pill">{marks.grade}</span>
        </div>
      </div>

      <div className="table-scroll card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr><th>Subject</th><th>IA-1<small>/20</small></th><th>IA-2<small>/20</small></th><th>Assign.<small>/10</small></th><th>Total<small>/50</small></th><th>%</th><th>Grade</th></tr>
          </thead>
          <tbody>
            {marks.subjects.map((s) => (
              <tr key={s.name}>
                <td className="sub">{s.name}</td>
                <td>{s.ia1}</td>
                <td>{s.ia2}</td>
                <td>{s.assignment}</td>
                <td><b>{s.total}</b></td>
                <td>{s.pct}%</td>
                <td><span className={`grade-badge grade-badge--${marksBand(s.pct)}`}>{s.grade}</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td>Total</td><td colSpan="3"></td><td><b>{marks.obtained}/{marks.maxTotal}</b></td><td>{marks.percentage}%</td><td><span className="grade-badge grade-badge--good">{marks.grade}</span></td></tr>
          </tfoot>
        </table>
      </div>
      <p className="admin-note">IA-1 &amp; IA-2 are internal tests (20 each), plus an assignment (10), for an internal total of 50 per subject.</p>
    </div>
  )
}

// ── Progress card ──
function ProgressCard({ att, marks }) {
  const rows = att.subjects.map((a) => {
    const m = marks.subjects.find((x) => x.name === a.name) || {}
    return { name: a.name, attendance: a.percent, internal: m.total, max: m.max || 50, grade: m.grade, pct: m.pct }
  })
  const result = att.eligible && marks.percentage >= 40 ? 'PASS' : att.eligible ? 'PASS' : 'DETAINED (Attendance)'
  const remark = !att.eligible
    ? 'Attendance below the 75% requirement — please improve to remain exam-eligible.'
    : marks.percentage >= 70
      ? 'Excellent performance. Keep up the good work!'
      : marks.percentage >= 50
        ? 'Good progress. Aim higher in the coming assessments.'
        : 'Satisfactory. Focus on internal assessments to improve your grade.'

  return (
    <div className="progress-card card" id="progress-card">
      <div className="pc-head">
        <div className="pc-head__brand">
          <span className="brand__logo" style={{ width: 48, height: 48, fontSize: '1.5rem' }}>S</span>
          <div>
            <strong>Seshadripuram First Grade College</strong>
            <span>Yelahanka, Bengaluru · Progress Report</span>
          </div>
        </div>
        <button className="btn btn--outline btn--sm no-print" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
      </div>

      <div className="pc-student">
        <div><span>Name</span><b>{att.name}</b></div>
        <div><span>ID</span><b>{att.id}</b></div>
        <div><span>Programme</span><b>{att.program}</b></div>
        <div><span>Semester</span><b>{att.semester}</b></div>
        <div><span>Section</span><b>{att.section}</b></div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr><th>Subject</th><th>Attendance</th><th>Internal<small>/50</small></th><th>%</th><th>Grade</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="sub">{r.name}</td>
                <td><span className={`grade-badge grade-badge--${band(r.attendance) === 'good' ? 'good' : band(r.attendance) === 'warn' ? 'warn' : 'low'}`}>{r.attendance}%</span></td>
                <td>{r.internal}/{r.max}</td>
                <td>{r.pct}%</td>
                <td><span className={`grade-badge grade-badge--${marksBand(r.pct)}`}>{r.grade}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pc-summary">
        <div className="pc-summary__tile"><span>Overall Attendance</span><b style={{ color: bandColor(band(att.overall)) }}>{att.overall}%</b></div>
        <div className="pc-summary__tile"><span>Internal %</span><b style={{ color: bandColor(marksBand(marks.percentage)) }}>{marks.percentage}%</b></div>
        <div className="pc-summary__tile"><span>Overall Grade</span><b className="grade-pill">{marks.grade}</b></div>
        <div className="pc-summary__tile"><span>Result</span><b style={{ color: result.startsWith('PASS') ? '#16a34a' : '#dc2626' }}>{result}</b></div>
      </div>

      <div className="pc-remark"><b>Remarks:</b> {remark}</div>
      <p className="admin-note" style={{ textAlign: 'center' }}>This is a system-generated progress report for the current semester.</p>
    </div>
  )
}
