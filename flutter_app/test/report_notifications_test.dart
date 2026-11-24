import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/data/checklist_cloud.dart';
import 'package:imaan_akhlaq/data/report_notifications.dart';
import 'package:imaan_akhlaq/domain.dart';
import 'package:imaan_akhlaq/l10n/language.dart';
import 'package:imaan_akhlaq/screens/family_checklists.dart';

class FakePush implements PushDevice {
  bool allow = true;
  bool asked = false;
  bool granted = false;
  String? device = 'device-1';
  bool forgotten = false;
  @override
  String get platform => 'web';
  @override
  Future<bool> allowed() async => granted;
  @override
  Future<bool> askPermission() async {
    asked = true;
    granted = allow;
    return allow;
  }

  @override
  Future<String?> token() async => granted ? device : null;
  @override
  Future<void> forget() async => forgotten = true;
}

class MemoryStore implements ReportDeviceStore {
  final saved = <String, Map<String, String>>{};
  int sends = 0;
  @override
  Future<String?> ownerOf(String token) async => saved[token]?['owner'];
  @override
  Future<void> save(
    String token, {
    required String owner,
    required String lang,
    required String platform,
  }) async =>
      saved[token] = {'owner': owner, 'lang': lang, 'platform': platform};
  @override
  Future<void> remove(String token) async => saved.remove(token);
  @override
  Future<int> sendNow() async => saved.isEmpty ? 0 : ++sends;
}

void main() {
  late FakePush push;
  late MemoryStore store;
  ReportNotifications report() =>
      ReportNotifications(store: store, familyUid: 'fam-1', push: push);

  setUp(() {
    push = FakePush();
    store = MemoryStore();
  });

  test('opening the family page never asks for permission', () async {
    final r = report();
    await r.load();
    expect(push.asked, isFalse);
    expect(r.on, isFalse);
  });

  test('turning it on saves this device in the family\'s language', () async {
    final r = report();
    expect(await r.turnOn(urdu: true), isNull);
    expect(r.on, isTrue);
    expect(store.saved['device-1'], {
      'owner': 'fam-1',
      'lang': 'ur',
      'platform': 'web',
    });
    await r.setLanguage(urdu: false);
    expect(store.saved['device-1']!['lang'], 'en');
    expect(await r.sendTest(), isTrue);

    // Next visit: already on, still without asking.
    push.asked = false;
    final again = report();
    await again.load();
    expect(again.on, isTrue);
    expect(push.asked, isFalse);

    await again.turnOff();
    expect(again.on, isFalse);
    expect(store.saved, isEmpty);
    expect(push.forgotten, isTrue);
  });

  test('blocked notifications are reported, nothing is saved', () async {
    push.allow = false;
    final r = report();
    expect(await r.turnOn(urdu: false), ReportProblem.notAllowed);
    expect(r.on, isFalse);
    expect(store.saved, isEmpty);
  });

  testWidgets('a parent reads the habits page in Urdu', (tester) async {
    tester.view.physicalSize = const Size(480, 2400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    AppLanguage.instance = AppLanguage(persist: false);
    addTearDown(() => AppLanguage.instance = AppLanguage(persist: false));
    await AppLanguage.instance.setUrdu(true);
    final cloud = MemoryChecklistCloud('kid-1')
      ..days['2026-11-25'] = {
        'salah': {'fajr', 'zuhr'},
      };
    await tester.pumpWidget(
      MaterialApp(
        home: LanguageScope(
          child: ChildChecklistsScreen(
            child: const Profile(
              uid: 'kid-1',
              name: 'Ayaan',
              role: AccountRole.student,
            ),
            cloud: cloud,
            clock: () => DateTime(2026, 11, 25, 18),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('اس ہفتے'), findsOneWidget);
    expect(find.text('نماز: فجر، ظہر'), findsOneWidget);
    expect(find.text('تصدیق کریں'), findsOneWidget);
    expect(
      Directionality.of(tester.element(find.text('اس ہفتے'))),
      TextDirection.rtl,
    );
  });
}
