import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app.dart';
import 'package:imaan_akhlaq/l10n/language.dart';
import 'app_test.dart' show FakeRepository, viewport;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    await (FontLoader('AppSans')
          ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
        .load();
    await (FontLoader('Fredoka')
          ..addFont(rootBundle.load('assets/fonts/fredoka.ttf')))
        .load();
    await (FontLoader('JameelNoori')
          ..addFont(rootBundle.load('assets/fonts/jameel-noori-nastaleeq.ttf')))
        .load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });
  setUp(() => AppLanguage.instance = AppLanguage(persist: false));
  tearDown(() => AppLanguage.instance = AppLanguage(persist: false));

  testWidgets('the switch turns the Individual home into right-to-left Urdu', (
    tester,
  ) async {
    viewport(tester);
    final repo = FakeRepository();
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await tester.pumpAndSettle();
    expect(find.text('Choose your space'), findsOneWidget);

    await tester.tap(find.byKey(const Key('language-toggle')));
    await tester.pumpAndSettle();
    expect(find.text('اپنی جگہ چنیں'), findsOneWidget);
    expect(
      Directionality.of(tester.element(find.text('اپنی جگہ چنیں'))),
      TextDirection.rtl,
    );

    await tester.tap(find.byKey(const Key('choose-individual')));
    await tester.pumpAndSettle();
    final art = tester.getRect(find.byKey(const Key('reading-hero-art')));
    final title = tester.getRect(find.text('آئیں مل کر کہانی پڑھیں'));
    expect(
      art.center.dx < title.center.dx,
      isTrue,
      reason: 'in Urdu the picture sits left of the words',
    );
    expect(find.text('سیکھنے کی دنیا'), findsOneWidget);
    expect(find.text('قرآن'), findsOneWidget);
    expect(find.text('گھر'), findsOneWidget);

    await tester.tap(find.byKey(const Key('language-toggle')));
    await tester.pumpAndSettle();
    expect(find.text('Explore learning'), findsOneWidget);
    expect(
      Directionality.of(tester.element(find.text('Explore learning'))),
      TextDirection.ltr,
    );
    final artEn = tester.getRect(find.byKey(const Key('reading-hero-art')));
    final titleEn = tester.getRect(find.text('Read a story together'));
    expect(
      artEn.center.dx > titleEn.center.dx,
      isTrue,
      reason: 'in English the picture sits right of the words',
    );
  });
}