import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { NAV } from '../data/nav.js'

// Site-wide floating glass navigation pill — the shared "template" nav used on
// every page. Transparent over the home hero (overlay), solid dark elsewhere.
// A Menu button opens a full-screen glass overlay exposing the complete site map
// so the deep navigation from the old mega-menu is preserved.

const PRIMARY = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about/overview' },
  { label: 'Courses', to: '/courses/overview' },
  { label: 'Admission', to: '/admission' },
  { label: 'Campus', to: '/facilities/overview' },
  { label: 'Contact', to: '/contact' },
]

function Pinwheel() {
  const petal = 'M24 24 C18 13 20 5 24 3 C28 5 30 13 24 24 Z'
  return (
    <svg className="gnav__logo" viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="gnav-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <g fill="url(#gnav-logo)">
        <path d={petal} />
        <path d={petal} transform="rotate(90 24 24)" />
        <path d={petal} transform="rotate(180 24 24)" />
        <path d={petal} transform="rotate(270 24 24)" />
      </g>
      <circle cx="24" cy="24" r="3.2" fill="#fff" />
    </svg>
  )
}

export default function GlassNav({ overlay = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const solid = !overlay || scrolled

  return (
    <>
      <nav className={`gnav ${solid ? 'is-solid' : ''}`} aria-label="Primary">
        <Link to="/" className="gnav__brand" onClick={() => setMenuOpen(false)}>
          <Pinwheel />
          <span>SFGC</span>
        </Link>
        <ul className="gnav__links">
          {PRIMARY.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.to === '/'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <Link to="/contact" className="gnav__getin">Get in touch</Link>
        <button
          className="gnav__menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Open full menu"
          aria-expanded={menuOpen}
        >
          <span className="gnav__bars"><span /><span /><span /></span>
          <em>Menu</em>
        </button>
      </nav>

      {menuOpen && (
        <div className="gnav-menu" role="dialog" aria-modal="true" aria-label="Site menu">
          <div className="gnav-menu__bar">
            <Link to="/" className="gnav__brand" onClick={() => setMenuOpen(false)}>
              <Pinwheel />
              <span>SFGC</span>
            </Link>
            <button className="gnav-menu__close" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>
          </div>

          <div className="gnav-menu__scroll">
            <div className="gnav-menu__grid">
              {NAV.map((section) => (
                <div className="gnav-menu__col" key={section.slug}>
                  <h4>{section.label}</h4>
                  {section.children.slice(0, 8).map((c) => (
                    <Link key={c.slug} to={`/${c.slug}`} onClick={() => setMenuOpen(false)}>{c.label}</Link>
                  ))}
                  {section.children.length > 8 && (
                    <Link className="gnav-menu__more" to={`/${section.children[0].slug}`} onClick={() => setMenuOpen(false)}>
                      View all →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="gnav-menu__foot">
            <Link to="/student" className="btn btn--outline" onClick={() => setMenuOpen(false)}>🎓 Student Portal</Link>
            <Link to="/admission" className="btn btn--gold" onClick={() => setMenuOpen(false)}>Apply Now</Link>
          </div>
        </div>
      )}
    </>
  )
}
