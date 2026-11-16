import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import '../story_cards_test.dart' show storyShown;
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/courses/duas/duas_course.dart';
import 'package:imaan_akhlaq/courses/duas/duas_data.dart';
import 'package:imaan_akhlaq/courses/duas/duas_screens.dart';
import 'package:imaan_akhlaq/courses/registry.dart';

class MemoryDuaStore implements DuaProgressStore {
  Map<String, DuaProgress> data = {};
  bool failWrites = false;
  @override
  Future<Map<String, DuaProgress>> load() async => {...data};
  @override
  Future<void> save(Map<String, DuaProgress> next) async {
    if (failWrites) throw StateError('Unavailable');
    data = {...next};
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

String squash(String s) => s.replaceAll(
  RegExp(r'[\s۝؛،.,;:!?()\[\]«»"“”' "'" r'’\-٠-٩]'),
  '',
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  late List<DuaVolume> volumes;
  setUpAll(() async {
    volumes = await DuaVolume.loadAll(rootBundle);
    await (FontLoader('AppSans')
          ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
        .load();
    await (FontLoader(
      'NotoNaskhArabic',
    )..addFont(rootBundle.load('assets/fonts/noto-naskh-arabic.ttf'))).load();
  });

  test('registry opens the duas course', () {
    expect(courseEntry(2), same(duasCourse));
    expect(duasCourse.subtitle, contains('100 duas'));
  });

  test('ten volumes hold the 100 duas in order with sources', () {
    expect(volumes.length, 10);
    final all = volumes.expand((v) => v.lessons).toList();
    expect(all.length, 100);
    expect(all.map((l) => l.number), List.generate(100, (i) => i + 1));
    expect(all.map((l) => l.id).toSet().length, 100);
    for (final v in volumes) {
      expect(v.lessons.length, 10);
      expect(v.sourceDocument, startsWith('Zad_al_Qulub_Junior_Volume_'));
      expect(v.reviewStatus, contains('review is required'));
      expect(
        v.lessons.map((l) => (l.number - 1) ~/ 10 + 1).toSet(),
        {v.number},
        reason: 'volume ${v.number} holds its own ten duas',
      );
    }
    for (final l in all) {
      expect(RegExp(r'[ً-ْ]').hasMatch(l.arabic), isTrue);
      expect(l.english, isNotEmpty, reason: l.id);
      expect(l.urdu, isNotNull, reason: l.id);
      expect(l.source, isNotEmpty, reason: l.id);
      expect(l.sourceUrl, startsWith('https://'), reason: l.id);
      expect(l.story, isNotEmpty, reason: l.id);
      expect(l.understand, isNotEmpty, reason: l.id);
      expect(l.action, isNotEmpty, reason: l.id);
      expect(l.reflect, isNotNull, reason: l.id);
      expect(l.memoryChunks, isNotEmpty, reason: l.id);
      if (l.chunksRebuildArabic) {
        expect(squash(l.sourceChunks.join()), squash(l.arabic), reason: l.id);
      }
    }
    // Only these three have source segments that are not the whole text.
    expect(
      all.where((l) => !l.chunksRebuildArabic).map((l) => l.id),
      ['dua-004', 'dua-008', 'dua-067'],
    );
    // The three surahs are memorised one surah at a time.
    expect(all[66].memoryChunks.length, 3);
  });

  test('meaning check offers the right meaning once among three', () {
    for (final v in volumes) {
      for (final l in v.lessons) {
        final c = meaningChoices(l, v.lessons);
        expect(c.length, 3, reason: l.id);
        expect(c.where((m) => m == l.english).length, 1, reason: l.id);
        expect(c.toSet().length, 3, reason: l.id);
      }
    }
  });

  test('device progress keeps learner scopes apart and survives reload', () async {
    final values = <String, String>{};
    DeviceDuaProgressStore store(String scope) => DeviceDuaProgressStore(
      scope: scope,
      readValue: (k) async => values[k],
      writeValue: (k, v) async => values[k] = v,
    );
    await store('learner-a').save({
      'dua-001': DuaProgress(
        step: 4,
        completedAt: DateTime.utc(2026, 11, 15),
        reflection: 'tried',
      ),
    });
    final back = await store('learner-a').load();
    expect(back['dua-001']?.reflection, 'tried');
    expect(back['dua-001']?.explored, isTrue);
    expect(await store('guest').load(), isEmpty);
    expect(values.keys.single, 'imaan.duas.v1.learner-a');
  });

  test('unreadable progress is not replaced and bad values are clamped', () async {
    var writes = 0;
    final store = DeviceDuaProgressStore(
      scope: 'guest',
      readValue: (_) async => '{broken',
      writeValue: (_, _) async => writes++,
    );
    await expectLater(store.load(), throwsStateError);
    expect(writes, 0);
    final p = DuaProgress.fromMap({'step': 99, 'reflection': 'nope'});
    expect(p.step, 4);
    expect(p.reflection, isNull);
  });

  Future<void> boot(WidgetTester tester, MemoryDuaStore store) async {
    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: appTheme(),
        home: DuasCourseScreen(
          scope: 'guest',
          store: store,
          loadVolumes: () async => volumes,
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  Future<void> tap(WidgetTester tester, String key) async {
    final f = find.byKey(Key(key));
    if (f.evaluate().isEmpty) {
      // ListView builds lazily; scroll until the item exists.
      await tester.scrollUntilVisible(
        f,
        300,
        scrollable: find.byType(Scrollable).last,
      );
    }
    await tester.ensureVisible(f);
    await tester.pumpAndSettle();
    await tester.tap(f);
    await tester.pumpAndSettle();
  }

  Future<void> playLesson(WidgetTester tester, DuaVolume v, DuaLesson l) async {
    await tap(tester, 'dua-lesson-${l.number}');
    expect(storyShown(l.story.first), findsOneWidget);
    await tap(tester, 'dua-next');
    expect(find.byKey(const Key('dua-arabic')), findsOneWidget);
    expect(find.text(l.english), findsOneWidget);
    await tap(tester, 'dua-next');
    expect(find.text(l.memorizeSteps), findsOneWidget);
    await tap(tester, 'dua-hide-words');
    expect(find.byKey(const Key('dua-memory-hidden')), findsOneWidget);
    await tap(tester, 'dua-hide-words');
    await tap(tester, 'dua-next');
    final choices = meaningChoices(l, v.lessons);
    final right = choices.indexOf(l.english);
    final wrong = (right + 1) % 3;
    await tap(tester, 'dua-answer-$wrong');
    expect(
      tester.widget<FilledButton>(find.byKey(const Key('dua-next'))).onPressed,
      isNull,
    );
    await tap(tester, 'dua-answer-$right');
    await tap(tester, 'dua-next');
    expect(find.text(l.action), findsOneWidget);
    await tap(tester, 'dua-next');
    expect(find.text('A small step to try'), findsOneWidget);
    await tap(tester, 'dua-next');
  }

  testWidgets('a child plays a dua from volume list to reflection', (
    tester,
  ) async {
    viewport(tester);
    final store = MemoryDuaStore();
    await boot(tester, store);
    expect(find.text('0 of 100 duas explored'), findsOneWidget);
    await tap(tester, 'duas-volume-1');
    final v = volumes.first, l = v.lessons.first;
    await tap(tester, 'dua-lesson-1');
    await tap(tester, 'dua-next');
    await tap(tester, 'dua-source-details');
    expect(find.byKey(const Key('dua-source-sheet')), findsOneWidget);
    expect(find.text(l.editorialNote!), findsOneWidget);
    await tester.tapAt(const Offset(10, 10));
    await tester.pumpAndSettle();
    await tap(tester, 'dua-next'); // remember
    await tap(tester, 'dua-next'); // check
    final choices = meaningChoices(l, v.lessons);
    await tap(tester, 'dua-answer-${choices.indexOf(l.english)}');
    expect(find.text(l.missionFeedback!), findsOneWidget);
    await tap(tester, 'dua-next');
    await tap(tester, 'dua-next');
    expect(store.data['dua-001']?.explored, isTrue);
    expect(find.text(l.reflect!), findsOneWidget);
    await tap(tester, 'dua-reflect-notYet');
    await tap(tester, 'dua-save-reflection');
    expect(store.data['dua-001']?.reflection, 'notYet');
    await tap(tester, 'dua-next');
    expect(find.text('Explored • Action planned'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('Duas 1–10 • 1 of 10 explored'), findsOneWidget);
  });

  testWidgets('building the words only accepts the next part', (tester) async {
    viewport(tester);
    final store = MemoryDuaStore();
    await boot(tester, store);
    await tap(tester, 'duas-volume-1');
    await tap(tester, 'dua-lesson-10'); // three chunks
    await tap(tester, 'dua-next');
    await tap(tester, 'dua-next');
    final chunks = volumes.first.lessons[9].memoryChunks;
    expect(chunks.length, 3);
    await tap(tester, 'dua-build-chunk-2');
    expect(find.byKey(const Key('dua-build-miss')), findsOneWidget);
    for (var i = 0; i < chunks.length; i++) {
      await tap(tester, 'dua-build-chunk-$i');
    }
    expect(find.byKey(const Key('dua-build-done')), findsOneWidget);
  });

  testWidgets('a failed save keeps the step and shows a retry message', (
    tester,
  ) async {
    viewport(tester);
    final store = MemoryDuaStore()..failWrites = true;
    await boot(tester, store);
    await tap(tester, 'duas-volume-2');
    await tap(tester, 'dua-lesson-11');
    await tap(tester, 'dua-next');
    expect(find.byKey(const Key('dua-save-error')), findsOneWidget);
    expect(find.text('Story'), findsOneWidget);
  });

  testWidgets('saved progress reopens where the child left off', (
    tester,
  ) async {
    viewport(tester);
    final store = MemoryDuaStore()
      ..data = {'dua-071': const DuaProgress(step: 2)};
    await boot(tester, store);
    await tap(tester, 'duas-volume-8');
    expect(find.text('Continue from step 3 of 5'), findsOneWidget);
    await tap(tester, 'dua-lesson-71');
    expect(find.text('Remember'), findsOneWidget);
  });

  // Every one of the 100 duas plays through on a 375 px phone with large
  // text, without overflow. Split per volume to keep failures readable.
  for (var vi = 0; vi < 10; vi++) {
    testWidgets('volume ${vi + 1} plays at 375 px with large text', (
      tester,
    ) async {
      viewport(tester, scale: 1.6);
      final store = MemoryDuaStore();
      await boot(tester, store);
      await tap(tester, 'duas-volume-${vi + 1}');
      final v = volumes[vi];
      for (final l in v.lessons) {
        await playLesson(tester, v, l);
      }
      expect(store.data.length, 10);
      expect(store.data.values.every((p) => p.explored), isTrue);
      expect(tester.takeException(), isNull);
    });
  }
}
