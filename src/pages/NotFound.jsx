import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <>
      <div className="page-hero">
        <div className="container page-hero__inner">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">»</span>
            <span>Error Page</span>
          </nav>
          <h1>404 — Page Not Found</h1>
        </div>
      </div>
      <section className="section">
        <div className="container text-center">
          <div style={{ fontSize: '5rem' }}>🔍</div>
          <h2>The requested resource could not be found</h2>
          <p style={{ color: 'var(--ink-soft)', maxWidth: 520, margin: '0 auto 24px' }}>
            Please verify the address and try again, or head back to the homepage.
          </p>
          <Link to="/" className="btn btn--primary">← Back to Home</Link>
        </div>
      </section>
    </>
  )
}
