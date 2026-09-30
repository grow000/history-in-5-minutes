import { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation, useParams } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Events from './pages/Events.jsx'
import EventPage from './pages/EventPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import Learn from './pages/Learn.jsx'
import CoursePage from './pages/CoursePage.jsx'
import TopicPage from './pages/TopicPage.jsx'
import TopicQuizPage from './pages/TopicQuizPage.jsx'
import ExamHub from './pages/ExamHub.jsx'
import ExamPractice from './pages/ExamPractice.jsx'
import Sources from './pages/Sources.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

// key={id} сбрасывает состояние страницы при переходе к другой теме/событию
function withId(Component) {
  return function Routed() {
    const { id } = useParams()
    return <Component key={id} id={id} />
  }
}

const EventRoute = withId(EventPage)
const QuizRoute = withId(QuizPage)
const CourseRoute = withId(CoursePage)
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
          <Route path="/learn/:id" element={<CourseRoute />} />
          <Route path="/topic/:id" element={<TopicRoute />} />
          <Route path="/topic/:id/quiz" element={<TopicQuizRoute />} />
          <Route path="/exam" element={<ExamHub />} />
          <Route path="/exam/practice" element={<ExamPractice />} />
          <Route path="/events" element={<Events />} />
          <Route path="/event/:id" element={<EventRoute />} />
          <Route path="/event/:id/quiz" element={<QuizRoute />} />
          <Route path="/sources" element={<Sources />} />
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
