import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ROUTES, sectionMenu } from '../data/nav.js'
import { useEvents, byDate } from '../store/EventsContext.jsx'
import useScrollReveal from '../components/useScrollReveal.js'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export default function EventsPage() {
  const slug = 'happenings/events'
  const meta = ROUTES[slug]
  const menu = sectionMenu(meta.section)
  const { events } = useEvents()
  const [filter, setFilter] = useState('all')
  useScrollReveal([filter, events.length])

  const shown = [...events]
    .sort(byDate)
    .filter((e) => filter === 'all' || e.type.toLowerCase() === filter)

  return (
    <>
      <div className="page-hero">
        <div className="container page-hero__inner">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">»</span>
            <Link to={`/${menu[0]?.slug}`}>{meta.sectionLabel}</Link>
            <span className="sep">»</span>
            <span>{meta.label}</span>
          </nav>
          <h1>Latest Events &amp; Fests</h1>
        </div>
      </div>

      <div className="container">
        <div className="page-layout">
          <aside className="sidenav">
            <div className="sidenav__head">{meta.sectionLabel}</div>
            {menu.map((item) => (
              <NavLink key={item.slug} to={`/${item.slug}`} className={({ isActive }) => (isActive ? 'active' : '')}>
                {item.label}
              </NavLink>
            ))}
          </aside>

          <div>
            <p className="lead" style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.3rem', paddingLeft: 20, borderLeft: '4px solid', borderImage: 'var(--grad-brand) 1', marginBottom: 24 }}>
              Register to participate in our upcoming events, guest lectures and inter-collegiate fests.
            </p>

            <div className="tabs" style={{ justifyContent: 'flex-start', marginBottom: 28 }}>
              <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`tab ${filter === 'event' ? 'active' : ''}`} onClick={() => setFilter('event')}>Events</button>
              <button className={`tab ${filter === 'fest' ? 'active' : ''}`} onClick={() => setFilter('fest')}>Fests</button>
            </div>

            <div className="events-list">
              {shown.length === 0 && (
                <div className="att-error" style={{ margin: 0 }}>
                  No {filter === 'all' ? '' : filter} events are scheduled right now. Please check back soon.
                </div>
              )}
              {shown.map((ev) => {
                const d = new Date(ev.date)
                return (
                  <div className="event-card reveal" key={ev.id}>
                    <div className="event-card__date">
                      <div className="d">{d.getDate()}</div>
                      <div className="m">{MONTHS[d.getMonth()]}</div>
                      <div className="y">{d.getFullYear()}</div>
                    </div>
                    <div className="event-card__info">
                      <span className={`ev-badge ${ev.type === 'Fest' ? 'ev-badge--fest' : 'ev-badge--event'}`}>
                        {ev.type === 'Fest' ? '🎉 Fest' : '📅 Event'}
                      </span>
                      <Link to={`/happenings/events/${ev.id}`} style={{ color: 'inherit' }}><h3>{ev.title}</h3></Link>
                      <div className="event-card__tags">
                        <span>📍 {ev.venue}</span>
                        <span>🎫 {ev.fee}</span>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>● Registration Open</span>
                      </div>
                    </div>
                    <div className="event-card__cta">
                      <div className="event-card__actions">
                        <Link to={`/happenings/events/${ev.id}`} className={`btn ${ev.type === 'Fest' ? 'btn--gold' : 'btn--primary'}`}>
                          More Info →
                        </Link>
                        <Link to={`/happenings/events/${ev.id}`} className="btn btn--outline btn--sm">View & Register</Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
