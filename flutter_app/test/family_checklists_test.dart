import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/data/checklist_cloud.dart';
import 'package:imaan_akhlaq/domain.dart';
import 'package:imaan_akhlaq/rewards/habit_log.dart';
import 'package:imaan_akhlaq/rewards/prayer_log.dart';
import 'package:imaan_akhlaq/rewards/rewards.dart';
import 'package:imaan_akhlaq/screens/family_checklists.dart';
import 'package:imaan_akhlaq/screens/prayer_tracker.dart';

void main() {
  late MemoryChecklistCloud cloud;
  final now = DateTime(2026, 11, 25, 18);

  setUp(() => cloud = MemoryChecklistCloud('kid-1'));

  test('a parent\'s confirmation reaches the child\'s device', () async {
    final log = HabitLog(
      'quran',
      items: 3,
      storage: MemoryRewardStorage(),
      clock: () => now,
    );
    await log.use('kid-1', cloud: cloud);
    await log.toggle('recite');
    expect(log.record.confirmedOn(now), isFalse);

    await cloud.confirm('2026-11-25', {
      'quran': {'recite'},
    });
    await log.refresh();
    expect(log.record.confirmedOn(now), isTrue);

    // A new tick after the confirmation waits for the parent again.
    await log.toggle('listen');
    expect(log.record.confirmedOn(now), isFalse);
  });

  testWidgets('the child sees when a parent has confirmed the day', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(420, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    cloud.days['2026-11-25'] = {
      'salah': {'fajr'},
      confirmedKey('salah'): {'fajr'},
    };
    final log = PrayerLog(storage: MemoryRewardStorage(), clock: () => now);
    await log.use('kid-1', cloud: cloud);
    await tester.pumpWidget(MaterialApp(home: PrayerTrackerScreen(log: log)));
    expect(find.byKey(const Key('parent-seen')), findsOneWidget);
  });

  testWidgets('a parent sees the week and confirms a day', (tester) async {
    tester.view.physicalSize = const Size(480, 2400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    cloud.days['2026-11-25'] = {
      'salah': {'fajr', 'zuhr'},
      'quran': {'recite'},
    };
    cloud.days['2026-11-24'] = {
      'salah': {'fajr', 'zuhr', 'asr', 'maghrib', 'isha'},
      confirmedKey('salah'): {'fajr', 'zuhr', 'asr', 'maghrib', 'isha'},
    };
    cloud.days['2026-11-15'] = {
      'salah': {'fajr'},
    };
    const child = Profile(
      uid: 'kid-1',
      name: 'Ayaan',
      role: AccountRole.student,
    );
    await tester.pumpWidget(
      MaterialApp(
        home: ChildChecklistsScreen(
          child: child,
          cloud: cloud,
          clock: () => now,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('7 / 35'), findsOneWidget, reason: 'salah this week');
    expect(find.text('last week 1'), findsOneWidget);
    expect(find.text('1 / 21'), findsOneWidget, reason: 'quran this week');
    expect(find.text('Salah: Fajr, Zuhr'), findsOneWidget);
    expect(find.text('Quran: I recited Quran'), findsOneWidget);
    // Yesterday is already confirmed; today waits for the parent.
    expect(find.byKey(const Key('confirm-button-2026-11-24')), findsNothing);
    await tester.tap(find.byKey(const Key('confirm-button-2026-11-25')));
    await tester.pumpAndSettle();
    expect(cloud.days['2026-11-25']![confirmedKey('salah')], {'fajr', 'zuhr'});
    expect(cloud.days['2026-11-25']![confirmedKey('quran')], {'recite'});
    expect(find.byKey(const Key('confirm-button-2026-11-25')), findsNothing);
    expect(find.text('Confirmed'), findsNWidgets(2));
  });
}
