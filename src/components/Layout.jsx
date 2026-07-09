import TopBar from './TopBar.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import SideButtons from './SideButtons.jsx'

export default function Layout({ children }) {
  return (
    <>
      <TopBar />
      <Header />
      <main>{children}</main>
      <SideButtons />
      <Footer />
    </>
  )
}
