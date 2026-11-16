import 'dart:async';

import 'package:imaan_akhlaq/audio/voice.dart';
import 'package:imaan_akhlaq/billing/entitlement.dart';

/// Runs before every test file: keep the voice guide away from the audio
/// plugin, and unlock the Individual courses so course tests can walk
/// through every lesson (paywall_test locks them again on purpose).
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  VoiceGuide.instance = VoiceGuide.silent();
  Entitlement.instance = Entitlement(
    backend: FakeBilling(active: true),
    persist: false,
  );
  await testMain();
}
