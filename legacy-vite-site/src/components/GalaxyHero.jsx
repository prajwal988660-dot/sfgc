import { Link } from 'react-router-dom'

// Official SFGC landing hero — the campus photograph behind a giant translucent
// "SFGC" wordmark. The floating glass navigation lives in the shared <GlassNav>
// (rendered by Layout), so this component is just the hero canvas + copy.

const CAMPUS_IMG = `${import.meta.env.BASE_URL}clg.webp`

export default function GalaxyHero() {
  const scrollDown = () => {
    document.getElementById('welcome')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="ghero">
      {/* Campus photo backdrop */}
      <div className="ghero__scene" aria-hidden="true">
        <img className="ghero__photo" src={CAMPUS_IMG} alt="" />
        <div className="ghero__overlay" />
      </div>

      {/* Hero copy */}
      <div className="ghero__content">
        <p className="ghero__eyebrow">Seshadripuram First Grade College</p>
        <h1 className="ghero__wordmark">SFGC</h1>
        <div className="ghero__taglines">
          <span>Value-based education since 1930</span>
          <span>NAAC A+ · Your future starts here</span>
        </div>
        <div className="ghero__actions">
          <Link to="/admission" className="btn btn--gold">Apply for Admission</Link>
          <Link to="/about/overview" className="btn btn--ghost">Explore SFGC</Link>
        </div>
      </div>

      <button className="ghero__scroll" onClick={scrollDown} aria-label="Scroll to content">
        <span>Discover more</span>
        <i />
      </button>
    </section>
  )
}
