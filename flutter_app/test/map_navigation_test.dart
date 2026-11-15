import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app.dart';
import 'package:imaan_akhlaq/data/catalog.dart';
import 'package:imaan_akhlaq/courses/quran/quran_screens.dart'
    show QuranCompanionScreen;
import 'app_test.dart'
    show FakeRepository, viewport, precacheExperienceImages, enterSection;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
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
  testWidgets(
    'map button opens adventure map; course node and story library work',
    (tester) async {
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
      // The Quran course is playable now, so its node opens the course
      // itself instead of the "In preparation" sheet.
      await tester.tap(find.byKey(const Key('map-quran')));
      await tester.pumpAndSettle();
      expect(find.byType(QuranCompanionScreen), findsOneWidget);
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      expect(find.byType(QuranCompanionScreen), findsNothing);
      await tester.scrollUntilVisible(
        find.byKey(const Key('map-books')),
        250,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.ensureVisible(find.byKey(const Key('map-books')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('map-books')));
      await tester.pumpAndSettle();
      expect(find.text('Stories & books'), findsOneWidget);
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      expect(find.text('Explore learning'), findsOneWidget);
    },
  );
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
