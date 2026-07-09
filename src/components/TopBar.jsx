import { COLLEGE } from '../data/home.js'

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="container">
        <div className="topbar__contact">
          <span>✉️ <a href={`mailto:${COLLEGE.email}`}>{COLLEGE.email}</a></span>
          <span>📞 <a href={`tel:${COLLEGE.phone}`}>{COLLEGE.phone}</a></span>
        </div>
        <div className="topbar__links">
          <a href="#" title="Student Research Foundation">SRF</a>
          <a href="#" title="National Institutional Ranking Framework">NIRF</a>
          <a href="#" title="Student Satisfaction Survey">SSS</a>
          <a href="#" title="National Academic Depository">NAD</a>
        </div>
      </div>
    </div>
  )
}
