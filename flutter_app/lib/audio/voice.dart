import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../app_theme.dart';
import '../l10n/language.dart';

/// Short spoken lines that greet, cheer and say goodbye in the Individual
/// section, in the learner's language (generated with ElevenLabs from
/// `tool/voice/lines.json` into `assets/audio/voice/<id>-<en|ur>.mp3`).
enum VoiceLine {
  welcome('welcome'),
  lessonStart('lesson_start'),
  correct('correct'),
  tryAgain('try_again'),
  stars('stars'),
  badge('badge'),
  streak('streak'),
  goodbye('goodbye');

  const VoiceLine(this.file);
  final String file;
}

/// Plays [VoiceLine]s, one at a time, and remembers whether sound is on.
///
/// Never throws: a missing audio plugin or a blocked autoplay simply means
/// silence. Tests swap in [VoiceGuide.silent] (see test/flutter_test_config).
class VoiceGuide extends ChangeNotifier {
  VoiceGuide() : _silent = false {
    _load();
  }

  /// A guide that never touches the audio plugin or storage.
  VoiceGuide.silent() : _silent = true;

  static VoiceGuide instance = VoiceGuide();

  static const _key = 'imaan.sound.v1';
  final bool _silent;
  bool _on = true;
  bool _welcomed = false;
  AudioPlayer? _player;
  SharedPreferencesAsync? _prefs;

  /// Lines played so far (for tests and debugging).
  final played = <VoiceLine>[];

  bool get on => _on;

  Future<void> _load() async {
    try {
      _prefs ??= SharedPreferencesAsync();
      if (await _prefs!.getString(_key) == 'off' && _on) {
        _on = false;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> toggle() async {
    _on = !_on;
    notifyListeners();
    if (!_on) await _stop();
    if (_silent) return;
    try {
      _prefs ??= SharedPreferencesAsync();
      await _prefs!.setString(_key, _on ? 'on' : 'off');
    } catch (_) {}
  }

  /// The greeting, once per app launch.
  void welcomeOnce() {
    if (_welcomed) return;
    _welcomed = true;
    play(VoiceLine.welcome);
  }

  Future<void> play(VoiceLine line) async {
    if (!_on) return;
    played.add(line);
    if (_silent) return;
    final lang = AppLanguage.instance.urdu ? 'ur' : 'en';
    try {
      final player = _player ??= AudioPlayer();
      // Stopping a player that never had a source can fail on some
      // platforms; that must not stop the new line from playing.
      if (player.state == PlayerState.playing) {
        try {
          await player.stop();
        } catch (_) {}
      }
      await player.play(AssetSource('audio/voice/${line.file}-$lang.mp3'));
    } catch (e) {
      // No audio on this device or browser: carry on quietly.
      debugPrint('VoiceGuide: $e');
    }
  }

  Future<void> _stop() async {
    try {
      await _player?.stop();
    } catch (_) {}
  }
}

/// Speaker button that mutes or unmutes the voice lines.
class SoundToggle extends StatelessWidget {
  const SoundToggle({super.key, this.onDark = false});
  final bool onDark;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: VoiceGuide.instance,
    builder: (context, _) {
      final on = VoiceGuide.instance.on;
      return Semantics(
        button: true,
        label: on
            ? tr('Turn sound off', 'آواز بند کریں')
            : tr('Turn sound on', 'آواز چلائیں'),
        excludeSemantics: true,
        child: Material(
          color: onDark ? Colors.white.withValues(alpha: .16) : Colors.white,
          shape: CircleBorder(
            side: BorderSide(
              color: onDark
                  ? Colors.white.withValues(alpha: .35)
                  : brandNavy.withValues(alpha: .15),
            ),
          ),
          child: InkWell(
            key: const Key('sound-toggle'),
            customBorder: const CircleBorder(),
            onTap: VoiceGuide.instance.toggle,
            child: Padding(
              padding: const EdgeInsets.all(7),
              child: Icon(
                on ? Icons.volume_up_rounded : Icons.volume_off_rounded,
                size: 20,
                color: onDark ? Colors.white : brandNavy,
              ),
            ),
          ),
        ),
      );
    },
  );
}
