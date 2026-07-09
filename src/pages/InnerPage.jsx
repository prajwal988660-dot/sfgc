import { Link, NavLink } from 'react-router-dom'
import { ROUTES, sectionMenu } from '../data/nav.js'
import { getPageContent } from '../data/pageContent.js'
import useScrollReveal from '../components/useScrollReveal.js'

export default function InnerPage({ slug }) {
  const meta = ROUTES[slug]
  const content = getPageContent(slug)
  const menu = sectionMenu(meta.section)
  useScrollReveal([slug])

  return (
    <>
      <div className="page-hero">
        <div className="container page-hero__inner">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">»</span>
            <Link to={`/${menu[0]?.slug || meta.section}`}>{meta.sectionLabel}</Link>
            <span className="sep">»</span>
            <span>{meta.label}</span>
          </nav>
          <h1>{meta.label}</h1>
        </div>
      </div>

      <div className="container">
        <div className="page-layout">
          <aside className="sidenav">
            <div className="sidenav__head">{meta.sectionLabel}</div>
            {menu.map((item) => (
              <NavLink
                key={item.slug}
                to={`/${item.slug}`}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {item.label}
              </NavLink>
            ))}
          </aside>

          <article className="prose reveal">
            {content.lead && <p className="lead">{content.lead}</p>}
            {content.body && content.body.map((p, i) => <p key={i}>{p}</p>)}

            {content.highlights && (
              <div className="highlight-grid">
                {content.highlights.map((h, i) => (
                  <div className="highlight" key={i}>
                    <div className="ic">{h.icon}</div>
                    <h4>{h.title}</h4>
                    <p>{h.text}</p>
                  </div>
                ))}
              </div>
            )}

            {content.sections && content.sections.map((sec, i) => (
              <div key={i}>
                <h3>{sec.heading}</h3>
                {sec.body && sec.body.map((p, j) => <p key={j}>{p}</p>)}
                {sec.list && (
                  <ul className="ticks">
                    {sec.list.map((li, j) => <li key={j}>{li}</li>)}
                  </ul>
                )}
              </div>
            ))}

            {content.cta && (
              <div className="page-cta">
                <div>
                  <h3>Ready to apply?</h3>
                  <p>Admissions for 2026–27 are open. Reach out and we'll guide you through.</p>
                </div>
                <Link to="/contact" className="btn btn--gold">Enquire Now</Link>
              </div>
            )}
          </article>
        </div>
      </div>
    </>
  )
}
