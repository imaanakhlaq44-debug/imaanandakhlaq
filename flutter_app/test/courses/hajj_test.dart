import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/courses/hajj/hajj_course.dart';
import 'package:imaan_akhlaq/courses/hajj/hajj_data.dart';
import 'package:imaan_akhlaq/courses/hajj/hajj_home.dart';
import 'package:imaan_akhlaq/courses/hajj/hajj_mission.dart';
import 'package:imaan_akhlaq/courses/registry.dart';
import '../app_test.dart' show viewport;

class MemoryHajjStore implements HajjProgressStore {
  HajjProgress data = const HajjProgress();
  bool failWrites = false;
  @override
  Future<HajjProgress> load() async => data;
  @override
  Future<void> save(HajjProgress next) async {
    if (failWrites) throw StateError('Unavailable');
    data = next;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  late HajjCourse course;
  setUpAll(() async {
    course = await HajjCourse.load();
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

  test('course is registered at index 6 and opens the Journey screen', () {
    expect(courseEntry(6), same(hajjCourse));
    expect(hajjCourse.open('guest'), isA<HajjCourseScreen>());
  });

  test('24 worlds and 72 unique missions map to their worlds (T03)', () {
    expect(course.worlds.length, 24);
    expect(course.missions.length, 72);
    for (final w in course.worlds) {
      expect(w.missionIds.length, 3);
      for (final id in w.missionIds) {
        expect(course.missions[id]!.worldId, w.id);
      }
    }
    final ids = [for (final a in course.adventures) ...a.worldIds];
    expect(ids.toSet().length, 24);
    expect(course.adventures.map((a) => a.worldIds.length), [10, 12, 2]);
    expect(course.raw['religiousReview'], 'pending');
    for (final m in course.missions.values) {
      expect(m.teach, isNotEmpty);
      expect(m.action, isNotEmpty);
      expect(m.evidence, isNotEmpty);
      for (final e in m.evidence) {
        expect(course.source(e), isNotNull, reason: '${m.id} $e');
      }
      for (final d in m.duaIds) {
        expect(course.duas.map((x) => x.id), contains(d));
      }
    }
  });

  test('duas keep the guide text verbatim with their sources', () {
    expect(course.duas.length, 14);
    final talbiyah = course.dua('D01');
    expect(
      talbiyah.arabic,
      // Code points exactly as in the guide (D01, Sahih Muslim 1184a).
      '\u0644\u064e\u0628\u0651\u064e\u064a\u0652\u0643\u064e \u0627\u0644\u0644\u0651\u064e\u0647\u064f\u0645\u0651\u064e \u0644\u064e\u0628\u0651\u064e\u064a\u0652\u0643\u064e\u060c \u0644\u064e\u0628\u0651\u064e\u064a\u0652\u0643\u064e \u0644\u064e\u0627 \u0634\u064e\u0631\u0650\u064a\u0643\u064e \u0644\u064e\u0643\u064e \u0644\u064e\u0628\u0651\u064e\u064a\u0652\u0643\u064e\u060c \u0625\u0650\u0646\u0651\u064e \u0627\u0644\u0652\u062d\u064e\u0645\u0652\u062f\u064e \u0648\u064e\u0627\u0644\u0646\u0651\u0650\u0639\u0652\u0645\u064e\u0629\u064e \u0644\u064e\u0643\u064e \u0648\u064e\u0627\u0644\u0652\u0645\u064f\u0644\u0652\u0643\u064e\u060c \u0644\u064e\u0627 \u0634\u064e\u0631\u0650\u064a\u0643\u064e \u0644\u064e\u0643\u064e',
    );
    expect(talbiyah.source, 'Sahih Muslim 1184a');
    expect(
      course.dua('D03').arabic,
      '\u0631\u064e\u0628\u0651\u0650 \u0632\u0650\u062f\u0652\u0646\u0650\u064a \u0639\u0650\u0644\u0652\u0645\u064b\u0627',
    );
    expect(course.dua('D03').source, 'Qur’an 20:114');
    for (final d in course.duas) {
      if (d.shortEcho != null) expect(d.arabic.startsWith(d.shortEcho!), true);
      expect(d.meaning, isNotEmpty);
      expect(d.source, isNotEmpty);
    }
  });

  test('rite sequences follow the guide (T07, T08)', () {
    expect(course.missions['U10.1']!.interaction!.items, [
      'Ihram',
      'Tawaf 7',
      'Sa‘i 7 lengths',
      'Tahallul',
    ]);
    final sai = course.missions['U07.2']!.interaction!;
    expect(sai.count, 7);
    expect(sai.labels.first, 'Safa → Marwah');
    expect(
      sai.labels.last,
      'Safa → Marwah',
    ); // the seventh length ends at Marwah
    expect(course.missions['U05.2']!.interaction!.count, 7);
    final checks = course.missions.values.expand((m) => m.checks).toList();
    expect(checks.where((c) => c.id.startsWith('Q')).length, 24);
    expect(course.strings('fortyDays').length, 40);
    expect(course.maps('faq', course.parent).length, 10);
    expect(course.maps('routes', course.parent).map((r) => r['route']), [
      'Tamattu‘',
      'Qiran',
      'Ifrad',
    ]);
  });

  test('no points or worship scores in the course data (T21)', () {
    final text = jsonEncode(course.raw['missions']).toLowerCase();
    expect(text.contains('points'), false);
    expect(text.contains('coins'), false);
  });

  test(
    'device store keeps scopes apart and never wipes unreadable data',
    () async {
      final values = <String, String>{};
      DeviceHajjProgressStore store(String scope) => DeviceHajjProgressStore(
        scope: scope,
        readValue: (k) async => values[k],
        writeValue: (k, v) async => values[k] = v,
      );
      final p = const HajjProgress(age: '10–14', days: {3, 40}).withMission(
        'U01.1',
        HajjMissionProgress(
          step: 3,
          learnedAt: DateTime.utc(2026, 11, 15),
          parentMarked: true,
          reflection: 'again',
        ),
      );
      await store('learner-a').save(p);
      final back = await store('learner-a').load();
      expect(back.age, '10–14');
      expect(back.days, {3, 40});
      expect(back.mission('U01.1').parentMarked, true);
      expect(back.mission('U01.1').reflection, 'again');
      expect(back.mission('U01.1').learnedAt, DateTime.utc(2026, 11, 15));
      expect((await store('guest').load()).missions, isEmpty);

      var writes = 0;
      final broken = DeviceHajjProgressStore(
        scope: 'guest',
        readValue: (_) async => '{broken',
        writeValue: (_, _) async => writes++,
      );
      await expectLater(broken.load(), throwsStateError);
      expect(writes, 0);
      final safe = HajjMissionProgress.fromMap({'step': 99, 'reflection': 'x'});
      expect(safe.step, 4);
      expect(safe.reflection, isNull);
    },
  );

  Future<void> boot(WidgetTester tester, MemoryHajjStore store) async {
    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: appTheme(),
        home: HajjCourseScreen(scope: 'guest', store: store),
      ),
    );
    await tester.pumpAndSettle();
  }

  Future<void> tap(WidgetTester tester, Finder finder) async {
    // Rows outside the list's built range: scroll down, then up, to reach them.
    final built = find.byElementPredicate(
      (e) => finder.evaluate().contains(e),
      skipOffstage: false,
    );
    if (finder.evaluate().isEmpty && built.evaluate().isEmpty) {
      final list = find.byType(Scrollable).first;
      try {
        await tester.scrollUntilVisible(finder, 200, scrollable: list);
      } on StateError {
        await tester.scrollUntilVisible(finder, -200, scrollable: list);
      }
    }
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  /// Text of a keyed Text near the top of the page (scrolls back up first).
  Future<String?> keyText(WidgetTester tester, String key) async {
    await tester.drag(find.byType(Scrollable).first, const Offset(0, 3000));
    await tester.pumpAndSettle();
    return tester.widget<Text>(find.byKey(Key(key))).data;
  }

  Future<void> tapKey(WidgetTester tester, String key) =>
      tap(tester, find.byKey(Key(key)));

  /// Plays the open mission from its current step to the notebook page.
  Future<void> playMission(WidgetTester tester, HajjMission m) async {
    for (var s = 0; s < m.steps.length; s++) {
      expect(tester.takeException(), isNull);
      final step = tester
          .widget<Text>(find.byKey(const Key('hajj-step-title')))
          .data;
      if (step == 'Try it') {
        final it = m.interaction;
        if (it?.type == 'sequence') {
          for (var i = 0; i < it!.items.length; i++) {
            await tapKey(tester, 'hajj-seq-$i');
          }
        } else if (it?.type == 'count') {
          for (var i = 0; i < it!.count; i++) {
            await tapKey(tester, 'hajj-count-$i');
          }
        } else if (it?.type == 'choice') {
          await tapKey(tester, 'hajj-choice-other');
          expect(find.byKey(const Key('hajj-choice-feedback')), findsOneWidget);
          await tapKey(tester, 'hajj-choice-good');
        }
        for (var n = 0; n < m.checks.length; n++) {
          final card = find.byKey(Key('hajj-check-$n'));
          final yes = find.descendant(
            of: card,
            matching: find.byKey(const Key('hajj-check-yes')),
          );
          await tap(
            tester,
            yes.evaluate().isNotEmpty
                ? yes
                : find.descendant(
                    of: card,
                    matching: find.byKey(const Key('hajj-check-show')),
                  ),
          );
          expect(find.text(m.checks[n].answer), findsOneWidget);
        }
        if (it == null && m.checks.isEmpty) {
          await tapKey(tester, 'hajj-practised');
        }
      }
      await tapKey(tester, 'hajj-next');
    }
    expect(find.text('A new page in your notebook'), findsOneWidget);
  }

  testWidgets(
    'Umrah mission plays from the map, saves, and a grown-up marks the action',
    (tester) async {
      viewport(tester);
      final store = MemoryHajjStore();
      await boot(tester, store);
      expect(find.text('0 of 72 missions explored'), findsOneWidget);
      await tapKey(tester, 'hajj-adventure-umrah');
      await tapKey(tester, 'hajj-mission-U01.2');
      expect(find.text('Step 1 of 5'), findsOneWidget);
      await tapKey(tester, 'hajj-next');
      expect(find.text(course.missions['U01.2']!.teach), findsOneWidget);
      await tapKey(tester, 'hajj-next');
      expect(find.text(course.dua('D03').arabic), findsOneWidget);
      await tapKey(tester, 'hajj-hide-words');
      expect(find.byKey(const Key('hajj-words-hidden')), findsOneWidget);
      await tapKey(tester, 'hajj-next');
      // Try it: the next button waits for the sequence and the check.
      expect(
        tester
            .widget<FilledButton>(find.byKey(const Key('hajj-next')))
            .onPressed,
        isNull,
      );
      await tapKey(tester, 'hajj-seq-2'); // wrong card first: a gentle nudge
      expect(find.textContaining('Try another card'), findsOneWidget);
      for (var i = 0; i < 4; i++) {
        await tapKey(tester, 'hajj-seq-$i');
      }
      await tapKey(tester, 'hajj-check-no');
      expect(find.text('Yes, that’s right.'), findsOneWidget);
      await tapKey(tester, 'hajj-next');
      expect(store.data.mission('U01.2').learned, false);
      expect(store.data.mission('U01.2').step, 4);
      await tapKey(tester, 'hajj-next');
      expect(store.data.mission('U01.2').learned, true);
      expect(store.data.mission('U01.2').parentMarked, false);
      await tapKey(tester, 'hajj-parent-mark');
      await tapKey(tester, 'hajj-grown-up-yes');
      expect(store.data.mission('U01.2').parentMarked, true);
      await tapKey(tester, 'hajj-reflect-again');
      expect(store.data.mission('U01.2').reflection, 'again');
      await tapKey(tester, 'hajj-next');
      expect(
        find.text('Practised the value • marked by a grown-up'),
        findsOneWidget,
      );
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(
        await keyText(tester, 'hajj-progress-count'),
        '1 of 72 missions explored',
      );
    },
  );

  testWidgets('every one of the 72 missions opens and plays to the end', (
    tester,
  ) async {
    viewport(tester);
    final store = MemoryHajjStore();
    final c = HajjController(
      course: course,
      store: store,
      progress: store.data,
    );
    for (final m in course.missions.values) {
      await tester.pumpWidget(
        MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: appTheme(),
          home: HajjMissionScreen(key: ValueKey(m.id), c: c, missionId: m.id),
        ),
      );
      await tester.pumpAndSettle();
      await playMission(tester, m);
    }
    expect(store.data.learnedCount, 72);
    expect(store.data.missions.values.where((p) => p.parentMarked), isEmpty);
  });

  testWidgets('320 px wide with large text fits every step for all age bands', (
    tester,
  ) async {
    viewport(tester, scale: 1.6);
    tester.view.physicalSize = const Size(320, 740);
    for (final age in hajjAges) {
      final store = MemoryHajjStore()..data = HajjProgress(age: age);
      final c = HajjController(
        course: course,
        store: store,
        progress: store.data,
      );
      for (final id in ['U01.2', 'U07.2', 'U03.3', 'H12.1', 'H05.2', 'Z02.1']) {
        await tester.pumpWidget(
          MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: appTheme(),
            home: HajjMissionScreen(
              key: ValueKey('$age$id'),
              c: c,
              missionId: id,
            ),
          ),
        );
        await tester.pumpAndSettle();
        await playMission(tester, course.missions[id]!);
        expect(tester.takeException(), isNull);
      }
    }
    final store = MemoryHajjStore();
    await boot(tester, store);
    expect(tester.takeException(), isNull);
    for (final key in [
      'hajj-open-duas',
      'hajj-open-places',
      'hajj-open-forty',
    ]) {
      await tapKey(tester, key);
      expect(tester.takeException(), isNull);
      await tester.pageBack();
      await tester.pumpAndSettle();
    }
    await tapKey(tester, 'hajj-adventure-hajj');
    expect(find.byKey(const Key('hajj-safety-gate')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('age band, Dua Studio, 40-day path and Parent Corner', (
    tester,
  ) async {
    viewport(tester);
    final store = MemoryHajjStore();
    await boot(tester, store);
    await tapKey(tester, 'hajj-age-0');
    expect(store.data.age, '3–5');

    await tapKey(tester, 'hajj-open-duas');
    await tapKey(tester, 'hajj-dua-D01');
    expect(find.text(course.dua('D01').shortEcho!), findsOneWidget);
    await tapKey(tester, 'hajj-dua-practised');
    expect(store.data.duas.containsKey('D01'), true);
    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.pageBack();
    await tester.pumpAndSettle();

    await tapKey(tester, 'hajj-open-forty');
    await tapKey(tester, 'hajj-day-1');
    expect(store.data.days, {1});
    expect(
      await keyText(tester, 'hajj-forty-count'),
      '1 of 40 small actions tried',
    );
    await tapKey(tester, 'hajj-day-1');
    expect(store.data.days, isEmpty);
    await tester.pageBack();
    await tester.pumpAndSettle();

    await tapKey(tester, 'hajj-open-parent');
    await tapKey(tester, 'hajj-grown-up-yes');
    expect(find.byKey(const Key('hajj-parent')), findsOneWidget);
    await tapKey(tester, 'hajj-clear');
    await tapKey(tester, 'hajj-clear-yes');
    expect(store.data.duas, isEmpty);
    expect(store.data.age, '3–5');
  });

  testWidgets('a failed save keeps the mission on the same step', (
    tester,
  ) async {
    viewport(tester);
    final store = MemoryHajjStore()..failWrites = true;
    await boot(tester, store);
    await tapKey(tester, 'hajj-adventure-umrah');
    await tapKey(tester, 'hajj-mission-U01.1');
    await tapKey(tester, 'hajj-next');
    expect(find.byKey(const Key('hajj-mission-error')), findsOneWidget);
    expect(find.text('Step 1 of 4'), findsOneWidget);
    store.failWrites = false;
    await tapKey(tester, 'hajj-next');
    expect(find.text('Step 2 of 4'), findsOneWidget);
    expect(store.data.mission('U01.1').step, 1);
  });

  testWidgets('every page offers Ask a trusted adult (T25)', (tester) async {
    viewport(tester);
    await boot(tester, MemoryHajjStore());
    await tapKey(tester, 'hajj-adventure-explore');
    await tapKey(tester, 'hajj-mission-Z01.1');
    await tapKey(tester, 'hajj-ask-adult');
    expect(find.byKey(const Key('hajj-ask-adult-sheet')), findsOneWidget);
  });
}
