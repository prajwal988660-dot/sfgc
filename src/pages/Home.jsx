import { useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import CountUp from '../components/CountUp.jsx'
import useScrollReveal from '../components/useScrollReveal.js'
import { useEvents, byDate } from '../store/EventsContext.jsx'
import {
  IMPORTANT_LINKS, WELCOME, STATS, COURSES, PRINCIPAL,
  NEWS, RECRUITERS,
} from '../data/home.js'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
function fmt(dateStr) {
  const d = new Date(dateStr)
  return { d: d.getDate(), m: MONTHS[d.getMonth()] }
}

export default function Home() {
  const [tab, setTab] = useState('ug')
  const { events } = useEvents()
  const upcomingEvents = [...events].sort(byDate).slice(0, 4)
  useScrollReveal([tab])

  return (
    <>
      <Hero />

      {/* Announcement marquee */}
      <div className="marquee-strip">
        <div className="marquee-strip__inner">
          <span><b>Admissions 2026–27 Open</b> — Apply now for UG & PG programmes</span>
          <span><b>NAAC A+</b> Accredited Institution</span>
          <span><b>State Award 2025</b> — Best NSS Unit, Karnataka</span>
          <span><b>Placements</b> — Amazon, Deloitte, TCS & more on campus</span>
          <span><b>Admissions 2026–27 Open</b> — Apply now for UG & PG programmes</span>
          <span><b>NAAC A+</b> Accredited Institution</span>
          <span><b>State Award 2025</b> — Best NSS Unit, Karnataka</span>
          <span><b>Placements</b> — Amazon, Deloitte, TCS & more on campus</span>
        </div>
      </div>

      {/* Intro + Important links */}
      <section className="section">
        <div className="container">
          <div className="intro-grid">
            <aside className="quicklinks reveal">
              <h3>Important Links</h3>
              {IMPORTANT_LINKS.map((l) => (
                <Link key={l.to} to={l.to}>{l.label}</Link>
              ))}
            </aside>
            <div className="intro-body reveal">
              <span className="eyebrow">Welcome to SFGC</span>
              <h2>Shaping dynamic leaders through value-based education</h2>
              {WELCOME.map((p, i) => <p key={i}>{p}</p>)}
              <div className="stats">
                {STATS.map((s) => (
                  <div key={s.label} className="stat">
                    <div className="stat__value">
                      <CountUp value={s.value} suffix={s.suffix} />
                    </div>
                    <div className="stat__label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="section section--alt">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Academics</span>
            <h2>Courses Offered</h2>
            <p>Industry-aligned undergraduate and postgraduate programmes across Commerce, Management, Science and Computer Applications.</p>
          </div>
          <div className="tabs reveal">
            <button className={`tab ${tab === 'ug' ? 'active' : ''}`} onClick={() => setTab('ug')}>UG Programmes</button>
            <button className={`tab ${tab === 'pg' ? 'active' : ''}`} onClick={() => setTab('pg')}>PG Programmes</button>
          </div>
          <div className="course-grid">
            {COURSES[tab].map((c) => (
              <div key={c.slug} className="card course-card reveal">
                <div className="course-card__icon">{c.icon}</div>
                <div className="course-card__code">{c.code}</div>
                <div className="course-card__name">{c.name}</div>
                <Link to={`/${c.slug}`} className="course-card__link">Learn more</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News & Events */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Stay Updated</span>
            <h2>News &amp; Events</h2>
          </div>
          <div className="ne-grid">
            <div className="panel panel--news reveal">
              <div className="panel__head">
                <h3>📢 Latest News</h3>
                <Link to="/happenings/news">View all →</Link>
              </div>
              <div className="panel__list">
                {NEWS.map((item, i) => {
                  const f = fmt(item.date)
                  return (
                    <div className="ne-item" key={i}>
                      <div className="ne-date"><div className="d">{f.d}</div><div className="m">{f.m}</div></div>
                      <div><div className="ne-item__title">{item.title}</div></div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="panel panel--events reveal">
              <div className="panel__head">
                <h3>🗓️ Upcoming Events</h3>
                <Link to="/happenings/events">View all →</Link>
              </div>
              <div className="panel__list">
                {upcomingEvents.map((item, i) => {
                  const f = fmt(item.date)
                  return (
                    <div className="ne-item" key={i}>
                      <div className="ne-date"><div className="d">{f.d}</div><div className="m">{f.m}</div></div>
                      <div className="ne-item__main">
                        <Link to={`/happenings/events/${item.id}`} className="ne-item__title" style={{ color: 'inherit' }}>{item.title}</Link>
                        <div className="ne-item__venue">
                          <span className={`ev-badge ${item.type === 'Fest' ? 'ev-badge--fest' : 'ev-badge--event'}`}>{item.type}</span>
                          {' '}📍 {item.venue}
                        </div>
                      </div>
                      <Link
                        to={`/happenings/events/${item.id}`}
                        className={`ne-register ${item.type === 'Fest' ? 'ne-register--fest' : ''}`}
                      >
                        More Info
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principal's Desk */}
      <section className="section section--tint">
        <div className="container">
          <div className="principal">
            <div className="principal__photo reveal">
              <span className="avatar">👨‍🏫</span>
              <div className="plabel">
                <div className="n">{PRINCIPAL.name}</div>
                <div className="t">{PRINCIPAL.title}</div>
              </div>
            </div>
            <div className="principal__body reveal">
              <span className="eyebrow">Principal's Desk</span>
              <div className="quote-mark">”</div>
              <p>{PRINCIPAL.message}</p>
              <Link to="/about/principal-desk" className="btn btn--outline">Read Full Message</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recruiters */}
      <section className="section section--alt">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Placements</span>
            <h2>Our Recruiters</h2>
            <p>Our students are placed with leading organisations across sectors.</p>
          </div>
        </div>
        <div className="recruiters">
          <div className="recruiters__track">
            {[...RECRUITERS, ...RECRUITERS].map((r, i) => (
              <div className="recruiter-chip" key={i}>{r}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingBottom: 90 }}>
        <div className="container">
          <div className="page-cta reveal">
            <div>
              <h3>Begin your journey at SFGC</h3>
              <p>Admissions for 2026–27 are now open across all UG &amp; PG programmes.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/admission" className="btn btn--gold">Apply Now</Link>
              <Link to="/contact" className="btn btn--ghost">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
