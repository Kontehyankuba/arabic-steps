import { useState } from 'react'
import { useProgress } from './lib/useProgress'
import type { TabId } from './data/plan'
import Today from './views/Today'
import Letters from './views/Letters'
import Harakat from './views/Harakat'
import Quran from './views/Quran'
import Flashcards from './views/Flashcards'
import QuizView from './views/QuizView'
import Speak from './views/Speak'
import Progress from './views/Progress'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'today', label: 'Today', emoji: '☀️' },
  { id: 'letters', label: 'Letters', emoji: '🔤' },
  { id: 'harakat', label: 'Vowels', emoji: 'ـَ' },
  { id: 'quran', label: 'Quran', emoji: '📖' },
  { id: 'words', label: 'Words', emoji: '🃏' },
  { id: 'quiz', label: 'Quiz', emoji: '✅' },
  { id: 'speak', label: 'Speak', emoji: '🎙️' },
  { id: 'progress', label: 'Progress', emoji: '📊' },
]

export default function App() {
  const [tab, setTab] = useState<TabId>('today')
  const { stats, storageOk } = useProgress()

  function navigate(next: TabId) {
    setTab(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="wrap header-inner">
          <div>
            <p className="eyebrow">Arabic Journey</p>
            <h1>Learn Arabic &amp; Quran reading</h1>
            <p className="tagline">15 quiet minutes a day · free · no account needed</p>
          </div>
          <div className="streak-chip" aria-label={`Current streak: ${stats.streak} days`}>
            <strong>{stats.streak}</strong>
            <span>{stats.streak === 1 ? 'day streak' : 'day streak'} 🔥</span>
          </div>
        </div>
      </header>

      <nav className="tabbar" aria-label="Sections">
        <div className="wrap tabbar-inner">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tab ${tab === item.id ? 'active' : ''}`}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              <span aria-hidden="true">{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="wrap" id="main">
        {!storageOk && (
          <p className="banner warn" role="status">
            This browser is blocking local storage, so progress cannot be saved. Turn off private
            browsing, or use “Export backup” in Progress to keep your work.
          </p>
        )}

        {tab === 'today' && <Today onNavigate={navigate} />}
        {tab === 'letters' && <Letters />}
        {tab === 'harakat' && <Harakat />}
        {tab === 'quran' && <Quran />}
        {tab === 'words' && <Flashcards onNavigate={navigate} />}
        {tab === 'quiz' && <QuizView />}
        {tab === 'speak' && <Speak />}
        {tab === 'progress' && <Progress />}
      </main>

      <footer className="app-footer wrap">
        <p>
          Made for slow, careful reading. Your progress stays on this device unless you export a
          backup. Audio uses free browser voices and a free Quran recitation CDN.
        </p>
      </footer>
    </div>
  )
}
