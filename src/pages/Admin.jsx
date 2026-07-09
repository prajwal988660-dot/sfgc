import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents, byDate } from '../store/EventsContext.jsx'
import { useRegistrations } from '../store/RegistrationsContext.jsx'
import CloudBadge from '../components/CloudBadge.jsx'

// NOTE: This is a client-side demo admin. The passcode is not real security —
// it only gates the UI. Changes are saved to this browser's localStorage.
const ADMIN_PASSCODE = 'sfgc-admin'

const COVER_PRESETS = [
  { name: 'Violet', value: ['#6d28d9', '#4f46e5'] },
  { name: 'Magenta', value: ['#d6249f', '#7c1d9e'] },
  { name: 'Ocean', value: ['#0891b2', '#4338ca'] },
  { name: 'Teal', value: ['#0e7490', '#1e40af'] },
  { name: 'Amber', value: ['#b45309', '#9d174d'] },
  { name: 'Tricolour', value: ['#c2410c', '#15803d'] },
]

const EMPTY = {
  title: '', type: 'Event', date: '', time: '', venue: '', fee: 'Free',
  icon: '📅', tagline: '', about: '', highlights: '', schedule: '',
  coordinatorName: '', coordinatorPhone: '080-22955369', coverName: 'Violet',
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'event'
}

function toForm(ev) {
  const preset = COVER_PRESETS.find((p) => p.value[0] === ev.cover?.[0])
  return {
    title: ev.title, type: ev.type, date: ev.date, time: ev.time || '',
    venue: ev.venue, fee: ev.fee, icon: ev.icon || '📅', tagline: ev.tagline || '',
    about: (ev.about || []).join('\n\n'),
    highlights: (ev.highlights || []).join('\n'),
    schedule: (ev.schedule || []).map(([t, i]) => `${t} | ${i}`).join('\n'),
    coordinatorName: ev.coordinator?.name || '',
    coordinatorPhone: ev.coordinator?.phone || '080-22955369',
    coverName: preset ? preset.name : 'Violet',
  }
}

function fromForm(form, existingId, allEvents) {
  const cover = (COVER_PRESETS.find((p) => p.name === form.coverName) || COVER_PRESETS[0]).value
  let id = existingId
  if (!id) {
    id = slugify(form.title)
    let n = 2
    while (allEvents.some((e) => e.id === id)) id = `${slugify(form.title)}-${n++}`
  }
  return {
    id,
    title: form.title.trim(),
    type: form.type,
    date: form.date,
    time: form.time.trim(),
    venue: form.venue.trim(),
    fee: form.fee.trim() || 'Free',
    registration: 'open',
    icon: form.icon.trim() || (form.type === 'Fest' ? '🎉' : '📅'),
    cover,
    tagline: form.tagline.trim(),
    about: form.about.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
    highlights: form.highlights.split('\n').map((s) => s.trim()).filter(Boolean),
    schedule: form.schedule.split('\n').map((l) => {
      const [t, ...rest] = l.split('|')
      return rest.length ? [t.trim(), rest.join('|').trim()] : null
    }).filter(Boolean),
    coordinator: { name: form.coordinatorName.trim() || 'College Office', phone: form.coordinatorPhone.trim() },
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Admin() {
  const { events, addEvent, updateEvent, deleteEvent, resetEvents } = useEvents()
  const { registrations, removeRegistration, clearAll, countForEvent } = useRegistrations()
  const [unlocked, setUnlocked] = useState(false)
  const [pass, setPass] = useState('')
  const [passErr, setPassErr] = useState('')

  const [view, setView] = useState('events')
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [flash, setFlash] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const showFlash = (msg) => { setFlash(msg); window.clearTimeout(showFlash._t); showFlash._t = window.setTimeout(() => setFlash(''), 3000) }

  const login = (e) => {
    e.preventDefault()
    if (pass.trim() === ADMIN_PASSCODE) { setUnlocked(true); setPassErr('') }
    else setPassErr('Incorrect passcode. Try again.')
  }

  const startEdit = (ev) => {
    setEditingId(ev.id)
    setForm(toForm(ev))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY) }

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) { showFlash('⚠️ Title and date are required.'); return }
    const ev = fromForm(form, editingId, events)
    if (editingId) { updateEvent(editingId, ev); showFlash(`✅ Updated "${ev.title}".`) }
    else { addEvent(ev); showFlash(`✅ Added "${ev.title}".`) }
    setEditingId(null); setForm(EMPTY)
  }

  const remove = (ev) => {
    if (window.confirm(`Remove "${ev.title}"? This cannot be undone.`)) {
      deleteEvent(ev.id)
      if (editingId === ev.id) cancelEdit()
      showFlash(`🗑️ Removed "${ev.title}".`)
    }
  }

  const reset = () => {
    if (window.confirm('Reset all events back to the original defaults? Your custom changes will be lost.')) {
      resetEvents(); cancelEdit(); showFlash('↩️ Events reset to defaults.')
    }
  }

  const removeReg = (reg) => {
    if (window.confirm(`Remove ${reg.name}'s registration for "${reg.eventTitle}"?`)) {
      removeRegistration(reg.ticket)
      showFlash(`🗑️ Removed registration ${reg.ticket}.`)
    }
  }

  const clearRegs = () => {
    if (registrations.length && window.confirm('Clear ALL registrations? This cannot be undone.')) {
      clearAll(); showFlash('🗑️ All registrations cleared.')
    }
  }

  const exportCSV = (rows, filename) => {
    if (!rows.length) { showFlash('No registrations to export.'); return }
    const cols = ['ticket', 'eventTitle', 'eventType', 'name', 'email', 'phone', 'college', 'team', 'members', 'registeredAt']
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showFlash(`⬇️ Exported ${rows.length} registration(s).`)
  }

  const fmtWhen = (iso) => {
    try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
    catch { return '—' }
  }

  // ── Login gate ──
  if (!unlocked) {
    return (
      <>
        <div className="page-hero">
          <div className="container page-hero__inner">
            <nav className="breadcrumb"><Link to="/">Home</Link><span className="sep">»</span><span>Admin</span></nav>
            <h1>Admin — Event Management</h1>
          </div>
        </div>
        <section className="section">
          <div className="container">
            <div className="att-search" style={{ maxWidth: 480, flexDirection: 'column', textAlign: 'center' }}>
              <div className="att-search__icon">🔐</div>
              <div className="att-search__body" style={{ width: '100%' }}>
                <h2>Admin Login</h2>
                <p>Enter the admin passcode to manage events.</p>
                <form onSubmit={login} className="att-form">
                  <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Passcode" aria-label="Admin passcode" />
                  <button type="submit" className="btn btn--primary">Unlock</button>
                </form>
                {passErr && <div className="att-error" style={{ margin: '14px 0 0' }}>⚠️ {passErr}</div>}
                <div className="att-hint" style={{ justifyContent: 'center' }}>
                  Demo passcode: <button type="button" className="att-chip" onClick={() => setPass(ADMIN_PASSCODE)}>{ADMIN_PASSCODE}</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  // ── Admin dashboard ──
  return (
    <>
      <div className="page-hero">
        <div className="container page-hero__inner">
          <nav className="breadcrumb"><Link to="/">Home</Link><span className="sep">»</span><span>Admin</span></nav>
          <h1>Event Management</h1>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {flash && <div className="admin-flash">{flash}</div>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 30, flexWrap: 'wrap' }}>
            <div className="tabs" style={{ justifyContent: 'flex-start', margin: 0 }}>
              <button className={`tab ${view === 'events' ? 'active' : ''}`} onClick={() => setView('events')}>
                🗂️ Manage Events
              </button>
              <button className={`tab ${view === 'regs' ? 'active' : ''}`} onClick={() => setView('regs')}>
                👥 Registrations <span className="admin-count" style={{ marginLeft: 6 }}>{registrations.length}</span>
              </button>
            </div>
            <CloudBadge />
          </div>

          {view === 'regs' ? (
            <RegistrationsView
              events={events}
              registrations={registrations}
              countForEvent={countForEvent}
              onRemove={removeReg}
              onExport={exportCSV}
              onClear={clearRegs}
              fmtWhen={fmtWhen}
            />
          ) : (
          <div className="admin-grid">
            {/* Form */}
            <form className="admin-form card" onSubmit={submit}>
              <div className="admin-form__head">
                <h2>{editingId ? 'Edit Event' : 'Add New Event'}</h2>
                {editingId && <button type="button" className="btn btn--outline btn--sm" onClick={cancelEdit}>+ New instead</button>}
              </div>

              <div className="form-row">
                <label>Event Title *</label>
                <input value={form.title} onChange={set('title')} placeholder="e.g. Annual Sports Meet" />
              </div>

              <div className="form-grid">
                <div className="form-row">
                  <label>Type</label>
                  <select value={form.type} onChange={set('type')}><option>Event</option><option>Fest</option></select>
                </div>
                <div className="form-row">
                  <label>Icon (emoji)</label>
                  <input value={form.icon} onChange={set('icon')} placeholder="📅" />
                </div>
                <div className="form-row">
                  <label>Date *</label>
                  <input type="date" value={form.date} onChange={set('date')} />
                </div>
                <div className="form-row">
                  <label>Time</label>
                  <input value={form.time} onChange={set('time')} placeholder="9:00 AM – 5:00 PM" />
                </div>
                <div className="form-row">
                  <label>Venue</label>
                  <input value={form.venue} onChange={set('venue')} placeholder="Main Auditorium" />
                </div>
                <div className="form-row">
                  <label>Fee</label>
                  <input value={form.fee} onChange={set('fee')} placeholder="Free / ₹200 / team" />
                </div>
                <div className="form-row">
                  <label>Cover Theme</label>
                  <select value={form.coverName} onChange={set('coverName')}>
                    {COVER_PRESETS.map((p) => <option key={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label>Coordinator</label>
                  <input value={form.coordinatorName} onChange={set('coordinatorName')} placeholder="Cultural Committee" />
                </div>
              </div>

              <div className="form-row">
                <label>Tagline</label>
                <input value={form.tagline} onChange={set('tagline')} placeholder="One catchy line about the event" />
              </div>
              <div className="form-row">
                <label>About (blank line separates paragraphs)</label>
                <textarea rows="4" value={form.about} onChange={set('about')} placeholder="Describe the event…" />
              </div>
              <div className="form-row">
                <label>Highlights (one per line)</label>
                <textarea rows="4" value={form.highlights} onChange={set('highlights')} placeholder={'Keynote address\nCultural performances\nPrizes'} />
              </div>
              <div className="form-row">
                <label>Schedule (one per line — "time | item")</label>
                <textarea rows="4" value={form.schedule} onChange={set('schedule')} placeholder={'09:00 AM | Inauguration\n11:00 AM | Main event'} />
              </div>
              <div className="form-row">
                <label>Coordinator Phone</label>
                <input value={form.coordinatorPhone} onChange={set('coordinatorPhone')} placeholder="080-22955369" />
              </div>

              <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                {editingId ? 'Save Changes' : 'Add Event'}
              </button>
            </form>

            {/* List */}
            <div className="admin-list">
              <div className="admin-list__head">
                <h2>Current Events <span className="admin-count">{events.length}</span></h2>
                <button className="btn btn--outline btn--sm" onClick={reset}>↩️ Reset defaults</button>
              </div>

              {[...events].sort(byDate).map((ev) => {
                const d = new Date(ev.date)
                return (
                  <div className={`admin-item ${editingId === ev.id ? 'editing' : ''}`} key={ev.id}>
                    <div className="admin-item__date" style={{ background: `linear-gradient(135deg, ${ev.cover?.[0] || '#6d28d9'}, ${ev.cover?.[1] || '#4f46e5'})` }}>
                      <span className="ic">{ev.icon}</span>
                      <span className="dm">{isNaN(d) ? '--' : `${d.getDate()} ${MONTHS[d.getMonth()]}`}</span>
                    </div>
                    <div className="admin-item__body">
                      <span className={`ev-badge ${ev.type === 'Fest' ? 'ev-badge--fest' : 'ev-badge--event'}`}>{ev.type}</span>
                      {countForEvent(ev.id) > 0 && (
                        <span className="admin-reg-badge" title="Registrations">👥 {countForEvent(ev.id)}</span>
                      )}
                      <div className="admin-item__title">{ev.title}</div>
                      <div className="admin-item__meta">📍 {ev.venue || '—'} · 🎫 {ev.fee}</div>
                    </div>
                    <div className="admin-item__actions">
                      <button className="admin-btn admin-btn--edit" onClick={() => startEdit(ev)}>Edit</button>
                      <button className="admin-btn admin-btn--del" onClick={() => remove(ev)}>Delete</button>
                    </div>
                  </div>
                )
              })}
              {events.length === 0 && <div className="att-error" style={{ margin: 0 }}>No events. Add one using the form.</div>}

              <p className="admin-note">
                💾 Changes are saved to this browser and appear live on the{' '}
                <Link to="/happenings/events">Events</Link> page and the homepage.
              </p>
            </div>
          </div>
          )}
        </div>
      </section>
    </>
  )
}

// ── Registrations view ──────────────────────────────────────────────────────
function RegistrationsView({ events, registrations, countForEvent, onRemove, onExport, onClear, fmtWhen }) {
  const sorted = [...events].sort(byDate)
  const withRegs = sorted.filter((ev) => countForEvent(ev.id) > 0)

  return (
    <div className="regs-view">
      <div className="admin-list__head">
        <h2>Registrations <span className="admin-count">{registrations.length}</span></h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn--outline btn--sm" onClick={() => onExport(registrations, 'sfgc-all-registrations.csv')}>⬇️ Export all CSV</button>
          <button className="btn btn--outline btn--sm" onClick={onClear} style={{ color: '#dc2626', borderColor: '#fecaca' }}>Clear all</button>
        </div>
      </div>

      {registrations.length === 0 && (
        <div className="att-error" style={{ margin: 0 }}>
          No registrations yet. When participants register for an event or fest, they'll appear here.
        </div>
      )}

      {withRegs.map((ev) => {
        const regs = registrations.filter((r) => r.eventId === ev.id)
        const isFest = ev.type === 'Fest'
        return (
          <div className="regs-group card" key={ev.id}>
            <div className="regs-group__head" style={{ background: `linear-gradient(135deg, ${ev.cover?.[0] || '#6d28d9'}, ${ev.cover?.[1] || '#4f46e5'})` }}>
              <div>
                <span className="regs-group__icon">{ev.icon}</span>
                <div>
                  <strong>{ev.title}</strong>
                  <span className="regs-group__sub">{regs.length} registration{regs.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => onExport(regs, `sfgc-${ev.id}-registrations.csv`)}>⬇️ CSV</button>
            </div>
            <div className={`regs-table ${isFest ? 'regs-table--fest' : ''}`} role="table">
              <div className="regs-row regs-row--head" role="row">
                <span>Participant</span>
                <span>Contact</span>
                {isFest && <span>Team</span>}
                <span>Ticket</span>
                <span></span>
              </div>
              {regs.map((r) => (
                <div className="regs-row" role="row" key={r.ticket}>
                  <span>
                    <b>{r.name}</b>
                    <small>{r.college || '—'} · {fmtWhen(r.registeredAt)}</small>
                  </span>
                  <span><small>{r.email}<br />{r.phone}</small></span>
                  {isFest && <span><small>{r.team || '—'}<br />{r.members} member(s)</small></span>}
                  <span className="regs-ticket">{r.ticket}</span>
                  <span><button className="admin-btn admin-btn--del" onClick={() => onRemove(r)}>Remove</button></span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
