import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/audio/voice.dart';
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/data/hadith_course.dart';
import 'package:imaan_akhlaq/screens/hadith_screen.dart';
import 'package:imaan_akhlaq/screens/learning_experience.dart';
import 'app_test.dart' show viewport;

class MemoryHadithStore implements HadithProgressStore {
  Map<String, HadithProgress> data = {};
  bool failWrites = false;
  @override
  Future<Map<String, HadithProgress>> load() async => {...data};
  @override
  Future<void> save(Map<String, HadithProgress> next) async {
    if (failWrites) throw StateError('Unavailable');
    data = {...next};
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  late List<HadithLesson> lessons;
  setUpAll(() async {
    lessons = await HadithLesson.load();
    await (FontLoader('AppSans')
          ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
        .load();
    await (FontLoader(
      'Fredoka',
    )..addFont(rootBundle.load('assets/fonts/fredoka.ttf'))).load();
    await (FontLoader(
      'NotoNaskhArabic',
    )..addFont(rootBundle.load('assets/fonts/noto-naskh-arabic.ttf'))).load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });

  test('100 lessons preserve the source registry and Arabic chunks', () {
    expect(lessons.length, 100);
    expect(lessons.map((l) => l.id).toSet().length, 100);
    expect(lessons.map((l) => l.number), List.generate(100, (i) => i + 1));
    expect(lessons.take(5).map((l) => l.sourceUrl), [
      'https://sunnah.com/bukhari:6094',
      'https://sunnah.com/bukhari:33',
      'https://sunnah.com/bukhari:6018',
      'https://sunnah.com/bukhari:10',
      'https://sunnah.com/bukhari:3559',
    ]);
    final refs = <String>{};
    for (final l in lessons) {
      expect(l.chunks.join(' '), l.arabic, reason: l.id);
      expect(l.chunks.length, inInclusiveRange(2, 4), reason: l.id);
      expect(l.answers.length, 3, reason: l.id);
      expect(l.answers.where((a) => a.correct).length, 1, reason: l.id);
      expect(l.answers.every((a) => a.feedback.isNotEmpty), isTrue);
      expect(l.action, isNotEmpty);
      expect(l.story, isNotEmpty);
      expect(l.label, isNotEmpty, reason: l.id);
      expect(l.excerpt, l.label.contains('EXCERPT'), reason: l.id);
      expect(l.world, (l.number - 1) ~/ 5 + 1, reason: l.id);
      expect(
        l.sourceDocument,
        l.number <= 50
            ? 'Imaan_Akhlaq_50_Hadith_Curriculum_Interactive_Developer_Edition.docx'
            : 'Imaan_Akhlaq_Hadith_51_to_100_New_Authentic_Actions.docx',
      );
      // Every reference is a distinct primary narration and the URL matches.
      final ref = l.sourceUrl.replaceFirst('https://sunnah.com/', '');
      expect(refs.add(ref), isTrue, reason: '${l.id} repeats $ref');
      expect(l.source.endsWith(' ${ref.split(':').last}'), isTrue);
    }
    // Spot checks against the supplied documents.
    final byNo = {for (final l in lessons) l.number: l};
    expect(byNo[51]!.title, 'Be the First to Make Peace');
    expect(byNo[51]!.source, 'Sahih al-Bukhari 6077');
    expect(byNo[73]!.source, 'Jamiʿ at-Tirmidhi 2910');
    expect(byNo[73]!.label, contains('HASAN'));
    expect(byNo[100]!.source, 'Sahih Muslim 2328a');
    expect(byNo[14]!.explanation, contains('Aishah'));
    for (final n in [77, 79, 80, 82, 94, 97, 100]) {
      expect(byNo[n]!.label, contains('NARRATOR'), reason: '$n');
    }
  });

  test('20 worlds of five lessons each cover the curriculum', () async {
    final worlds = await HadithLesson.loadWorlds();
    expect(worlds.length, 20);
    for (var i = 0; i < 20; i++) {
      expect(worlds[i].number, i + 1);
      expect(worlds[i].first, i * 5 + 1);
      expect(worlds[i].last, i * 5 + 5);
      expect(lessons.where(worlds[i].contains).length, 5);
    }
    expect(worlds.first.title, 'My Words and Honesty');
    expect(worlds.last.title, 'Little Sunnahs, Big Character');
  });

  test(
    'device adapter survives reopening and keeps learner scopes separate',
    () async {
      final values = <String, String>{};
      DeviceHadithProgressStore store(String scope) =>
          DeviceHadithProgressStore(
            scope: scope,
            readValue: (key) async => values[key],
            writeValue: (key, value) async {
              values[key] = value;
            },
          );
      final p = HadithProgress(
        step: 4,
        choice: 1,
        completedAt: DateTime.utc(2026, 11, 15),
        reflection: 'notYet',
      );
      await store('learner-a').save({'hadith-01': p});
      final reloaded = await store('learner-a').load();
      expect(reloaded['hadith-01']?.reflection, 'notYet');
      expect(reloaded['hadith-01']?.completedAt, DateTime.utc(2026, 11, 15));
      expect(await store('guest').load(), isEmpty);
      expect(await store('learner-b').load(), isEmpty);
    },
  );

  test('unreadable local progress is not silently replaced', () async {
    var writes = 0;
    final store = DeviceHadithProgressStore(
      scope: 'guest',
      readValue: (_) async => '{broken',
      writeValue: (_, _) async {
        writes++;
      },
    );
    await expectLater(store.load(), throwsStateError);
    expect(writes, 0);
    final safe = HadithProgress.fromMap({
      'step': 90,
      'choice': -3,
      'reflection': 'invalid',
    });
    expect(safe.step, 4);
    expect(safe.choice, isNull);
    expect(safe.reflection, isNull);
  });

  Future<void> boot(WidgetTester tester, MemoryHadithStore store) async {
    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: appTheme(),
        home: HadithCourseScreen(scope: 'guest', store: store),
      ),
    );
    await tester.pumpAndSettle();
  }

  Future<void> tap(WidgetTester tester, String key) async {
    final finder = find.byKey(Key(key));
    final list = find.byKey(const Key('hadith-lesson-list'));
    if (finder.evaluate().isEmpty && list.evaluate().isNotEmpty) {
      // The lesson list builds lazily; scroll until the row exists.
      await tester.scrollUntilVisible(
        finder,
        300,
        scrollable: find.descendant(
          of: list,
          matching: find.byType(Scrollable),
        ),
      );
    }
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  testWidgets(
    'story to action plan and optional reflection persist without awarding worship points',
    (tester) async {
      viewport(tester);
      final store = MemoryHadithStore();
      await boot(tester, store);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/hadith-course.png'),
      );
      await tap(tester, 'hadith-lesson-1');
      expect(find.text('A moment with Imaan & Akhlaq'), findsOneWidget);
      await tap(tester, 'hadith-next');
      expect(find.text(lessons.first.arabic), findsOneWidget);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/hadith-understand.png'),
      );
      await tap(tester, 'hadith-next');
      await tap(tester, 'hadith-hide-words');
      expect(find.byKey(const Key('hadith-memory-hidden')), findsOneWidget);
      expect(find.text(lessons.first.chunks.first), findsNothing);
      await tap(tester, 'hadith-next');
      await tap(tester, 'hadith-answer-0');
      expect(
        tester
            .widget<FilledButton>(find.byKey(const Key('hadith-next')))
            .onPressed,
        isNull,
      );
      expect(find.text(lessons.first.answers[0].feedback), findsOneWidget);
      expect(VoiceGuide.instance.played.last, VoiceLine.tryAgain);
      await tap(tester, 'hadith-answer-1');
      expect(VoiceGuide.instance.played.last, VoiceLine.correct);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/hadith-choose.png'),
      );
      await tap(tester, 'hadith-next');
      expect(find.text(lessons.first.action), findsOneWidget);
      expect(store.data['hadith-01']?.explored, false);
      await tap(tester, 'hadith-next');
      expect(store.data['hadith-01']?.explored, true);
      expect(store.data['hadith-01']?.reflection, isNull);
      await tap(tester, 'hadith-reflect-notYet');
      await tap(tester, 'hadith-save-reflection');
      expect(store.data['hadith-01']?.reflection, 'notYet');
      await tap(tester, 'hadith-next');
      await tester.drag(
        find.byKey(const Key('hadith-lesson-list')),
        const Offset(0, 2000),
      );
      await tester.pumpAndSettle();
      expect(find.text('1 of 100 lessons explored'), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
      await boot(tester, store);
      expect(find.text('1 of 100 lessons explored'), findsOneWidget);
      await tap(tester, 'hadith-lesson-1');
      expect(find.text('A small step to try'), findsOneWidget);
    },
  );

  testWidgets(
    'failed saving leaves the lesson at the same step and permits retry',
    (tester) async {
      viewport(tester);
      final store = MemoryHadithStore()..failWrites = true;
      await boot(tester, store);
      await tap(tester, 'hadith-lesson-1');
      await tap(tester, 'hadith-next');
      expect(find.text('Story'), findsOneWidget);
      expect(find.byKey(const Key('hadith-save-error')), findsOneWidget);
      expect(store.data, isEmpty);
      store.failWrites = false;
      await tap(tester, 'hadith-next');
      expect(find.text('Understand'), findsOneWidget);
      expect(store.data['hadith-01']?.step, 1);
    },
  );

  testWidgets(
    'all 100 lessons open by world with their own questions and actions',
    (tester) async {
      viewport(tester);
      final store = MemoryHadithStore();
      store.data = {
        for (final l in lessons) l.id: const HadithProgress(step: 3),
      };
      await boot(tester, store);
      // Only the world holding the next lesson starts open.
      expect(find.byKey(const Key('hadith-lesson-1')), findsOneWidget);
      expect(find.byKey(const Key('hadith-lesson-6')), findsNothing);
      for (var i = 0; i < lessons.length; i++) {
        if (i % 5 == 0 && i > 0) {
          await tap(tester, 'hadith-world-${i ~/ 5 + 1}');
        }
        await tap(tester, 'hadith-lesson-${i + 1}');
        expect(find.text(lessons[i].question), findsOneWidget);
        final correct = lessons[i].answers.indexWhere((a) => a.correct);
        final wrong = (correct + 1) % 3;
        await tap(tester, 'hadith-answer-$wrong');
        expect(find.text(lessons[i].answers[wrong].feedback), findsOneWidget);
        await tap(tester, 'hadith-answer-$correct');
        await tap(tester, 'hadith-next');
        expect(find.text(lessons[i].action), findsOneWidget);
        await tap(tester, 'hadith-next');
        await tap(tester, 'hadith-next');
        expect(store.data[lessons[i].id]?.explored, isTrue);
      }
      await tester.pumpWidget(const SizedBox());
      await boot(tester, store);
      expect(find.text('100 of 100 lessons explored'), findsOneWidget);
      expect(find.byKey(const Key('hadith-continue')), findsNothing);
    },
    timeout: const Timeout(Duration(minutes: 5)),
  );

  testWidgets(
    'continue opens the next lesson and narrator reports are labelled',
    (tester) async {
      viewport(tester);
      final store = MemoryHadithStore();
      store.data = {
        for (final l in lessons.take(76))
          l.id: HadithProgress(
            step: 4,
            completedAt: DateTime.utc(2026, 11, 15),
          ),
      };
      await boot(tester, store);
      expect(find.text('76 of 100 lessons explored'), findsOneWidget);
      expect(find.text('Next: lesson 77'), findsOneWidget);
      await tap(tester, 'hadith-continue');
      expect(find.text(lessons[76].title), findsOneWidget);
      await tap(tester, 'hadith-next');
      expect(find.byKey(const Key('hadith-narrator-note')), findsOneWidget);
      expect(
        find.text('Curriculum note: ${lessons[76].label}'),
        findsOneWidget,
      );
    },
  );

  testWidgets('small phone and large text fit every lesson step', (
    tester,
  ) async {
    viewport(tester, scale: 1.6);
    tester.view.physicalSize = const Size(320, 740);
    final store = MemoryHadithStore();
    await boot(tester, store);
    await tap(tester, 'hadith-lesson-1');
    for (var step = 0; step < 5; step++) {
      expect(tester.takeException(), isNull);
      if (step == 3) await tap(tester, 'hadith-answer-1');
      await tap(tester, 'hadith-next');
    }
    expect(find.text('A small step to try'), findsOneWidget);
    expect(tester.takeException(), isNull);
    // The longest Arabic passage and every world header also fit.
    await tap(tester, 'hadith-next');
    for (var w = 2; w <= 19; w++) {
      await tap(tester, 'hadith-world-$w');
      expect(tester.takeException(), isNull);
    }
    await tap(tester, 'hadith-lesson-94');
    for (var step = 0; step < 5; step++) {
      expect(tester.takeException(), isNull);
      if (step == 3) {
        final correct = lessons[93].answers.indexWhere((a) => a.correct);
        await tap(tester, 'hadith-answer-$correct');
      }
      await tap(tester, 'hadith-next');
    }
    expect(find.text('A small step to try'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('school course preview stays gated from the Individual sample', (
    tester,
  ) async {
    viewport(tester);
    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: appTheme(),
        home: Builder(
          builder: (context) => Scaffold(
            body: TextButton(
              onPressed: () => showCourseDetails(context, 1),
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('hadith-course')), findsNothing);
    expect(find.textContaining('In preparation.'), findsOneWidget);
  });
}
