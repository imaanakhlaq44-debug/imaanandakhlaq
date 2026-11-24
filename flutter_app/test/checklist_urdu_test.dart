import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/l10n/language.dart';
import 'package:imaan_akhlaq/rewards/habit_log.dart';
import 'package:imaan_akhlaq/rewards/prayer_log.dart';
import 'package:imaan_akhlaq/rewards/rewards.dart';
import 'package:imaan_akhlaq/screens/habit_tracker.dart';
import 'package:imaan_akhlaq/screens/prayer_tracker.dart';
import 'package:imaan_akhlaq/screens/weekly_challenge.dart';

void main() {
  setUp(() async {
    AppLanguage.instance = AppLanguage(persist: false);
    await AppLanguage.instance.setUrdu(true);
    PrayerLog.instance = PrayerLog(storage: MemoryRewardStorage());
    HabitLog.resetShared();
  });
  tearDown(() => AppLanguage.instance = AppLanguage(persist: false));

  // Each checklist opens as its own page, above the learner's home; in Urdu
  // it must still read right to left (the streak line was reversed).
  Future<void> openAndCheck(
    WidgetTester tester,
    Future<void> Function(BuildContext) open,
    String text,
  ) async {
    tester.view.physicalSize = const Size(420, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => TextButton(
            onPressed: () => open(context),
            child: const Text('open'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    final shown = find.textContaining(text);
    expect(shown, findsWidgets);
    expect(Directionality.of(tester.element(shown.first)), TextDirection.rtl);
  }

  testWidgets('My Salah reads right to left in Urdu', (tester) async {
    await openAndCheck(
      tester,
      (c) => openPrayerTracker(c, scope: 'guest', onLearnSalah: () {}),
      'میری نماز',
    );
  });

  testWidgets('a checklist reads right to left in Urdu', (tester) async {
    await openAndCheck(
      tester,
      (c) => openHabitTracker(c, quranSpot, scope: 'guest'),
      'میرا قرآن باغیچہ',
    );
  });

  testWidgets('the weekly goal reads right to left in Urdu', (tester) async {
    await openAndCheck(
      tester,
      (c) => openWeeklyChallenge(c, scope: 'guest'),
      'ہفتے کا چیلنج',
    );
  });
}
