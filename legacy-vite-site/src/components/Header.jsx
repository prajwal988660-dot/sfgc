import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { NAV } from '../data/nav.js'
import { COLLEGE } from '../data/home.js'
import MobileNav from './MobileNav.jsx'

export default function Header() {
  const [openIdx, setOpenIdx] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  // Right-aligned dropdowns for the last few menus so they don't overflow.
  const rightAlign = (idx) => idx >= NAV.length - 3

  return (
    <header className="header">
      <div className="container">
        <div className="header__main">
          <Link to="/" className="brand" aria-label="SFGC home">
            <span className="brand__logo">S</span>
            <span className="brand__text">
              <h1>Seshadripuram First Grade College</h1>
              <span className="loc">{COLLEGE.location}</span>
              <span className="accred">
                {COLLEGE.affiliation}
              </span>
            </span>
          </Link>

          <div className="header__badges">
            <span className="badge badge--naac">NAAC A+</span>
            <span className="badge badge--iso">ISO 9001:2015</span>
            <Link to="/admission" className="btn btn--gold" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
              Apply Now
            </Link>
          </div>

          <button
            className={`hamburger ${mobileOpen ? 'open' : ''}`}
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <nav className="nav" aria-label="Primary">
        <div className="container">
          <ul className="nav__inner desktop">
            {NAV.map((section, idx) => (
              <li
                key={section.slug}
                className={`nav__item ${openIdx === idx ? 'open' : ''}`}
                onMouseEnter={() => setOpenIdx(idx)}
                onMouseLeave={() => setOpenIdx(null)}
              >
                <div
                  className="nav__link"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/${section.children[0].slug}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/${section.children[0].slug}`)}
                >
                  {section.label}
                  <span className="chev">▾</span>
                </div>
                <div className={`mega ${rightAlign(idx) ? 'mega--right' : ''}`}>
                  {section.children.map((child) => (
                    <Link key={child.slug} to={`/${child.slug}`} onClick={() => setOpenIdx(null)}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
            <li className="nav__item">
              <NavLink
                to="/student"
                className={({ isActive }) => `nav__link nav__link--att ${isActive ? 'open' : ''}`}
                onClick={() => setOpenIdx(null)}
              >
                <span className="att-dot">🎓</span> Student Portal
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  )
}
