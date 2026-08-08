import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import InnerPage from './pages/InnerPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import EventDetail from './pages/EventDetail.jsx'
import Attendance from './pages/Attendance.jsx'
import StudentPortal from './pages/StudentPortal.jsx'
import Teacher from './pages/Teacher.jsx'
import Admin from './pages/Admin.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'
import { ROUTES } from './data/nav.js'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname])
  return null
}

export default function App() {
  const slugs = Object.keys(ROUTES)
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/student" element={<StudentPortal />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/happenings/events/:id" element={<EventDetail />} />
        <Route path="/happenings/events" element={<EventsPage />} />
        {slugs
          .filter((slug) => slug !== 'happenings/events')
          .map((slug) => (
            <Route key={slug} path={`/${slug}`} element={<InnerPage slug={slug} />} />
          ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
