import { useEffect, useState } from 'react'
import { useRegistrations } from '../store/RegistrationsContext.jsx'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function pretty(dateStr) {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const emptyForm = { name: '', email: '', phone: '', college: '', team: '', members: '1' }

export default function EventRegisterModal({ event, onClose }) {
  const [form, setForm] = useState(emptyForm)
  const [done, setDone] = useState(false)
  const [ticket, setTicket] = useState('')
  const { addRegistration } = useRegistrations()

  const isFest = event?.type === 'Fest'
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!event) return null

  const submit = (e) => {
    e.preventDefault()
    const t = addRegistration({
      eventId: event.id,
      eventTitle: event.title,
      eventType: event.type,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      college: form.college.trim(),
      team: isFest ? form.team.trim() : '',
      members: isFest ? form.members : '1',
    })
    setTicket(t)
    setDone(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal__close" onClick={onClose} aria-label="Close">×</button>

        <div className="modal__banner">
          <span className={`ev-badge ${isFest ? 'ev-badge--fest' : 'ev-badge--event'}`}>
            {isFest ? '🎉 Fest' : '📅 Event'}
          </span>
          <h3>{event.title}</h3>
          <div className="modal__meta">
            <span>🗓️ {pretty(event.date)}</span>
            <span>📍 {event.venue}</span>
            <span>🎫 {event.fee}</span>
          </div>
        </div>

        <div className="modal__body">
          {done ? (
            <div className="reg-success">
              <div className="reg-success__icon">✅</div>
              <h4>Registration Confirmed!</h4>
              <p>
                Thank you, <b>{form.name}</b>. You're registered for <b>{event.title}</b>.
                A confirmation has been sent to <b>{form.email}</b>.
              </p>
              <div className="reg-ticket">
                <span>Your Registration ID</span>
                <strong>{ticket}</strong>
              </div>
              <button className="btn btn--primary" onClick={onClose} style={{ marginTop: 18 }}>Done</button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <p className="modal__lead">Fill in your details to register as a participant.</p>
              <div className="form-grid">
                <div className="form-row">
                  <label>Full Name *</label>
                  <input required value={form.name} onChange={set('name')} placeholder="Participant name" />
                </div>
                <div className="form-row">
                  <label>Email *</label>
                  <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                </div>
                <div className="form-row">
                  <label>Phone *</label>
                  <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 …" />
                </div>
                <div className="form-row">
                  <label>College / Institution</label>
                  <input value={form.college} onChange={set('college')} placeholder="Your college" />
                </div>
                {isFest && (
                  <>
                    <div className="form-row">
                      <label>Team Name</label>
                      <input value={form.team} onChange={set('team')} placeholder="Team name (if any)" />
                    </div>
                    <div className="form-row">
                      <label>No. of Participants</label>
                      <select value={form.members} onChange={set('members')}>
                        {['1', '2', '3', '4', '5+'].map((n) => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                Confirm Registration
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
