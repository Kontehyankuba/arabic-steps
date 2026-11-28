import { useState } from 'react'
import { HARAKAT } from '../data/harakat'
import AudioBar from '../components/AudioBar'
import { useProgress } from '../lib/useProgress'

export default function Harakat() {
  const { state, markLesson } = useProgress()
  const [selectedId, setSelectedId] = useState(HARAKAT[0].id)
  const mark = HARAKAT.find((item) => item.id === selectedId) ?? HARAKAT[0]
  const learned = Boolean(state.lessons.harakat)

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Lesson 2</p>
            <h2>Vowel marks — ḥarakāt</h2>
          </div>
          <span className={`pill ${learned ? 'pill-good' : ''}`}>{learned ? 'Completed ✓' : 'Not yet'}</span>
        </div>
        <p className="muted">
          Arabic letters on their own carry no vowel. Small marks above and below tell you which
          vowel to say. Start with just three: fatḥah (a), kasrah (i), ḍammah (u).
        </p>
        <div className="chips">
          {HARAKAT.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${item.id === mark.id ? 'active' : ''}`}
              onClick={() => setSelectedId(item.id)}
            >
              <span lang="ar" dir="rtl">
                {item.glyph}
              </span>{' '}
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="mark-hero">
          <p className="arabic huge" lang="ar" dir="rtl">
            {mark.demo}
          </p>
          <p className="translit">{mark.demoTranslit}</p>
          <p className="pill">
            {mark.name} · {mark.sound}
          </p>
        </div>
        <p className="arabic-name" lang="ar" dir="rtl">
          {mark.arabicName}
        </p>
        <p>{mark.explanation}</p>

        <AudioBar
          text={mark.demo}
          exerciseId={`haraka-${mark.id}`}
          label={`the sound of ${mark.name}`}
        />

        <div className="example-box">
          <p className="arabic" lang="ar" dir="rtl">
            {mark.example.word}
          </p>
          <p className="translit">{mark.example.translit}</p>
          <p className="meaning">{mark.example.meaning}</p>
        </div>

        <AudioBar
          text={mark.example.word}
          exerciseId={`haraka-example-${mark.id}`}
          label={`the example word for ${mark.name}`}
          compact
        />

        <div className="actions center">
          <button
            type="button"
            className="btn ghost"
            onClick={() => markLesson('harakat')}
            disabled={learned}
          >
            {learned ? 'Lesson complete ✓' : 'Mark lesson complete'}
          </button>
        </div>
      </section>

      <section className="card">
        <h3>All the marks at a glance</h3>
        <div className="mark-grid">
          {HARAKAT.map((item) => (
            <button
              key={item.id}
              type="button"
              className="mark-cell"
              onClick={() => setSelectedId(item.id)}
            >
              <span className="glyph" lang="ar" dir="rtl">
                {item.glyph}
              </span>
              <span className="tile-name">{item.name}</span>
              <span className="small muted">{item.sound}</span>
            </button>
          ))}
        </div>
        <p className="small muted">
          Practise slowly: read the letter, add the vowel, then say the whole syllable. Repeat three
          times before moving on.
        </p>
      </section>
    </div>
  )
}
