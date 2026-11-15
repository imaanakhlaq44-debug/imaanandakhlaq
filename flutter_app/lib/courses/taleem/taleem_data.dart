import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Rihlat al-Huda Junior (Taleem-ul-Islam): four age editions, each with nine
/// learning journeys. The JSON is generated word for word from the source
/// texts by `tool/extract_taleem.cjs`; see README.md in this folder.

class TaleemQuestion {
  const TaleemQuestion(this.question, this.answer);
  final String question, answer;
}

/// One part of "Understand — Our Teaching": a paragraph, or an Arabic line
/// with the meaning printed beneath it in the source.
class TaleemTeaching {
  const TaleemTeaching({this.text, this.arabic, this.meaning});
  final String? text, arabic, meaning;
  factory TaleemTeaching.fromMap(Map<String, dynamic> m) => TaleemTeaching(
    text: m['text'] as String?,
    arabic: m['arabic'] as String?,
    meaning: m['meaning'] as String?,
  );
}

class TaleemDecide {
  const TaleemDecide(this.scenario, this.feedback);
  final List<String> scenario;
  final String feedback;
}

class TaleemLesson {
  const TaleemLesson({
    required this.id,
    required this.number,
    required this.title,
    required this.objective,
    required this.masterChapters,
    required this.evidenceLabel,
    required this.evidence,
    required this.story,
    required this.teaching,
    required this.questions,
    required this.reflect,
    required this.decide,
    required this.dailyAction,
    required this.tryTogether,
    required this.keyWords,
    required this.remember,
    required this.parentNote,
  });
  final String id, title, objective, masterChapters, evidenceLabel, evidence;
  final int number;
  final List<String> story, reflect, remember;
  final List<TaleemTeaching> teaching;
  final List<TaleemQuestion> questions;
  final TaleemDecide? decide;
  final String dailyAction, tryTogether, keyWords, parentNote;

  factory TaleemLesson.fromMap(Map<String, dynamic> m) {
    List<String> strings(String k) => List<String>.from(m[k] as List);
    final d = m['decide'] as Map?;
    return TaleemLesson(
      id: m['id'] as String,
      number: m['number'] as int,
      title: m['title'] as String,
      objective: m['objective'] as String,
      masterChapters: m['masterChapters'] as String,
      evidenceLabel: m['evidenceLabel'] as String,
      evidence: m['evidence'] as String,
      story: strings('story'),
      teaching: (m['teaching'] as List)
          .map((t) => TaleemTeaching.fromMap(Map<String, dynamic>.from(t)))
          .toList(),
      questions: (m['questions'] as List)
          .map((q) => TaleemQuestion(q['q'] as String, q['a'] as String))
          .toList(),
      reflect: strings('reflect'),
      decide: d == null
          ? null
          : TaleemDecide(
              List<String>.from(d['scenario'] as List),
              d['feedback'] as String,
            ),
      dailyAction: m['dailyAction'] as String,
      tryTogether: m['tryTogether'] as String,
      keyWords: m['keyWords'] as String,
      remember: strings('remember'),
      parentNote: m['parentNote'] as String,
    );
  }
}

class TaleemJourney {
  const TaleemJourney(this.number, this.title, this.aim, this.lessons);
  final int number;
  final String title, aim;
  final List<TaleemLesson> lessons;
}

class TaleemEdition {
  const TaleemEdition({
    required this.id,
    required this.volume,
    required this.title,
    required this.arabicTitle,
    required this.ages,
    required this.welcome,
    required this.status,
    required this.sourceDocument,
    required this.journeys,
  });
  final String id, title, arabicTitle, ages, welcome, status, sourceDocument;
  final int volume;
  final List<TaleemJourney> journeys;
  List<TaleemLesson> get lessons => [for (final j in journeys) ...j.lessons];

  factory TaleemEdition.fromMap(Map<String, dynamic> m) => TaleemEdition(
    id: m['id'] as String,
    volume: m['volume'] as int,
    title: m['title'] as String,
    arabicTitle: m['arabicTitle'] as String,
    ages: m['ages'] as String,
    welcome: m['welcome'] as String,
    status: m['status'] as String,
    sourceDocument: m['sourceDocument'] as String,
    journeys: (m['journeys'] as List)
        .map(
          (j) => TaleemJourney(
            j['number'] as int,
            j['title'] as String,
            j['aim'] as String,
            (j['lessons'] as List)
                .map((l) => TaleemLesson.fromMap(Map<String, dynamic>.from(l)))
                .toList(),
          ),
        )
        .toList(),
  );

  static const assets = [
    'assets/data/courses/taleem-volume-01.json',
    'assets/data/courses/taleem-volume-02.json',
    'assets/data/courses/taleem-volume-03.json',
    'assets/data/courses/taleem-volume-04.json',
  ];
  static List<TaleemEdition>? _loaded;
  static Future<List<TaleemEdition>>? _loading;

  /// All four editions, parsed once per app run.
  static Future<List<TaleemEdition>> load() {
    if (_loaded != null) return SynchronousFuture(_loaded!);
    return _loading ??= Future.wait(assets.map(rootBundle.loadString))
        .then((texts) {
          final editions = [
            for (final t in texts)
              TaleemEdition.fromMap(
                Map<String, dynamic>.from(jsonDecode(t) as Map),
              ),
          ];
          _loaded = editions;
          return editions;
        })
        .catchError((Object e) {
          _loading = null;
          throw e;
        });
  }
}

/// Steps of one lesson, in the order of the source learning page.
const taleemSteps = [
  'Discover',
  'Understand',
  'Questions & Answers',
  'Reflect & decide',
  'Practise',
  'Remember',
];

class TaleemProgress {
  const TaleemProgress({
    this.step = 0,
    this.completedAt,
    this.reflection,
    this.checks = const {},
  });
  final int step;
  final DateTime? completedAt;
  final String? reflection;

  /// Ticked "Remember" self-checks (indices into the lesson's list).
  final Set<int> checks;
  bool get explored => completedAt != null;

  TaleemProgress copyWith({
    int? step,
    DateTime? completedAt,
    String? reflection,
    Set<int>? checks,
  }) => TaleemProgress(
    step: step ?? this.step,
    completedAt: completedAt ?? this.completedAt,
    reflection: reflection ?? this.reflection,
    checks: checks ?? this.checks,
  );
  Map<String, dynamic> toMap() => {
    'step': step,
    if (completedAt != null)
      'completedAt': completedAt!.toUtc().toIso8601String(),
    if (reflection != null) 'reflection': reflection,
    if (checks.isNotEmpty) 'checks': (checks.toList()..sort()),
  };
  factory TaleemProgress.fromMap(Map<String, dynamic> m) => TaleemProgress(
    step: m['step'] is int
        ? (m['step'] as int).clamp(0, taleemSteps.length - 1)
        : 0,
    completedAt: m['completedAt'] is String
        ? DateTime.tryParse(m['completedAt'] as String)
        : null,
    reflection: const ['yes', 'tried', 'notYet'].contains(m['reflection'])
        ? m['reflection'] as String
        : null,
    checks: m['checks'] is List
        ? {
            for (final c in m['checks'] as List)
              if (c is int && c >= 0 && c < 8) c,
          }
        : const {},
  );
}

abstract class TaleemProgressStore {
  Future<Map<String, TaleemProgress>> load();
  Future<void> save(Map<String, TaleemProgress> progress);
}

/// Progress for every edition, kept on this device per learner [scope].
/// No points and nothing is sent to Firebase.
class DeviceTaleemProgressStore implements TaleemProgressStore {
  DeviceTaleemProgressStore({
    required String scope,
    required this.readValue,
    required this.writeValue,
  }) : key = 'imaan.taleem.v1.${Uri.encodeComponent(scope)}';
  factory DeviceTaleemProgressStore.forLearner(String scope) {
    final prefs = SharedPreferencesAsync();
    return DeviceTaleemProgressStore(
      scope: scope,
      readValue: prefs.getString,
      writeValue: prefs.setString,
    );
  }
  final String key;
  final Future<String?> Function(String) readValue;
  final Future<void> Function(String, String) writeValue;

  @override
  Future<Map<String, TaleemProgress>> load() async {
    final text = await readValue(key);
    if (text == null) return {};
    try {
      final value = jsonDecode(text);
      if (value is! Map || value['version'] != 1 || value['lessons'] is! Map) {
        throw const FormatException();
      }
      return (value['lessons'] as Map).map((id, item) {
        if (id is! String || item is! Map) throw const FormatException();
        return MapEntry(
          id,
          TaleemProgress.fromMap(Map<String, dynamic>.from(item)),
        );
      });
    } catch (_) {
      // Never overwrite unreadable saved progress with an empty document.
      throw StateError('Saved progress could not be read.');
    }
  }

  @override
  Future<void> save(Map<String, TaleemProgress> progress) => writeValue(
    key,
    jsonEncode({
      'version': 1,
      'lessons': progress.map((id, p) => MapEntry(id, p.toMap())),
    }),
  );
}
