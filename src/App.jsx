import { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation, useParams } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import EventPage from './pages/EventPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

// key={id} сбрасывает состояние страницы при переходе к другому событию
function EventRoute() {
  const { id } = useParams()
  return <EventPage key={id} id={id} />
}

function QuizRoute() {
  const { id } = useParams()
  return <QuizPage key={id} id={id} />
}

function Layout() {
  const location = useLocation()
  return (
    <>
      <ScrollToTop />
      <a className="skip-link" href="#main">К содержимому</a>
      <Header />
      <main id="main" className="page" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/event/:id" element={<EventRoute />} />
          <Route path="/event/:id/quiz" element={<QuizRoute />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  )
}
