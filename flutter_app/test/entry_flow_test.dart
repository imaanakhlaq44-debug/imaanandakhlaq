import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app.dart';
import 'package:imaan_akhlaq/data/registration.dart';
import 'package:imaan_akhlaq/screens/learning_experience.dart';
import 'app_test.dart' show FakeRepository, viewport, enterSection;

Future<void> tap(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  setUpAll(() async {
    await (FontLoader('AppSans')
          ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
        .load();
    await (FontLoader('Fredoka')
          ..addFont(rootBundle.load('assets/fonts/fredoka.ttf')))
        .load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });
  testWidgets('original splash leads to two mobile entry buttons', (
    tester,
  ) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    expect(find.byKey(const Key('brand-splash')), findsOneWidget);
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('choose-individual')), findsOneWidget);
    expect(find.byKey(const Key('choose-school')), findsOneWidget);
    await tester.runAsync(
      () => precacheImage(
        const ResizeImage(
          AssetImage('assets/images/launch-logo.png'),
          width: 480,
        ),
        tester.element(find.byType(MaterialApp)),
      ),
    );
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/section-choice.png'),
    );
  });
  testWidgets('Individual creates an individual account without role cards', (
    tester,
  ) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester);
    await tap(tester, find.text('Profile'));
    await tap(tester, find.byKey(const Key('home-create-account')));
    expect(find.text('Individual registration'), findsOneWidget);
    expect(find.byKey(const Key('signup-school')), findsNothing);
    expect(find.byKey(const Key('signup-kind')), findsNothing);
  });
  testWidgets('School opens one login form with school registration link', (
    tester,
  ) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: true);
    expect(find.byKey(const Key('login')), findsOneWidget);
    expect(find.text('Email or school username'), findsOneWidget);
    expect(find.byKey(const Key('school-teacher-login')), findsNothing);
    expect(find.byKey(const Key('school-family-login')), findsNothing);
    await tester.runAsync(
      () => precacheImage(
        const ResizeImage(
          AssetImage('assets/images/launch-logo.png'),
          width: 240,
        ),
        tester.element(find.byType(MaterialApp)),
      ),
    );
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/unified-login.png'),
    );
    await tap(tester, find.byKey(const Key('login-create-account')));
    expect(find.text('School registration'), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('login')), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('section-choice')), findsOneWidget);
  });
  testWidgets('school registration preserves existing registration contract', (
    tester,
  ) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: true);
    await tap(tester, find.byKey(const Key('login-create-account')));
    for (final entry in {
      'signup-school': 'Imaan Academy',
      'signup-name': 'School Admin',
      'signup-email': 'admin@example.com',
      'signup-phone': '+923001234567',
      'signup-password': 'strong-password',
      'signup-confirm': 'strong-password',
    }.entries) {
      await tester.scrollUntilVisible(
        find.byKey(Key(entry.key)),
        160,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.enterText(find.byKey(Key(entry.key)), entry.value);
    }
    await tap(tester, find.byType(Checkbox));
    await tap(tester, find.byKey(const Key('signup-submit')));
    expect(repo.lastRegistration?.kind, RegistrationKind.school);
    expect(repo.lastRegistration?.schoolName, 'Imaan Academy');
    expect(find.text('Your account is ready'), findsOneWidget);
  });
  testWidgets(
    'one form accepts email, teacher and family credentials and routes by profile',
    (tester) async {
      viewport(tester);
      for (final entry in {
        'person@example.com': 'individual',
        'PAR-7K4QM': 'family',
        'TCH-7K4QM': 'teacher',
        'admin@example.com': 'admin',
      }.entries) {
        final repo = FakeRepository()..loginUid = entry.value;
        addTearDown(repo.dispose);
        await tester.pumpWidget(ImaanApp(key: UniqueKey(), repository: repo));
        await enterSection(tester, school: true);
        await tester.enterText(find.byKey(const Key('login')), entry.key);
        await tester.enterText(find.byKey(const Key('password')), 'password');
        await tap(tester, find.text('Continue'));
        expect(repo.loginCalls, 1);
        if (entry.value == 'family') {
          expect(find.text('Your family'), findsOneWidget);
          expect(find.text('Ayaan'), findsOneWidget);
        }
        if (entry.value == 'individual') {
          // An Individual account never opens from the School section.
          expect(find.byType(LearningDashboard), findsNothing);
          expect(
            find.textContaining('No school account matches'),
            findsOneWidget,
          );
          expect(find.byKey(const Key('login')), findsOneWidget);
        }
        if (entry.value == 'teacher') {
          expect(find.text('Teacher workspace'), findsOneWidget);
        }
        if (entry.value == 'admin') {
          expect(find.text('School admin workspace'), findsOneWidget);
        }
        expect(tester.takeException(), isNull);
      }
    },
  );
  testWidgets('invalid child code never submits login', (tester) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: true);
    await tester.enterText(find.byKey(const Key('login')), 'STU-12345');
    await tester.enterText(find.byKey(const Key('password')), 'password');
    await tap(tester, find.text('Continue'));
    expect(repo.loginCalls, 0);
    expect(
      find.text('Enter your email or school username (PAR- / TCH-).'),
      findsOneWidget,
    );
  });
  testWidgets(
    'a school account opens only from School, never from Individual',
    (tester) async {
      viewport(tester);
      final repo = FakeRepository()..initial = 'family';
      addTearDown(repo.dispose);
      await tester.pumpWidget(ImaanApp(repository: repo));
      await enterSection(tester);
      expect(find.text('Your family'), findsNothing);
      expect(find.byType(LearningDashboard), findsNothing);
      expect(find.textContaining('This is a school account'), findsOneWidget);
      expect(find.byKey(const Key('login')), findsOneWidget);

      // Signing in again from School opens the family workspace.
      final school = FakeRepository()..initial = 'family';
      addTearDown(school.dispose);
      await tester.pumpWidget(ImaanApp(key: UniqueKey(), repository: school));
      await enterSection(tester, school: true);
      expect(find.text('Your family'), findsOneWidget);
    },
  );
  testWidgets('small phone login remains usable with keyboard and large text', (
    tester,
  ) async {
    viewport(tester, scale: 1.6);
    tester.view.physicalSize = const Size(320, 740);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await tester.pumpAndSettle();
    await tap(tester, find.byKey(const Key('choose-school')));
    tester.view.viewInsets = const FakeViewPadding(bottom: 280);
    addTearDown(tester.view.resetViewInsets);
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('password')));
    await tester.enterText(find.byKey(const Key('password')), 'test');
    await tap(tester, find.text('Continue'));
    expect(repo.loginCalls, 0);
    expect(tester.takeException(), isNull);
  });
}
