import 'dart:ui' show PointerDeviceKind;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/phone_frame.dart';

void main() {
  Future<Size> pumpAt(WidgetTester tester, Size screen) async {
    tester.view.physicalSize = screen;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    late Size seen;
    await tester.pumpWidget(
      MaterialApp(
        builder: (context, child) => PhoneFrame(enabled: true, child: child!),
        home: Builder(
          builder: (context) {
            seen = MediaQuery.sizeOf(context);
            return const Scaffold(body: Text('app'));
          },
        ),
      ),
    );
    return seen;
  }

  testWidgets('a wide web window shows the app in a phone-sized frame', (
    tester,
  ) async {
    final seen = await pumpAt(tester, const Size(1920, 1080));
    expect(find.byKey(const Key('phone-frame')), findsOneWidget);
    expect(seen.width, PhoneFrame.phoneWidth);
    expect(seen.height, PhoneFrame.maxPhoneHeight);
  });

  testWidgets('a phone-sized screen stays full screen', (tester) async {
    final seen = await pumpAt(tester, const Size(390, 844));
    expect(find.byKey(const Key('phone-frame')), findsNothing);
    expect(seen.width, 390);
  });

  test('a mouse can drag to scroll and slide', () {
    const behavior = DragEverywhereScrollBehavior();
    expect(behavior.dragDevices, contains(PointerDeviceKind.mouse));
    expect(behavior.dragDevices, contains(PointerDeviceKind.trackpad));
  });
}
