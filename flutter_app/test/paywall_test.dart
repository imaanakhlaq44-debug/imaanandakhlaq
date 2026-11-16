import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/billing/entitlement.dart';
import 'package:imaan_akhlaq/billing/paywall.dart';

/// Answers the grown-up check shown on screen.
Future<void> answerGate(WidgetTester tester, {bool right = true}) async {
  final q = tester
      .widget<Text>(find.byKey(const Key('parent-gate-question')))
      .data!;
  final m = RegExp(r'(\d+) × (\d+)').firstMatch(q)!;
  final answer = int.parse(m[1]!) * int.parse(m[2]!) + (right ? 0 : 1);
  await tester.enterText(
    find.byKey(const Key('parent-gate-answer')),
    '$answer',
  );
  await tester.tap(find.byKey(const Key('parent-gate-ok')));
  await tester.pumpAndSettle();
}

void main() {
  late FakeBilling store;
  late Entitlement previous;

  setUp(() {
    previous = Entitlement.instance;
    store = FakeBilling();
    Entitlement.instance = Entitlement(backend: store, persist: false);
  });
  tearDown(() => Entitlement.instance = previous);

  Widget app(Widget child) => MaterialApp(home: child);

  testWidgets('the first lesson is free even without a subscription', (
    tester,
  ) async {
    await tester.pumpWidget(
      app(const PaidGate(free: true, child: Text('LESSON 1'))),
    );
    await tester.pumpAndSettle();
    expect(find.text('LESSON 1'), findsOneWidget);
    expect(find.byKey(const Key('paywall')), findsNothing);
  });

  testWidgets('locked lessons need a grown-up and a purchase', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      app(const PaidGate(free: false, child: Text('LESSON 2'))),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('paywall')), findsOneWidget);
    expect(find.text('LESSON 2'), findsNothing);
    expect(find.byKey(const Key('plan-yearly')), findsOneWidget);
    expect(find.text('Rs 4,500'), findsOneWidget);

    // A child guessing wrong does not buy anything.
    await tester.tap(find.byKey(const Key('paywall-buy')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('parent-gate')), findsOneWidget);
    await answerGate(tester, right: false);
    expect(store.bought, isEmpty);
    expect(find.byKey(const Key('paywall')), findsOneWidget);

    // A grown-up picks monthly and answers correctly.
    await tester.ensureVisible(find.byKey(const Key('plan-monthly')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('plan-monthly')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('paywall-buy')));
    await tester.pumpAndSettle();
    await answerGate(tester);
    expect(store.bought, ['monthly']);
    expect(find.text('LESSON 2'), findsOneWidget);
    expect(Entitlement.instance.active, isTrue);
  });

  testWidgets('restore unlocks a purchase made before', (tester) async {
    store.active = false;
    await tester.pumpWidget(
      app(const PaidGate(free: false, child: Text('LESSON 3'))),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('paywall')), findsOneWidget);
    store.active = true;
    await tester.tap(find.byKey(const Key('paywall-restore')));
    await tester.pumpAndSettle();
    expect(find.text('LESSON 3'), findsOneWidget);
  });

  testWidgets('without Google Play the paywall explains where to buy', (
    tester,
  ) async {
    Entitlement.instance = Entitlement(
      backend: FakeBilling(storeOpen: false),
      persist: false,
    );
    await tester.pumpWidget(
      app(const PaidGate(free: false, child: Text('LESSON 4'))),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('paywall-notice')), findsOneWidget);
    expect(
      tester
          .widget<FilledButton>(find.byKey(const Key('paywall-buy')))
          .onPressed,
      isNull,
    );
  });
}
