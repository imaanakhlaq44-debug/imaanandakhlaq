import 'dart:async';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

/// Web only, emulator mode only: removes the Firebase Auth session the
/// browser saved on an earlier run.
///
/// Firebase restores a saved session as soon as the Auth instance exists, and
/// that restore calls the LIVE Auth server; once any request has gone out the
/// emulator can no longer be attached, so every later sign-in would go live as
/// well. Clearing the saved session before Firebase starts means there is
/// nothing to restore, and the emulator is attached before the first request.
Future<void> clearSavedFirebaseSession() async {
  final storageAny = globalContext['localStorage'];
  if (storageAny != null && storageAny.isA<JSObject>()) {
    final storage = storageAny as JSObject;
    final length = (storage['length'] as JSNumber?)?.toDartInt ?? 0;
    final keys = <String>[
      for (var i = 0; i < length; i++)
        if (storage.callMethod<JSString?>('key'.toJS, i.toJS)?.toDart
            case final String key
            when key.startsWith('firebase:'))
          key,
    ];
    for (final key in keys) {
      storage.callMethod<JSAny?>('removeItem'.toJS, key.toJS);
    }
  }
  final idbAny = globalContext['indexedDB'];
  if (idbAny == null || !idbAny.isA<JSObject>()) return;
  final idb = idbAny as JSObject;
  final done = Completer<void>();
  final request = idb.callMethod<JSObject>(
    'deleteDatabase'.toJS,
    'firebaseLocalStorageDb'.toJS,
  );
  void finish(JSAny? _) {
    if (!done.isCompleted) done.complete();
  }

  request['onsuccess'] = finish.toJS;
  request['onerror'] = finish.toJS;
  request['onblocked'] = finish.toJS;
  await done.future.timeout(const Duration(seconds: 3), onTimeout: () {});
}
