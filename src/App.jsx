import { useEffect } from 'react'
import { HashRouter, Navigate, Routes, Route, useLocation, useParams } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Learn from './pages/Learn.jsx'
import TopicPage from './pages/TopicPage.jsx'
import TopicQuizPage from './pages/TopicQuizPage.jsx'
import ExamHub from './pages/ExamHub.jsx'
import ExamPractice from './pages/ExamPractice.jsx'
import Sources from './pages/Sources.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

// key={id} сбрасывает состояние страницы при переходе к другой теме
function withId(Component) {
  return function Routed() {
    const { id } = useParams()
    return <Component key={id} id={id} />
  }
}

const TopicRoute = withId(TopicPage)
const TopicQuizRoute = withId(TopicQuizPage)

function Layout() {
  const location = useLocation()
  return (
    <>
      <ScrollToTop />
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <Header />
      <main id="main" className="page" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:id" element={<Navigate to="/learn" replace />} />
          <Route path="/topic/:id" element={<TopicRoute />} />
          <Route path="/topic/:id/quiz" element={<TopicQuizRoute />} />
          <Route path="/exam" element={<ExamHub />} />
          <Route path="/exam/practice" element={<ExamPractice />} />
          <Route path="/events" element={<Navigate to="/learn" replace />} />
          <Route path="/event/*" element={<Navigate to="/learn" replace />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/progress" element={<ProgressPage />} />
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
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Layout />
      </HashRouter>
    </MotionConfig>
  )
}
