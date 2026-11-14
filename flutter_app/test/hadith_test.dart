import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
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
      'NotoNaskhArabic',
    )..addFont(rootBundle.load('assets/fonts/noto-naskh-arabic.ttf'))).load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });

  test('five lessons preserve the source registry and Arabic chunks', () {
    expect(lessons.length, 5);
    expect(lessons.map((l) => l.id).toSet().length, 5);
    expect(lessons.map((l) => l.sourceUrl), [
      'https://sunnah.com/bukhari:6094',
      'https://sunnah.com/bukhari:33',
      'https://sunnah.com/bukhari:6018',
      'https://sunnah.com/bukhari:10',
      'https://sunnah.com/bukhari:3559',
    ]);
    for (final l in lessons) {
      expect(l.chunks.join(' '), l.arabic);
      expect(l.answers.length, 3);
      expect(l.answers.where((a) => a.correct).length, 1);
      expect(l.action, isNotEmpty);
    }
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
      await tap(tester, 'hadith-answer-1');
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
      expect(find.text('1 of 5 lessons explored'), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
      await boot(tester, store);
      expect(find.text('1 of 5 lessons explored'), findsOneWidget);
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
    'all five lessons open with their own questions and source-linked text',
    (tester) async {
      viewport(tester);
      final store = MemoryHadithStore();
      store.data = {
        for (final l in lessons) l.id: const HadithProgress(step: 3),
      };
      await boot(tester, store);
      for (var i = 0; i < 5; i++) {
        await tap(tester, 'hadith-lesson-${i + 1}');
        expect(find.text(lessons[i].question), findsOneWidget);
        final correct = lessons[i].answers.indexWhere((a) => a.correct);
        await tap(tester, 'hadith-answer-$correct');
        await tap(tester, 'hadith-next');
        expect(find.text(lessons[i].action), findsOneWidget);
        await tap(tester, 'hadith-next');
        await tap(tester, 'hadith-next');
      }
      expect(find.text('5 of 5 lessons explored'), findsOneWidget);
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
