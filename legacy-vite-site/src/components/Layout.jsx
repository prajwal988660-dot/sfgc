import { useLocation } from 'react-router-dom'
import GlassNav from './GlassNav.jsx'
import Footer from './Footer.jsx'
import SideButtons from './SideButtons.jsx'
import Assistant from './Assistant.jsx'

export default function Layout({ children }) {
  // One shared floating glass nav across the whole site. It floats transparently
  // over the full-bleed home hero (overlay) and is solid on every other page,
  // where <main> gets top padding so content clears the fixed pill.
  const isHome = useLocation().pathname === '/'
  return (
    <>
      <GlassNav overlay={isHome} />
      <main className={isHome ? undefined : 'has-glassnav'}>{children}</main>
      <SideButtons />
      <Footer />
      <Assistant />
    </>
  )
}
