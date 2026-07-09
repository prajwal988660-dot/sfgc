import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NAV } from '../data/nav.js'

export default function MobileNav({ open, onClose }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className={`mobile-nav ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="mobile-nav__panel" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-nav__head">
          <h3>Menu</h3>
          <button className="mobile-nav__close" onClick={onClose} aria-label="Close menu">×</button>
        </div>
        {NAV.map((section, idx) => (
          <div key={section.slug} className={`m-acc ${expanded === idx ? 'open' : ''}`}>
            <button
              className="m-acc__top"
              onClick={() => setExpanded(expanded === idx ? null : idx)}
            >
              {section.label}
              <span className="chev">▾</span>
            </button>
            <div className="m-acc__sub">
              {section.children.map((child) => (
                <Link key={child.slug} to={`/${child.slug}`} onClick={onClose}>
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div className="m-acc">
          <Link to="/student" className="m-acc__top" onClick={onClose} style={{ display: 'block', color: 'var(--purple-700)' }}>
            🎓 Student Portal
          </Link>
        </div>
        <div className="m-acc">
          <Link to="/contact" className="m-acc__top" onClick={onClose} style={{ display: 'block' }}>
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
