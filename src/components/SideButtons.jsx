import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function SideButtons() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="side-buttons">
      <Link to="/happenings/news" className="side-btn side-btn--qb">QUESTION BANK</Link>
      <Link to="/alumni/registration" className="side-btn side-btn--alumni">ALUMNI REGISTRATION</Link>
      {showTop && (
        <button
          className="side-btn side-btn--top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >↑</button>
      )}
    </div>
  )
}
