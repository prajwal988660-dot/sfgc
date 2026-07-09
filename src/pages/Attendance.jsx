import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SAMPLE_IDS, MIN_ATTENDANCE, band } from '../data/attendance.js'
import { useAttendance } from '../store/AttendanceContext.jsx'
import useScrollReveal from '../components/useScrollReveal.js'

function Ring({ percent }) {
  const r = 54
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(percent, 100) / 100) * c
  const b = band(percent)
  const color = b === 'good' ? '#16a34a' : b === 'warn' ? '#f59e0b' : '#dc2626'
  return (
    <div className="att-ring">
      <svg viewBox="0 0 128 128" width="128" height="128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#ece8f5" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="att-ring__label">
        <span className="att-ring__pct" style={{ color }}>{percent}%</span>
        <span className="att-ring__sub">Overall</span>
      </div>
    </div>
  )
}

export default function Attendance() {
  const { getStudentSummary } = useAttendance()
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  useScrollReveal([result])

  const submit = (e) => {
    e.preventDefault()
    const data = getStudentSummary(input)
    setSearched(true)
    if (!data) {
      setResult(null)
      setError(`No record found for ID "${input.trim()}". Please check your ID card number and try again.`)
      return
    }
    setError('')
    setResult(data)
  }

  return (
    <>
      <div className="page-hero">
        <div className="container page-hero__inner">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">»</span>
            <span>Check Attendance</span>
          </nav>
          <h1>Student Attendance Portal</h1>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Search card */}
          <div className="att-search reveal">
            <div className="att-search__icon">🪪</div>
            <div className="att-search__body">
              <h2>Check your attendance</h2>
              <p>Enter your ID card number to view your subject-wise and overall attendance.</p>
              <form onSubmit={submit} className="att-form">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. SFGC101"
                  aria-label="ID card number"
                  autoComplete="off"
                />
                <button type="submit" className="btn btn--primary">Check Attendance</button>
              </form>
              <div className="att-hint">
                Try a sample ID:{' '}
                {SAMPLE_IDS.map((id, i) => (
                  <button key={id} type="button" className="att-chip" onClick={() => { setInput(id); setResult(getStudentSummary(id)); setError(''); setSearched(true) }}>
                    {id}
                  </button>
                ))}
              </div>
              <div className="att-hint" style={{ marginTop: 6 }}>
                👩‍🏫 Faculty? <Link to="/teacher" style={{ fontWeight: 700 }}>Log in to mark attendance →</Link>
              </div>
            </div>
          </div>

          {/* Error */}
          {searched && error && (
            <div className="att-error reveal">⚠️ {error}</div>
          )}

          {/* Result dashboard */}
          {result && (
            <div className="att-result reveal" key={result.id}>
              {/* Student + overall */}
              <div className="att-top">
                <div className="att-profile">
                  <div className="att-avatar">{result.photo}</div>
                  <div>
                    <h3>{result.name}</h3>
                    <div className="att-profile__meta">
                      <span><b>ID:</b> {result.id}</span>
                      <span><b>Programme:</b> {result.program}</span>
                      <span><b>Semester:</b> {result.semester}</span>
                      <span><b>Section:</b> {result.section}</span>
                    </div>
                    <div className={`att-status att-status--${result.eligible ? 'ok' : 'low'}`}>
                      {result.eligible
                        ? `✅ Eligible — above the ${MIN_ATTENDANCE}% requirement`
                        : `⚠️ Shortage — below the ${MIN_ATTENDANCE}% requirement`}
                    </div>
                  </div>
                </div>
                <Ring percent={result.overall} />
              </div>

              {/* Summary tiles */}
              <div className="att-tiles">
                <div className="att-tile"><span className="v">{result.totalClasses}</span><span className="l">Total Classes</span></div>
                <div className="att-tile att-tile--green"><span className="v">{result.totalPresent}</span><span className="l">Present</span></div>
                <div className="att-tile att-tile--red"><span className="v">{result.totalAbsent}</span><span className="l">Absent</span></div>
                <div className="att-tile"><span className="v">{result.subjects.length}</span><span className="l">Subjects</span></div>
              </div>

              {/* Subject-wise */}
              <h3 className="att-section-title">Subject-wise Attendance</h3>
              <div className="att-subjects">
                {result.subjects.map((s) => {
                  const b = band(s.percent)
                  return (
                    <div className="att-subject" key={s.name}>
                      <div className="att-subject__head">
                        <span className="att-subject__name">{s.name}</span>
                        <span className={`att-subject__pct att-subject__pct--${b}`}>{s.percent}%</span>
                      </div>
                      <div className="att-bar">
                        <div className={`att-bar__fill att-bar__fill--${b}`} style={{ width: `${Math.min(s.percent, 100)}%` }} />
                      </div>
                      <div className="att-subject__foot">
                        <span>{s.present} / {s.total} classes attended</span>
                        <span>{s.absent} absent</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="att-updated">Last updated: {new Date(result.updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. For discrepancies, contact your class mentor or the office.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
