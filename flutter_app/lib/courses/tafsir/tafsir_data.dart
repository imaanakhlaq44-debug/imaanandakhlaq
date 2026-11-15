import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// One ayah as printed in the source volume: reference, exact Arabic and,
/// in volumes 1–5, the volume's own English meaning guide for that ayah.
class TafsirAyah {
  const TafsirAyah({required this.ref, required this.arabic, this.meaning});
  final String ref, arabic;
  final String? meaning;
  factory TafsirAyah.fromMap(Map<String, dynamic> m) => TafsirAyah(
    ref: m['ref'] as String,
    arabic: m['arabic'] as String,
    meaning: m['meaning'] as String?,
  );
}

/// One mission, copied field by field from a Tafsir story volume by
/// `tool/extract_tafsir.mjs`. Nothing here is rewritten.
class TafsirMission {
  const TafsirMission({
    required this.id,
    required this.number,
    required this.title,
    required this.anchor,
    required this.aim,
    required this.ayahs,
    required this.tafsir,
    required this.story,
    required this.question,
    required this.options,
    required this.correct,
    required this.feedback,
    required this.action,
    required this.reflection,
    required this.sourceDocument,
    this.meaning,
    this.ayahNote,
    this.memorization,
    this.vocabulary,
    this.careNote,
    this.review,
    this.sourcePath,
    this.sourceUrl,
  });
  final String id, title, anchor, aim, tafsir, story, question, feedback;
  final String action, reflection, sourceDocument;
  final int number, correct;
  final List<TafsirAyah> ayahs;
  final List<String> options;

  /// Volumes 6–7: one child-friendly meaning for the whole passage.
  final String? meaning;
  final String? ayahNote, memorization, vocabulary, careNote, review;
  final String? sourcePath, sourceUrl;

  /// "49:2, 49:3" — the ayah references in the order the volume gives them.
  String get refs => ayahs.map((a) => a.ref).join(', ');

  factory TafsirMission.fromMap(Map<String, dynamic> m) => TafsirMission(
    id: m['id'] as String,
    number: m['number'] as int,
    title: m['title'] as String,
    anchor: m['anchor'] as String,
    aim: m['aim'] as String,
    ayahs: (m['ayahs'] as List)
        .map((a) => TafsirAyah.fromMap(Map<String, dynamic>.from(a)))
        .toList(),
    tafsir: m['tafsir'] as String,
    story: m['story'] as String,
    question: m['question'] as String,
    options: List<String>.from(m['options'] as List),
    correct: m['correct'] as int,
    feedback: m['feedback'] as String,
    action: m['action'] as String,
    reflection: m['reflection'] as String,
    sourceDocument: m['sourceDocument'] as String,
    meaning: m['meaning'] as String?,
    ayahNote: m['ayahNote'] as String?,
    memorization: m['memorization'] as String?,
    vocabulary: m['vocabulary'] as String?,
    careNote: m['careNote'] as String?,
    review: m['review'] as String?,
    sourcePath: m['sourcePath'] as String?,
    sourceUrl: m['sourceUrl'] as String?,
  );
}

class TafsirWorld {
  const TafsirWorld({
    required this.number,
    required this.title,
    required this.document,
    required this.missions,
  });
  final int number;
  final String title, document;
  final List<TafsirMission> missions;

  factory TafsirWorld.fromMap(Map<String, dynamic> m) => TafsirWorld(
    number: m['world'] as int,
    title: m['title'] as String,
    document: (m['_source'] as Map)['document'] as String,
    missions: (m['missions'] as List)
        .map((x) => TafsirMission.fromMap(Map<String, dynamic>.from(x)))
        .toList(),
  );

  /// The seven worlds that have a source volume in the email curriculum.
  static const assets = [
    'assets/data/courses/tafsir-world-01.json',
    'assets/data/courses/tafsir-world-02.json',
    'assets/data/courses/tafsir-world-03.json',
    'assets/data/courses/tafsir-world-04.json',
    'assets/data/courses/tafsir-world-05.json',
    'assets/data/courses/tafsir-world-06.json',
    'assets/data/courses/tafsir-world-07.json',
  ];

  /// World 8 is in the developer manual's plan, but its volume (Volume 08,
  /// Self-Improvement) was not attached to the email. Shown as coming soon.
  static const comingSoonTitle = 'The World of Self-Improvement';
  static const comingSoonMissions = 16;

  static List<TafsirWorld>? _loaded;
  static Future<List<TafsirWorld>>? _loading;
  static Future<List<TafsirWorld>> load([AssetBundle? bundle]) {
    if (_loaded != null) return SynchronousFuture(_loaded!);
    return _loading ??= _read(bundle ?? rootBundle);
  }

  static Future<List<TafsirWorld>> _read(AssetBundle bundle) async {
    try {
      final texts = await Future.wait(assets.map(bundle.loadString));
      final worlds = [
        for (final t in texts)
          TafsirWorld.fromMap(Map<String, dynamic>.from(jsonDecode(t))),
      ];
      _loaded = worlds;
      return worlds;
    } catch (_) {
      _loading = null; // let Retry read the assets again
      rethrow;
    }
  }
}

/// Where a learner is in one mission. Steps: 0 story, 1 ayah, 2 understand,
/// 3 decide, 4 daily action.
class TafsirProgress {
  const TafsirProgress({
    this.step = 0,
    this.choice,
    this.completedAt,
    this.reflection,
  });
  static const lastStep = 4;
  final int step;
  final int? choice;
  final DateTime? completedAt;
  final String? reflection;
  bool get explored => completedAt != null;

  TafsirProgress copyWith({
    int? step,
    int? choice,
    DateTime? completedAt,
    String? reflection,
  }) => TafsirProgress(
    step: step ?? this.step,
    choice: choice ?? this.choice,
    completedAt: completedAt ?? this.completedAt,
    reflection: reflection ?? this.reflection,
  );

  Map<String, dynamic> toMap() => {
    'step': step,
    if (choice != null) 'choice': choice,
    if (completedAt != null)
      'completedAt': completedAt!.toUtc().toIso8601String(),
    if (reflection != null) 'reflection': reflection,
  };

  factory TafsirProgress.fromMap(Map<String, dynamic> m) => TafsirProgress(
    step: m['step'] is int ? (m['step'] as int).clamp(0, lastStep) : 0,
    choice: m['choice'] is int && m['choice'] >= 0 && m['choice'] < 3
        ? m['choice'] as int
        : null,
    completedAt: m['completedAt'] is String
        ? DateTime.tryParse(m['completedAt'])
        : null,
    reflection: const ['yes', 'tried', 'notYet'].contains(m['reflection'])
        ? m['reflection'] as String
        : null,
  );
}

abstract class TafsirProgressStore {
  Future<Map<String, TafsirProgress>> load();
  Future<void> save(Map<String, TafsirProgress> progress);
}

/// Progress kept on this device only, separately for each learner scope.
/// No points and nothing is sent to Firebase.
class DeviceTafsirProgressStore implements TafsirProgressStore {
  DeviceTafsirProgressStore({
    required String scope,
    required this.readValue,
    required this.writeValue,
  }) : key = 'imaan.tafsir.v1.${Uri.encodeComponent(scope)}';

  factory DeviceTafsirProgressStore.forLearner(String scope) {
    final prefs = SharedPreferencesAsync();
    return DeviceTafsirProgressStore(
      scope: scope,
      readValue: prefs.getString,
      writeValue: prefs.setString,
    );
  }

  final String key;
  final Future<String?> Function(String) readValue;
  final Future<void> Function(String, String) writeValue;

  @override
  Future<Map<String, TafsirProgress>> load() async {
    final text = await readValue(key);
    if (text == null) return {};
    try {
      final value = jsonDecode(text);
      if (value is! Map || value['version'] != 1 || value['missions'] is! Map) {
        throw const FormatException();
      }
      return (value['missions'] as Map).map((id, item) {
        if (id is! String || item is! Map) throw const FormatException();
        return MapEntry(
          id,
          TafsirProgress.fromMap(Map<String, dynamic>.from(item)),
        );
      });
    } catch (_) {
      // Never overwrite unreadable saved progress with an empty document.
      throw StateError(
        'Your saved progress could not be read. Please try again.',
      );
    }
  }

  @override
  Future<void> save(Map<String, TafsirProgress> progress) => writeValue(
    key,
    jsonEncode({
      'version': 1,
      'missions': progress.map((id, p) => MapEntry(id, p.toMap())),
    }),
  );
}
