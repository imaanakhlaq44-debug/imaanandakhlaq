import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app.dart';
import 'app_test.dart'
    show FakeRepository, viewport, precacheExperienceImages, enterSection;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  setUpAll(() async {
    await (FontLoader('AppSans')
          ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
        .load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });
  testWidgets('guest home starts with a full-width hero without a header', (
    tester,
  ) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: repo.initial == 'family');
    expect(find.text('Explore learning'), findsOneWidget);
    expect(find.textContaining('Assalamu alaikum'), findsNothing);
    expect(find.text('Ready for a little learning?'), findsNothing);
    expect(find.byKey(const Key('reading-hero-art')), findsOneWidget);
    expect(find.byKey(const Key('login')), findsNothing);
    expect(find.byType(AppBar), findsNothing);
    final hero = tester.getRect(find.byKey(const Key('reading-hero')));
    expect(hero.left, 0);
    expect(hero.top, 0);
    expect(
      hero.width,
      tester.view.physicalSize.width / tester.view.devicePixelRatio,
    );
    await precacheExperienceImages(tester);
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/welcome.png'),
    );
  });
  testWidgets('sign in and create account can both return to home', (
    tester,
  ) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: repo.initial == 'family');
    await tester.tap(find.byKey(const Key('nav-profile')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('home-sign-in')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('login')), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('nav-profile')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('home-create-account')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('signup-name')), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    await tester.tap(find.text('Home'));
    await tester.pumpAndSettle();
    expect(find.text('Explore learning'), findsOneWidget);
    expect(find.byKey(const Key('reading-hero-art')), findsOneWidget);
  });
  testWidgets(
    'signup validates consent and recovers from errors without logging in early',
    (tester) async {
      viewport(tester);
      final repo = FakeRepository()..failRegistration = true;
      addTearDown(repo.dispose);
      await tester.pumpWidget(ImaanApp(repository: repo));
      await enterSection(tester, school: repo.initial == 'family');
      await tester.tap(find.byKey(const Key('nav-profile')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('home-create-account')));
      await tester.pumpAndSettle();
      for (final entry in {
        'signup-name': 'Parent Name',
        'signup-email': 'parent@example.com',
        'signup-phone': '+923001234567',
        'signup-password': 'secure-password',
        'signup-confirm': 'secure-password',
      }.entries) {
        await tester.scrollUntilVisible(
          find.byKey(Key(entry.key)),
          180,
          scrollable: find.byType(Scrollable).first,
        );
        await tester.pumpAndSettle();
        await tester.enterText(find.byKey(Key(entry.key)), entry.value);
      }
      Future<void> submit() async {
        await tester.scrollUntilVisible(
          find.byKey(const Key('signup-submit')),
          200,
          scrollable: find.byType(Scrollable).first,
        );
        await tester.ensureVisible(find.byKey(const Key('signup-submit')));
        await tester.pumpAndSettle();
        await tester.tap(find.byKey(const Key('signup-submit')));
        await tester.pumpAndSettle();
      }

      await submit();
      expect(repo.registrationCalls, 0);
      expect(
        find.text('Please read and accept the terms and privacy policy.'),
        findsOneWidget,
      );
      await tester.ensureVisible(find.byKey(const Key('signup-consent')));
      await tester.pumpAndSettle();
      await tester.tap(find.byType(Checkbox));
      await tester.pumpAndSettle();
      await submit();
      expect(repo.registrationCalls, 1);
      expect(
        find.text('Could not create your account. Try again.'),
        findsOneWidget,
      );
      repo.failRegistration = false;
      await submit();
      expect(find.text('Your account is ready'), findsOneWidget);
      expect(find.textContaining('Assalamu alaikum'), findsNothing);
      await tester.tap(find.text('Go to sign in'));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('login')), findsOneWidget);
    },
  );
  testWidgets('home, login and signup fit a small phone at large text scale', (
    tester,
  ) async {
    viewport(tester, scale: 1.6);
    tester.view.physicalSize = const Size(320, 740);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: repo.initial == 'family');
    expect(tester.takeException(), isNull);
    await tester.tap(find.byKey(const Key('nav-profile')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('home-sign-in')));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('nav-profile')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('home-create-account')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('nav-profile')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('home-create-account')));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}
