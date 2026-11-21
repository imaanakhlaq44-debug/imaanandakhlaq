import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/courses/duas/duas_data.dart';
import 'package:imaan_akhlaq/courses/quran/quran_text.dart';
import 'package:imaan_akhlaq/data/journey_lessons.dart';
import 'package:imaan_akhlaq/data/learning_journey.dart';
import 'package:imaan_akhlaq/screens/guest_shell.dart';
import 'package:imaan_akhlaq/screens/journey_screen.dart';

class _JourneyMemoryStore implements JourneyStore {
  _JourneyMemoryStore(this.record);
  JourneyRecord record;

  @override
  Future<JourneyRecord> load() async => record;

  @override
  Future<JourneyRecord> save(JourneyRecord record) async =>
      this.record = record;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'guest home shows the mission preview before publication',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: GuestShell(onSignIn: () {}, onCreateAccount: () {}),
        ),
      );
      await tester.pumpAndSettle();
      final entry = find.byKey(const Key('continue-journey'));
      await tester.ensureVisible(entry);
      await tester.tap(entry);
      await tester.pumpAndSettle();
      expect(find.text('Inside a mission'), findsOneWidget);
      expect(find.text('Start mission'), findsNothing);
    },
    skip: learningJourneyEnabled,
  );

  testWidgets(
    'public Journey opens the bundled curriculum without an approval lookup',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => TextButton(
                onPressed: () => openLearningJourney(
                  context,
                  'guest',
                  store: _JourneyMemoryStore(const JourneyRecord()),
                ),
                child: const Text('Open Journey'),
              ),
            ),
          ),
        ),
      );
      final map = find.byKey(const Key('journey-map-overview'));
      await tester.runAsync(() async {
        await tester.tap(find.text('Open Journey'));
        for (
          var attempt = 0;
          attempt < 100 && map.evaluate().isEmpty;
          attempt++
        ) {
          await Future<void>.delayed(const Duration(milliseconds: 20));
          await tester.pump();
        }
      });
      expect(map, findsOneWidget);
      expect(find.text('0 of 1000 levels complete'), findsOneWidget);
    },
    skip: !learningJourneyRelease,
  );

  test('catalogue follows the source order and includes Hajj at 11', () async {
    final catalogue = await loadJourneyPreview();
    expect(
      catalogue.map((level) => level.number),
      orderedEquals(List.generate(1000, (i) => i + 1)),
    );
    expect(catalogue.first.sourceUnit, 'DUA-V01-L01');
    expect(catalogue[1].sourceUnit, 'QUR-1:1–7');
    expect(catalogue[10].world, 'HAJ');
    expect(catalogue[393].stations, ['IA-0005', 'IA-0080']);
    expect(catalogue.last.stations, hasLength(8));
    expect(JourneyLane.parentLed.includes(catalogue[1]), isTrue);
    expect(JourneyLane.parentLed.includes(catalogue.last), isFalse);
    final senior = catalogue.firstWhere(
      (level) => level.sourceUnit == 'RHD-L4-24',
    );
    expect(JourneyLane.guided.includes(senior), isFalse);
    expect(JourneyLane.core.includes(senior), isFalse);
    expect(JourneyLane.advanced.includes(senior), isTrue);
    final guidedStations = JourneyLesson.stationLevels(
      catalogue.last,
      catalogue,
      lane: JourneyLane.guided,
    );
    expect(guidedStations, hasLength(8));
    expect(guidedStations.every(JourneyLane.guided.includes), isTrue);
    final guidedIds = JourneyLane.guided
        .eligibleLevels(catalogue)
        .map((level) => level.id)
        .toSet();
    expect(
      catalogue
          .where((level) => guidedIds.contains(level.id) && level.comparison)
          .every((level) => level.stations.every(guidedIds.contains)),
      isTrue,
    );
    expect(await journeyReleaseHash(), matches(RegExp(r'^[0-9a-f]{64}$')));
    expect(catalogue[60].difficulty, 'Moderate');
    expect(catalogue.where((level) => level.checkpoint), hasLength(21));
    expect(
      catalogue.where((level) => level.cumulative).map((level) => level.number),
      [60, 200, 600, 1000],
    );
    expect(
      JourneyLesson.stationLevels(
        catalogue[59],
        catalogue,
      ).map((level) => level.world).toSet(),
      hasLength(4),
    );
  });

  test('all 1,000 levels load source content and usable activities', () async {
    final catalogue = await loadJourneyPreview();
    final failures = <String>[];
    for (final level in catalogue) {
      try {
        final stations = await JourneyLesson.loadStations(level, catalogue);
        if (level.world == 'QUR') {
          final lesson = stations.first;
          expect(lesson.listeningClip, isNotNull, reason: level.id);
          expect(lesson.revealAnswer, isFalse, reason: level.id);
          final activity = level.brief['activity']!;
          if (activity.startsWith('Hide an approved phrase')) {
            expect(
              lesson.practice?.prompt,
              contains('ـ ـ ـ'),
              reason: level.id,
            );
          }
          if (activity.startsWith('Listen, echo and select')) {
            expect(
              lesson.practice?.items[lesson.practice!.correct],
              lesson.verses[1].text,
              reason: level.id,
            );
          }
          if (activity.startsWith('Explain the approved meaning guide')) {
            expect(lesson.practice?.recall, isTrue, reason: level.id);
          }
        }
        if (level.id == 'IA-0068') {
          expect(
            stations.first.verses.map((verse) => verse.key),
            orderedEquals(List.generate(7, (index) => '1:${index + 1}')),
          );
          expect(stations.first.listeningClip, isNotNull);
        }
        if (const {
          'IA-0164',
          'IA-0069',
          'IA-0061',
          'IA-0585',
        }.contains(level.id)) {
          expect(stations.first.practice?.inOrder, isTrue, reason: level.id);
        }
        if (const {'IA-0209', 'IA-0752'}.contains(level.id)) {
          expect(
            stations.first.practice?.explanations,
            isNotEmpty,
            reason: level.id,
          );
        }
        for (final lesson in stations) {
          expect(lesson.story.trim(), isNotEmpty, reason: level.id);
          expect(lesson.source.trim(), isNotEmpty, reason: level.id);
          expect(lesson.question.trim(), isNotEmpty, reason: level.id);
          if (lesson.practice case final JourneyPractice exercise) {
            expect(exercise.prompt.trim(), isNotEmpty, reason: level.id);
            expect(exercise.items, isNotEmpty, reason: level.id);
            expect(
              exercise.explanations.isEmpty ||
                  exercise.explanations.length == exercise.items.length,
              isTrue,
              reason: level.id,
            );
            expect(
              exercise.items.every((value) => value.trim().isNotEmpty),
              isTrue,
              reason: level.id,
            );
            expect(
              exercise.correct,
              inInclusiveRange(0, exercise.items.length - 1),
              reason: level.id,
            );
          }
          expect(
            lesson.choices.length,
            greaterThan(lesson.revealAnswer ? 0 : 1),
            reason: level.id,
          );
          expect(
            lesson.correct,
            inInclusiveRange(0, lesson.choices.length - 1),
            reason: level.id,
          );
          for (final (index, choice) in lesson.choices.indexed) {
            expect(choice.trim(), isNotEmpty, reason: level.id);
            expect(
              lesson.feedbackFor(index).trim(),
              isNotEmpty,
              reason: level.id,
            );
          }
        }
      } catch (error, stack) {
        failures.add(
          '${level.id} ${level.sourceUnit}: $error\n${stack.toString().split('\n').where((line) => line.contains('JourneyLesson')).firstOrNull}',
        );
      }
    }
    expect(failures, isEmpty, reason: failures.join('\n'));

    final now = DateTime.utc(2026, 11, 20);
    var progress = const JourneyRecord();
    for (final level in catalogue) {
      expect(progress.next(catalogue, now), level);
      progress = JourneyRecord.decode(progress.finish(level, now).encode());
    }
    expect(progress.next(catalogue, now), isNull);
    expect(progress.levels, hasLength(1000));
  });

  test(
    'saved completion unlocks the next level and queues spaced reviews',
    () async {
      final catalogue = await loadJourneyPreview();
      final first = catalogue[0];
      final second = catalogue[1];
      final started = DateTime.utc(2026, 11, 20, 14);
      const empty = JourneyRecord();
      expect(empty.next(catalogue, started), first);
      expect(empty.unlocked(catalogue, second), isFalse);

      var record = JourneyRecord.decode(empty.finish(first, started).encode());
      expect(record.next(catalogue, started), second);
      expect(record.finish(first, started), same(record));
      var date = record.levels[first.id]!.nextReviewAt!;
      expect(date.difference(started).inDays, 1);
      expect(record.next(catalogue, date), first);

      record = record.finish(first, date);
      var due = record.levels[first.id]!.nextReviewAt!;
      expect(due.difference(date).inDays, 3);
      date = due.add(
        const Duration(days: 5),
      ); // Returning late keeps the review usable.
      expect(record.next(catalogue, date), first);
      record = record.finish(first, date);
      due = record.levels[first.id]!.nextReviewAt!;
      expect(due.difference(date).inDays, 7);
      record = JourneyRecord.decode(record.finish(first, due).encode());
      expect(record.levels[first.id]!.nextReviewAt, isNull);
      expect(record.levels[first.id]!.completedAt, started);
      expect(record.next(catalogue, due), second);
      expect(record.unlocked(catalogue, catalogue[2]), isFalse);
    },
  );

  test(
    'sync merges concurrent completions without losing review progress',
    () async {
      final catalogue = await loadJourneyPreview();
      final now = DateTime.utc(2026, 11, 21);
      final earlier = const JourneyRecord().finish(catalogue.first, now);
      final later = const JourneyRecord()
          .finish(catalogue.first, now.add(const Duration(hours: 1)))
          .finish(catalogue.first, now.add(const Duration(days: 2)))
          .finish(catalogue[1], now.add(const Duration(days: 2)));
      final merged = earlier.merge(later);
      expect(merged.levels, later.merge(earlier).levels);
      expect(merged.levels, hasLength(2));
      expect(merged.levels[catalogue.first.id]?.completedAt, now);
      expect(merged.levels[catalogue.first.id]?.reviewCount, 1);
    },
  );

  testWidgets(
    'Level 2 supports recitation matching, correct order and saving',
    (tester) async {
      final preparation = await tester.runAsync(() async {
        final catalogue = await loadJourneyPreview();
        return (catalogue, await JourneyLesson.load(catalogue[1]));
      });
      final (catalogue, lesson) = preparation!;
      final first = catalogue[0];
      final second = catalogue[1];
      final now = DateTime.utc(2026, 11, 21);
      final store = _JourneyMemoryStore(
        const JourneyRecord().finish(first, now),
      );
      final players = <SilentAyahAudio>[];
      final originalPlayer = AyahAudio.create;
      AyahAudio.create = () {
        final player = SilentAyahAudio();
        players.add(player);
        return player;
      };
      addTearDown(() => AyahAudio.create = originalPlayer);
      await tester.runAsync(() async {
        await tester.pumpWidget(
          MaterialApp(
            home: JourneyScreen(
              store: store,
              now: () => now,
              loadCatalogue: () async => catalogue,
            ),
          ),
        );
        await Future<void>.delayed(Duration.zero);
        await tester.pump();
      });
      await tester.pumpAndSettle();

      Future<void> tapLabel(String label) async {
        final target = find.text(label);
        await tester.ensureVisible(target);
        await tester.pumpAndSettle();
        await tester.tap(target, warnIfMissed: true);
        await tester.pumpAndSettle();
      }

      expect(find.text('Amanpur Journey Map'), findsOneWidget);
      expect(find.text('1 of 1000 levels complete'), findsOneWidget);
      final recitation = find.byKey(const Key('quran-recitation'));
      final startMission = find.byKey(const Key('journey-start-mission'));
      await tester.runAsync(() async {
        await tester.tap(find.byKey(const Key('journey-play-next')));
        for (
          var attempt = 0;
          attempt < 100 && startMission.evaluate().isEmpty;
          attempt++
        ) {
          await Future<void>.delayed(const Duration(milliseconds: 20));
          await tester.pump();
        }
      });
      expect(find.text('Inside this mission'), findsOneWidget);
      expect(find.text('Put the ayahs in order'), findsOneWidget);
      expect(recitation, findsNothing);
      await tapLabel('Start mission');
      expect(recitation, findsOneWidget);
      await tester.pumpAndSettle();
      expect(find.text('Step 1 of 4 · Explore'), findsOneWidget);
      await tapLabel('Start activity');
      await tapLabel('Skip this reflection');
      await tapLabel('Listen to the ayah');
      expect(find.text('Step 2 of 4 · Practise'), findsOneWidget);
      expect(players.last.played, [lesson.listeningClip]);
      await tapLabel(lesson.listeningChoices[lesson.listeningAnswer]);
      await tapLabel('Continue');
      expect(find.text('Put these ayahs in Qur’anic order'), findsOneWidget);
      for (final verse in lesson.verses) {
        await tapLabel(verse.text);
      }
      await tapLabel('Continue');
      await tapLabel(lesson.choices[lesson.correct]);
      await tapLabel('Continue');
      expect(find.text(second.brief['decision']!), findsOneWidget);
      expect(find.text('Step 3 of 4 · Think'), findsOneWidget);
      await tapLabel('Continue');
      expect(find.text(second.brief['dailyAction']!), findsOneWidget);
      expect(find.text('Step 4 of 4 · Apply'), findsOneWidget);
      await tapLabel('Save and finish');
      expect(store.record.levels[second.id], isNotNull);
      await tapLabel('Open the map');
      expect(find.text('2 of 1000 levels complete'), findsOneWidget);
    },
  );

  test(
    'first two levels reuse the bundled dua and complete Quran passage',
    () async {
      final dua = DuaVolume.fromJson(
        await rootBundle.loadString(DuaVolume.assetFor(1)),
      ).lessons.firstWhere((lesson) => lesson.id == 'dua-001');
      expect(dua.arabic, isNotEmpty);
      expect(dua.source, contains('5376'));

      final text = await QuranText.load();
      for (var ayah = 1; ayah <= 7; ayah++) {
        expect(text.verses['1:$ayah']?.text, isNotEmpty);
      }
    },
  );
}
