import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/courses/quran/quran_course.dart';
import 'package:imaan_akhlaq/courses/quran/quran_data.dart';
import 'package:imaan_akhlaq/courses/quran/quran_progress.dart';
import 'package:imaan_akhlaq/courses/quran/quran_screens.dart';
import 'package:imaan_akhlaq/courses/registry.dart';

class MemoryQuranStore implements QuranProgressStore {
  QuranProgress data = const QuranProgress();
  bool failWrites = false;
  @override
  Future<QuranProgress> load() async => data;
  @override
  Future<void> save(QuranProgress next) async {
    if (failWrites) throw StateError('Unavailable');
    data = next;
  }
}

void viewport(WidgetTester tester, {double scale = 1}) {
  tester.view.physicalSize = const Size(375, 812);
  tester.view.devicePixelRatio = 1;
  tester.platformDispatcher.textScaleFactorTestValue = scale;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
    tester.platformDispatcher.clearTextScaleFactorTestValue();
  });
}

/// Fixed seed: the grown-up question is 'What is a × b?'.
int adultAnswer(WidgetTester tester) {
  final q = tester.widget<Text>(find.byKey(const Key('quran-adult-question'))).data!;
  final m = RegExp(r'(\d+) × (\d+)').firstMatch(q)!;
  return int.parse(m[1]!) * int.parse(m[2]!);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late QuranCourseData d;
  late Map<String, dynamic> raw;
  setUpAll(() async {
    final text = await rootBundle.loadString(quranFrameworkAsset);
    raw = jsonDecode(text) as Map<String, dynamic>;
    d = await QuranCourseData.load();
    await (FontLoader('AppSans')
          ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
        .load();
    await (FontLoader('Fredoka')
          ..addFont(rootBundle.load('assets/fonts/fredoka.ttf')))
        .load();
  });

  group('source data', () {
    test('records the source and carries no Qur’an text or audio', () {
      expect(raw['source'], 'Imaan_Akhlaq_Masnun_Quran_Recitation_Hifz_Developer_Framework.docx');
      expect(raw['reviewStatus'], contains('Scholarly review required'));
      // No Arabic script anywhere: ayat must come from a verified dataset.
      final arabic = RegExp(r'[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]');
      expect(arabic.hasMatch(jsonEncode(raw).replaceAll('ﷺ', '')), isFalse);
      expect(jsonEncode(raw), isNot(contains('audio_url')));
    });

    test('30 Juz in order, contiguous, covering 1:1 to 114:6', () {
      expect(d.juz.map((z) => z.number), List.generate(30, (i) => i + 1));
      expect(d.juz.first.start, const AyahRef(1, 1));
      expect(d.juz.last.end, const AyahRef(114, 6));
      for (var i = 1; i < 30; i++) {
        expect(d.juz[i - 1].end.compareTo(d.juz[i].start) < 0, isTrue);
      }
    });

    test('every selected range resolves to its own Juz, in canonical order', () {
      for (final z in d.juz) {
        for (final s in z.selections) {
          expect(z.containsRange(s.range), isTrue, reason: 'Juz ${z.number} ${s.range}');
          expect(d.passage(s.passageId).range.contains(s.range), isTrue);
        }
        final starts = z.selections.map((s) => s.range.start).toList();
        expect([...starts]..sort(), starts);
      }
    });

    test('acceptance: 2:285–286 in Juz 3 and Yā-Sīn spans Juz 22/23 as one lesson', () {
      expect(d.passage('Q2_285_286').juz, [3]);
      final yasin = d.passage('Q36_1_83');
      expect(yasin.juz, [22, 23]);
      expect(yasin.range.ayahs.length, 83);
      final parts = [
        for (final z in d.juz)
          for (final s in z.selections)
            if (s.passageId == yasin.id) s,
      ];
      expect(parts.map((s) => s.range.label), ['36:1–27', '36:28–83']);
      expect(parts.every((s) => s.continuation != null), isTrue);
      // Chunks cover the surah with no gap, repeat or reordering.
      expect([for (final c in yasin.chunks) ...c.ayahs], yasin.range.ayahs);
    });

    test('Masnūn M01–M11 keep citations; elective claims are never made', () {
      expect(d.masnun.map((m) => m.id), [for (var i = 1; i <= 11; i++) 'M${i.toString().padLeft(2, '0')}']);
      for (final m in d.masnun) {
        expect(m.sourceUrl, startsWith('https://sunnah.com/'));
        expect(d.passage(m.passageId).labels, contains('M'));
        expect(d.passage(m.passageId).juz, contains(m.juz));
      }
      expect(d.passage('Q56_1_96').labels, ['H']);
      expect(d.passage('Q36_1_83').labels, ['H']);
      expect(d.passage('Q56_1_96').publicationRule, contains('do not assert a guaranteed protection from poverty'));
    });

    test('Juz 30 inventory has all 37 surahs with matching ayah counts', () {
      expect(d.juz30.map((s) => s.surah), List.generate(37, (i) => 78 + i));
      for (final s in d.juz30) {
        expect(d.passage(s.id).range.count, s.ayahCount);
        expect(d.passage(s.id).juz, [30]);
      }
    });

    test('learning road starts with Al-Fātiḥah and uses each passage once', () {
      final ids = d.road.expand((p) => p.passageIds).toList();
      expect(ids.first, 'Q1_1_7');
      expect(ids.toSet().length, ids.length);
      expect(d.road.map((p) => p.phase), [
        'Foundation', 'Early Hifz', 'Growing recall', 'Masnūn selections', 'Extended Hifz', 'Advanced optional',
      ]);
      // Every Juz 30 surah appears somewhere on the road.
      for (final s in d.juz30) {
        expect(ids, contains(s.id));
      }
    });
  });

  group('revision engine', () {
    final t0 = DateTime.utc(2026, 11, 15, 9);
    late RevisionEngine e;
    setUp(() => e = RevisionEngine(d.revision.intervalsDays));

    test('intervals are the source policy', () {
      expect(d.revision.intervalsDays, [0, 1, 3, 7, 14, 30, 60]);
      expect(d.revision.mastery.last, 'Retained After Review');
    });

    test('retained needs a delayed review, not one success', () {
      var p = e.recall(const PassageProgress(), RecallResult.onMyOwn, t0);
      expect(p.mastery, Mastery.independent);
      expect(p.nextReview, t0);
      p = e.review(p, ReviewResult.confident, t0.add(const Duration(hours: 2)));
      expect(p.mastery, Mastery.independent, reason: 'same day is not delayed');
      expect(p.intervalIndex, 1);
      p = e.review(p, ReviewResult.confident, t0.add(const Duration(days: 1, hours: 2)));
      expect(p.mastery, Mastery.retained);
      expect(p.intervalIndex, 2);
      expect(p.nextReview, t0.add(const Duration(days: 4, hours: 2)));
    });

    test('interval grows to about every 60 days and stays there', () {
      var p = e.recall(const PassageProgress(), RecallResult.onMyOwn, t0);
      for (var i = 0; i < 10; i++) {
        p = e.review(p, ReviewResult.confident, p.nextReview!);
      }
      expect(p.intervalIndex, 6);
      expect(p.nextReview!.difference(p.lastReview!), const Duration(days: 60));
    });

    test('prompting shortens; re-learning returns to listen + echo', () {
      var p = e.recall(const PassageProgress(step: 4), RecallResult.onMyOwn, t0);
      for (var i = 0; i < 3; i++) {
        p = e.review(p, ReviewResult.confident, p.nextReview!);
      }
      expect(p.intervalIndex, 3);
      p = e.review(p, ReviewResult.prompting, p.nextReview!);
      expect(p.intervalIndex, 2);
      expect(p.mastery, Mastery.withHelp);
      p = p.copyWith(approvedAt: t0);
      p = e.review(p, ReviewResult.relearn, t0.add(const Duration(days: 20)));
      expect(p.step, 0);
      expect(p.mastery, Mastery.practicing);
      expect(p.nextReview, isNull);
      expect(p.approvedAt, isNull);
      expect(p.reviews.length, 5);
    });

    test('help or still practising never schedules as learnt', () {
      final h = e.recall(const PassageProgress(), RecallResult.withHelp, t0);
      expect(h.mastery, Mastery.withHelp);
      expect(h.firstRecallAt, isNull);
      expect(h.nextReview, t0.add(const Duration(days: 1)));
      final s = e.recall(const PassageProgress(), RecallResult.stillPractising, t0);
      expect(s.nextReview, isNull);
    });

    test('pause hides due reviews', () {
      final p = QuranProgress(passages: {
        'Q1_1_7': e.recall(const PassageProgress(), RecallResult.onMyOwn, t0),
      });
      expect(p.due(t0), ['Q1_1_7']);
      expect(p.copyWith(paused: true).due(t0), isEmpty);
    });
  });

  test('device store survives reopening and keeps learner scopes apart', () async {
    final values = <String, String>{};
    DeviceQuranProgressStore store(String scope) => DeviceQuranProgressStore(
      scope: scope,
      readValue: (k) async => values[k],
      writeValue: (k, v) async => values[k] = v,
    );
    final e = RevisionEngine(d.revision.intervalsDays);
    final t = DateTime.utc(2026, 11, 15);
    final p = e.review(
      e.recall(const PassageProgress(step: 5, repetitions: 7, chunksDone: {1}), RecallResult.onMyOwn, t),
      ReviewResult.confident,
      t.add(const Duration(days: 1)),
      byAdult: true,
    ).copyWith(approvedAt: t);
    await store('learner-a').save(QuranProgress(experience: 'guided', passages: {'Q112_1_4': p}));
    final back = await store('learner-a').load();
    final q = back.of('Q112_1_4');
    expect(back.experience, 'guided');
    expect(q.mastery, Mastery.retained);
    expect(q.repetitions, 7);
    expect(q.chunksDone, {1});
    expect(q.reviews.single.byAdult, isTrue);
    expect(q.approvedAt, t);
    expect(await store('guest').load(), isA<QuranProgress>().having((x) => x.passages, 'passages', isEmpty));
    values[store('broken').key] = '{oops';
    expect(store('broken').load(), throwsStateError);
  });

  test('course is registered as playable at index 0', () {
    expect(courseEntry(0), same(quranCourse));
    expect(quranCourse.subtitle, contains('pending review'));
  });

  Future<MemoryQuranStore> pumpCourse(
    WidgetTester tester, {
    double scale = 1,
    MemoryQuranStore? store,
    DateTime? now,
  }) async {
    viewport(tester, scale: scale);
    final s = store ?? MemoryQuranStore();
    await tester.pumpWidget(
      MaterialApp(
        home: QuranCompanionScreen(
          scope: 'learner-a',
          store: s,
          clock: () => now ?? DateTime(2026, 11, 15, 10),
          random: Random(1),
        ),
      ),
    );
    await tester.pumpAndSettle();
    return s;
  }

  /// Scrolls the page's list (down, then back up) until [f] is built.
  Future<void> seek(WidgetTester tester, Finder f) async {
    final list = find.byType(Scrollable).first;
    try {
      await tester.scrollUntilVisible(f, 250, scrollable: list, maxScrolls: 80);
    } on StateError {
      await tester.scrollUntilVisible(f, -250, scrollable: list, maxScrolls: 80);
    }
    await tester.pumpAndSettle();
  }

  Future<void> tapKey(WidgetTester tester, String key) async {
    final f = find.byKey(Key(key));
    if (f.evaluate().isEmpty) await seek(tester, f);
    await tester.ensureVisible(f);
    await tester.pumpAndSettle();
    await tester.tap(f);
    await tester.pumpAndSettle();
  }

  for (final scale in [1.0, 2.0]) {
    testWidgets('home, paths and Juz browser fit 375 px at text ×$scale', (tester) async {
      final st = await pumpCourse(tester, scale: scale);
      expect(find.text('New lesson'), findsOneWidget);
      await seek(tester, find.text('Arabic text and recitation audio pending review'));
      await tester.scrollUntilVisible(find.byKey(const Key('quran-placement')), -250, scrollable: find.byType(Scrollable).first);
      await tapKey(tester, 'quran-experience-guided');
      expect(st.data.experience, 'guided');
      expect(find.byKey(const Key('quran-experience'), skipOffstage: false), findsOneWidget);

      await tapKey(tester, 'quran-path-masnun');
      await seek(tester, find.text('Āyat al-Kursī'));
      await tester.pageBack();
      await tester.pumpAndSettle();

      await tapKey(tester, 'quran-path-hifz');
      await seek(tester, find.text('Order pending editor approval'));
      await tester.pageBack();
      await tester.pumpAndSettle();

      await tapKey(tester, 'quran-open-juz');
      await tapKey(tester, 'quran-juz-23');
      expect(find.textContaining('Part 2 of 2'), findsOneWidget);
      await tester.pageBack();
      await tester.pumpAndSettle();
      await tapKey(tester, 'quran-juz-30');
      await seek(tester, find.text('All surahs of Juz 30'));
      await seek(tester, find.byKey(const Key('quran-passage-Q114_1_6')));
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('six-step lesson, review and adult approval on the device', (tester) async {
    var now = DateTime(2026, 11, 15, 10);
    final store = MemoryQuranStore();
    viewport(tester, scale: 1.5);
    await tester.pumpWidget(
      MaterialApp(
        home: QuranCompanionScreen(
          scope: 'learner-a',
          store: store,
          clock: () => now,
          random: Random(1),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tapKey(tester, 'quran-next-step'); // New lesson: Al-Fātiḥah
    expect(find.byKey(const Key('quran-lesson')), findsOneWidget);
    expect(find.text('1:1–7'), findsOneWidget);
    expect(find.text('Recitation audio pending review'), findsOneWidget);
    await tapKey(tester, 'quran-next');
    expect(find.text('Arabic text pending verified Uthmānī import'), findsOneWidget);
    await seek(tester, find.text('1:7'));
    await tapKey(tester, 'quran-next');
    await tapKey(tester, 'quran-said-it');
    await tapKey(tester, 'quran-said-it');
    expect(find.textContaining('Repetitions so far: 2'), findsOneWidget);
    await tapKey(tester, 'quran-next');
    await seek(tester, find.byKey(const Key('quran-sunnah-context')));
    await seek(tester, find.text('Source: Ṣaḥīḥ al-Bukhārī 756'));
    await seek(tester, find.text('Child-friendly meaning pending review'));
    await tapKey(tester, 'quran-next');
    final next = tester.widget<FilledButton>(find.byKey(const Key('quran-next')));
    expect(next.onPressed, isNull, reason: 'recall result is required');
    await tapKey(tester, 'quran-recall-onMyOwn');
    await tapKey(tester, 'quran-next');
    await seek(tester, find.text('Next review: Today.'));
    final saved = store.data.of('Q1_1_7');
    expect(saved.mastery, Mastery.independent);
    expect(saved.repetitions, 2);
    expect(saved.step, 5);
    await tapKey(tester, 'quran-next');

    // Today’s review from the home screen, then a delayed review → retained.
    expect(find.text('Today’s review'), findsOneWidget);
    await tapKey(tester, 'quran-next-step');
    await tapKey(tester, 'quran-review-Q1_1_7');
    await tapKey(tester, 'quran-outcome-confident');
    expect(find.text('Coming up'), findsOneWidget);
    expect(store.data.of('Q1_1_7').mastery, Mastery.independent);
    await tester.pageBack();
    await tester.pumpAndSettle();

    // Parent/teacher: wrong answer stays out, right answer opens and approves.
    await tapKey(tester, 'quran-open-adult');
    await tester.enterText(find.byKey(const Key('quran-adult-answer')), '1');
    await tapKey(tester, 'quran-adult-enter');
    expect(find.byKey(const Key('quran-adult')), findsNothing);
    await tapKey(tester, 'quran-open-adult');
    await tester.enterText(find.byKey(const Key('quran-adult-answer')), '${adultAnswer(tester)}');
    await tapKey(tester, 'quran-adult-enter');
    expect(find.byKey(const Key('quran-adult')), findsOneWidget);
    await tapKey(tester, 'quran-adult-approve-Q1_1_7');
    expect(store.data.of('Q1_1_7').approvedAt, isNotNull);
    await tapKey(tester, 'quran-pause');
    expect(store.data.paused, isTrue);
    await tapKey(tester, 'quran-adult-reassign-Q1_1_7');
    final r = store.data.of('Q1_1_7');
    expect(r.reassigned, isTrue);
    expect(r.mastery, Mastery.practicing);
    expect(r.approvedAt, isNull);
    expect(tester.takeException(), isNull);
  });

  testWidgets('a failed save keeps the step and says so', (tester) async {
    final store = MemoryQuranStore()..failWrites = true;
    await pumpCourse(tester, store: store);
    await tapKey(tester, 'quran-next-step');
    await tapKey(tester, 'quran-next');
    expect(find.byKey(const Key('quran-save-error')), findsOneWidget);
    expect(find.text('Step 1 of 6'), findsOneWidget);
  });
}
