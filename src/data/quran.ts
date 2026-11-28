/**
 * Short surahs for beginner reading practice.
 *
 * `global` is the running ayah number of the whole Quran (1–6236). It is used to
 * build the recitation URL on the free, key-less Al Quran Cloud audio CDN:
 *   https://cdn.islamic.network/quran/audio/128/ar.alafasy/<global>.mp3
 * Recitation: Mishary Rashid Alafasy. Translation meanings are plain-English
 * paraphrases written for learners, not a scholarly translation.
 */
export type Ayah = {
  number: number
  global: number
  arabic: string
  translit: string
  meaning: string
  tip: string
}

export type Surah = {
  id: string
  name: string
  arabicName: string
  meaning: string
  intro: string
  ayat: Ayah[]
}

export const SURAHS: Surah[] = [
  {
    id: 'fatihah',
    name: 'Al-Fātiḥah',
    arabicName: 'الفَاتِحَة',
    meaning: 'The Opening — 7 verses',
    intro:
      'The first surah of the Quran and the one we recite in every prayer. Read it slowly, one word at a time.',
    ayat: [
      {
        number: 1,
        global: 1,
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translit: 'Bismi llāhi r-raḥmāni r-raḥīm',
        meaning: 'In the name of Allah, the Most Merciful, the Most Compassionate.',
        tip: 'Three words: بِسْمِ · اللَّهِ · الرَّحْمَٰنِ الرَّحِيمِ. Notice the long ā in الرَّحْمَٰن.',
      },
      {
        number: 2,
        global: 2,
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        translit: 'Al-ḥamdu lillāhi rabbi l-ʿālamīn',
        meaning: 'All praise is for Allah, Lord of all the worlds.',
        tip: 'الْحَمْدُ starts with a fatḥah on the lām — say “al-ḥamdu”, not “ḥamdu”.',
      },
      {
        number: 3,
        global: 3,
        arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
        translit: 'Ar-raḥmāni r-raḥīm',
        meaning: 'The Most Merciful, the Most Compassionate.',
        tip: 'The shaddah on the r means you double it: ar-raḥmān.',
      },
      {
        number: 4,
        global: 4,
        arabic: 'مَالِكِ يَوْمِ الدِّينِ',
        translit: 'Māliki yawmi d-dīn',
        meaning: 'Master of the Day of Judgement.',
        tip: 'مَالِكِ has a long ā — hold it two counts: mā-li-ki.',
      },
      {
        number: 5,
        global: 5,
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        translit: 'Iyyāka naʿbudu wa iyyāka nastaʿīn',
        meaning: 'You alone we worship, and You alone we ask for help.',
        tip: 'إِيَّاكَ has a shaddah on the yāʾ: iy-yā-ka. Say it twice as long.',
      },
      {
        number: 6,
        global: 6,
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        translit: 'Ihdinā ṣ-ṣirāṭa l-mustaqīm',
        meaning: 'Guide us to the straight path.',
        tip: 'الصِّرَاطَ uses the heavy ṣād and ṭāʾ — round your lips slightly.',
      },
      {
        number: 7,
        global: 7,
        arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        translit: 'Ṣirāṭa lladhīna anʿamta ʿalayhim ghayri l-maghḍūbi ʿalayhim wa lā ḍ-ḍāllīn',
        meaning:
          'The path of those You have blessed — not of those who earned anger, nor of those who went astray.',
        tip: 'The longest verse here. Split it into three breaths: صِرَاطَ الَّذِينَ · أَنْعَمْتَ عَلَيْهِمْ · وَلَا الضَّالِّينَ.',
      },
    ],
  },
  {
    id: 'ikhlas',
    name: 'Al-Ikhlāṣ',
    arabicName: 'الإِخْلَاص',
    meaning: 'Sincerity — 4 verses',
    intro: 'A short surah about the oneness of Allah. Very good for memorising first.',
    ayat: [
      {
        number: 1,
        global: 6222,
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        translit: 'Qul huwa llāhu aḥad',
        meaning: 'Say: He is Allah, the One.',
        tip: 'قُلْ ends with sukūn — stop the l sound without adding a vowel.',
      },
      {
        number: 2,
        global: 6223,
        arabic: 'اللَّهُ الصَّمَدُ',
        translit: 'Allāhu ṣ-ṣamad',
        meaning: 'Allah, the Eternal Refuge.',
        tip: 'الصَّمَدُ: heavy ṣād, then a ḍammah on the dāl.',
      },
      {
        number: 3,
        global: 6224,
        arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
        translit: 'Lam yalid wa lam yūlad',
        meaning: 'He does not beget, nor was He begotten.',
        tip: 'Both يَلِدْ and يُولَدْ end with sukūn — stop cleanly at the d.',
      },
      {
        number: 4,
        global: 6225,
        arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
        translit: 'Wa lam yakun lahū kufuwan aḥad',
        meaning: 'And there is none comparable to Him.',
        tip: 'كُفُوًا carries two fatḥahs: kufu-wan.',
      },
    ],
  },
  {
    id: 'falaq',
    name: 'Al-Falaq',
    arabicName: 'الفَلَق',
    meaning: 'The Daybreak — 5 verses',
    intro: 'A surah of protection, often recited morning and evening.',
    ayat: [
      {
        number: 1,
        global: 6226,
        arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
        translit: 'Qul aʿūdhu bi rabbi l-falaq',
        meaning: 'Say: I seek refuge with the Lord of the daybreak.',
        tip: 'أَعُوذُ begins with a fatḥah on the alif — “aʿūdhu”.',
      },
      {
        number: 2,
        global: 6227,
        arabic: 'مِن شَرِّ مَا خَلَقَ',
        translit: 'Min sharri mā khalaq',
        meaning: 'From the evil of what He created.',
        tip: 'شَرِّ has a shaddah on the r: shar-ri.',
      },
      {
        number: 3,
        global: 6228,
        arabic: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',
        translit: 'Wa min sharri ghāsiqin idhā waqab',
        meaning: 'And from the evil of the darkness when it settles.',
        tip: 'غَاسِقٍ ends with two kasrahs: ghāsiqin.',
      },
      {
        number: 4,
        global: 6229,
        arabic: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ',
        translit: 'Wa min sharri n-naffāthāti fi l-ʿuqad',
        meaning: 'And from the evil of those who blow on knots.',
        tip: 'النَّفَّاثَاتِ has a shaddah on the fāʾ: naf-fā-thā-ti.',
      },
      {
        number: 5,
        global: 6230,
        arabic: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
        translit: 'Wa min sharri ḥāsidin idhā ḥasad',
        meaning: 'And from the evil of the envious one when he envies.',
        tip: 'حَاسِدٍ and حَسَدَ share the same letters — watch the vowels.',
      },
    ],
  },
  {
    id: 'nas',
    name: 'An-Nās',
    arabicName: 'النَّاس',
    meaning: 'Mankind — 6 verses',
    intro: 'The last surah of the Quran. Short verses, perfect for slow reading practice.',
    ayat: [
      {
        number: 1,
        global: 6231,
        arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
        translit: 'Qul aʿūdhu bi rabbi n-nās',
        meaning: 'Say: I seek refuge with the Lord of mankind.',
        tip: 'النَّاسِ: the alif is a long ā — n-nās.',
      },
      {
        number: 2,
        global: 6232,
        arabic: 'مَلِكِ النَّاسِ',
        translit: 'Maliki n-nās',
        meaning: 'The King of mankind.',
        tip: 'مَلِكِ has two short i sounds: ma-li-ki.',
      },
      {
        number: 3,
        global: 6233,
        arabic: 'إِلَٰهِ النَّاسِ',
        translit: 'Ilāhi n-nās',
        meaning: 'The God of mankind.',
        tip: 'إِلَٰهِ has a small alif above the lām — a long ā: ilāhi.',
      },
      {
        number: 4,
        global: 6234,
        arabic: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',
        translit: 'Min sharri l-waswāsi l-khannās',
        meaning: 'From the evil of the whispering, retreating one.',
        tip: 'الْخَنَّاسِ has a shaddah on the n: khan-nās.',
      },
      {
        number: 5,
        global: 6235,
        arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ',
        translit: 'Alladhī yuwaswisu fī ṣudūri n-nās',
        meaning: 'Who whispers into the hearts of mankind.',
        tip: 'صُدُورِ has a long ū — ṣu-dū-ri.',
      },
      {
        number: 6,
        global: 6236,
        arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ',
        translit: 'Mina l-jinnati wa n-nās',
        meaning: 'From among the jinn and mankind.',
        tip: 'الْجِنَّةِ: double n, then a shaddah — al-jin-na-ti.',
      },
    ],
  },
]

export const RECITER = {
  id: 'ar.alafasy',
  name: 'Mishary Rashid Alafasy',
  source: 'Al Quran Cloud / Islamic Network CDN',
  licenceNote:
    'Audio is streamed free, with no API key, from the Islamic Network CDN (Al Quran Cloud project). Readings are by Sheikh Mishary Rashid Alafasy. If the network is unavailable the app falls back to your device’s built-in Arabic voice.',
}

/** Recitation MP3 for one ayah, from the free public CDN. */
export function recitationUrl(globalAyah: number): string {
  return `https://cdn.islamic.network/quran/audio/128/${RECITER.id}/${globalAyah}.mp3`
}
