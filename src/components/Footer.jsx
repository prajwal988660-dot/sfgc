import { Link } from 'react-router-dom'
import { COLLEGE } from '../data/home.js'

const COLS = [
  {
    title: 'About Us',
    links: [
      ['An Overview', '/about/overview'],
      ['Vision & Mission', '/about/vision-mission'],
      ["Principal's Desk", '/about/principal-desk'],
      ['Governing Council', '/about/governing-council'],
      ['IQAC', '/about/iqac'],
      ['NIRF', '/about/nirf'],
    ],
  },
  {
    title: 'Activities',
    links: [
      ['NSS', '/activities/nss'],
      ['NCC', '/activities/ncc'],
      ['Cultural Activities', '/activities/cultural'],
      ['Youth Red Cross', '/activities/yrc'],
      ['Eco Watch', '/activities/eco-watch'],
      ['Clubs & Forums', '/activities/clubs'],
    ],
  },
  {
    title: 'Sports',
    links: [
      ['An Overview', '/sports/overview'],
      ['Activities', '/sports/activities'],
      ['Achievements', '/sports/achievements'],
    ],
  },
  {
    title: 'Important Links',
    links: [
      ['Admission', '/admission'],
      ['Career & Placements', '/students/placements'],
      ['Photo Gallery', '/happenings/gallery'],
      ['Latest News', '/happenings/news'],
      ['Contact Us', '/contact'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <span className="brand__logo">S</span>
            <h4>Seshadripuram First Grade College</h4>
            <p>
              {COLLEGE.accreditation} · {COLLEGE.iso}. A prominent landmark of value-based
              education in {COLLEGE.location}, part of the {COLLEGE.trust}.
            </p>
            <div className="footer__contact">
              <div>📍 New Town, Yelahanka, Doddaballapur–Bengaluru Highway, Bengaluru</div>
              <div>✉️ <a href={`mailto:${COLLEGE.email}`} style={{ color: '#f4c430' }}>{COLLEGE.email}</a></div>
              <div>📞 <a href={`tel:${COLLEGE.phone}`} style={{ color: '#f4c430' }}>{COLLEGE.phone}</a></div>
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.title} className="footer__col">
              <h5>{col.title}</h5>
              {col.links.map(([label, to]) => (
                <Link key={to + label} to={to}>{label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <span>© {new Date().getFullYear()} Seshadripuram First Grade College. All Rights Reserved.</span>
          <span>An inspired redesign · Built with React + Vite · <Link to="/teacher" style={{ color: '#f4c430' }}>Faculty</Link> · <Link to="/admin" style={{ color: '#f4c430' }}>Admin</Link></span>
        </div>
      </div>
    </footer>
  )
}
