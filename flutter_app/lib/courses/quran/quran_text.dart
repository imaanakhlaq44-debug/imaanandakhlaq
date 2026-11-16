import 'dart:async';
import 'dart:convert';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'quran_data.dart';

/// One ayah of the verified Uthmani text, with its recitation.
///
/// Everything comes verbatim from `assets/data/courses/quran-text.json`,
/// imported by `tool/gen_quran_text.cjs` (Quran.com API; recitation by
/// Mahmoud Khalil Al-Husary, Muallim). Nothing here is typed by hand.
@immutable
class QuranVerse {
  const QuranVerse({
    required this.key,
    required this.text,
    required this.words,
    required this.timing,
    required this.audio,
  });

  /// "surah:ayah", e.g. "112:1".
  final String key;
  final String text;
  final List<String> words;

  /// Start and end (ms) of each word in [audio], or null where unknown.
  final List<(int, int)?> timing;
  final String? audio;

  int get ayah => int.parse(key.split(':').last);

  /// The verse text split at spaces, exactly as published. This, not
  /// [words], is what the app shows: the per-word list can drop small
  /// tajweed marks that the full text keeps.
  List<String> get tokens => text.trim().split(RegExp(r'\s+'));

  /// For each token, the index of the word it is (for highlighting), or
  /// null for tokens that are only a pause mark.
  List<int?> get tokenWords {
    final out = <int?>[];
    var w = 0;
    for (final t in tokens) {
      out.add(_hasLetter.hasMatch(t) ? w++ : null);
    }
    return out;
  }

  // Arabic letters (hamza to yeh, alef wasla to yeh barree, extended).
  static final _hasLetter = RegExp('[ء-يٱ-ۓۺ-ۿ]');

  /// The word being recited at [ms] into the audio, or null.
  int? wordAt(int ms) {
    for (var i = 0; i < timing.length; i++) {
      final t = timing[i];
      if (t != null && ms >= t.$1 && ms < t.$2) return i;
    }
    return null;
  }

  factory QuranVerse.fromMap(String key, Map<String, dynamic> m) => QuranVerse(
    key: key,
    text: m['text'] as String,
    words: List<String>.from(m['words'] as List),
    timing: [
      for (final t in m['timing'] as List)
        t is List && t.length == 2
            ? ((t[0] as num).toInt(), (t[1] as num).toInt())
            : null,
    ],
    audio: m['audio'] as String?,
  );
}

/// The imported text of every ayah the course uses.
class QuranText {
  QuranText._(this.verses, this.checksum, this.reciter);

  final Map<String, QuranVerse> verses;
  final String checksum;
  final String reciter;

  static Future<QuranText>? _loading;

  static Future<QuranText> load([AssetBundle? bundle]) =>
      _loading ??= (bundle ?? rootBundle)
          .loadString('assets/data/courses/quran-text.json')
          .then((s) => parse(jsonDecode(s) as Map<String, dynamic>));

  static QuranText parse(Map<String, dynamic> m) {
    final raw = Map<String, dynamic>.from(m['verses'] as Map);
    final rec = Map<String, dynamic>.from(m['recitation'] as Map? ?? {});
    return QuranText._(
      {
        for (final e in raw.entries)
          e.key: QuranVerse.fromMap(e.key, Map<String, dynamic>.from(e.value)),
      },
      m['checksum'] as String? ?? '',
      '${rec['reciter'] ?? ''} (${rec['style'] ?? ''})',
    );
  }

  /// The verses of [range] in order; missing ayahs are skipped.
  List<QuranVerse> of(AyahRange range) => [
    for (var a = range.from; a <= range.to; a++) ?verses['${range.surah}:$a'],
  ];
}

/// Plays one ayah's recitation. Swappable so widget tests stay silent.
abstract class AyahAudio {
  /// How the app makes players; tests replace it.
  static AyahAudio Function() create = PluginAyahAudio.new;

  Stream<Duration> get position;
  Stream<void> get completed;
  Future<void> play(String url);
  Future<void> pause();
  Future<void> resume();
  Future<void> stop();
  void dispose();
}

class PluginAyahAudio implements AyahAudio {
  final _player = AudioPlayer();
  @override
  Stream<Duration> get position => _player.onPositionChanged;
  @override
  Stream<void> get completed => _player.onPlayerComplete;
  @override
  Future<void> play(String url) => _player.play(UrlSource(url));
  @override
  Future<void> pause() => _player.pause();
  @override
  Future<void> resume() => _player.resume();
  @override
  Future<void> stop() => _player.stop();
  @override
  void dispose() => _player.dispose();
}

/// A silent player for tests: "plays" instantly and reports completion.
class SilentAyahAudio implements AyahAudio {
  final played = <String>[];
  final _pos = StreamController<Duration>.broadcast();
  final _done = StreamController<void>.broadcast();
  @override
  Stream<Duration> get position => _pos.stream;
  @override
  Stream<void> get completed => _done.stream;
  @override
  Future<void> play(String url) async => played.add(url);
  @override
  Future<void> pause() async {}
  @override
  Future<void> resume() async {}
  @override
  Future<void> stop() async {}

  /// Lets a test finish the current ayah.
  void finish() => _done.add(null);
  @override
  void dispose() {
    _pos.close();
    _done.close();
  }
}
