import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COLLEGE } from '../data/home.js'
import useScrollReveal from '../components/useScrollReveal.js'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', course: '', message: '' })
  const [sent, setSent] = useState(false)
  useScrollReveal([])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <div className="page-hero">
        <div className="container page-hero__inner">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">»</span>
            <span>Contact Us</span>
          </nav>
          <h1>Contact Us</h1>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <div className="reveal">
              <span className="eyebrow">Get in touch</span>
              <h2>We'd love to hear from you</h2>
              <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
                Have a question about admissions, courses or campus life? Send us a message
                and our team will get back to you.
              </p>

              <div className="contact-card">
                <div className="ic">📍</div>
                <div>
                  <h4>Campus Address</h4>
                  <p>New Town, Yelahanka, Doddaballapur–Bengaluru Highway, Bengaluru — 560064</p>
                </div>
              </div>
              <div className="contact-card">
                <div className="ic">✉️</div>
                <div>
                  <h4>Email</h4>
                  <p><a href={`mailto:${COLLEGE.email}`}>{COLLEGE.email}</a></p>
                </div>
              </div>
              <div className="contact-card">
                <div className="ic">📞</div>
                <div>
                  <h4>Phone</h4>
                  <p><a href={`tel:${COLLEGE.phone}`}>{COLLEGE.phone}</a></p>
                </div>
              </div>

              <div className="map-embed" aria-label="Campus location map">
                <iframe
                  title="SFGC Yelahanka location"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=77.58%2C13.09%2C77.62%2C13.12&layer=mapnik&marker=13.105%2C77.60"
                />
              </div>
            </div>

            <div className="card reveal" style={{ padding: 30 }}>
              <h3>Enquiry Form</h3>
              {sent ? (
                <div className="form-note">
                  ✅ Thank you, {form.name || 'there'}! Your enquiry has been received. Our
                  admissions team will contact you at {form.email || 'your email'} shortly.
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className="form-row">
                    <label>Full Name *</label>
                    <input required value={form.name} onChange={set('name')} placeholder="Your name" />
                  </div>
                  <div className="form-row">
                    <label>Email *</label>
                    <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                  </div>
                  <div className="form-row">
                    <label>Phone</label>
                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 …" />
                  </div>
                  <div className="form-row">
                    <label>Programme of Interest</label>
                    <select value={form.course} onChange={set('course')}>
                      <option value="">Select a programme</option>
                      <optgroup label="Undergraduate">
                        <option>B.Com</option><option>B.Com with BDA</option><option>BCA</option>
                        <option>BBA</option><option>BBA Aviation</option><option>BSc BBG</option><option>BSc EMC</option>
                      </optgroup>
                      <optgroup label="Postgraduate">
                        <option>M.Com</option><option>MCA</option><option>MBA</option><option>Global MBA</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Message</label>
                    <textarea rows="4" value={form.message} onChange={set('message')} placeholder="How can we help?" />
                  </div>
                  <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Send Enquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
