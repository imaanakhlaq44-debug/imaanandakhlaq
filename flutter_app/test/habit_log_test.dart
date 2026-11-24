import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/rewards/habit_log.dart';
import 'package:imaan_akhlaq/rewards/rewards.dart';
import 'package:imaan_akhlaq/screens/habit_tracker.dart';
import 'package:imaan_akhlaq/screens/weekly_challenge.dart';

void main() {
  late MemoryRewardStorage storage;
  late DateTime now;
  late HabitLog log;

  setUp(() {
    storage = MemoryRewardStorage();
    now = DateTime(2026, 11, 25, 20); // a Wednesday
    log = HabitLog('quran', items: 3, storage: storage, clock: () => now);
  });

  test('items tick per day, per learner and per checklist', () async {
    await log.use('kid-1');
    await log.toggle('recite');
    await log.toggle('listen');
    expect(log.record.countOn(now), 2);
    expect(storage.data.keys, ['imaan.habits.v1.quran.kid-1']);
    final duas = HabitLog('duas', items: 6, storage: storage, clock: () => now);
    await duas.use('kid-1');
    expect(duas.record.countOn(now), 0);
    final again = HabitLog(
      'quran',
      items: 3,
      storage: storage,
      clock: () => now,
    );
    await again.use('kid-1');
    expect(again.record.on(now), {'recite', 'listen'});
  });

  test(
    'a full day completes, builds a streak and reaches goals once',
    () async {
      await log.use('kid-1');
      for (final d in [23, 24]) {
        now = DateTime(2026, 11, d, 20);
        for (final i in ['recite', 'listen', 'learn']) {
          await log.toggle(i);
        }
      }
      now = DateTime(2026, 11, 25, 8);
      expect(log.record.streakOn(now, 3), 2);
      await log.toggle('recite');
      await log.toggle('listen');
      final t = await log.toggle('learn');
      expect(t!.dayComplete, isTrue);
      expect(t.goalReached, 3);
      await log.toggle('learn');
      expect((await log.toggle('learn'))!.goalReached, isNull);
    },
  );

  test('only today and yesterday can change', () async {
    await log.use('kid-1');
    expect(await log.toggle('recite', day: DateTime(2026, 11, 24)), isNotNull);
    expect(await log.toggle('recite', day: DateTime(2026, 11, 23)), isNull);
  });

  test('days this week count Monday to Sunday', () async {
    final c = HabitLog(
      'challenge',
      items: 1,
      storage: storage,
      clock: () => now,
    );
    await c.use('kid-1');
    await c.toggle('x', day: DateTime(2026, 11, 24));
    await c.toggle('x');
    expect(c.record.daysThisWeek(now), 2);
    now = DateTime(2026, 11, 30, 9); // next Monday
    expect(c.record.daysThisWeek(now), 0);
  });

  test('hadith and challenge rotate by day and by week', () {
    expect(
      hadithFor(DateTime(2026, 11, 25)),
      isNot(same(hadithFor(DateTime(2026, 11, 26)))),
    );
    expect(
      hadithFor(DateTime(2026, 11, 25)),
      same(hadithFor(DateTime(2026, 12, 2))),
    );
    expect(
      challengeFor(DateTime(2026, 11, 24)),
      same(challengeFor(DateTime(2026, 11, 29))),
    );
    expect(
      challengeFor(DateTime(2026, 11, 29)),
      isNot(same(challengeFor(DateTime(2026, 11, 30)))),
    );
  });

  testWidgets('a checklist screen lights a unit per item and celebrates', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(420, 1600);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final hadith = HabitLog(
      'hadith',
      items: 2,
      storage: storage,
      clock: () => now,
    );
    await hadith.use('kid-1');
    await tester.pumpWidget(
      MaterialApp(
        home: HabitTrackerScreen(spot: hadithSpot, log: hadith),
      ),
    );
    expect(find.byKey(const Key('habit-hadith')), findsOneWidget);
    expect(find.text('Today: 0 of 2'), findsOneWidget);
    await tester.tap(find.byKey(const Key('habit-item-read')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('habit-unit-0-on')), findsOneWidget);
    await tester.tap(find.byKey(const Key('habit-item-act')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Today: 2 of 2'), findsOneWidget);
    expect(find.byKey(const Key('habit-celebration')), findsOneWidget);
  });
}
