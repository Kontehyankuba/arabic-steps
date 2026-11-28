/** The five starter flashcards, plus the phrase list used by speaking practice. */
export type VocabWord = {
  id: string
  arabic: string
  translit: string
  meaning: string
  hint: string
  emoji: string
  example: { arabic: string; translit: string; meaning: string }
}

export const VOCAB: VocabWord[] = [
  {
    id: 'kitab',
    arabic: 'كِتَابٌ',
    translit: 'kitābun',
    meaning: 'a book',
    hint: 'The long ā in the middle is held for two counts: ki-tā-bun.',
    emoji: '📕',
    example: { arabic: 'هَذَا كِتَابٌ', translit: 'hādhā kitābun', meaning: 'This is a book.' },
  },
  {
    id: 'bayt',
    arabic: 'بَيْتٌ',
    translit: 'baytun',
    meaning: 'a house',
    hint: 'The sukūn on the yāʾ stops it: bayt, one smooth syllable.',
    emoji: '🏠',
    example: { arabic: 'هَذَا بَيْتٌ', translit: 'hādhā baytun', meaning: 'This is a house.' },
  },
  {
    id: 'ma',
    arabic: 'مَاءٌ',
    translit: 'māʾun',
    meaning: 'water',
    hint: 'A long ā, then a small hamzah with two ḍammahs.',
    emoji: '💧',
    example: { arabic: 'أُرِيدُ مَاءً', translit: 'urīdu māʾan', meaning: 'I want water.' },
  },
  {
    id: 'qalam',
    arabic: 'قَلَمٌ',
    translit: 'qalamun',
    meaning: 'a pen',
    hint: 'The qāf is made far back in the throat, deeper than k.',
    emoji: '✏️',
    example: { arabic: 'هَذَا قَلَمٌ', translit: 'hādhā qalamun', meaning: 'This is a pen.' },
  },
  {
    id: 'yad',
    arabic: 'يَدٌ',
    translit: 'yadun',
    meaning: 'a hand',
    hint: 'Two dots below at the start; a plain d in the middle.',
    emoji: '✋',
    example: { arabic: 'هَذِهِ يَدٌ', translit: 'hādhihi yadun', meaning: 'This is a hand.' },
  },
]

export const VOCAB_BY_ID: Record<string, VocabWord> = Object.fromEntries(
  VOCAB.map((word) => [word.id, word]),
)

export type Phrase = {
  id: string
  arabic: string
  translit: string
  meaning: string
  note: string
}

export const PHRASES: Phrase[] = [
  {
    id: 'salam',
    arabic: 'السَّلَامُ عَلَيْكُمْ',
    translit: 'As-salāmu ʿalaykum',
    meaning: 'Peace be upon you.',
    note: 'The everyday greeting. The reply is وَعَلَيْكُمُ السَّلَامُ.',
  },
  {
    id: 'shukran',
    arabic: 'شُكْرًا',
    translit: 'Shukran',
    meaning: 'Thank you.',
    note: 'Ends with two fatḥahs, so it sounds like “shukran”.',
  },
  {
    id: 'hamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    translit: 'Al-ḥamdu lillāh',
    meaning: 'All praise is for Allah.',
    note: 'Said when something good happens, and after sneezing.',
  },
  {
    id: 'kayf',
    arabic: 'كَيْفَ حَالُكَ؟',
    translit: 'Kayfa ḥāluka?',
    meaning: 'How are you? (to a man)',
    note: 'To a woman say كَيْفَ حَالُكِ — ḥāluki.',
  },
  {
    id: 'ismi',
    arabic: 'مَا اسْمُكَ؟',
    translit: 'Mā ismuka?',
    meaning: 'What is your name?',
    note: 'Answer with: اسْمِي … — ismī … (my name is …).',
  },
  {
    id: 'la',
    arabic: 'لَا أَفْهَمُ',
    translit: 'Lā afham',
    meaning: 'I do not understand.',
    note: 'Very useful while you are still learning.',
  },
]
