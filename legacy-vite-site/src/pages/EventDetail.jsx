import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useEvents } from '../store/EventsContext.jsx'
import EventRegisterModal from '../components/EventRegisterModal.jsx'
import NotFound from './NotFound.jsx'
import useScrollReveal from '../components/useScrollReveal.js'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function prettyDate(dateStr) {
  const d = new Date(dateStr)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return `${days[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function EventDetail() {
  const { id } = useParams()
  const { getEvent } = useEvents()
  const event = getEvent(id)
  const [showReg, setShowReg] = useState(false)
  useScrollReveal([id])

  if (!event) return <NotFound />

  const isFest = event.type === 'Fest'
  const cover = `linear-gradient(135deg, ${event.cover[0]}, ${event.cover[1]})`

  return (
    <>
      {/* Event picture / cover banner */}
      <div className="event-hero" style={{ background: cover }}>
        <div className="event-hero__art" aria-hidden="true">{event.icon}</div>
        <div className="container event-hero__inner">
          <nav className="breadcrumb">
            <Link to="/">Home</Link><span className="sep">»</span>
            <Link to="/happenings/events">Events &amp; Fests</Link><span className="sep">»</span>
            <span>{event.title}</span>
          </nav>
          <span className={`ev-badge ${isFest ? 'ev-badge--fest' : 'ev-badge--event'}`}>
            {isFest ? '🎉 Fest' : '📅 Event'}
          </span>
          <h1>{event.title}</h1>
          <p className="event-hero__tagline">{event.tagline}</p>
          <div className="event-hero__meta">
            <span>🗓️ {prettyDate(event.date)}</span>
            <span>⏰ {event.time}</span>
            <span>📍 {event.venue}</span>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="event-detail">
          {/* Info column */}
          <div className="event-detail__main reveal">
            <h2>About the {event.type}</h2>
            {event.about.map((p, i) => <p key={i}>{p}</p>)}

            <h3>Highlights</h3>
            <ul className="ticks">
              {event.highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>

            <h3>Schedule</h3>
            <div className="schedule">
              {event.schedule.map(([time, item], i) => (
                <div className="schedule__row" key={i}>
                  <span className="schedule__time">{time}</span>
                  <span className="schedule__item">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky registration card */}
          <aside className="event-detail__side">
            <div className="reg-card reveal">
              <div className="reg-card__cover" style={{ background: cover }}>
                <span>{event.icon}</span>
              </div>
              <div className="reg-card__body">
                <div className="reg-card__row"><span>🗓️ Date</span><b>{new Date(event.date).getDate()} {MONTHS[new Date(event.date).getMonth()].slice(0,3)} {new Date(event.date).getFullYear()}</b></div>
                <div className="reg-card__row"><span>📍 Venue</span><b>{event.venue}</b></div>
                <div className="reg-card__row"><span>🎫 Fee</span><b>{event.fee}</b></div>
                <div className="reg-card__row"><span>✅ Status</span><b style={{ color: '#16a34a' }}>Registration Open</b></div>
                <button className={`btn ${isFest ? 'btn--gold' : 'btn--primary'}`} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => setShowReg(true)}>
                  Register Now
                </button>
                <p className="reg-card__note">
                  Coordinator: {event.coordinator.name}<br />
                  📞 {event.coordinator.phone}
                </p>
              </div>
            </div>
            <Link to="/happenings/events" className="event-detail__back">← Back to all events</Link>
          </aside>
        </div>
      </div>

      {showReg && <EventRegisterModal event={event} onClose={() => setShowReg(false)} />}
    </>
  )
}
