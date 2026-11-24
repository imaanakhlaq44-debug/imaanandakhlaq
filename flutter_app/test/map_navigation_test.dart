import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app.dart';
import 'package:imaan_akhlaq/data/catalog.dart';
import 'package:imaan_akhlaq/rewards/habit_log.dart';
import 'package:imaan_akhlaq/rewards/prayer_log.dart';
import 'package:imaan_akhlaq/courses/quran/quran_screens.dart'
    show QuranCompanionScreen;
import 'app_test.dart'
    show FakeRepository, viewport, precacheExperienceImages, enterSection;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() {
    // Daily checklists are app-wide; each test starts with none ticked.
    PrayerLog.instance = PrayerLog();
    HabitLog.resetShared();
  });
  WidgetController.hitTestWarningShouldBeFatal = true;
  setUpAll(() async {
    await Catalog().books();
    await (FontLoader('AppSans')
          ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
        .load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });
  testWidgets('map places open daily checklists that lead on to the courses', (
    tester,
  ) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: repo.initial == 'family');
    await tester.tap(find.byKey(const Key('nav-map')));
    await tester.pumpAndSettle();
    expect(find.byType(AppBar), findsNothing);
    expect(find.text('Amanpur adventure'), findsNothing);
    expect(find.byKey(const Key('map-next-story')), findsNothing);
    // Every place shows today's progress on its pin.
    expect(find.byKey(const Key('map-quran-count')), findsOneWidget);
    expect(find.text('0/5'), findsWidgets);
    // Quran Garden opens its checklist, which leads on to the course.
    await tester.tap(find.byKey(const Key('map-quran')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('habit-quran')), findsOneWidget);
    await tester.tap(find.byKey(const Key('habit-item-recite')));
    await tester.pumpAndSettle();
    expect(find.text('Today: 1 of 3'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.byKey(const Key('habit-course')),
      200,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.tap(find.byKey(const Key('habit-course')));
    await tester.pumpAndSettle();
    expect(find.byType(QuranCompanionScreen), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('habit-quran')), findsNothing);
    expect(find.text('1/3'), findsOneWidget);
    // Salah Studio opens the prayer tracker.
    await tester.tap(find.byKey(const Key('map-salah')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('prayer-tracker')), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    // Hadith House shows the hadith of the day.
    await tester.tap(find.byKey(const Key('map-hadith')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('habit-hadith')), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    // Good Deeds leads on to the story books.
    await tester.scrollUntilVisible(
      find.byKey(const Key('map-deeds')),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.ensureVisible(find.byKey(const Key('map-deeds')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('map-deeds')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('habit-deeds')), findsOneWidget);
    await tester.scrollUntilVisible(
      find.byKey(const Key('habit-course')),
      200,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.tap(find.byKey(const Key('habit-course')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('habit-deeds')), findsNothing);
    expect(find.text('Stories & books'), findsOneWidget);
    await tester.tap(find.byKey(const Key('nav-map')));
    await tester.pumpAndSettle();
    // Weekly Goal opens this week's challenge.
    await tester.scrollUntilVisible(
      find.byKey(const Key('map-challenge')),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.ensureVisible(find.byKey(const Key('map-challenge')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('map-challenge')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('weekly-challenge')), findsOneWidget);
    await tester.tap(find.byKey(const Key('challenge-today')));
    await tester.pumpAndSettle();
    expect(find.text('1 of 5 days'), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('nav-home')));
    await tester.pumpAndSettle();
    expect(find.text('Explore learning'), findsOneWidget);
  });
  testWidgets(
    'signed-in continue opens a real chapter rather than sample lesson data',
    (tester) async {
      viewport(tester);
      final repo = FakeRepository()..initial = 'individual';
      addTearDown(repo.dispose);
      await tester.pumpWidget(ImaanApp(repository: repo));
      await enterSection(tester, school: repo.initial == 'family');
      await tester.tap(find.byKey(const Key('continue-learning')));
      await tester.pumpAndSettle();
      expect(find.text('Think about it'), findsOneWidget);
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      expect(find.text('Explore learning'), findsOneWidget);
    },
  );
  testWidgets('map is readable on narrow phones with large text', (
    tester,
  ) async {
    viewport(tester, scale: 1.6);
    tester.view.physicalSize = const Size(320, 740);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: repo.initial == 'family');
    await tester.tap(find.byKey(const Key('nav-map')));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.scrollUntilVisible(
      find.byKey(const Key('map-explore')),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.tap(find.byKey(const Key('nav-home')));
    await tester.pumpAndSettle();
    expect(find.text('Explore learning'), findsOneWidget);
  });
  testWidgets('home adventure tile opens the same native map', (tester) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester);
    await tester.ensureVisible(find.byKey(const Key('home-map')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('home-map')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('map-hadith')), findsOneWidget);
    expect(find.byKey(const Key('reading-hero')), findsNothing);
  });
  testWidgets('adventure map visual review', (tester) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: repo.initial == 'family');
    await tester.tap(find.byKey(const Key('nav-map')));
    await tester.pumpAndSettle();
    await precacheExperienceImages(tester);
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/adventure-map.png'),
    );
  });
}
