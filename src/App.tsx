import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Architecture from './components/Architecture'
import Performance from './components/Performance'
import AgentMemory from './components/AgentMemory'
import RuntimeState from './components/RuntimeState'
import SDKs from './components/SDKs'
import GetStarted from './components/GetStarted'
import CTA from './components/CTA'
import Footer from './components/Footer'
import FeedbackWidget from './components/FeedbackWidget'
import FeedbackAdmin from './components/FeedbackAdmin'

type Page = 'home' | 'feedback-admin'

function hashToPage(hash: string): Page {
  if (hash === '#/admin/feedback') return 'feedback-admin'
  return 'home'
}

export default function App() {
  const [page, setPage] = useState<Page>(() => hashToPage(window.location.hash))

  useEffect(() => {
    const onHash = () => {
      const next = hashToPage(window.location.hash)
      setPage(next)
      if (next !== 'home') window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (page === 'feedback-admin') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <FeedbackAdmin />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Architecture />
      <Performance />
      <AgentMemory />
      <RuntimeState />
      <SDKs />
      <GetStarted />
      <CTA />
      <Footer />
      <FeedbackWidget />
    </div>
  )
}
