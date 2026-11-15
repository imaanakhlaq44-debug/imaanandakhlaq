import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/courses/registry.dart';
import 'package:imaan_akhlaq/courses/salah/salah_data.dart';
import 'package:imaan_akhlaq/courses/salah/salah_screens.dart';
import 'package:imaan_akhlaq/courses/salah/salah_widgets.dart';
import 'package:imaan_akhlaq/screens/learning_experience.dart';

class MemorySalahStore implements SalahProgressStore {
  Map<String, SalahProgress> data = {};
  bool failWrites = false;
  @override
  Future<Map<String, SalahProgress>> load() async => {...data};
  @override
  Future<void> save(Map<String, SalahProgress> next) async {
    if (failWrites) throw StateError('Unavailable');
    data = {...next};
  }
}

/// 375 px phone; [scale] is the text scale factor.
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

Widget app(Widget home) => MaterialApp(theme: appTheme(), home: home);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  late SalahCourseData data;
  setUpAll(() async {
    data = await SalahCourseData.load();
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

  group('content', () {
    test('30 missions in the manual’s order and worlds', () {
      expect(data.missions.length, 30);
      expect(data.missions.map((m) => m.id).toSet().length, 30);
      expect(
        data.missions.map((m) => m.id).join(' '),
        'P1 P2 P3 P4 P5 F1 F2 F3 F4 F5 F6 F7 F8 S1 S2 S3 S4 '
        'W1 W2 W3 T1 T2 T3 J1 J2 J3 I1 I2 B1 B2',
      );
      expect(data.worlds.map((w) => w.id), [
        'ready', 'fard', 'sunnah', 'witr', //
        'tahajjud', 'janazah', 'istisqa', 'tasbih',
      ]);
      expect(data.worlds.where((w) => w.optional).map((w) => w.id), ['tasbih']);
      expect(data.coreMissions.length, 28);
      expect(
        data.document,
        'Imaan_Akhlaq_My_Salah_Journey_COMPLETE_Curriculum_and_Developer_Manual.docx',
      );
    });

    test('every mission is complete and its check has one right answer', () {
      String norm(String s) =>
          s.toLowerCase().replaceAll(RegExp(r'[“”"\.]'), '').trim();
      for (final m in data.missions) {
        for (final f in [m.scene, m.learn, m.action, m.evidence, m.guardrail]) {
          expect(f, isNotEmpty, reason: m.id);
        }
        final c = m.check;
        expect(c.options.length, inInclusiveRange(2, 4), reason: m.id);
        expect(c.correct, inInclusiveRange(0, c.options.length - 1));
        expect(c.feedback, isNotEmpty);
        // The right option is the manual's correct response (some manual
        // answers are a letter, A/B, or a shortened form).
        expect(c.sourceQuestion, isNotEmpty);
        final answer = _sourceAnswers[m.id]!;
        if (answer.length == 1) {
          expect(c.correct, 'AB'.indexOf(answer), reason: m.id);
        } else {
          expect(norm(c.options[c.correct]), contains(norm(answer)));
        }
        for (final id in m.recitations) {
          expect(data.recitation(id).arabic, isNotEmpty);
        }
        expect(m.steps.length, m.recitations.isEmpty ? 4 : 5);
      }
    });

    test('recitation library keeps the manual’s Arabic and sources', () {
      expect(data.recitations.length, 19);
      final arabic = RegExp('[؀-ۿ]');
      for (final r in data.recitations) {
        expect(arabic.hasMatch(r.arabic), isTrue, reason: r.id);
        expect(arabic.hasMatch(r.meaningUrdu), isTrue, reason: r.id);
        expect(r.source, isNotEmpty);
      }
      // Arabic is copied by the generator, never typed by hand. This
      // fingerprint fails if any letter or mark changes without a re-review.
      expect(
        _fingerprint(data.recitations.map((r) => r.arabic).join('|')),
        _arabicFingerprint,
      );
      final r17 = data.recitation('R17').arabic.split('، ');
      expect(r17.length, 3);
      expect(r17.toSet().length, 1);
      expect(data.recitation('R14').source, startsWith('Tirmidhi 464'));
      expect(
        data.recitation('R14').links.single.url,
        'https://sunnah.com/tirmidhi:464',
      );
      // Links only ever come from the manual's own source register.
      for (final l in [
        ...data.recitations.expand((r) => r.links),
        ...data.missions.expand((m) => m.links),
      ]) {
        expect(
          l.url,
          anyOf(
            startsWith('https://sunnah.com/'),
            startsWith('https://quran.com/'),
          ),
        );
      }
    });

    test('Fiqh notes and Tasbih notices come from the manual', () {
      expect(data.fiqh.topics.length, 9);
      expect(data.fiqh.topics.first.topic, 'Raf‘ al-Yadayn');
      expect(data.fiqh.rafChild, startsWith('You may see some people raise'));
      expect(data.tasbihNotice, contains('Sunan Abi Dawud 1297'));
      expect(data.missions.firstWhere((m) => m.id == 'B2').table!.rows.last, [
        'Four rak’ahs total',
        '75 × 4',
        '300',
      ]);
    });

    test('course is registered with the Salah accent', () {
      expect(courseEntry(3), isNotNull);
      expect(courseEntry(3)!.subtitle, contains('30 missions'));
      expect(salahAccent, courseAccents[3]);
    });
  });

  group('device progress', () {
    test('survives reopening and keeps learner scopes apart', () async {
      final values = <String, String>{};
      DeviceSalahProgressStore store(String scope) => DeviceSalahProgressStore(
        scope: scope,
        readValue: (key) async => values[key],
        writeValue: (key, value) async => values[key] = value,
      );
      await store('learner-a').save({
        'F6': SalahProgress(
          step: 3,
          choice: 1,
          completedAt: DateTime.utc(2026, 11, 15),
          reflection: 'tried',
        ),
      });
      final back = await store('learner-a').load();
      expect(back['F6']?.reflection, 'tried');
      expect(back['F6']?.completedAt, DateTime.utc(2026, 11, 15));
      expect(await store('guest').load(), isEmpty);
      expect(values.keys.single, 'imaan.salah.v1.learner-a');
    });

    test('unreadable progress is reported, not wiped', () async {
      final values = {'imaan.salah.v1.guest': '{broken'};
      final store = DeviceSalahProgressStore(
        scope: 'guest',
        readValue: (key) async => values[key],
        writeValue: (key, value) async => values[key] = value,
      );
      expect(store.load(), throwsStateError);
      expect(values['imaan.salah.v1.guest'], '{broken');
    });
  });

  group('screens', () {
    testWidgets('map lists all worlds and plays P1 to the end', (tester) async {
      phone(tester);
      final store = MemorySalahStore();
      await tester.pumpWidget(
        app(SalahCourseScreen(scope: 'guest', store: store)),
      );
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('salah-progress-count')), findsOneWidget);
      expect(find.text('0 of 28 missions explored'), findsOneWidget);

      await tester.tap(find.byKey(const Key('salah-mission-P1')));
      await tester.pumpAndSettle();
      await _playThrough(tester, data.missions.first, data);
      expect(store.data['P1']?.explored, isTrue);
      await tester.tap(find.byKey(const Key('salah-reflect-yes')));
      await tester.pump();
      await tester.ensureVisible(
        find.byKey(const Key('salah-save-reflection')),
      );
      await tester.tap(find.byKey(const Key('salah-save-reflection')));
      await tester.pumpAndSettle();
      expect(store.data['P1']?.reflection, 'yes');

      await tester.tap(find.byKey(const Key('salah-next')));
      await tester.pumpAndSettle();
      expect(find.text('1 of 28 missions explored'), findsOneWidget);
      expect(find.text('Explored • You tried your action'), findsOneWidget);
    });

    testWidgets('a wrong answer gets the gentle try-again message', (
      tester,
    ) async {
      phone(tester);
      final m = data.missions.firstWhere((m) => m.id == 'F7');
      await tester.pumpWidget(
        app(
          SalahMissionScreen(
            data: data,
            mission: m,
            progress: SalahProgress(step: m.checkStep),
            onSave: (_) async {},
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('salah-option-1')));
      await tester.pumpAndSettle();
      expect(find.text(data.tryAgain), findsOneWidget);
      final next = tester.widget<FilledButton>(
        find.byKey(const Key('salah-next')),
      );
      expect(next.onPressed, isNull);
      await tester.ensureVisible(find.byKey(const Key('salah-option-0')));
      await tester.tap(find.byKey(const Key('salah-option-0')));
      await tester.pumpAndSettle();
      expect(find.text(m.check.feedback), findsOneWidget);
    });

    testWidgets('a failed save keeps the learner on the step', (tester) async {
      phone(tester);
      final m = data.missions.first;
      await tester.pumpWidget(
        app(
          SalahMissionScreen(
            data: data,
            mission: m,
            progress: const SalahProgress(),
            onSave: (_) async => throw StateError('offline'),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('salah-next')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('salah-save-error')), findsOneWidget);
      expect(find.text('Story'), findsOneWidget);
    });

    testWidgets('Tasbih asks for a grown-up first and can be skipped', (
      tester,
    ) async {
      phone(tester);
      await tester.pumpWidget(
        app(SalahCourseScreen(scope: 'guest', store: MemorySalahStore())),
      );
      await tester.pumpAndSettle();
      final tile = find.byKey(const Key('salah-mission-B1'));
      await tester.scrollUntilVisible(
        tile,
        400,
        scrollable: find.descendant(
          of: find.byKey(const Key('salah-mission-list')),
          matching: find.byType(Scrollable),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(tile);
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('salah-world-notice')), findsOneWidget);
      expect(find.text(data.tasbihNotice), findsOneWidget);
      await tester.tap(find.text('Not now'));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('salah-mission-screen')), findsNothing);
      await tester.tap(tile);
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('salah-notice-continue')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('salah-mission-screen')), findsOneWidget);
    });

    for (final scale in [1.0, 2.0]) {
      testWidgets('all 30 missions play at 375 px, text x$scale', (
        tester,
      ) async {
        phone(tester, scale: scale);
        for (final m in data.missions) {
          final saved = <SalahProgress>[];
          await tester.pumpWidget(
            app(
              SalahMissionScreen(
                key: ValueKey(m.id),
                data: data,
                mission: m,
                progress: const SalahProgress(),
                onSave: (p) async => saved.add(p),
              ),
            ),
          );
          await tester.pumpAndSettle();
          await _playThrough(tester, m, data);
          expect(saved.last.explored, isTrue, reason: m.id);
          expect(tester.takeException(), isNull, reason: m.id);
        }
      });
    }

    testWidgets('words step shows Arabic and the audio-coming slot', (
      tester,
    ) async {
      phone(tester, scale: 1.5);
      final m = data.missions.firstWhere((m) => m.id == 'W3');
      await tester.pumpWidget(
        app(
          SalahMissionScreen(
            data: data,
            mission: m,
            progress: const SalahProgress(step: 2),
            onSave: (_) async {},
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Words'), findsOneWidget);
      expect(find.text(data.recitation('R14').arabic), findsOneWidget);
      expect(find.byKey(const Key('salah-audio-coming')), findsOneWidget);
      await tester.scrollUntilVisible(
        find.byKey(const Key('salah-hide-words')),
        300,
        scrollable: find.descendant(
          of: find.byKey(const Key('salah-mission-body')),
          matching: find.byType(Scrollable),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('salah-hide-words')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('salah-words-hidden')), findsOneWidget);
    });

    testWidgets('library and differences open at large text', (tester) async {
      phone(tester, scale: 2);
      await tester.pumpWidget(
        app(SalahCourseScreen(scope: 'guest', store: MemorySalahStore())),
      );
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byKey(const Key('salah-library')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('salah-library')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('salah-library-screen')), findsOneWidget);
      await tester.scrollUntilVisible(
        find.text('Surah al-Fatihah'),
        700,
        maxScrolls: 400,
        scrollable: find.descendant(
          of: find.byKey(const Key('salah-library-list')),
          matching: find.byType(Scrollable),
        ),
      );
      expect(find.text('Surah al-Fatihah'), findsOneWidget);
      await tester.pageBack();
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byKey(const Key('salah-differences')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('salah-differences')));
      await tester.pumpAndSettle();
      expect(find.text(data.fiqh.disclaimer), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}

/// FNV-1a over UTF-16 code units.
int _fingerprint(String s) {
  var h = 0x811c9dc5;
  for (final c in s.codeUnits) {
    h = ((h ^ c) * 0x01000193) & 0xffffffff;
  }
  return h;
}

const _arabicFingerprint = 1440538283;

/// The manual's "Correct response" line, kept here so a regenerated JSON
/// that shuffled options would fail.
const _sourceAnswers = {
  'P1': 'B', 'P2': 'Maghrib', 'P3': 'B', 'P4': 'Clear a clean place', //
  'P5': 'Ruku', 'F1': 'B', 'F2': 'B', 'F3': 'Stand up calmly',
  'F4': 'Sit between them', 'F5': 'Tashahhud', 'F6': 'Stand for rak’ah two',
  'F7': 'Maghrib', 'F8': 'Lower your voice', 'S1': 'obligatory prayer',
  'S2': 'Two Sunnah rak’ahs', 'S3': 'Two', 'S4': 'One carefully learned Sunnah',
  'W1': 'The end of night worship', 'W2': 'Choose one complete approved method',
  'W3': 'O Allah, guide me', 'T1': 'Let families choose', 'T2': 'Two',
  'T3': 'Preserve every Arabic word', 'J1': 'Offer kind, quiet support',
  'J2': 'Ruku', 'J3': 'Forgiveness and mercy', 'I1': 'Pray and conserve water',
  'I2': 'We ask Allah for rain and care for water responsibly',
  'B1': 'Scholars differ about its report and recommendation', 'B2': '75',
};

/// Walks one open mission from its current step to the summary, choosing
/// the right answer at the check.
Future<void> _playThrough(
  WidgetTester tester,
  SalahMission m,
  SalahCourseData data,
) async {
  final next = find.byKey(const Key('salah-next'));
  for (var step = 0; step < m.steps.length; step++) {
    expect(
      find.byKey(const Key('salah-step-title')),
      findsOneWidget,
      reason: '${m.id} step $step',
    );
    if (m.steps[step] == 'Check') {
      final right = find.byKey(Key('salah-option-${m.check.correct}'));
      await tester.ensureVisible(right);
      await tester.pumpAndSettle();
      await tester.tap(right);
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('salah-feedback')), findsOneWidget);
    }
    await tester.tap(next);
    await tester.pumpAndSettle();
  }
  expect(find.text('Mission explored'), findsOneWidget, reason: m.id);
}
