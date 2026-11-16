import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import '../story_cards_test.dart' show storyShown;
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/courses/registry.dart';
import 'package:imaan_akhlaq/courses/tafsir/tafsir_data.dart';
import 'package:imaan_akhlaq/courses/tafsir/tafsir_screens.dart';

class MemoryTafsirStore implements TafsirProgressStore {
  Map<String, TafsirProgress> data = {};
  bool failWrites = false;
  @override
  Future<Map<String, TafsirProgress>> load() async => {...data};
  @override
  Future<void> save(Map<String, TafsirProgress> next) async {
    if (failWrites) throw StateError('Unavailable');
    data = {...next};
  }
}

/// 375 px phone; [scale] > 1 checks large accessibility text.
void phone(WidgetTester tester, {double scale = 1}) {
  tester.view.physicalSize = const Size(375, 812);
  tester.view.devicePixelRatio = 1;
  tester.platformDispatcher.textScaleFactorTestValue = scale;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
    tester.platformDispatcher.clearTextScaleFactorTestValue();
  });
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  late List<TafsirWorld> worlds;
  setUpAll(() async {
    worlds = await TafsirWorld.load();
    await (FontLoader('AppSans')
          ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
        .load();
    await (FontLoader(
      'NotoNaskhArabic',
    )..addFont(rootBundle.load('assets/fonts/noto-naskh-arabic.ttf'))).load();
    await (FontLoader(
      'Fredoka',
    )..addFont(rootBundle.load('assets/fonts/fredoka.ttf'))).load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });

  test('course is registered and opens at index 4', () {
    expect(courseEntry(4), isNotNull);
    expect(courseEntry(4)!.open('guest'), isA<TafsirCourseScreen>());
  });

  test('seven source volumes give the manual\'s mission counts', () {
    expect(worlds.map((w) => w.number), [1, 2, 3, 4, 5, 6, 7]);
    // Developer manual, "Learning scope — eight existing worlds".
    expect(worlds.map((w) => w.missions.length), [12, 16, 15, 16, 16, 16, 16]);
    expect(
      worlds.map((w) => w.missions.fold<int>(0, (s, m) => s + m.ayahs.length)),
      [
        18, 75, 35, 49, 20, 30, 27, // Luqman revisits 31:17 in missions 8 and 9
      ],
    );
    final ids = worlds.expand((w) => w.missions).map((m) => m.id).toList();
    expect(ids.length, 107);
    expect(ids.toSet().length, 107);
  });

  test('every mission is complete and keeps its source', () {
    final arabic = RegExp(r'[؀-ۿ]');
    for (final w in worlds) {
      for (final m in w.missions) {
        expect(m.sourceDocument, w.document, reason: m.id);
        expect(m.options.length, 3, reason: m.id);
        expect(m.correct, inInclusiveRange(0, 2), reason: m.id);
        for (final f in [m.title, m.aim, m.story, m.tafsir, m.question]) {
          expect(f, isNotEmpty, reason: m.id);
        }
        expect(m.feedback, isNotEmpty, reason: m.id);
        expect(m.action, isNotEmpty, reason: m.id);
        expect(m.reflection, isNotEmpty, reason: m.id);
        expect(m.ayahs, isNotEmpty, reason: m.id);
        for (final a in m.ayahs) {
          expect(a.ref, matches(RegExp(r'^\d+:\d+$')), reason: m.id);
          expect(arabic.hasMatch(a.arabic), isTrue, reason: m.id);
        }
        // Volumes 1–5 give a meaning per ayah; 6–7 one meaning per passage.
        if (w.number <= 5) {
          expect(m.ayahs.every((a) => a.meaning != null), isTrue, reason: m.id);
        } else {
          expect(m.meaning, isNotNull, reason: m.id);
        }
      }
    }
  });

  test('text is copied verbatim from Volume 01, Mission 01', () {
    final m = worlds.first.missions.first;
    expect(m.title, 'Guidance Comes First');
    // Arabic is checked against the DOCX text by tool/extract_tafsir.mjs.
    expect(m.ayahs.single.arabic, endsWith('﴿1﴾'));
    expect(m.ayahs.single.ref, '49:1');
    expect(
      m.ayahs.single.meaning,
      'Believers should not put their own opinions ahead of Allah and His Messenger; they should be mindful of Allah, Who hears and knows.',
    );
    expect(m.correct, 1);
    expect(
      m.action,
      'Ask a parent or teacher one sincere question about a Sunnah you want to understand, and listen carefully to the answer.',
    );
    expect(m.sourceUrl, 'https://quran.com/49/1');
  });

  test('device progress is per learner and unreadable data is kept', () async {
    final values = <String, String>{};
    DeviceTafsirProgressStore store(String scope) => DeviceTafsirProgressStore(
      scope: scope,
      readValue: (key) async => values[key],
      writeValue: (key, value) async => values[key] = value,
    );
    await store('learner-a').save({
      '01-01': TafsirProgress(
        step: 4,
        choice: 1,
        completedAt: DateTime.utc(2026, 11, 15),
        reflection: 'tried',
      ),
    });
    final back = await store('learner-a').load();
    expect(back['01-01']?.reflection, 'tried');
    expect(back['01-01']?.completedAt, DateTime.utc(2026, 11, 15));
    expect(await store('learner-b').load(), isEmpty);
    expect(await store('guest').load(), isEmpty);

    var writes = 0;
    final broken = DeviceTafsirProgressStore(
      scope: 'guest',
      readValue: (_) async => '{broken',
      writeValue: (_, _) async => writes++,
    );
    await expectLater(broken.load(), throwsStateError);
    expect(writes, 0);
    final safe = TafsirProgress.fromMap({'step': 90, 'choice': 7});
    expect(safe.step, 4);
    expect(safe.choice, isNull);
  });

  Future<void> tap(WidgetTester tester, String key) async {
    final finder = find.byKey(Key(key));
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  testWidgets('world list → mission → story, ayah, decide, act, reflect', (
    tester,
  ) async {
    phone(tester);
    final store = MemoryTafsirStore();
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: TafsirCourseScreen(scope: 'guest', store: store),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('0 of 107 missions explored'), findsOneWidget);

    // World 8 has no source volume: it is shown but does not open.
    await tester.scrollUntilVisible(
      find.byKey(const Key('tafsir-world-8')),
      200,
    );
    await tester.pumpAndSettle();
    expect(find.text('Coming soon'), findsOneWidget);
    await tester.tap(find.byKey(const Key('tafsir-world-8')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('tafsir-world-screen')), findsNothing);

    await tester.scrollUntilVisible(
      find.byKey(const Key('tafsir-world-1')),
      -200,
    );
    await tap(tester, 'tafsir-world-1');
    await tap(tester, 'tafsir-mission-01-01');
    final m = worlds.first.missions.first;
    expect(storyShown(m.story), findsOneWidget);
    await tap(tester, 'tafsir-next');
    expect(find.text(m.ayahs.single.arabic), findsOneWidget);
    await tap(tester, 'tafsir-next');
    expect(find.text(m.tafsir), findsOneWidget);
    await tap(tester, 'tafsir-next');

    FilledButton next() =>
        tester.widget<FilledButton>(find.byKey(const Key('tafsir-next')));
    expect(next().onPressed, isNull);
    await tap(tester, 'tafsir-answer-0');
    expect(next().onPressed, isNull);
    expect(find.text(m.feedback), findsNothing);
    await tap(tester, 'tafsir-answer-1');
    expect(find.text(m.feedback), findsOneWidget);
    await tap(tester, 'tafsir-next');
    expect(find.text(m.action), findsOneWidget);
    await tap(tester, 'tafsir-next');

    expect(find.text('Mission explored'), findsOneWidget);
    expect(find.text(m.reflection), findsOneWidget);
    expect(store.data['01-01']?.explored, isTrue);
    await tap(tester, 'tafsir-reflect-yes');
    await tap(tester, 'tafsir-save-reflection');
    expect(store.data['01-01']?.reflection, 'yes');

    await tap(tester, 'tafsir-next');
    expect(find.text('Explored • You tried your action'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.byKey(const Key('tafsir-world-progress')),
      -200,
    );
    expect(find.text('1 of 12 missions explored'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.byKey(const Key('tafsir-progress-count')),
      -200,
    );
    expect(find.text('1 of 107 missions explored'), findsOneWidget);
  });

  testWidgets('a failed save keeps the learner on the step', (tester) async {
    phone(tester);
    final store = MemoryTafsirStore()..failWrites = true;
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: TafsirCourseScreen(scope: 'guest', store: store),
      ),
    );
    await tester.pumpAndSettle();
    await tap(tester, 'tafsir-world-2');
    await tap(tester, 'tafsir-mission-02-01');
    await tap(tester, 'tafsir-next');
    expect(find.byKey(const Key('tafsir-save-error')), findsOneWidget);
    expect(find.text('Step 1 of 5'), findsOneWidget);
  });

  testWidgets('all 107 missions render every step at 375 px, large text', (
    tester,
  ) async {
    phone(tester, scale: 2);
    for (final w in worlds) {
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: TafsirWorldScreen(
            world: w,
            state: TafsirCourseProgress(MemoryTafsirStore()),
          ),
        ),
      );
      await tester.pump(const Duration(seconds: 1));
      expect(tester.takeException(), isNull, reason: 'world ${w.number}');
      for (final m in w.missions) {
        for (var step = 0; step <= TafsirProgress.lastStep + 1; step++) {
          final done = step > TafsirProgress.lastStep;
          await tester.pumpWidget(
            MaterialApp(
              theme: appTheme(),
              home: TafsirMissionScreen(
                key: ValueKey('${m.id}-$step'),
                mission: m,
                progress: TafsirProgress(
                  step: done ? TafsirProgress.lastStep : step,
                  choice: m.correct,
                  completedAt: done ? DateTime.utc(2026, 11, 15) : null,
                ),
                onSave: (_) async {},
              ),
            ),
          );
          await tester.pump();
          expect(tester.takeException(), isNull, reason: '${m.id} step $step');
        }
      }
    }
  });

  testWidgets('course list fits 375 px with large text', (tester) async {
    phone(tester, scale: 2);
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: TafsirCourseScreen(scope: 'learner', store: MemoryTafsirStore()),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.scrollUntilVisible(
      find.byKey(const Key('tafsir-world-8')),
      200,
    );
    expect(tester.takeException(), isNull);
  });
}
