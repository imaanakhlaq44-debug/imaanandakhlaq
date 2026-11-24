import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

/// The phone side of push notifications, swappable for tests.
abstract class PushDevice {
  /// Asks to show notifications; true when allowed.
  Future<bool> askPermission();

  /// Whether notifications are already allowed, without asking.
  Future<bool> allowed();

  /// This device's address for notifications, or null when not allowed.
  Future<String?> token();
  Future<void> forget();
  String get platform;
}

class FirebasePushDevice implements PushDevice {
  FirebasePushDevice({FirebaseMessaging? messaging})
    : _messaging = messaging ?? FirebaseMessaging.instance;
  final FirebaseMessaging _messaging;

  /// On the website the background worker sits in its own folder, so it
  /// never replaces the app's own worker. It reads the public Firebase
  /// settings from its address.
  static String get _webWorker {
    final query = Uri(
      queryParameters: {
        'apiKey': const String.fromEnvironment('FIREBASE_API_KEY'),
        'projectId': const String.fromEnvironment('FIREBASE_PROJECT_ID'),
        'messagingSenderId': const String.fromEnvironment(
          'FIREBASE_MESSAGING_SENDER_ID',
        ),
        'appId': const String.fromEnvironment('FIREBASE_WEB_APP_ID'),
      },
    ).query;
    return 'fcm/firebase-messaging-sw.js?$query';
  }

  static const _vapidKey = String.fromEnvironment('FIREBASE_VAPID_KEY');

  @override
  String get platform => kIsWeb
      ? 'web'
      : defaultTargetPlatform == TargetPlatform.iOS
      ? 'ios'
      : 'android';

  @override
  Future<bool> askPermission() async {
    final s = await _messaging.requestPermission();
    return s.authorizationStatus == AuthorizationStatus.authorized ||
        s.authorizationStatus == AuthorizationStatus.provisional;
  }

  @override
  Future<bool> allowed() async {
    final s = await _messaging.getNotificationSettings();
    return s.authorizationStatus == AuthorizationStatus.authorized ||
        s.authorizationStatus == AuthorizationStatus.provisional;
  }

  @override
  // Classic FCM tokens: the server (firebase-admin 12) sends to these; the
  // newer register() hands out installation ids it cannot send to yet.
  // ignore: deprecated_member_use
  Future<String?> token() => _messaging.getToken(
    vapidKey: kIsWeb && _vapidKey.isNotEmpty ? _vapidKey : null,
    serviceWorkerScriptPath: kIsWeb ? _webWorker : null,
  );

  @override
  // ignore: deprecated_member_use
  Future<void> forget() => _messaging.deleteToken();
}

/// Why turning the weekly report on did not work.
enum ReportProblem { notAllowed, unavailable }

/// Where a device that gets the report is saved: `push_tokens/{token}`.
abstract class ReportDeviceStore {
  /// The family the device belongs to, or null when it is not saved.
  Future<String?> ownerOf(String token);
  Future<void> save(
    String token, {
    required String owner,
    required String lang,
    required String platform,
  });
  Future<void> remove(String token);

  /// Sends the family's report now; how many devices got it.
  Future<int> sendNow();
}

class FirebaseReportDeviceStore implements ReportDeviceStore {
  FirebaseReportDeviceStore(this.db, this.functions);
  final FirebaseFirestore db;
  final FirebaseFunctions functions;

  DocumentReference<Map<String, dynamic>> _doc(String token) =>
      db.collection('push_tokens').doc(token);

  @override
  Future<String?> ownerOf(String token) async {
    final saved = await _doc(token).get();
    if (!saved.exists) return null;
    return saved.data()?['owner_uid'] as String?;
  }

  @override
  Future<void> save(
    String token, {
    required String owner,
    required String lang,
    required String platform,
  }) => _doc(token).set({
    'owner_uid': owner,
    'lang': lang,
    'platform': platform,
    'updatedAt': FieldValue.serverTimestamp(),
  });

  @override
  Future<void> remove(String token) => _doc(token).delete();

  @override
  Future<int> sendNow() async {
    final r = await functions
        .httpsCallable('sendMyWeeklyReport')
        .call<Object?>();
    final data = r.data;
    return data is Map ? (data['sent'] as num? ?? 0).toInt() : 0;
  }
}

/// A family's weekly habits report on this phone: on or off, its language,
/// and a "send me one now" test.
///
/// The server sends the report every Sunday evening
/// (functions/weekly-report.js).
class ReportNotifications extends ChangeNotifier {
  ReportNotifications({
    required this.store,
    required this.familyUid,
    required this.push,
  });

  final ReportDeviceStore store;
  final String familyUid;
  final PushDevice push;

  bool _on = false;
  bool _busy = false;
  String? _token;

  bool get on => _on;
  bool get busy => _busy;

  /// Finds out whether this device already gets the report. Never asks the
  /// family for permission.
  Future<void> load() async {
    try {
      if (!await push.allowed()) return;
      final token = await push.token();
      if (token == null) return;
      _token = token;
      _on = await store.ownerOf(token) == familyUid;
      notifyListeners();
    } catch (_) {
      // Not allowed yet, or offline: shown as off.
    }
  }

  Future<ReportProblem?> turnOn({required bool urdu}) async {
    _setBusy(true);
    try {
      if (!await push.askPermission()) return ReportProblem.notAllowed;
      final token = await push.token();
      if (token == null) return ReportProblem.notAllowed;
      await store.save(
        token,
        owner: familyUid,
        lang: urdu ? 'ur' : 'en',
        platform: push.platform,
      );
      _token = token;
      _on = true;
      return null;
    } catch (_) {
      return ReportProblem.unavailable;
    } finally {
      _setBusy(false);
    }
  }

  Future<void> turnOff() async {
    _setBusy(true);
    try {
      final token = _token ?? await push.token();
      if (token != null) await store.remove(token);
      await push.forget();
    } catch (_) {
      // Already gone: off either way.
    } finally {
      _token = null;
      _on = false;
      _setBusy(false);
    }
  }

  /// Keeps the report in the language the family now reads the app in.
  Future<void> setLanguage({required bool urdu}) async {
    final token = _token;
    if (!_on || token == null) return;
    try {
      await store.save(
        token,
        owner: familyUid,
        lang: urdu ? 'ur' : 'en',
        platform: push.platform,
      );
    } catch (_) {}
  }

  /// Asks the server to send this week's report now. True when sent.
  Future<bool> sendTest() async {
    _setBusy(true);
    try {
      return await store.sendNow() > 0;
    } catch (_) {
      return false;
    } finally {
      _setBusy(false);
    }
  }

  void _setBusy(bool value) {
    _busy = value;
    notifyListeners();
  }
}
