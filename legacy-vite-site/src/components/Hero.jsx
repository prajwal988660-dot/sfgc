import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SLIDES } from '../data/home.js'

export default function Hero() {
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)
  const n = SLIDES.length

  const go = (i) => setIdx((i + n) % n)
  const next = () => go(idx + 1)
  const prev = () => go(idx - 1)

  useEffect(() => {
    timer.current = setInterval(() => setIdx((v) => (v + 1) % n), 5500)
    return () => clearInterval(timer.current)
  }, [n])

  const pause = () => clearInterval(timer.current)
  const resume = () => {
    clearInterval(timer.current)
    timer.current = setInterval(() => setIdx((v) => (v + 1) % n), 5500)
  }

  return (
    <section className="hero" onMouseEnter={pause} onMouseLeave={resume} aria-roledescription="carousel">
      <div className="hero__aurora" aria-hidden="true" />
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`hero__slide ${i === idx ? 'active' : ''}`}
          style={{ '--slide-accent': s.accent }}
          aria-hidden={i !== idx}
        >
          <div className="hero__content">
            <span className="hero__tag">{s.tag}</span>
            <h2 className="hero__title">{s.title}</h2>
            <p className="hero__caption">“{s.caption}”</p>
            <div className="hero__actions">
              <Link to="/admission" className="btn btn--gold">Apply for Admission</Link>
              <Link to="/about/overview" className="btn btn--ghost">Explore SFGC</Link>
            </div>
          </div>
        </div>
      ))}

      <button className="hero__ctrl hero__ctrl--prev" onClick={prev} aria-label="Previous slide">‹</button>
      <button className="hero__ctrl hero__ctrl--next" onClick={next} aria-label="Next slide">›</button>

      <div className="hero__dots" role="tablist">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero__dot ${i === idx ? 'active' : ''}`}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-selected={i === idx}
          />
        ))}
      </div>
    </section>
  )
}
