import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import '../story_cards_test.dart' show storyShown;
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/courses/registry.dart';
import 'package:imaan_akhlaq/courses/taleem/taleem_data.dart';
import 'package:imaan_akhlaq/courses/taleem/taleem_screens.dart';
import '../app_test.dart' show viewport;

class MemoryTaleemStore implements TaleemProgressStore {
  Map<String, TaleemProgress> data = {};
  bool failWrites = false;
  @override
  Future<Map<String, TaleemProgress>> load() async => {...data};
  @override
  Future<void> save(Map<String, TaleemProgress> next) async {
    if (failWrites) throw StateError('Unavailable');
    data = {...next};
  }
}

/// The email curriculum's extracted text, when it is on this machine.
const _sourceFolder =
    r'C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14\extracted\08-Taleem-ul-Islam';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  late List<TaleemEdition> editions;
  setUpAll(() async {
    editions = await TaleemEdition.load();
    for (final (family, files) in [
      ('AppSans', ['roboto-regular.ttf', 'roboto-bold.ttf']),
      ('NotoNaskhArabic', ['noto-naskh-arabic.ttf']),
      ('Fredoka', ['fredoka.ttf']),
    ]) {
      final loader = FontLoader(family);
      for (final f in files) {
        loader.addFont(rootBundle.load('assets/fonts/$f'));
      }
      await loader.load();
    }
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });

  test('four age editions keep the declared journeys and lessons', () {
    expect(editions.map((e) => e.ages), ['6–8', '9–10', '11–12', '13–14']);
    expect(editions.map((e) => e.title), [
      'The Beginning of Guidance',
      'Understanding Guidance',
      'Living the Guidance',
      'Carrying the Guidance',
    ]);
    expect(editions.map((e) => e.lessons.length), [21, 26, 27, 27]);
    expect(courseEntry(7), isNotNull);
    final ids = <String>{};
    for (final e in editions) {
      expect(e.journeys.length, 9);
      expect(e.status, startsWith('EDITORIAL WORKING EDITION'));
      for (final (i, l) in e.lessons.indexed) {
        expect(ids.add(l.id), isTrue, reason: l.id);
        expect(l.number, i + 1);
        expect(l.story, isNotEmpty);
        expect(l.teaching, isNotEmpty);
        expect(l.questions.length, e.volume == 1 ? 3 : 4, reason: l.id);
        expect(l.reflect, isNotEmpty);
        expect(l.remember.length, 3);
        expect(l.evidence, isNotEmpty);
        // Volume 01 has no "Decide" scenarios; the later volumes all do.
        expect(l.decide == null, e.volume == 1, reason: l.id);
      }
    }
    final kalimah = editions[0].lessons[1].teaching.where(
      (t) => t.arabic != null,
    );
    expect(
      kalimah.first.arabic,
      'لَا إِلَٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ',
    );
  });

  test(
    'every teaching line is word for word from the source text',
    () {
      final folder = Directory(_sourceFolder);
      for (final e in editions) {
        final file = folder.listSync().whereType<File>().firstWhere(
          (f) => f.path.contains('Volume_0${e.volume}_'),
        );
        final lines = file.readAsLinesSync().map((l) => l.trim()).toSet();
        final source = lines.join('\n');
        expect(lines, contains(e.welcome));
        for (final l in e.lessons) {
          for (final s in [
            l.title,
            ...l.story,
            ...l.reflect,
            for (final t in l.teaching) ...[?t.text, ?t.arabic, ?t.meaning],
            for (final q in l.questions) ...[
              'Q. ${q.question}',
              'A. ${q.answer}',
            ],
            ...?l.decide?.scenario,
          ]) {
            expect(lines, contains(s), reason: '${l.id}: $s');
          }
          for (final s in [
            l.objective,
            l.evidence,
            l.dailyAction,
            l.tryTogether,
            l.keyWords,
            l.parentNote,
            ...l.remember,
            ?l.decide?.feedback,
          ]) {
            expect(source, contains(s), reason: '${l.id}: $s');
          }
        }
      }
    },
    skip: Directory(_sourceFolder).existsSync()
        ? false
        : 'Source curriculum is not on this machine',
  );

  test('device progress survives reopening and keeps scopes apart', () async {
    final values = <String, String>{};
    DeviceTaleemProgressStore store(String scope) => DeviceTaleemProgressStore(
      scope: scope,
      readValue: (key) async => values[key],
      writeValue: (key, value) async {
        values[key] = value;
      },
    );
    await store('learner-a').save({
      'taleem-v2-l05': TaleemProgress(
        step: 5,
        completedAt: DateTime.utc(2026, 11, 15),
        reflection: 'tried',
        checks: const {0, 2},
      ),
    });
    final back = (await store('learner-a').load())['taleem-v2-l05']!;
    expect(back.reflection, 'tried');
    expect(back.checks, {0, 2});
    expect(back.explored, isTrue);
    expect(await store('guest').load(), isEmpty);

    var writes = 0;
    final broken = DeviceTaleemProgressStore(
      scope: 'guest',
      readValue: (_) async => '{broken',
      writeValue: (_, _) async => writes++,
    );
    await expectLater(broken.load(), throwsStateError);
    expect(writes, 0);
    final safe = TaleemProgress.fromMap({
      'step': 99,
      'reflection': 'bad',
      'checks': [1, -1, 'x'],
    });
    expect(safe.step, taleemSteps.length - 1);
    expect(safe.reflection, isNull);
    expect(safe.checks, {1});
  });

  Future<void> boot(WidgetTester tester, MemoryTaleemStore store) async {
    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: appTheme(),
        home: TaleemHomeScreen(scope: 'guest', store: store),
      ),
    );
    await tester.pumpAndSettle();
  }

  Future<void> tap(WidgetTester tester, String key) async {
    final finder = find.byKey(Key(key));
    if (finder.evaluate().isEmpty) {
      await tester.scrollUntilVisible(
        finder,
        300,
        scrollable: find.byType(Scrollable).first,
      );
    }
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  bool nextEnabled(WidgetTester tester) =>
      tester
          .widget<FilledButton>(find.byKey(const Key('taleem-next')))
          .onPressed !=
      null;

  testWidgets('age edition to lesson summary saves progress on the device', (
    tester,
  ) async {
    viewport(tester);
    final store = MemoryTaleemStore();
    await boot(tester, store);
    expect(find.text('0 of 101 lessons explored'), findsOneWidget);
    await tap(tester, 'taleem-edition-2');
    final lesson = editions[1].lessons.first;
    await tap(tester, 'taleem-lesson-${lesson.id}');
    expect(storyShown(lesson.story.first), findsOneWidget);
    await tap(tester, 'taleem-next');
    expect(find.text(lesson.evidence), findsOneWidget);
    await tap(tester, 'taleem-next');
    // Questions: answers stay hidden until the learner taps each card.
    expect(find.text(lesson.questions.first.answer), findsNothing);
    expect(nextEnabled(tester), isFalse);
    for (var i = 0; i < lesson.questions.length; i++) {
      await tap(tester, 'taleem-reveal-$i');
    }
    expect(find.text(lesson.questions.last.answer), findsOneWidget);
    expect(nextEnabled(tester), isTrue);
    await tap(tester, 'taleem-next');
    expect(find.text(lesson.reflect.first), findsOneWidget);
    expect(nextEnabled(tester), isFalse);
    await tap(tester, 'taleem-decide-reveal');
    expect(find.text(lesson.decide!.feedback), findsOneWidget);
    await tap(tester, 'taleem-next');
    expect(find.text(lesson.dailyAction), findsOneWidget);
    await tap(tester, 'taleem-next');
    await tap(tester, 'taleem-check-1');
    expect(store.data[lesson.id]?.checks, {1});
    expect(store.data[lesson.id]?.explored, isFalse);
    await tap(tester, 'taleem-next');
    expect(store.data[lesson.id]?.explored, isTrue);
    await tap(tester, 'taleem-reflect-yes');
    await tap(tester, 'taleem-save-reflection');
    expect(store.data[lesson.id]?.reflection, 'yes');
    await tap(tester, 'taleem-next');
    expect(find.text('Explored • You tried your action'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, 4000));
    await tester.pumpAndSettle();
    expect(find.text('1 of 26 lessons explored'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, 4000));
    await tester.pumpAndSettle();
    expect(find.text('1 of 101 lessons explored'), findsOneWidget);
    expect(find.text('1/26'), findsOneWidget);
  });

  testWidgets('a failed save keeps the step and allows a retry', (
    tester,
  ) async {
    viewport(tester);
    final store = MemoryTaleemStore()..failWrites = true;
    await boot(tester, store);
    await tap(tester, 'taleem-edition-1');
    await tap(tester, 'taleem-lesson-taleem-v1-l01');
    await tap(tester, 'taleem-next');
    expect(find.text('Discover'), findsOneWidget);
    expect(find.byKey(const Key('taleem-save-error')), findsOneWidget);
    store.failWrites = false;
    await tap(tester, 'taleem-next');
    expect(find.text('Understand'), findsOneWidget);
    expect(store.data['taleem-v1-l01']?.step, 1);
  });

  testWidgets(
    'all 101 lessons play through at 375 px with large text',
    (tester) async {
      viewport(tester, scale: 1.6);
      tester.view.physicalSize = const Size(375, 812);
      for (final e in editions) {
        for (final l in e.lessons) {
          var saved = const TaleemProgress();
          await tester.pumpWidget(
            MaterialApp(
              theme: appTheme(),
              home: TaleemLessonScreen(
                key: ValueKey(l.id),
                edition: e,
                lesson: l,
                progress: saved,
                onSave: (p) async => saved = p,
              ),
            ),
          );
          await tester.pumpAndSettle();
          for (var step = 0; step < taleemSteps.length; step++) {
            expect(tester.takeException(), isNull, reason: '${l.id} $step');
            if (step == 2) {
              for (var i = 0; i < l.questions.length; i++) {
                await tap(tester, 'taleem-reveal-$i');
              }
            }
            if (step == 3 && l.decide != null) {
              await tap(tester, 'taleem-decide-reveal');
            }
            await tap(tester, 'taleem-next');
          }
          expect(saved.explored, isTrue, reason: l.id);
          expect(find.textContaining('You explored'), findsOneWidget);
          expect(tester.takeException(), isNull);
        }
      }
    },
    timeout: const Timeout(Duration(minutes: 5)),
  );

  testWidgets('home and edition lists fit a small phone with large text', (
    tester,
  ) async {
    viewport(tester, scale: 1.6);
    tester.view.physicalSize = const Size(320, 740);
    await boot(tester, MemoryTaleemStore());
    for (var v = 1; v <= 4; v++) {
      await tap(tester, 'taleem-edition-$v');
      await tester.drag(find.byType(ListView), const Offset(0, -4000));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.pageBack();
      await tester.pumpAndSettle();
    }
    expect(tester.takeException(), isNull);
  });
}
