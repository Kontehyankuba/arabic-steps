# Arabic Journey — audio, recitation and speaking practice

Everything in this upgrade is free. There is no subscription, no paid API, no
credit card and no AI service. The only optional step is registering a free
Quran Foundation API key, and the app works without it.

## What needs no setup at all

| Feature | How it works | Cost |
| --- | --- | --- |
| Letters, vowels, words, sentences read aloud | Browser `speechSynthesis` (Web Speech API) — runs on the device | Free, no account |
| Slow / normal speed, Play / Pause / Repeat | Same browser API, one shared player | Free, no account |
| Speaking practice | Browser `SpeechRecognition` (Web Speech API) | Free, no account |
| Verse-by-verse recitation | Mishary Rashid Alafasy, 128 kbps, from `cdn.islamic.network` (QuranicAudio) | Free, no account |
| Progress, streaks, 15-minute plan | `localStorage` on your device | Free |

## Feature 1 — Arabic text-to-speech

- Play, Pause, Resume and Repeat, plus a Slow/Normal toggle that is remembered
  for the whole app (one shared engine, so two lines never speak at once).
- The voice picker prefers `ar-SA`, then any other Arabic voice (`ar-EG`,
  `ar-XX`), then a default voice.
- If no Arabic voice is installed, a note explains how to add one:
  - **iPhone/iPad:** Settings → Accessibility → Spoken Content → Voices →
    Arabic → download a voice.
  - **Android:** Settings → System → Languages → Text-to-speech output →
    install a voice.
  - **Desktop Chrome/Edge:** usually ships an Arabic voice already; otherwise
    install the language pack in the OS.
- Speech synthesis needs no permission and no network.

## Feature 3 — Speaking practice (text match, not pronunciation scoring)

- Microphone button, listening indicator, live transcript, target phrase and a
  Retry button.
- Recognition language is Arabic (`ar-SA`, falling back to `ar-EG`).
- The comparison ignores harmless differences: extra spaces, punctuation,
  vowel marks (ḥarakāt), tatweel and the common alef / yāʾ / tāʾ marbūṭa
  spelling variants.
- The result is clearly labelled as a **text match**, not a judgement of
  pronunciation, accent or tajweed.
- If speech recognition is unavailable (Firefox, older browsers, no
  microphone), a **self-check** option still records the attempt.
- Microphone denial shows a plain message with the browser-specific fix and
  leaves the self-check path available.

Browser support for recognition: Chrome, Edge and Safari 14.5+ (iPhone and
desktop). It requires HTTPS — the deployed URL is HTTPS, and so is
`localhost` during development.

## Feature 2 — Quran recitation

Two sources, both authentic recordings. The app never synthesises Quran audio
and never speaks Quran text with the TTS voice.

### Default source (no key): QuranicAudio / Islamic Network CDN

`https://cdn.islamic.network/quran/audio/128/ar.alafasy/<globalAyah>.mp3`

`globalAyah` is the Quran-wide verse number (1–6236) stored with each verse in
`src/data/quran.ts`. The backend converts a surah + ayah pair to that number
from its own verse counts, so the frontend never guesses.

### Optional source: Quran Foundation APIs (free)

1. Create a free account at <https://api-docs.quran.foundation/> and request
   API access for a non-commercial app.
2. You receive a **client ID** and **client secret**.
3. In AppJet: **Settings → Environment variables**, add
   - `QURAN_CLIENT_ID`
   - `QURAN_CLIENT_SECRET`
4. Redeploy. `server.mjs` requests an OAuth token server-side, then fetches
   verse text, translations and audio from the Content API.

The credentials are read only in `server.mjs`. They are never sent to the
browser and never appear in frontend code. The browser only calls this app's
own endpoints:

- `GET /api/quran/surah/:chapter` → verses for a surah, `source` is
  `"quran-foundation"` or `"quranic-audio"`.
- `GET /api/quran/health` → whether the API credentials are configured.

If the key is missing, invalid or the API is unreachable, the app falls back to
the key-less CDN and says so in the interface. If a verse cannot be played, an
honest message appears instead of a fabricated recitation.

## Feature 4 — Progress tracking

The existing storage key (`arabicJourney.progress.v1`) gained three fields:

- `audioExercises` / `audioPlays` — lines heard to the end (pausing and
  repeating is free).
- `vocabReviews` — flashcards reviewed.
- `speakingResults` — each speaking attempt with phrase id, text-match score,
  date and whether it was a manual self-check.

Streaks, minutes and the 15-minute plan are unchanged, and imported backups
keep the new fields.

## How to test

1. `npm install`, then `npm test` (unit tests for text matching, the
   recitation queue, voice selection and progress) and `npm run build`.
2. `npm run dev`, open the app on a desktop browser:
   - Letters → tap a letter → Play, then Pause, then Repeat, then Slow.
   - Vowels → play a ḥarakah example.
   - Vocabulary → play a card, mark it known; Progress shows cards reviewed.
   - Speak → tap the microphone, allow it, say the phrase; try Retry; then
     block the microphone in the browser and confirm the message and the
     self-check button.
   - Quran → pick Al-Fatihah, play verse 1, set repeat to 2×, confirm the
     verse highlights and playback advances.
   - Progress → confirm audio exercises, listens and speaking tries are counted
     and survive a reload.
3. iPhone Safari: same steps. Speech synthesis requires a user tap (the app
   only speaks from a tap). If no Arabic voice is installed, the note appears
   and everything else keeps working.

## Publishing for free

1. Push to GitHub (AppJet already saves every change to your branch).
2. Deploy from AppJet — the Free plan covers this app: 1 GB RAM, 1 vCPU,
   unlimited traffic, no credit card.
3. The container runs `node server.mjs`, which serves the built `dist/` folder
   and the two `/api/quran/*` endpoints on port 3000.
4. A custom domain is a paid feature (Starter $5/month). The free
   `*.dev.ap-jt.com` URL works everywhere, including iPhone Safari.

## Limitations worth knowing

- TTS voice quality depends on the voices installed on the device; the app
  cannot install them for you.
- Speech recognition is a text matcher. It cannot judge tajweed or
  pronunciation accuracy — a teacher is still the best guide.
- The browser stops speech when the screen locks on iOS; tap Play again.
