import 'package:flutter/services.dart';

import '../courses/duas/duas_data.dart';
import '../courses/hajj/hajj_data.dart';
import '../courses/ibrah/ibrah_data.dart';
import '../courses/quran/quran_data.dart';
import '../courses/quran/quran_text.dart';
import '../courses/salah/salah_data.dart';
import '../courses/tafsir/tafsir_data.dart';
import '../courses/taleem/taleem_data.dart';
import '../l10n/language.dart';
import 'hadith_course.dart';
import 'learning_journey.dart';

class JourneyPractice {
  const JourneyPractice({
    required this.prompt,
    required this.items,
    this.correct = 0,
    this.inOrder = false,
    this.recall = false,
    this.explanations = const [],
  });

  final String prompt;
  final List<String> items;
  final int correct;
  final bool inOrder, recall;
  final List<String> explanations;

  static JourneyPractice sequence(
    List<String> items, {
    required String prompt,
  }) => JourneyPractice(prompt: prompt, items: items, inOrder: true);

  static JourneyPractice match(
    String prompt,
    List<String> source,
    String answer,
    int number,
  ) {
    final options = source
        .where((item) => item.trim().isNotEmpty && item != answer)
        .toSet()
        .take(2)
        .toList();
    if (options.isEmpty) {
      return JourneyPractice(prompt: prompt, items: [answer], recall: true);
    }
    final index = number % (options.length + 1);
    options.insert(index, answer);
    return JourneyPractice(prompt: prompt, items: options, correct: index);
  }
}

class JourneyLesson {
  const JourneyLesson({
    required this.story,
    this.arabic = const [],
    this.meaning = '',
    required this.source,
    required this.question,
    required this.choices,
    required this.correct,
    required this.feedback,
    this.tryAgain,
    this.answerFeedback,
    this.revealAnswer = false,
    this.verses = const [],
    this.reciter = '',
    this.practice,
    this.listeningVerses = const [],
  });

  final String story, meaning, source, question, feedback;
  final String? tryAgain;
  final List<String?>? answerFeedback;
  final List<String> arabic, choices;
  final int correct;
  final bool revealAnswer;
  final List<QuranVerse> verses;
  final String reciter;
  final JourneyPractice? practice;
  final List<QuranVerse> listeningVerses;

  List<QuranVerse> get _listeningOptions =>
      listeningVerses.isEmpty ? verses.take(3).toList() : listeningVerses;

  int get listeningAnswer => verses.length == 1
      ? _listeningOptions.indexWhere((verse) => verse.key == verses.first.key)
      : verses.first.ayah % _listeningOptions.length;

  String? get listeningClip => verses.isEmpty || _listeningOptions.length < 2
      ? null
      : _listeningOptions[listeningAnswer].audio;

  List<String> get listeningChoices =>
      _listeningOptions.map((verse) => verse.text).toList();

  static List<JourneyLevel> stationLevels(
    JourneyLevel level,
    List<JourneyLevel> catalogue, {
    JourneyLane? lane,
  }) {
    if (level.stations.isNotEmpty) {
      return level.stations.map((id) {
        final station = catalogue.firstWhere((item) => item.id == id);
        if (lane == null || lane.includes(station)) return station;
        return catalogue.firstWhere(
          (item) =>
              item.world == station.world &&
              item.stations.isEmpty &&
              lane.includes(item),
        );
      }).toList();
    }
    if (!level.cumulative) return [level];
    final worlds = {level.world};
    return [
      level,
      ...catalogue
          .take(level.number - 1)
          .toList()
          .reversed
          .where(
            (item) =>
                item.stations.isEmpty &&
                (lane?.includes(item) ?? true) &&
                worlds.add(item.world),
          )
          .take(3),
    ];
  }

  static Future<List<JourneyLesson>> loadStations(
    JourneyLevel level,
    List<JourneyLevel> catalogue, {
    JourneyLane? lane,
  }) async => [
    for (final station in stationLevels(level, catalogue, lane: lane))
      await load(station),
  ];

  String feedbackFor(int index) =>
      answerFeedback?[index] ??
      (index == correct
          ? feedback
          : tryAgain ??
                tr(
                  'Read the lesson again, then try another answer.',
                  'سبق دوبارہ پڑھیں، پھر دوسرا جواب آزمائیں۔',
                ));

  static Future<DuaLesson> _dua(String id) async {
    final volume = DuaVolume.fromJson(
      await rootBundle.loadString(DuaVolume.assetFor(1)),
    );
    return volume.lessons.firstWhere((lesson) => lesson.id == id);
  }

  static Future<List<QuranVerse>> _verses(AyahRange range, int expected) async {
    final verses = (await QuranText.load()).of(range);
    if (verses.length != expected) {
      throw const FormatException('Incomplete Qur’an passage');
    }
    return verses;
  }

  static Future<JourneyLesson> load(JourneyLevel level) async {
    switch (level.id) {
      case 'IA-0001':
        final dua = await _dua('dua-001');
        return JourneyLesson(
          practice: JourneyPractice(
            prompt: tr(
              'Which words belong before the first bite?',
              'پہلے لقمے سے پہلے کیا کہیں؟',
            ),
            items: ['الحمد لله', dua.arabic, 'سبحان الله'],
            correct: 1,
          ),
          story: tr(
            'Imaan and Akhlaq sit down to eat. Before the first bite, they remember to say Bismillah.',
            'ایمان اور اخلاق کھانے کے لیے بیٹھے۔ پہلے لقمے سے پہلے انہوں نے بسم اللہ کہی۔',
          ),
          arabic: [dua.arabic],
          meaning: tr(dua.english, dua.urdu ?? dua.english),
          source: dua.source,
          question: tr(
            'When should you say Bismillah at a meal?',
            'کھانے میں بسم اللہ کب کہیں؟',
          ),
          choices: [
            tr('After finishing the meal', 'کھانا ختم کرنے کے بعد'),
            tr('Before the first bite', 'پہلے لقمے سے پہلے'),
            tr('Only when the plate is empty', 'جب پلیٹ خالی ہو جائے'),
          ],
          correct: 1,
          feedback: tr(
            'Yes. Say Bismillah before you start eating.',
            'جی ہاں۔ کھانا شروع کرنے سے پہلے بسم اللہ کہیں۔',
          ),
          tryAgain: tr(
            'Think about what you say before you start eating.',
            'سوچیں کہ کھانا شروع کرنے سے پہلے کیا کہتے ہیں۔',
          ),
        );
      case 'IA-0002':
        final verses = await _verses(const AyahRange(1, 1, 7), 7);
        return JourneyLesson(
          verses: verses,
          reciter: (await QuranText.load()).reciter,
          story: tr(
            'Read Al-Fātiḥah from the first ayah to the seventh ayah.',
            'سورۃ الفاتحہ پہلی آیت سے ساتویں آیت تک پڑھیں۔',
          ),
          arabic: [for (final verse in verses) verse.text],
          meaning: '',
          source: tr('Qur’an 1:1–7', 'قرآن ۱:۱ تا ۷'),
          question: tr(
            'Which order should we keep when reading Al-Fātiḥah?',
            'سورۃ الفاتحہ پڑھتے وقت کون سی ترتیب رکھیں؟',
          ),
          choices: [
            tr('First ayah to seventh ayah', 'پہلی آیت سے ساتویں آیت تک'),
            tr('Seventh ayah to first ayah', 'ساتویں آیت سے پہلی آیت تک'),
            tr('Any order', 'کسی بھی ترتیب سے'),
          ],
          correct: 0,
          feedback: tr(
            'Yes. Keep the ayahs in their Qur’anic order.',
            'جی ہاں۔ آیات کو قرآن کی ترتیب میں پڑھیں۔',
          ),
          tryAgain: tr(
            'Look back at where the surah starts.',
            'دوبارہ دیکھیں کہ سورت کہاں سے شروع ہوتی ہے۔',
          ),
        );
      case 'IA-0008':
        final dua = await _dua('dua-002');
        return JourneyLesson(
          story: dua.story.first,
          arabic: [dua.arabic],
          meaning: tr(dua.english, dua.urdu ?? dua.english),
          source: dua.source,
          question: tr(
            'What can you say to thank Allah after a drink?',
            'کچھ پینے کے بعد اللہ کا شکر ادا کرنے کے لیے کیا کہہ سکتے ہیں؟',
          ),
          choices: const ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar'],
          correct: 1,
          feedback: tr(
            'Yes. Alhamdulillah is an expression of praise and thanks.',
            'جی ہاں۔ الحمد للہ کہہ کر ہم اللہ کی تعریف اور شکر ادا کرتے ہیں۔',
          ),
        );
      case 'IA-0009':
        final verses = await _verses(const AyahRange(112, 1, 4), 4);
        return JourneyLesson(
          verses: verses,
          reciter: (await QuranText.load()).reciter,
          story: tr(
            'Read Al-Ikhlāṣ from the first ayah to the fourth ayah.',
            'سورۃ الاخلاص پہلی آیت سے چوتھی آیت تک پڑھیں۔',
          ),
          arabic: verses.map((verse) => verse.text).toList(),
          meaning: tr(
            'The surah teaches that Allah is One.',
            'یہ سورت سکھاتی ہے کہ اللہ ایک ہے۔',
          ),
          source: tr('Qur’an 112:1–4', 'قرآن ۱۱۲:۱ تا ۴'),
          question: tr(
            'What does Al-Ikhlāṣ teach us about Allah?',
            'سورۃ الاخلاص ہمیں اللہ کے بارے میں کیا سکھاتی ہے؟',
          ),
          choices: [
            tr('Allah is One.', 'اللہ ایک ہے۔'),
            tr('Allah has an equal.', 'اللہ کا کوئی ہمسر ہے۔'),
            tr('Allah has children.', 'اللہ کی اولاد ہے۔'),
          ],
          correct: 0,
          feedback: tr(
            'Yes. Allah is One and has no equal.',
            'جی ہاں۔ اللہ ایک ہے اور اس کا کوئی ہمسر نہیں۔',
          ),
        );
      case 'IA-0011':
        final course = await HajjCourse.load();
        final mission = course.missions[level.sourceUnit]!;
        final references = mission.evidence
            .map((id) => course.source(id)?['title'])
            .whereType<String>();
        return JourneyLesson(
          story: 'Imaan and Akhlaq are learning about the Ka‘bah in Makkah.',
          meaning: mission.teach,
          source: references.join(' · '),
          question: 'What do pilgrims walk around during Tawaf?',
          choices: const ['Safa and Marwah', 'The Ka‘bah', 'Mount Arafat'],
          correct: 1,
          feedback: 'Yes. During Tawaf, pilgrims walk around the Ka‘bah.',
        );
      default:
        return _loadCourseLesson(level);
    }
  }

  static List<int> _parts(JourneyLevel level, RegExp pattern) {
    final match = pattern.firstMatch(level.sourceUnit);
    if (match == null) throw FormatException('Unsupported source: ${level.id}');
    return [
      for (var i = 1; i <= match.groupCount; i++)
        if (match.group(i) case final String digits) int.parse(digits),
    ];
  }

  static Future<JourneyLesson> _loadCourseLesson(JourneyLevel level) async {
    switch (level.world) {
      case 'HAD':
        final [number] = _parts(level, RegExp(r'^HAD-(\d+)$'));
        final lessons = await HadithLesson.load();
        final lesson = lessons.firstWhere((item) => item.number == number);
        final correct = lesson.answers.indexWhere((answer) => answer.correct);
        return JourneyLesson(
          practice: JourneyPractice.match(
            tr(
              'Which action puts this hadith into practice?',
              'کون سا عمل اس حدیث کی تعلیم پر ہے؟',
            ),
            lessons
                .where((item) => item.world != lesson.world)
                .map((item) => item.action)
                .toList(),
            lesson.action,
            level.number,
          ),
          story: lesson.story,
          arabic: [lesson.arabic],
          meaning: lesson.meaning,
          source: lesson.excerpt
              ? '${lesson.source} · ${lesson.label}'
              : lesson.source,
          question: lesson.question,
          choices: [for (final answer in lesson.answers) answer.text],
          correct: correct,
          feedback: lesson.answers[correct].feedback,
          answerFeedback: [
            for (final answer in lesson.answers) answer.feedback,
          ],
        );
      case 'DUA':
        final [volumeNumber, lessonNumber] = _parts(
          level,
          RegExp(r'^DUA-V(\d+)-L(\d+)$'),
        );
        final volume = DuaVolume.fromJson(
          await rootBundle.loadString(DuaVolume.assetFor(volumeNumber)),
        );
        final dua = volume.lessons[lessonNumber - 1];
        final choices = meaningChoices(dua, volume.lessons);
        final occasion = dua.occasion;
        final chunks = dua.chunksRebuildArabic && dua.sourceChunks.length > 1
            ? dua.sourceChunks
            : dua.arabic.trim().split(RegExp(r'\s+'));
        final useChunks =
            level.brief['activity']!.contains('Reconstruct') &&
            chunks.length > 1;
        return JourneyLesson(
          practice: useChunks
              ? JourneyPractice(
                  prompt: tr(
                    'Put the parts of this du’a in order.',
                    'اس دعا کے حصے ترتیب سے لگائیں۔',
                  ),
                  items: chunks,
                  inOrder: true,
                )
              : occasion == null || occasion.trim().isEmpty
              ? null
              : JourneyPractice.match(
                  tr('When is this du’a used?', 'یہ دعا کب پڑھی جاتی ہے؟'),
                  volume.lessons.map((item) => item.occasion ?? '').toList(),
                  occasion,
                  level.number,
                ),
          story: dua.story.firstOrNull ?? dua.occasion ?? dua.title,
          arabic: [dua.arabic],
          meaning: dua.english,
          source: dua.source,
          question: 'Which meaning matches this du’a?',
          choices: choices,
          correct: choices.indexOf(dua.english),
          feedback: 'Yes. ${dua.english}',
        );
      case 'QUR':
        final passage = _parts(
          level,
          RegExp(r'^QUR-(\d+):(\d+)(?:[–-](\d+))?$'),
        );
        final [surah, first, ...end] = passage;
        final last = end.firstOrNull ?? first;
        final verses = await _verses(
          AyahRange(surah, first, last),
          last - first + 1,
        );
        final text = await QuranText.load();
        final firstAyah = verses.first.text.trim();
        final neighbours = first == last
            ? text.of(
                AyahRange(surah, first > 1 ? first - 1 : first, first + 1),
              )
            : verses.reversed;
        final nearbyChoices = {
          ...neighbours
              .map((verse) => verse.text.trim())
              .where((text) => text != firstAyah)
              .take(2),
          firstAyah,
        }.toList();
        final activity = level.brief['activity']!;
        final listeningOptions = verses.length == 1
            ? [
                ...{
                  for (final verse in [...neighbours, ...text.verses.values])
                    if (verse.key != verses.first.key &&
                        verse.text != verses.first.text)
                      verse.text: verse,
                }.values.take(2),
              ]
            : <QuranVerse>[];
        if (verses.length == 1) {
          listeningOptions.insert(
            first % (listeningOptions.length + 1),
            verses.first,
          );
        }
        final choices = nearbyChoices.length > 1
            ? nearbyChoices
            : {
                for (final option in listeningOptions) option.text.trim(),
              }.toList();
        final reveal = choices.length == 1;
        final practice = _quranPractice(activity, verses, level.number);
        return JourneyLesson(
          verses: verses,
          reciter: text.reciter,
          listeningVerses: listeningOptions,
          practice: practice,
          story: tr(
            'Read the ayahs in their Qur’anic order.',
            'آیات قرآن کی ترتیب سے پڑھیں۔',
          ),
          arabic: [for (final verse in verses) verse.text],
          source: first == last
              ? 'Qur’an $surah:$first'
              : 'Qur’an $surah:$first–$last',
          question: tr(
            first == last
                ? 'Which ayah did you read in this lesson?'
                : 'Which ayah comes first in this lesson?',
            first == last
                ? 'آپ نے اس سبق میں کون سی آیت پڑھی؟'
                : 'اس سبق میں پہلے کون سی آیت آتی ہے؟',
          ),
          choices: choices,
          correct: choices.indexOf(firstAyah),
          feedback: reveal
              ? firstAyah
              : first == last
              ? tr(
                  'Yes. This is the ayah you read.',
                  'جی ہاں۔ آپ نے یہی آیت پڑھی۔',
                )
              : tr(
                  'Yes. This is the first ayah in the passage.',
                  'جی ہاں۔ اس حصے کی یہ پہلی آیت ہے۔',
                ),
          revealAnswer: reveal,
        );
      case 'IBR':
        final [volumeNumber, number] = _parts(
          level,
          RegExp(r'^IBR-V(\d+)-M(\d+)$'),
        );
        final index = await IbrahLibrary.index();
        final volume = await IbrahLibrary.volume(
          index.firstWhere((item) => item.number == volumeNumber),
        );
        final mission = volume.missions.firstWhere(
          (item) => item.number == number,
        );
        final story = volume.stories
            .where((item) => item.number == mission.story)
            .firstOrNull;
        final guidance = mission.discover.where((block) {
          final label = block.label?.toLowerCase() ?? '';
          return label.contains('meaning') || label.startsWith('understand');
        }).firstOrNull;
        final anchor = mission.discover.where((block) {
          final label = block.label?.toLowerCase() ?? '';
          return label == 'source anchor' ||
              label == 'qurʾānic foundation' ||
              label == 'source panel';
        }).firstOrNull;
        final correct = mission.choices.indexWhere((choice) => choice.correct);
        final compareChoices = level.brief['activity']!.startsWith(
          'Compare two realistic decisions',
        );
        final teachingCards = mission.discover
            .where(
              (block) =>
                  block.kind == 'p' &&
                  !block.text.startsWith('STORY EPISODE') &&
                  block.text.trim().isNotEmpty,
            )
            .map((block) => block.text)
            .toSet()
            .take(3)
            .toList();
        if (teachingCards.length == 2) {
          final citation =
              anchor?.text ?? mission.evidence.firstOrNull?.reference;
          if (citation != null && citation.trim().isNotEmpty) {
            teachingCards.insert(0, citation);
          }
        }
        final orderCards =
            level.brief['activity']!.startsWith('Put three') &&
            teachingCards.length == 3;
        return JourneyLesson(
          practice: orderCards
              ? JourneyPractice(
                  prompt: tr(
                    'Put these teaching cards in the order used in the source lesson.',
                    'ان تدریسی کارڈز کو اصل سبق کی ترتیب میں رکھیں۔',
                  ),
                  items: teachingCards,
                  inOrder: true,
                )
              : compareChoices
              ? JourneyPractice(
                  prompt: tr(
                    'Compare what could happen after two choices.',
                    'دو فیصلوں کے ممکنہ نتائج کا موازنہ کریں۔',
                  ),
                  items: [for (final choice in mission.choices) choice.text],
                  explanations: [
                    for (final choice in mission.choices) choice.feedback ?? '',
                  ],
                )
              : JourneyPractice.match(
                  tr(
                    'Which action did this story suggest?',
                    'اس کہانی میں کون سا عمل تجویز کیا گیا؟',
                  ),
                  volume.missions
                      .where((item) => item.number != number)
                      .map((item) => item.action)
                      .toList(),
                  mission.action,
                  level.number,
                ),
          story:
              mission.discover
                  .where((block) => block.kind == 'p')
                  .lastOrNull
                  ?.text ??
              story?.blocks
                  .where((block) => block.kind == 'p')
                  .firstOrNull
                  ?.text ??
              guidance?.text ??
              mission.title,
          meaning:
              guidance?.text ?? mission.evidence.firstOrNull?.meaning ?? '',
          source:
              anchor?.text ??
              mission.evidence.firstOrNull?.reference ??
              level.sourceReference,
          question: mission.question,
          choices: [for (final choice in mission.choices) choice.text],
          correct: correct,
          feedback: mission.choices[correct].feedback ?? 'Well done.',
          answerFeedback: [
            for (final choice in mission.choices) choice.feedback,
          ],
        );
      case 'SAL':
        final course = await SalahCourseData.load();
        final mission = course.missions.firstWhere(
          (item) => item.id == level.sourceUnit,
        );
        final prayerSequence = _salahSequences[mission.id];
        final recitation = mission.id == 'F2' ? await QuranText.load() : null;
        return JourneyLesson(
          verses: recitation?.of(const AyahRange(1, 1, 7)) ?? const [],
          reciter: recitation?.reciter ?? '',
          practice: prayerSequence != null
              ? JourneyPractice.sequence(
                  prayerSequence,
                  prompt: tr(
                    'Place the lesson cards in order.',
                    'سبق کے کارڈ ترتیب سے رکھیں۔',
                  ),
                )
              : level.brief['activity']!.startsWith('Compare incomplete')
              ? JourneyPractice(
                  prompt: mission.check.sourceQuestion,
                  items: mission.check.options,
                  explanations: [
                    for (final (index, _) in mission.check.options.indexed)
                      index == mission.check.correct
                          ? mission.check.feedback
                          : mission.learn,
                  ],
                )
              : JourneyPractice(
                  prompt: mission.check.sourceQuestion,
                  items: [mission.check.options[mission.check.correct]],
                  recall: true,
                ),
          story: mission.scene,
          meaning: mission.learn,
          source: mission.evidence,
          question: mission.check.question,
          choices: mission.check.options,
          correct: mission.check.correct,
          feedback: mission.check.feedback,
        );
      case 'RHD':
        final [volume, number] = _parts(level, RegExp(r'^RHD-L(\d+)-(\d+)$'));
        final edition = (await TaleemEdition.load()).firstWhere(
          (item) => item.volume == volume,
        );
        final lesson = edition.lessons.firstWhere(
          (item) => item.number == number,
        );
        final check = lesson.questions.first;
        final recall = lesson.questions.skip(1).firstOrNull;
        final scenario = lesson.decide;
        final choices = edition.lessons
            .where((item) => item.id != lesson.id && item.questions.isNotEmpty)
            .map((item) => item.questions.first.answer)
            .where((answer) => answer != check.answer)
            .toSet()
            .take(2)
            .toList();
        final correct = number % (choices.length + 1);
        choices.insert(correct, check.answer);
        return JourneyLesson(
          practice:
              scenario != null &&
                  scenario.scenario.isNotEmpty &&
                  scenario.feedback.trim().isNotEmpty &&
                  level.brief['activity']!.startsWith('Solve a realistic')
              ? JourneyPractice(
                  prompt: scenario.scenario.join('\n\n'),
                  items: [scenario.feedback],
                  recall: true,
                )
              : recall == null
              ? null
              : JourneyPractice(
                  prompt: recall.question,
                  items: [recall.answer],
                  recall: true,
                ),
          story: lesson.story.first,
          meaning: lesson.teaching
              .firstWhere((item) => item.text != null)
              .text!,
          source: lesson.evidence,
          question: check.question,
          choices: choices,
          correct: correct,
          feedback: 'Yes. ${check.answer}',
        );
      case 'TAF':
        final [worldNumber, number] = _parts(
          level,
          RegExp(r'^TAF-V(\d+)-M(\d+)$'),
        );
        final world = (await TafsirWorld.load()).firstWhere(
          (item) => item.number == worldNumber,
        );
        final mission = world.missions.firstWhere(
          (item) => item.number == number,
        );
        return JourneyLesson(
          practice: JourneyPractice.match(
            tr(
              'Which daily action did this example teach?',
              'اس مثال میں کون سا روزمرہ عمل سکھایا گیا؟',
            ),
            world.missions
                .where((item) => item.number != number)
                .map((item) => item.action)
                .toList(),
            mission.action,
            level.number,
          ),
          story: mission.story,
          arabic: [for (final ayah in mission.ayahs) ayah.arabic],
          meaning:
              mission.meaning ??
              mission.ayahs
                  .map((ayah) => ayah.meaning)
                  .whereType<String>()
                  .join('\n'),
          source: mission.sourcePath ?? mission.refs,
          question: mission.question,
          choices: mission.options,
          correct: mission.correct,
          feedback: mission.feedback,
        );
      case 'HAJ':
        final course = await HajjCourse.load();
        final mission = course.missions[level.sourceUnit]!;
        final references = mission.evidence
            .map((id) => course.source(id)?['title'])
            .whereType<String>()
            .join(' · ');
        final check =
            mission.checks.where((item) => item.yesNo != null).firstOrNull ??
            mission.checks.firstOrNull;
        final answer = check?.answer ?? mission.teach;
        final interaction = mission.interaction;
        final travelCards = _travelSequences[mission.id];
        final practice = level.brief['activity']!.startsWith('Compare the rite')
            ? JourneyPractice(
                prompt: tr(
                  'Compare what the lesson teaches with what you would do.',
                  'سبق کی تعلیم اور اپنے عمل کا موازنہ کریں۔',
                ),
                items: [
                  tr('What the lesson teaches', 'سبق کی تعلیم'),
                  tr('What to practise', 'کس بات کی مشق کریں'),
                  tr(
                    'What to discuss with an adult',
                    'کسی بڑے سے کس بات پر گفتگو کریں',
                  ),
                ],
                explanations: [mission.teach, mission.play, mission.extend],
              )
            : travelCards != null
            ? JourneyPractice.sequence(
                travelCards,
                prompt: tr(
                  'Put these learning cards in order.',
                  'ان کارڈز کو ترتیب سے رکھیں۔',
                ),
              )
            : switch (interaction?.type) {
                'sequence' => JourneyPractice(
                  prompt: tr(
                    'Put the source cards in order.',
                    'اصل کارڈ ترتیب سے لگائیں۔',
                  ),
                  items: interaction!.items,
                  inOrder: true,
                ),
                'count' => JourneyPractice.match(
                  tr(
                    'How many times did the source lesson show?',
                    'سبق میں کتنی بار دکھایا گیا؟',
                  ),
                  const ['5', '6', '7', '8'],
                  interaction!.count.toString(),
                  level.number,
                ),
                _ => null,
              };
        if (check != null &&
            interaction?.type == 'choice' &&
            interaction?.good != null &&
            interaction?.other != null) {
          return JourneyLesson(
            practice: practice,
            story: mission.teach,
            source: references.isEmpty ? check.source : references,
            question: check.question,
            choices: [interaction!.other!, interaction.good!],
            correct: 1,
            feedback: answer,
          );
        }
        final alternatives = _hajjAlternatives[mission.id];
        if (check != null &&
            check.yesNo == null &&
            alternatives != null &&
            check.question == alternatives.$1) {
          final options = [...alternatives.$2];
          final correct = level.number % (options.length + 1);
          options.insert(correct, answer);
          return JourneyLesson(
            practice: practice,
            story: mission.teach,
            source: references.isEmpty ? check.source : references,
            question: check.question,
            choices: options,
            correct: correct,
            feedback: answer,
          );
        }
        return JourneyLesson(
          practice: practice,
          story: mission.teach,
          source: references.isEmpty
              ? check?.source ?? level.sourceReference
              : references,
          question:
              check?.question ??
              'How would you explain “${mission.title}” in your own words?',
          choices: check?.yesNo == null ? [answer] : const ['Yes', 'No'],
          correct: check?.yesNo == false ? 1 : 0,
          feedback: answer,
          revealAnswer: check?.yesNo == null,
        );
      default:
        throw StateError('No preview activity for ${level.id}');
    }
  }

  static const _salahSequences = <String, List<String>>{
    'P1': [
      'Notice it is prayer time',
      'Pause with family guidance',
      'Return to your activity afterward',
    ],
    'P2': ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    'P3': [
      'Ask a teacher to show Wudu',
      'Follow the steps calmly and save water',
      'Get ready for prayer',
    ],
    'P4': [
      'Find a clean space',
      'Check covering and Qiblah with a trusted adult',
      'Get ready to begin',
    ],
    'P5': ['Takbir', 'Qiyam', 'Ruku', 'Sujud', 'Tashahhud', 'Taslim'],
    'F1': [
      'Complete preparation',
      'Make the intention in your heart',
      'Begin with Takbir',
    ],
    'F3': ['Bow in Ruku', 'Stand up calmly', 'First Sujud'],
    'F4': ['First Sujud', 'Sit between them', 'Second Sujud'],
    'F5': [
      'Final sitting and Tashahhud',
      'Blessings and the sourced supplication as taught',
      'Conclude with Taslim',
    ],
    'F6': ['First rak’ah', 'Second rak’ah', 'Final sitting and Taslim'],
    'F7': [
      'First two rak’ahs',
      'First sitting',
      'Remaining rak’ahs',
      'Final sitting',
    ],
    'F8': [
      'Join the row respectfully',
      'Pay attention to the imam',
      'Follow at the taught time',
    ],
    'S1': [
      'Identify the obligatory prayer',
      'Learn the optional practice with guidance',
      'Keep optional practice alongside the obligatory prayer',
    ],
    'S2': ['Two Sunnah rak’ahs before Fajr', 'Fard Fajr'],
    'S3': [
      'Two before Fajr',
      'Four before Dhuhr',
      'Two after Dhuhr',
      'Two after Maghrib',
      'Two after Isha',
    ],
  };

  static const _travelSequences = <String, List<String>>{
    'U02.1': [
      'Check water and clothing with family',
      'Agree on a meeting point and contact plan',
      'Pack a safe item with a parent',
    ],
    'U02.2': [
      'Notice the disagreement',
      'Apologise or thank the person sincerely',
      'Choose one way to repair things',
    ],
    'U02.3': [
      'Agree how to stay with a trusted adult',
      'Take breaks and drink water',
      'Ask a trusted adult for help if needed',
    ],
    'U03.1': [
      'Ask the guardian about the applicable Miqat',
      'Prepare and enter Ihram as taught',
      'Cross the Miqat',
    ],
    'U03.2': [
      'Ask an adult about the state of Ihram',
      'Separate the clothing from the actions taught',
      'Practise care in shared space',
    ],
    'U03.3': [
      'Listen to an approved Talbiyah recording with a trusted adult',
      'Repeat a short phrase as learning practice',
      'Discuss what the words mean',
    ],
    'U04.1': [
      'Find Masjid al-Haram on the learning map',
      'Enter shared space respectfully',
      'Keep your voice gentle',
    ],
    'U04.2': [
      'Stay with the trusted adult',
      'Choose the route marked by the officials',
      'Walk without pushing',
    ],
    'U05.1': [
      'Locate the starting marker on the learning map',
      'Start the circuit from the reference point',
      'Return to that reference point without pushing',
    ],
  };

  // Alternatives apply only to the exact authored question. If a source
  // changes the question, the original open recall remains available.
  static const _hajjAlternatives = <String, (String, List<String>)>{
    'U02.1': (
      'You have packed three snacks. Your sibling forgot one.',
      [
        'Make fun of them for forgetting.',
        'Hide the snacks and refuse to talk.',
      ],
    ),
    'U02.3': (
      'Another child is tired on the journey.',
      [
        'Tell them to hurry and ignore how they feel.',
        'Leave them alone to catch up.',
      ],
    ),
    'U03.3': (
      'You cannot remember a dua yet.',
      ['Invent the words you cannot remember.', 'Give up after the first try.'],
    ),
    'U04.2': (
      'Your parent says a pathway is crowded.',
      ['Run ahead without the parent.', 'Use an unmarked shortcut alone.'],
    ),
    'U05.1': (
      'People are near the Black Stone.',
      [
        'Push through the crowd to touch it.',
        'Tell everyone they must touch it.',
      ],
    ),
    'U05.2': ('How many complete circuits are in Tawaf?', ['Five.', 'Six.']),
    'U06.2': (
      'You want a drink after Tawaf.',
      ['Waste water on purpose.', 'Rush and knock into other people.'],
    ),
    'U07.2': (
      'From Safa to Marwah counts as what?',
      ['Two Sa‘i lengths.', 'A full round trip back to Safa.'],
    ),
    'U07.3': ('What is the seventh destination?', ['Safa.']),
    'H06.1': (
      'When is Muzdalifah visited in the common Hajj sequence?',
      ['Before Arafat.', 'At midday before standing at Arafat.'],
    ),
    'H12.3': (
      'Your schoolmate cannot travel for Hajj.',
      ['Make fun of them.', 'Treat them as less deserving of respect.'],
    ),
    'Z02.3': (
      'What can love for the Prophet ﷺ inspire?',
      [
        'Make up stories about his life.',
        'Compete to see who gets the most praise.',
      ],
    ),
  };

  static JourneyPractice? _quranPractice(
    String activity,
    List<QuranVerse> verses,
    int number,
  ) {
    if (activity.startsWith('Hide an approved phrase')) {
      final words = verses.first.tokens;
      final position = verses.first.tokenWords.indexed
          .where((entry) => entry.$2 != null)
          .map((entry) => entry.$1)
          .toList();
      if (position.isEmpty) return null;
      final index = position[position.length ~/ 2];
      final hidden = words[index];
      final options = [
        for (final verse in verses)
          for (final (offset, word) in verse.tokenWords.indexed)
            if (word != null) verse.tokens[offset],
      ];
      final withBlank = [...words]..[index] = 'ـ ـ ـ';
      return JourneyPractice.match(
        '${tr('Which word completes this ayah?', 'اس آیت میں کون سا لفظ آئے گا؟')}\n\n${withBlank.join(' ')}',
        options,
        hidden,
        number,
      );
    }
    if (activity.startsWith('Listen, echo and select') && verses.length > 1) {
      return JourneyPractice.match(
        '${tr('Which ayah follows this one?', 'اس کے بعد کون سی آیت آتی ہے؟')}\n\n${verses.first.text}',
        [
          verses.first.text,
          ...verses.skip(2).take(2).map((verse) => verse.text),
        ],
        verses[1].text,
        number,
      );
    }
    if (activity.startsWith('Explain the approved meaning guide')) {
      return JourneyPractice(
        prompt: tr(
          'Try to recall the ayah with an adult. Open the source text to compare when you are ready.',
          'کسی بڑے کے ساتھ آیت یاد سے پڑھنے کی کوشش کریں۔ تیار ہوں تو اصل متن سے ملائیں۔',
        ),
        items: [verses.first.text],
        recall: true,
      );
    }
    return null;
  }
}
