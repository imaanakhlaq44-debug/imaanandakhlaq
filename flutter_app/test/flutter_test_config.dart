import 'dart:async';

import 'package:imaan_akhlaq/audio/voice.dart';

/// Runs before every test file: keep the voice guide away from the audio
/// plugin, which widget tests do not have.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  VoiceGuide.instance = VoiceGuide.silent();
  await testMain();
}
