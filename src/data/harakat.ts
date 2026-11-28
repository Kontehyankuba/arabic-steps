/** Vowel marks (ḥarakāt) and the extra signs a beginner meets first. */
export type Haraka = {
  id: string
  name: string
  arabicName: string
  sound: string
  glyph: string
  demo: string
  demoTranslit: string
  explanation: string
  example: { word: string; translit: string; meaning: string }
}

export const HARAKAT: Haraka[] = [
  {
    id: 'fatha',
    name: 'Fatḥah',
    arabicName: 'فَتْحَة',
    sound: 'a',
    glyph: 'بَ',
    demo: 'بَ',
    demoTranslit: 'ba',
    explanation:
      'A small slanted line above the letter. It adds a short “a” sound. Say it short — like the a in “bat”.',
    example: { word: 'كَتَبَ', translit: 'kataba', meaning: 'he wrote' },
  },
  {
    id: 'kasra',
    name: 'Kasrah',
    arabicName: 'كَسْرَة',
    sound: 'i',
    glyph: 'بِ',
    demo: 'بِ',
    demoTranslit: 'bi',
    explanation: 'A small slanted line below the letter. It adds a short “i” sound, like the i in “sit”.',
    example: { word: 'بِسْمِ', translit: 'bismi', meaning: 'in the name of' },
  },
  {
    id: 'damma',
    name: 'Ḍammah',
    arabicName: 'ضَمَّة',
    sound: 'u',
    glyph: 'بُ',
    demo: 'بُ',
    demoTranslit: 'bu',
    explanation: 'A small curl above the letter. It adds a short “u” sound, like the u in “put”.',
    example: { word: 'كُتُبٌ', translit: 'kutubun', meaning: 'books' },
  },
  {
    id: 'sukun',
    name: 'Sukūn',
    arabicName: 'سُكُون',
    sound: 'no vowel',
    glyph: 'بْ',
    demo: 'بْ',
    demoTranslit: 'b',
    explanation:
      'A small circle above the letter. It means “stop here”: say the letter with no vowel after it. You will see it in words like بَيْتٌ.',
    example: { word: 'بَيْتٌ', translit: 'baytun', meaning: 'a house' },
  },
  {
    id: 'shadda',
    name: 'Shaddah',
    arabicName: 'شَدَّة',
    sound: 'double letter',
    glyph: 'بَّ',
    demo: 'بَّ',
    demoTranslit: 'bba',
    explanation:
      'A small “w” shape above the letter. It doubles the letter: say it twice, holding it a moment. In إِنَّ the n is doubled.',
    example: { word: 'إِنَّ', translit: 'inna', meaning: 'indeed' },
  },
  {
    id: 'tanwin-fath',
    name: 'Fatḥatān',
    arabicName: 'تَنْوِين الفَتْح',
    sound: '-an',
    glyph: 'بًا',
    demo: 'بًا',
    demoTranslit: 'ban',
    explanation:
      'Two fatḥahs at the end of a word add “-an”. This is why many Quranic words end in ـًا: كِتَابًا = kitāban.',
    example: { word: 'كِتَابًا', translit: 'kitāban', meaning: 'a book (object)' },
  },
  {
    id: 'tanwin-kasr',
    name: 'Kasratān',
    arabicName: 'تَنْوِين الكَسْر',
    sound: '-in',
    glyph: 'بٍ',
    demo: 'بٍ',
    demoTranslit: 'bin',
    explanation: 'Two kasrahs below add “-in” at the end of a word.',
    example: { word: 'كِتَابٍ', translit: 'kitābin', meaning: 'of a book' },
  },
  {
    id: 'tanwin-damm',
    name: 'Ḍammatān',
    arabicName: 'تَنْوِين الضَّمّ',
    sound: '-un',
    glyph: 'بٌ',
    demo: 'بٌ',
    demoTranslit: 'bun',
    explanation: 'Two ḍammahs above add “-un” at the end of a word. Most new vocabulary words appear this way.',
    example: { word: 'قَلَمٌ', translit: 'qalamun', meaning: 'a pen' },
  },
  {
    id: 'madd',
    name: 'Madd (long vowel)',
    arabicName: 'مَدّ',
    sound: 'long ā / ī / ū',
    glyph: 'بَا',
    demo: 'بَا',
    demoTranslit: 'bā',
    explanation:
      'A short vowel followed by ا, و or ي becomes long: hold it for two counts. بَ + ا = بَا (bā), بِ + ي = بِي (bī), بُ + و = بُو (bū).',
    example: { word: 'نُورٌ', translit: 'nūrun', meaning: 'light' },
  },
]

export const HARAKAT_BY_ID: Record<string, Haraka> = Object.fromEntries(
  HARAKAT.map((haraka) => [haraka.id, haraka]),
)
