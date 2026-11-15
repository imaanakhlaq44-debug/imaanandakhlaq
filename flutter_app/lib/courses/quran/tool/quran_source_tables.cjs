const labels = [
  {"id": "M", "name": "Masnūn", "meaning": "Passage associated with an explicitly sourced authentic/accepted Hadith or Prophetic practice.", "rule": "Display context and citation, wording of claim reviewed before publication."},
  {"id": "H", "name": "Hifz elective", "meaning": "Qur’anic passage selected because it is useful, age-appropriate, or requested by families.", "rule": "Never display a specific reward, ritual time or special virtue without evidence."},
  {"id": "C", "name": "Curriculum passage", "meaning": "Verse selected to develop understanding, adab, Du’a language, and character.", "rule": "Teach as Qur’anic guidance; do not present as a prescribed daily recitation."},
]

const experiences = [
  {"id": "picture", "name": "Picture & Audio", "users": "Approx. 4–6; beginner", "pacing": "2–5 minute listening, imitation and recognition; adult-operated recording."},
  {"id": "guided", "name": "Guided Reciter", "users": "Approx. 7–9; early reader", "pacing": "3–8 minute verse learning, repeat loops, short meaning and parent check."},
  {"id": "explorer", "name": "Independent Explorer", "users": "Approx. 10–13; developing reader", "pacing": "5–15 minute chunks, Tajweed prompts, delayed recall and reflection."},
]

const steps = [
  {"name": "Hear it", "text": "Teacher-quality audio. Child can replay each ayah or a selected phrase without an arbitrary limit."},
  {"name": "See it", "text": "Display full Uthmānī verse, ayah number, optional word highlighting and Arabic text size settings."},
  {"name": "Say it", "text": "Repeat after the reciter with a pause; optional private recording. Do not score pronunciation as a binary pass/fail via unreliable ASR."},
  {"name": "Understand it", "text": "One or two plain-language sentences and a relatable example; separate the revealed meaning from imagined scenarios."},
  {"name": "Recall it", "text": "Hide text progressively, recover the next word or next ayah, and recite the full unit from memory."},
  {"name": "Keep it", "text": "Schedule future reviews. Ask “Would you like to practice again?” rather than penalizing missed days."},
]

const modes = [
  ["Listen only", "Play complete ayah or short phrase with clear audio.", "First exposure or relaxation."],
  ["Echo", "Playback, pause, child recites, optional replay.", "New memorization."],
  ["Loop × 3/5/10", "Repeat one ayah or an approved chunk; child can stop anytime.", "Controlled repetition."],
  ["Reveal gradually", "Hide one phrase, reveal after attempt.", "Prompted recall."],
  ["Verse bridge", "Hear 1st verse, recite following verse unaided.", "Order and continuity."],
  ["Full passage", "Child recites without visible text.", "Independent assessment."],
  ["Listen & compare", "Side-by-side sample and self-recorded audio, only with consent.", "Teacher/parent feedback."],
]

const revision = {
  "intervalsDays": [0, 1, 3, 7, 14, 30, 60],
  "note": "Default review intervals after the child first demonstrates recall: same day, next day, +3 days, +7 days, +14 days, +30 days, then approximately every 60 days. These are configurable instructional intervals, not a religiously prescribed schedule.",
  "outcomes": [
    {"id": "confident", "after": "Confident and correct", "result": "Independent recitation approved", "next": "Move to the next interval; keep the whole passage in rotation."},
    {"id": "prompting", "after": "Some prompting needed", "result": "Minor recall or sequence difficulty", "next": "Shorten interval; revisit relevant ayah and bridge."},
    {"id": "relearn", "after": "Needs re-learning", "result": "Repeated omissions or substantive errors", "next": "Return to listen + echo mode; parent/teacher help where needed."},
  ],
  "mastery": ["Practicing", "Can Recite with Help", "Can Recite Independently", "Retained After Review"],
  "masteryNote": "The last state must require delayed recall, not one successful attempt. A qualified adult controls final certification of recitation correctness.",
}

const masnun = [
  ["M01", "1:1-7", "Al-Fātiḥah", 1, "Recitation in ṣalāh; teach prayer relevance without discussing school-specific detailed rulings.", "Ṣaḥīḥ al-Bukhārī 756", "https://sunnah.com/bukhari:756"],
  ["M02", "2:255", "Āyat al-Kursī", 3, "Before sleep; protection mentioned in the report validated by the Prophet ﷺ.", "Ṣaḥīḥ al-Bukhārī 2311", "https://sunnah.com/bukhari:2311"],
  ["M03", "2:285-286", "Last two of Al-Baqarah", 3, "Nighttime recitation; report says they suffice the reciter.", "Ṣaḥīḥ al-Bukhārī 5009", "https://sunnah.com/bukhari:5009"],
  ["M04", "18:1-10", "Beginning of Al-Kahf", 15, "Memorizing the first ten verses; relation to protection from al-Dajjāl.", "Ṣaḥīḥ Muslim 809a", "https://sunnah.com/muslim:809a"],
  ["M05", "32:1-30", "As-Sajdah", 21, "Prophetic recitation in Friday Fajr prayer; advanced learning module.", "Ṣaḥīḥ al-Bukhārī 891", "https://sunnah.com/bukhari:891"],
  ["M06", "67:1-30", "Al-Mulk", 29, "A 30-ayah surah whose intercession is mentioned; this report does not by itself specify a nightly schedule.", "Jāmiʿ at-Tirmidhī 2891 (ḥasan)", "https://sunnah.com/tirmidhi:2891"],
  ["M07", "76:1-31", "Al-Insān", 29, "Prophetic recitation in Friday Fajr prayer alongside As-Sajdah; advanced module.", "Ṣaḥīḥ al-Bukhārī 891", "https://sunnah.com/bukhari:891"],
  ["M08", "109:1-6", "Al-Kāfirūn", 30, "Recitation at bedtime is reported; reviewed ḥasan grading.", "Jāmiʿ at-Tirmidhī 3403 (ḥasan)", "https://sunnah.com/tirmidhi:3403"],
  ["M09", "112:1-4", "Al-Ikhlāṣ", 30, "Part of the three-surah bedtime recitation practice.", "Ṣaḥīḥ al-Bukhārī 5017", "https://sunnah.com/bukhari:5017"],
  ["M10", "113:1-5", "Al-Falaq", 30, "Part of the same bedtime recitation practice.", "Ṣaḥīḥ al-Bukhārī 5017", "https://sunnah.com/bukhari:5017"],
  ["M11", "114:1-6", "An-Nās", 30, "Part of the same bedtime recitation practice.", "Ṣaḥīḥ al-Bukhārī 5017", "https://sunnah.com/bukhari:5017"],
]

const extended = [
  ["36:1-83", "Yā-Sīn", "Juz 22: 36:1–27; Juz 23: 36:28–83", ["36:1-12", "36:13-27", "36:28-44", "36:45-54", "36:55-68", "36:69-83"], "Elective Hifz; do not claim automatic forgiveness or a fixed daily ritual."],
  ["56:1-96", "Al-Wāqiʿah", "Juz 27", ["56:1-26", "56:27-40", "56:41-56", "56:57-74", "56:75-96"], "Elective Hifz; do not assert a guaranteed protection from poverty."],
  ["67:1-30", "Al-Mulk", "Juz 29", ["67:1-10", "67:11-20", "67:21-30"], "Use M for the evidenced virtue of intercession, not an unsourced nightly guarantee."],
  ["18:1-10", "Al-Kahf", "Juz 15", ["18:1-5", "18:6-10"], "Use M for the first-ten-verse memorization report."],
  ["2:285-286", "Last two of Al-Baqarah", "Juz 3", ["2:285", "2:286"], "Use M for night recitation; display full verses with accurate stops."],
]
const chunk_notes = {
  "2:285-286": "2:285 in approved phrases; 2:286 in approved phrases",
  "2:255": "For long ayahs (e.g., 2:255 and 2:286), allow editorially approved phrase chunks aligned to safe waqf positions; keep the full verse intact in storage.",
}

const juz = [
  [1, "1:1", "2:141", [["1:1-7", "M"], ["2:1-5", "C"]], "Al-Fātiḥah; qualities of believers"],
  [2, "2:142", "2:252", [["2:152-153", "C"], ["2:201", "C"]], "Remembrance, patience and a Qur’anic supplication"],
  [3, "2:253", "3:92", [["2:255", "M"], ["2:285-286", "M"], ["3:8-9", "C"]], "Āyat al-Kursī; last two verses; steadfast hearts"],
  [4, "3:93", "4:23", [["3:133-136", "C"], ["3:159", "C"]], "Forgiveness, restraint and gentleness"],
  [5, "4:24", "4:147", [["4:36", "C"], ["4:58", "C"]], "Kindness, trust and responsibility"],
  [6, "4:148", "5:81", [["4:148-149", "C"], ["5:8", "C"]], "Good speech, justice"],
  [7, "5:82", "6:110", [["5:90-91", "C"], ["6:59", "C"]], "Wise choices; Allah’s knowledge"],
  [8, "6:111", "7:87", [["6:151-153", "C"], ["7:31", "C"]], "Core moral guidance; avoiding wastefulness"],
  [9, "7:88", "8:40", [["7:199", "C"], ["8:2", "C"]], "Forbearance; faith and trust"],
  [10, "8:41", "9:92", [["8:46", "C"], ["9:71", "C"]], "Patience; supporting one another"],
  [11, "9:93", "11:5", [["10:57-58", "C"], ["10:62-64", "C"]], "Guidance and hope"],
  [12, "11:6", "12:52", [["11:114", "C"], ["12:33", "C"]], "Prayer and turning away from wrongdoing"],
  [13, "12:53", "14:52", [["12:87", "C"], ["13:28", "C"], ["14:40-41", "C"]], "Hope; remembrance; prayer for family"],
  [14, "15:1", "16:128", [["15:97-99", "C"], ["16:90", "C"], ["16:98", "C"]], "Worship, justice, preparing to recite"],
  [15, "17:1", "18:74", [["17:23-24", "C"], ["18:1-10", "M"]], "Parents; first ten verses of Al-Kahf"],
  [16, "18:75", "20:135", [["18:101-110", "H"], ["20:114", "C"]], "Al-Kahf ending; asking for knowledge"],
  [17, "21:1", "22:78", [["21:83-84", "C"], ["21:87-88", "C"], ["22:77", "C"]], "Supplications of Prophets; doing good"],
  [18, "23:1", "25:20", [["23:1-11", "C"], ["23:97-98", "C"]], "Character and protection from evil prompting"],
  [19, "25:21", "27:55", [["25:63-76", "C"], ["27:19", "C"]], "Servants of the Merciful; gratitude"],
  [20, "27:56", "29:45", [["28:24", "C"], ["29:2-3", "C"], ["29:45", "C"]], "Du’a, trials, prayer"],
  [21, "29:46", "33:30", [["31:12-19", "C"], ["32:1-30", "M"], ["33:21", "C"]], "Luqmān’s advice; As-Sajdah; Prophetic example"],
  [22, "33:31", "36:27", [["33:56", "C"], ["35:28", "C"], ["36:1-27", "H"]], "Ṣalawāt; learning; Yā-Sīn part one"],
  [23, "36:28", "39:31", [["36:28-83", "H"], ["37:100", "C"]], "Yā-Sīn part two; Ibrāhīm’s supplication"],
  [24, "39:32", "41:46", [["39:53", "C"], ["40:60", "C"], ["41:34", "C"]], "Mercy, supplication, responding with good"],
  [25, "41:47", "45:37", [["42:38", "C"], ["43:67", "C"]], "Consultation and righteous friendship"],
  [26, "46:1", "51:30", [["46:15", "C"], ["49:10-13", "C"], ["50:16", "C"]], "Parents; manners; awareness of Allah"],
  [27, "51:31", "57:29", [["51:56", "C"], ["56:1-96", "H"], ["57:20", "C"]], "Purpose; Al-Wāqiʿah; priorities"],
  [28, "58:1", "66:12", [["58:11", "C"], ["59:18", "C"], ["60:8", "C"], ["66:6", "C"]], "Knowledge, self-review, fairness, family duty"],
  [29, "67:1", "77:50", [["67:1-30", "M"], ["73:1-10", "C"], ["76:1-31", "M"]], "Al-Mulk; night worship; Al-Insān"],
  [30, "78:1", "114:6", [["78:1-40", "H"], ["87:1-19", "H"], ["93:1-11", "H"], ["94:1-8", "H"], ["103:1-3", "H"], ["109:1-6", "M"], ["112:1-4", "M"], ["113:1-5", "M"], ["114:1-6", "M"]], "Juz ʿAmma short-surah curriculum; full inventory in §9"],
]

const juz30 = [
  [78, "An-Nabaʾ", 40], [79, "An-Nāziʿāt", 46], [80, "ʿAbasa", 42], [81, "At-Takwīr", 29],
  [82, "Al-Infiṭār", 19], [83, "Al-Muṭaffifīn", 36], [84, "Al-Inshiqāq", 25], [85, "Al-Burūj", 22],
  [86, "Aṭ-Ṭāriq", 17], [87, "Al-Aʿlā", 19], [88, "Al-Ghāshiyah", 26], [89, "Al-Fajr", 30],
  [90, "Al-Balad", 20], [91, "Ash-Shams", 15], [92, "Al-Layl", 21], [93, "Aḍ-Ḍuḥā", 11],
  [94, "Ash-Sharḥ", 8], [95, "At-Tīn", 8], [96, "Al-ʿAlaq", 19], [97, "Al-Qadr", 5],
  [98, "Al-Bayyinah", 8], [99, "Az-Zalzalah", 8], [100, "Al-ʿĀdiyāt", 11], [101, "Al-Qāriʿah", 11],
  [102, "At-Takāthur", 8], [103, "Al-ʿAṣr", 3], [104, "Al-Humazah", 9], [105, "Al-Fīl", 5],
  [106, "Quraysh", 4], [107, "Al-Māʿūn", 7], [108, "Al-Kawthar", 3], [109, "Al-Kāfirūn", 6],
  [110, "An-Naṣr", 3], [111, "Al-Masad", 5], [112, "Al-Ikhlāṣ", 4], [113, "Al-Falaq", 5],
  [114, "An-Nās", 6],
]


module.exports={labels,experiences,steps,modes,revision,masnun,extended,chunk_notes,juz,juz30};