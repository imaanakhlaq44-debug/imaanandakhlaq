import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/courses/ibrah/ibrah_course.dart';
import 'package:imaan_akhlaq/courses/ibrah/ibrah_data.dart';
import 'package:imaan_akhlaq/courses/ibrah/ibrah_screens.dart';
import 'package:imaan_akhlaq/courses/registry.dart';

class MemoryIbrahStore implements IbrahProgressStore {
  IbrahProgress data = const IbrahProgress();
  bool failWrites = false;
  int writes = 0;
  @override
  Future<IbrahProgress> load() async => data;
  @override
  Future<void> save(IbrahProgress next) async {
    if (failWrites) throw StateError('Unavailable');
    writes++;
    data = next;
  }
}

/// 375 px wide phone, optionally with large text.
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

const prophets = [
  'Adam',
  'Idris',
  'Nuh',
  'Hud',
  'Salih',
  'Ibrahim',
  'Lut',
  'Ismail',
  'Ishaq & Yaqub',
  'Yusuf',
  'Ayyub',
  'Shuayb',
  'Musa',
  'Harun',
  'Yusha ibn Nun',
  'Dawud',
  'Sulayman',
  'Ilyas',
  'Al-Yasa',
  'Dhul-Kifl',
  'Yunus',
  'Zakariyya',
  'Yahya',
  'Isa',
];

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  late List<IbrahVolumeSummary> index;
  late List<IbrahVolume> volumes;

  setUpAll(() async {
    index = await IbrahLibrary.index();
    volumes = [for (final s in index) await IbrahLibrary.volume(s)];
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

  test('the course is registered at index 5', () {
    expect(courseEntry(5), same(ibrahCourse));
    expect(ibrahCourse.subtitle, contains('24'));
  });

  test('all 24 volumes are present, in order, with their own counts', () {
    expect(index.map((v) => v.prophet), prophets);
    expect(index.map((v) => v.number), List.generate(24, (i) => i + 1));
    // Counts declared on each document's title page.
    const stories = [
      6,
      6,
      6,
      6,
      6,
      12,
      6,
      6,
      8,
      10,
      8,
      8,
      10,
      8,
      8,
      8,
      8,
      8,
      8,
      8,
      8,
      8,
      8,
      8,
    ];
    const missions = [
      10,
      10,
      10,
      10,
      10,
      16,
      10,
      10,
      12,
      12,
      12,
      12,
      14,
      12,
      12,
      12,
      12,
      12,
      12,
      12,
      12,
      12,
      12,
      12,
    ];
    for (var i = 0; i < 24; i++) {
      final v = volumes[i];
      expect(v.stories.length, stories[i], reason: v.prophet);
      expect(v.missions.length, missions[i], reason: v.prophet);
      expect(index[i].stories, v.stories.length);
      expect(index[i].missions, v.missions.length);
    }
  });

  test('every mission plays: one right answer, an action, a linked story', () {
    for (final v in volumes) {
      expect(v.sourceDocument, startsWith('originals/06-IBRAH/'));
      expect(v.sourceDocument, endsWith('.docx'));
      expect(v.reviewNote, contains(RegExp('review', caseSensitive: false)));
      expect(
        v.stories.map((s) => s.number),
        List.generate(v.stories.length, (i) => i + 1),
      );
      for (final s in v.stories) {
        expect(s.blocks, isNotEmpty, reason: '${v.prophet} story ${s.number}');
      }
      final storyNumbers = v.stories.map((s) => s.number).toSet();
      for (final m in v.missions) {
        final why = '${v.prophet} mission ${m.number}';
        expect(m.choices.length, inInclusiveRange(2, 4), reason: why);
        expect(m.choices.where((c) => c.correct).length, 1, reason: why);
        expect(m.question, isNotEmpty, reason: why);
        expect(m.action, isNotEmpty, reason: why);
        expect(storyNumbers, contains(m.story), reason: why);
        expect(
          m.discover.any((b) => b.kind == 'ar') ||
              m.evidence.isNotEmpty ||
              m.discover.isNotEmpty,
          isTrue,
          reason: why,
        );
      }
    }
  });

  test('source wording is kept verbatim', () {
    final idris = volumes[1].missions.first;
    expect(
      idris.choices.firstWhere((c) => c.correct).text,
      'Say the pen is a reminder of truthfulness; explain that the invention claim needs checking.',
    );
    expect(
      idris.action,
      'Say “I need to check” once today when you are unsure about a claim, and check it with a trusted source or adult.',
    );
    final adam = volumes[0].missions.first;
    expect(
      adam.discover.firstWhere((b) => b.kind == 'ar').text,
      'إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً',
    );
    expect(
      adam.choices[2].feedback,
      'Blame does not solve the problem. Start with a constructive action.',
    );
    // Template missions (Shuʿayb) borrow the full āyah from the source library.
    final shuayb = volumes[11].missions.first;
    expect(shuayb.evidence.first.reference, 'Hūd · 11:84');
    expect(volumes[1].stories.first.title, 'The Pen of Truth');
    // No developer-only notes reach children.
    for (final v in volumes) {
      for (final m in v.missions) {
        for (final b in [...m.discover, ...m.remember]) {
          expect(b.text, isNot(startsWith('Developer')));
          expect(b.text, isNot(contains('Present its full approved Arabic')));
        }
      }
    }
  });

  test(
    'device progress survives reopening and keeps learner scopes apart',
    () async {
      final values = <String, String>{};
      DeviceIbrahProgressStore store(String scope) => DeviceIbrahProgressStore(
        scope: scope,
        readValue: (k) async => values[k],
        writeValue: (k, v) async => values[k] = v,
      );
      final p = const IbrahProgress()
          .withStory('ibrah-02', 's01')
          .withMission(
            'ibrah-02',
            'm01',
            IbrahMissionProgress(
              step: 3,
              choice: 1,
              completedAt: DateTime.utc(2026, 11, 15),
              reflection: 'learning',
            ),
          )
          .withReview('ibrah-02', DateTime.utc(2026, 11, 16));
      await store('learner-a').save(p);
      final back = await store('learner-a').load();
      expect(back.storyRead('ibrah-02', 's01'), isTrue);
      expect(back.mission('ibrah-02', 'm01').reflection, 'learning');
      expect(
        back.mission('ibrah-02', 'm01').completedAt,
        DateTime.utc(2026, 11, 15),
      );
      expect(back.missionsDone('ibrah-02'), 1);
      expect(back.reviewed['ibrah-02'], DateTime.utc(2026, 11, 16));
      expect((await store('learner-b').load()).storiesRead, isEmpty);
      expect(jsonDecode(values.values.single)['version'], 1);
    },
  );

  test('unreadable local progress is not silently replaced', () async {
    var writes = 0;
    final store = DeviceIbrahProgressStore(
      scope: 'guest',
      readValue: (_) async => '{broken',
      writeValue: (_, _) async => writes++,
    );
    await expectLater(store.load(), throwsStateError);
    expect(writes, 0);
    final safe = IbrahMissionProgress.fromMap({
      'step': 40,
      'choice': -1,
      'reflection': 'x',
    });
    expect(safe.step, 3);
    expect(safe.choice, isNull);
    expect(safe.reflection, isNull);
  });

  Future<void> boot(WidgetTester tester, MemoryIbrahStore store) async {
    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: appTheme(),
        home: IbrahCourseScreen(scope: 'guest', store: store),
      ),
    );
    await tester.pumpAndSettle();
  }

  Future<void> tap(WidgetTester tester, Finder f) async {
    if (f.evaluate().isEmpty) {
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

  testWidgets('a volume plays from prophet card to review at 375 px', (
    tester,
  ) async {
    phone(tester);
    final store = MemoryIbrahStore();
    await boot(tester, store);
    expect(find.text('Adam'), findsOneWidget);
    expect(find.text('0 of 280 missions explored'), findsOneWidget);
    await tap(tester, find.byKey(const Key('ibrah-volume-2')));
    expect(find.byKey(const Key('ibrah-volume-screen')), findsOneWidget);

    // Story reading.
    await tap(tester, find.byKey(const Key('ibrah-story-1')));
    expect(find.text('The Pen of Truth'), findsOneWidget);
    await tap(tester, find.byKey(const Key('ibrah-story-done')));
    expect(store.data.storyRead('ibrah-02', 's01'), isTrue);

    // Mission: Discover → Decide → Act → Remember.
    await tap(tester, find.byKey(const Key('ibrah-mission-1')));
    expect(find.text('Discover'), findsOneWidget);
    await tap(tester, find.byKey(const Key('ibrah-next')));
    expect(find.text('Decide'), findsOneWidget);
    FilledButton next() =>
        tester.widget<FilledButton>(find.byKey(const Key('ibrah-next')));
    expect(next().onPressed, isNull);
    await tap(tester, find.byKey(const Key('ibrah-choice-0')));
    expect(find.byKey(const Key('ibrah-feedback')), findsOneWidget);
    expect(next().onPressed, isNull, reason: 'a wrong choice asks for a retry');
    await tap(tester, find.byKey(const Key('ibrah-choice-1')));
    expect(
      find.text(
        'Careful honesty is not weakness. It protects what the Qur’an actually says and builds trust in the learner.',
      ),
      findsOneWidget,
    );
    await tap(tester, find.byKey(const Key('ibrah-next')));
    expect(find.byKey(const Key('ibrah-action')), findsOneWidget);
    await tap(tester, find.byKey(const Key('ibrah-next')));
    expect(find.text('Remember'), findsWidgets);
    await tap(tester, find.byKey(const Key('ibrah-reflect-practised')));
    await tap(tester, find.byKey(const Key('ibrah-next')));
    expect(find.text('Mission explored'), findsOneWidget);
    final saved = store.data.mission('ibrah-02', 'm01');
    expect(saved.done, isTrue);
    expect(saved.reflection, 'practised');
    await tap(tester, find.byKey(const Key('ibrah-next')));
    expect(find.text('Story 1 • Explored • Practised'), findsOneWidget);

    // Review: match each Arabic passage to its meaning, then closing lesson.
    final v = volumes[1];
    await tap(tester, find.byKey(const Key('ibrah-review')));
    for (var q = 0; q < v.review.length; q++) {
      final arabic = tester.widget<Text>(
        find.descendant(
          of: find.byKey(const Key('ibrah-review-arabic')),
          matching: find.byType(Text),
        ),
      );
      final right = v.review.indexWhere((e) => e.arabic == arabic.data);
      await tap(tester, find.byKey(Key('ibrah-review-option-$right')));
      await tap(tester, find.byKey(const Key('ibrah-review-next')));
    }
    expect(find.text('The closing lesson'), findsOneWidget);
    await tap(tester, find.byKey(const Key('ibrah-review-next')));
    expect(store.data.reviewed.containsKey('ibrah-02'), isTrue);
    expect(find.byKey(const Key('ibrah-volume-screen')), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.drag(find.byType(Scrollable).last, const Offset(0, 2000));
    await tester.pumpAndSettle();
    expect(
      tester.widget<Text>(find.byKey(const Key('ibrah-progress-count'))).data,
      '1 of 280 missions explored',
    );
  });

  testWidgets('a failed save keeps the learner on the step with a message', (
    tester,
  ) async {
    phone(tester);
    final store = MemoryIbrahStore()..failWrites = true;
    await boot(tester, store);
    await tap(tester, find.byKey(const Key('ibrah-volume-1')));
    await tap(tester, find.byKey(const Key('ibrah-mission-1')));
    await tap(tester, find.byKey(const Key('ibrah-next')));
    expect(find.byKey(const Key('ibrah-save-error')), findsOneWidget);
    expect(find.text('Discover'), findsOneWidget);
  });

  testWidgets(
    'every volume, story and mission screen fits 375 px with large text',
    (tester) async {
      phone(tester, scale: 1.6);
      final store = MemoryIbrahStore();
      await boot(tester, store);
      expect(tester.takeException(), isNull);
      final nav = tester.state<NavigatorState>(find.byType(Navigator));
      final c = IbrahProgressController(store);
      for (final v in volumes) {
        final s = index[v.number - 1];
        final screens = <Widget>[
          IbrahVolumeScreen(summary: s, progress: c),
          IbrahStoryScreen(volume: v, story: v.stories.first, progress: c),
          IbrahReviewScreen(volume: v, progress: c),
          for (final m in v.missions)
            IbrahMissionScreen(volume: v, mission: m, progress: c),
        ];
        for (final w in screens) {
          nav.push(MaterialPageRoute<void>(builder: (_) => w));
          await tester.pumpAndSettle();
          expect(
            tester.takeException(),
            isNull,
            reason: '${v.prophet} ${w.runtimeType}',
          );
          nav.pop();
          await tester.pumpAndSettle();
        }
      }
      // Every step of one long mission at large text.
      store.data = const IbrahProgress();
      final m = volumes[5].missions.first;
      nav.push(
        MaterialPageRoute<void>(
          builder: (_) =>
              IbrahMissionScreen(volume: volumes[5], mission: m, progress: c),
        ),
      );
      await tester.pumpAndSettle();
      await tap(tester, find.byKey(const Key('ibrah-next')));
      final right = m.choices.indexWhere((x) => x.correct);
      await tap(tester, find.byKey(Key('ibrah-choice-$right')));
      await tap(tester, find.byKey(const Key('ibrah-next')));
      await tap(tester, find.byKey(const Key('ibrah-next')));
      await tap(tester, find.byKey(const Key('ibrah-next')));
      expect(find.text('Mission explored'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
