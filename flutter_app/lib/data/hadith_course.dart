import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HadithAnswer {
  const HadithAnswer(this.text, this.feedback, this.correct);
  final String text, feedback;
  final bool correct;
}

class HadithLesson {
  const HadithLesson({
    required this.id,
    required this.title,
    required this.arabic,
    required this.meaning,
    required this.explanation,
    required this.action,
    required this.source,
    required this.sourceUrl,
    required this.story,
    required this.question,
    required this.answers,
    required this.chunks,
    required this.excerpt,
  });
  final String id,
      title,
      arabic,
      meaning,
      explanation,
      action,
      source,
      sourceUrl,
      story,
      question;
  final List<HadithAnswer> answers;
  final List<String> chunks;
  final bool excerpt;
  factory HadithLesson.fromMap(Map<String, dynamic> m) => HadithLesson(
    id: m['id'] as String,
    title: m['title'] as String,
    arabic: m['arabic'] as String,
    meaning: m['meaning'] as String,
    explanation: m['explanation'] as String,
    action: m['action'] as String,
    source: m['source'] as String,
    sourceUrl: m['sourceUrl'] as String,
    story: m['story'] as String,
    question: m['question'] as String,
    excerpt: m['excerpt'] as bool,
    chunks: List<String>.from(m['chunks'] as List),
    answers: (m['answers'] as List)
        .map(
          (a) => HadithAnswer(
            a['text'] as String,
            a['feedback'] as String,
            a['correct'] as bool,
          ),
        )
        .toList(),
  );
  static List<HadithLesson>? _loaded;
  static Future<List<HadithLesson>>? _catalog;
  static Future<List<HadithLesson>> load() {
    if (_loaded != null) return SynchronousFuture(_loaded!);
    return _catalog ??= rootBundle
        .loadString('assets/data/hadith-demo.json')
        .then((text) {
          final lessons = (jsonDecode(text)['lessons'] as List)
              .map((m) => HadithLesson.fromMap(Map<String, dynamic>.from(m)))
              .toList();
          _loaded = lessons;
          return lessons;
        });
  }
}

class HadithProgress {
  const HadithProgress({
    this.step = 0,
    this.choice,
    this.completedAt,
    this.reflection,
  });
  final int step;
  final int? choice;
  final DateTime? completedAt;
  final String? reflection;
  bool get explored => completedAt != null;
  DateTime? get reviewAt => completedAt?.add(const Duration(days: 1));
  HadithProgress copyWith({
    int? step,
    int? choice,
    DateTime? completedAt,
    String? reflection,
  }) => HadithProgress(
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
  factory HadithProgress.fromMap(Map<String, dynamic> m) => HadithProgress(
    step: m['step'] is int ? (m['step'] as int).clamp(0, 4) : 0,
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

abstract class HadithProgressStore {
  Future<Map<String, HadithProgress>> load();
  Future<void> save(Map<String, HadithProgress> progress);
}

class DeviceHadithProgressStore implements HadithProgressStore {
  DeviceHadithProgressStore({
    required String scope,
    required this.readValue,
    required this.writeValue,
  }) : key = 'imaan.hadith.v1.${Uri.encodeComponent(scope)}';
  factory DeviceHadithProgressStore.forLearner(String scope) {
    final prefs = SharedPreferencesAsync();
    return DeviceHadithProgressStore(
      scope: scope,
      readValue: prefs.getString,
      writeValue: prefs.setString,
    );
  }
  final String key;
  final Future<String?> Function(String) readValue;
  final Future<void> Function(String, String) writeValue;
  @override
  Future<Map<String, HadithProgress>> load() async {
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
          HadithProgress.fromMap(Map<String, dynamic>.from(item)),
        );
      });
    } catch (_) {
      // Do not overwrite unreadable existing progress with an empty document.
      throw StateError(
        'Your saved progress could not be read. Please try again.',
      );
    }
  }

  @override
  Future<void> save(Map<String, HadithProgress> progress) => writeValue(
    key,
    jsonEncode({
      'version': 1,
      'lessons': progress.map((id, p) => MapEntry(id, p.toMap())),
    }),
  );
}
