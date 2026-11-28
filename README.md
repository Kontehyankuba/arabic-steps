# Arabic Journey · رحلة العربية

A **completely free**, beginner-friendly app for learning to read Arabic and the Quran — built for
someone who reads Arabic slowly. 15 quiet minutes a day, no account, no subscription, no paid API.

> **Status:** working first version. Letters, vowel marks, Quran reading, flashcards, quiz,
> pronunciation practice, the daily plan, streaks and progress saving all work and are tested.

---

## What is in the app

| Section | What you get |
| --- | --- |
| **Today** | The 15-minute plan (4 blocks), a built-in timer, "mark today complete" for the streak, and a first-day checklist. |
| **Letters** | All 28 letters. Tap any letter to see **isolated, initial, medial and final** shapes, hear it, and see an example word. "Build a word" shows letter-by-letter how letters join, including the six letters that never join forward (ا د ذ ر ز و). |
| **Vowels** | 9 ḥarakāt (fatḥah, kasrah, ḍammah, sukūn, shaddah, tanwīn ×3, long vowels) each with a pronunciation demo on ب, an explanation, and a real example word. |
| **Quran** | Al-Fātiḥah, Al-Ikhlāṣ, Al-Falaq and An-Nās with fully vowelled Arabic, transliteration, plain-English meaning, and a beginner reading tip for every ayah. One tap plays real **recitation** audio. |
| **Words** | 5 starter flashcards (flip to reveal), "I know this" tracking, and audio for each word. |
| **Quiz** | A 5-question multiple-choice quiz with instant feedback, an explanation, and a saved score. |
| **Speak** | Hear a phrase, then record yourself. The browser's speech recognition compares what you said with the target and gives a score plus a hint. |
| **Progress** | Streak, minutes, lessons completed, quiz scores, words known, a 7-day activity strip, Arabic text-size control, and **export/import backup**. |

Everything is mobile-first: large Arabic type (28–46 px, adjustable), big tap targets, safe-area
padding for iPhone notches, and a tab bar that wraps instead of scrolling off screen.

---

## Run it locally (2 minutes)

```bash
npm install
npm run dev          # http://localhost:5173
```

Other useful commands:

```bash
npm test             # 17 unit tests (content, letter joining, quiz, streak/storage logic)
npm run typecheck    # TypeScript, strict mode
npm run build        # typecheck + production bundle into dist/
npm start            # serve the built app on http://localhost:3000
```

### How to test it yourself

1. **Letters** — tap ب, ي, ت. Each should show four different shapes. Then open "Build a word" and
   pick *bayt*: you should see بـ + ـيـ + ـت and the finished word بَيْتٌ. Try *dār* (دَار) and notice
   that ا does not join to the letter after it.
2. **Vowels** — tap the vowel cards and press "Hear it". Fatḥah on ب should give *ba*.
3. **Quran** — open Al-Fātiḥah and press ▶ on any ayah. Real recitation streams from the free CDN;
   if the network is unavailable the app falls back to the device voice and tells you so.
4. **Words / Quiz** — flip all five cards, then take the quiz. Wrong answers show the correct meaning.
5. **Speak** — press "Record", say the phrase, and check the score. (Speech recognition needs
   Chrome, Edge or Safari 14.1+ and microphone permission; the "Hear it" button always works.)
6. **Progress** — mark today complete on the Today tab, then reload the page. Your streak, lessons,
   quiz score and words known should all still be there. Try "Export backup" too.

### iPhone

Open the deployed URL in Safari, tap **Share → Add to Home Screen**. It launches full-screen like an
app. Progress is stored on the device in `localStorage`; use Progress → Export backup to move it.

---

## Publish it for free

The app is a static site, so any free static host works. Pick one:

**Option A — this workspace (already configured).** `Dockerfile` builds the app and `server.mjs`
serves `dist/` with SPA fallback on `$PORT` (default 3000). Deploying here is the fastest way to get
a shareable URL.

**Option B — GitHub Pages (free, permanent).**

```bash
npm run build
npx gh-pages -d dist        # or push dist/ to a gh-pages branch
```
Set `base: '/<repo-name>/'` in `vite.config.ts` for a project page.

**Option C — Netlify / Cloudflare Pages / Vercel (free tiers).**
Build command `npm run build`, output directory `dist`. No environment variables needed.

### What it costs to run

Nothing. There is no server-side logic, no database, no API key and no analytics. Recitation audio is
streamed from a public CDN, so bandwidth is not billed to you.

---

## Free services and content licensing

- **Progress storage:** the browser's `localStorage` (free, offline, private). Backups are a JSON
  file you download. If you later want multi-device sync, Supabase's free tier or Firebase's free
  Spark plan would slot in behind `src/lib/progress.ts` without touching the views.
- **Arabic pronunciation:** the browser's built-in `speechSynthesis` (`ar-SA`). Free, no key.
- **Speaking practice:** the browser's `SpeechRecognition` / `webkitSpeechRecognition`. Free, no key,
  and it runs in the user's browser.
- **Quran recitation:** [Al Quran Cloud](https://alquran.cloud/api) audio CDN
  (`cdn.islamic.network`), recitation by **Mishary Rashid Alafasy**. Free and key-less. Please review
  the CDN's terms before large-scale public use, and keep the reciter credited (the app does).
- **Quran text:** the Arabic ayah text follows the standard Madinah muṣḥaf orthography.
- **English meanings:** short learner-friendly paraphrases written for this app — *not* a substitute
  for a published translation. For study, pair it with a licensed translation such as
  [Quran.com](https://quran.com) or the free **Saheeh International** text.

If you add content, keep it either your own work, public domain, or explicitly licensed for reuse.

---

## Project layout

```
src/
  data/          letters.ts · harakat.ts · quran.ts · vocab.ts · plan.ts   ← all learning content
  lib/           arabic.ts (joining/normalising) · progress.ts (state, streaks, storage)
                 quiz.ts · audio.ts (speech, recitation, recognition) · useProgress.tsx
  views/         Today · Letters · Harakat · Quran · Flashcards · QuizView · Speak · Progress
  App.tsx        shell + tab navigation
  styles.css     mobile-first design system, large Arabic type
server.mjs       zero-dependency static server for production
Dockerfile       multi-stage Alpine build (Node 26)
```

**Adding content** needs no view changes: add a letter to `src/data/letters.ts`, a mark to
`harakat.ts`, a surah to `quran.ts` (include each ayah's running Quran-wide number in `global` so the
recitation URL resolves), a word to `vocab.ts`, or a lesson to `plan.ts` — the lesson list drives the
progress percentages automatically.

`arabic_steps_app.html` is the original single-file prototype, kept for reference. The app itself is
the Vite project above.
