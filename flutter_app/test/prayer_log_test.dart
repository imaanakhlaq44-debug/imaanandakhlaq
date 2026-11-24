import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/rewards/prayer_log.dart';
import 'package:imaan_akhlaq/rewards/rewards.dart';
import 'package:imaan_akhlaq/screens/prayer_tracker.dart';

void main() {
  late MemoryRewardStorage storage;
  late DateTime now;
  late PrayerLog log;

  setUp(() {
    storage = MemoryRewardStorage();
    now = DateTime(2026, 11, 25, 20);
    log = PrayerLog(storage: storage, clock: () => now);
  });

  Future<PrayerTick?> prayAll({DateTime? day}) async {
    PrayerTick? last;
    for (final p in Prayer.values) {
      last = await log.toggle(p, day: day);
    }
    return last;
  }

  test('ticking and unticking a prayer, saved per learner', () async {
    await log.use('kid-1');
    final t = await log.toggle(Prayer.fajr);
    expect(t!.prayed, isTrue);
    expect(log.record.countOn(now), 1);
    final u = await log.toggle(Prayer.fajr);
    expect(u!.prayed, isFalse);
    expect(log.record.countOn(now), 0);
    await log.toggle(Prayer.asr);
    final saved = jsonDecode(storage.data['imaan.habits.v1.salah.kid-1']!);
    expect(saved['days']['2026-11-25'], ['asr']);

    final other = PrayerLog(storage: storage, clock: () => now);
    await other.use('kid-2');
    expect(other.record.countOn(now), 0, reason: 'each child has their own');
    await other.use('kid-1');
    expect(other.record.on(now), {Prayer.asr});
  });

  test('all five completes the day and starts a streak', () async {
    await log.use('kid-1');
    final last = await prayAll();
    expect(last!.dayComplete, isTrue);
    expect(last.streak, 1);
    expect(log.record.streakOn(now), 1);
  });

  test('streak survives the morning and reaches a goal once', () async {
    await log.use('kid-1');
    // Two full days before today: Nov 23 and 24.
    now = DateTime(2026, 11, 23, 21);
    await prayAll();
    now = DateTime(2026, 11, 24, 21);
    await prayAll();
    now = DateTime(2026, 11, 25, 7);
    expect(log.record.streakOn(now), 2, reason: 'today is not over yet');
    final t = await prayAll();
    expect(t!.streak, 3);
    expect(t.goalReached, 3);
    await log.toggle(Prayer.isha);
    final again = await log.toggle(Prayer.isha);
    expect(again!.goalReached, isNull, reason: 'a goal is celebrated once');
    expect(log.record.bestStreak, 3);
  });

  test('yesterday can be fixed, older days are locked', () async {
    await log.use('kid-1');
    final yesterday = DateTime(2026, 11, 24);
    expect(await log.toggle(Prayer.zuhr, day: yesterday), isNotNull);
    expect(log.record.countOn(yesterday), 1);
    expect(await log.toggle(Prayer.zuhr, day: DateTime(2026, 11, 23)), isNull);
    expect(await log.toggle(Prayer.zuhr, day: DateTime(2026, 11, 26)), isNull);
  });

  test('a missed day breaks the streak', () async {
    await log.use('kid-1');
    now = DateTime(2026, 11, 23, 21);
    await prayAll();
    now = DateTime(2026, 11, 25, 21);
    await log.toggle(Prayer.fajr);
    expect(log.record.streakOn(now), 0);
    expect(log.record.weekCount(now), 6);
  });

  test('broken saved data starts fresh', () async {
    storage.data['imaan.habits.v1.salah.kid-1'] = '{not json';
    await log.use('kid-1');
    expect(log.record.countOn(now), 0);
    storage.data['imaan.habits.v1.salah.kid-2'] = jsonEncode({
      'days': {
        '2026-11-25': ['fajr', 'nap'],
      },
    });
    await log.use('kid-2');
    expect(log.record.on(now), {Prayer.fajr}, reason: 'unknown names ignored');
  });

  testWidgets('tracker screen lights a lamp per prayer and celebrates', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(420, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await log.use('kid-1');
    var learned = false;
    await tester.pumpWidget(
      MaterialApp(
        home: PrayerTrackerScreen(log: log, onLearnSalah: () => learned = true),
      ),
    );
    expect(find.text('Today: 0 of 5'), findsOneWidget);
    await tester.tap(find.byKey(const Key('prayer-fajr')));
    await tester.pumpAndSettle();
    expect(find.text('Today: 1 of 5'), findsOneWidget);
    expect(find.byKey(const Key('prayer-lamp-0-lit')), findsOneWidget);
    for (final p in Prayer.values.skip(1)) {
      await tester.tap(find.byKey(Key('prayer-${p.name}')));
      await tester.pump();
    }
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Today: 5 of 5'), findsOneWidget);
    expect(find.byKey(const Key('prayer-celebration')), findsOneWidget);
    expect(find.text('This week: 5 of 35'), findsOneWidget);

    await tester.tap(find.byKey(const Key('prayer-day-yesterday')));
    await tester.pumpAndSettle();
    expect(find.text('Yesterday: 0 of 5'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.byKey(const Key('prayer-learn-salah')),
      200,
    );
    await tester.tap(find.byKey(const Key('prayer-learn-salah')));
    expect(learned, isTrue);
  });
}
