import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// One verbatim paragraph from the source DOCX, tagged by what it is.
/// type: arabic | translit | urdu | field | link | text.
class DuaBlock {
  const DuaBlock({required this.type, required this.text, this.label});
  final String type, text;
  final String? label;
  factory DuaBlock.fromMap(Map<String, dynamic> m) => DuaBlock(
    type: m['type'] as String,
    text: m['text'] as String,
    label: m['label'] as String?,
  );
}

/// A titled source section such as "AUTHENTIC SOURCE CONTEXT".
class DuaSection {
  const DuaSection({required this.heading, required this.blocks});
  final String heading;
  final List<DuaBlock> blocks;
}

class DuaLesson {
  const DuaLesson({
    required this.id,
    required this.number,
    required this.title,
    required this.tagline,
    required this.arabic,
    required this.transliteration,
    required this.english,
    required this.urdu,
    required this.occasion,
    required this.source,
    required this.sourceUrl,
    required this.words,
    required this.extras,
    required this.story,
    required this.understand,
    required this.memorizeSteps,
    required this.sourceChunks,
    required this.chunksRebuildArabic,
    required this.action,
    required this.missionFeedback,
    required this.reflect,
    required this.guidanceLabel,
    required this.guidance,
    required this.editorialNote,
  });
  final String id, title, arabic, english, source, memorizeSteps, action;
  final int number;
  final String? tagline, transliteration, urdu, occasion, sourceUrl;
  final String? missionFeedback, reflect, guidanceLabel, guidance;
  final String? editorialNote;
  final List<DuaBlock> words;
  final List<DuaSection> extras;
  final List<String> story, understand;

  /// The memorisation segments exactly as printed in the source.
  final List<String> sourceChunks;

  /// True when [sourceChunks], in order, are the whole [arabic] text.
  final bool chunksRebuildArabic;

  /// What the child memorises piece by piece: the source segments when they
  /// make up the full text, otherwise the text's own lines (e.g. three surahs).
  List<String> get memoryChunks {
    if (chunksRebuildArabic) return sourceChunks;
    final lines = arabic
        .split('\n')
        .map((l) => l.trim())
        .where((l) => l.isNotEmpty)
        .toList();
    return lines.isEmpty ? [arabic] : lines;
  }

  factory DuaLesson.fromMap(Map<String, dynamic> m) {
    List<String> strings(Object? v) =>
        v is List ? v.whereType<String>().toList() : const [];
    final mission = Map<String, dynamic>.from(m['mission'] as Map? ?? {});
    final guidance = m['guidance'] is Map
        ? Map<String, dynamic>.from(m['guidance'] as Map)
        : null;
    return DuaLesson(
      id: m['id'] as String,
      number: m['number'] as int,
      title: m['title'] as String,
      tagline: m['tagline'] as String?,
      arabic: m['arabic'] as String,
      transliteration: m['transliteration'] as String?,
      english: m['english'] as String,
      urdu: m['urdu'] as String?,
      occasion: m['occasion'] as String?,
      source: m['source'] as String,
      sourceUrl: m['sourceUrl'] as String?,
      words: [
        for (final b in m['words'] as List)
          DuaBlock.fromMap(Map<String, dynamic>.from(b as Map)),
      ],
      extras: [
        for (final e in (m['extras'] as List? ?? const []))
          DuaSection(
            heading: (e as Map)['heading'] as String,
            blocks: [
              for (final b in e['blocks'] as List)
                DuaBlock.fromMap(Map<String, dynamic>.from(b as Map)),
            ],
          ),
      ],
      story: strings(m['story']),
      understand: strings(m['understand']),
      memorizeSteps: m['memorizeSteps'] as String? ?? '',
      sourceChunks: strings(m['chunks']),
      chunksRebuildArabic: m['chunksRebuildArabic'] == true,
      action: m['action'] as String,
      missionFeedback: mission['feedback'] as String?,
      reflect: m['reflect'] as String?,
      guidanceLabel: guidance?['label'] as String?,
      guidance: guidance?['text'] as String?,
      editorialNote: m['editorialNote'] as String?,
    );
  }
}

class DuaVolume {
  const DuaVolume({
    required this.number,
    required this.title,
    required this.intro,
    required this.sourceDocument,
    required this.reviewStatus,
    required this.lessons,
  });
  final int number;
  final String title, intro, sourceDocument, reviewStatus;
  final List<DuaLesson> lessons;

  static const count = 10;
  static String assetFor(int volume) =>
      'assets/data/courses/duas-volume-${volume.toString().padLeft(2, '0')}.json';

  factory DuaVolume.fromJson(String text) {
    final m = Map<String, dynamic>.from(jsonDecode(text) as Map);
    return DuaVolume(
      number: m['volume'] as int,
      title: m['title'] as String,
      intro: m['intro'] as String,
      sourceDocument: m['sourceDocument'] as String,
      reviewStatus: m['reviewStatus'] as String,
      lessons: [
        for (final l in m['lessons'] as List)
          DuaLesson.fromMap(Map<String, dynamic>.from(l as Map)),
      ],
    );
  }

  static Future<List<DuaVolume>>? _cache;

  /// Loads and parses the ten bundled volumes once per app run.
  static Future<List<DuaVolume>> loadAll([AssetBundle? bundle]) {
    if (bundle != null) return _load(bundle);
    return _cache ??= _load(rootBundle).catchError((Object e) {
      _cache = null;
      throw e;
    });
  }

  static Future<List<DuaVolume>> _load(AssetBundle bundle) async => [
    for (var v = 1; v <= count; v++)
      DuaVolume.fromJson(await bundle.loadString(assetFor(v))),
  ];
}

/// Steps of one dua lesson, in order.
const duaSteps = ['Story', 'Learn', 'Remember', 'Check', 'One action'];

class DuaProgress {
  const DuaProgress({this.step = 0, this.completedAt, this.reflection});
  final int step;
  final DateTime? completedAt;
  final String? reflection;
  bool get explored => completedAt != null;
  DuaProgress copyWith({
    int? step,
    DateTime? completedAt,
    String? reflection,
  }) => DuaProgress(
    step: step ?? this.step,
    completedAt: completedAt ?? this.completedAt,
    reflection: reflection ?? this.reflection,
  );
  Map<String, dynamic> toMap() => {
    'step': step,
    if (completedAt != null)
      'completedAt': completedAt!.toUtc().toIso8601String(),
    if (reflection != null) 'reflection': reflection,
  };
  factory DuaProgress.fromMap(Map<String, dynamic> m) => DuaProgress(
    step: m['step'] is int
        ? (m['step'] as int).clamp(0, duaSteps.length - 1)
        : 0,
    completedAt: m['completedAt'] is String
        ? DateTime.tryParse(m['completedAt'] as String)
        : null,
    reflection: const ['yes', 'tried', 'notYet'].contains(m['reflection'])
        ? m['reflection'] as String
        : null,
  );
}

abstract class DuaProgressStore {
  Future<Map<String, DuaProgress>> load();
  Future<void> save(Map<String, DuaProgress> progress);
}

/// Device-local progress per learner scope. No Firebase, no points.
class DeviceDuaProgressStore implements DuaProgressStore {
  DeviceDuaProgressStore({
    required String scope,
    required this.readValue,
    required this.writeValue,
  }) : key = 'imaan.duas.v1.${Uri.encodeComponent(scope)}';
  factory DeviceDuaProgressStore.forLearner(String scope) {
    final prefs = SharedPreferencesAsync();
    return DeviceDuaProgressStore(
      scope: scope,
      readValue: prefs.getString,
      writeValue: prefs.setString,
    );
  }
  final String key;
  final Future<String?> Function(String) readValue;
  final Future<void> Function(String, String) writeValue;

  @override
  Future<Map<String, DuaProgress>> load() async {
    final text = await readValue(key);
    if (text == null) return {};
    try {
      final value = jsonDecode(text);
      if (value is! Map || value['version'] != 1 || value['lessons'] is! Map) {
        throw const FormatException();
      }
      return (value['lessons'] as Map).map((id, item) {
        if (id is! String || item is! Map) throw const FormatException();
        return MapEntry(id, DuaProgress.fromMap(Map<String, dynamic>.from(item)));
      });
    } catch (_) {
      // Never overwrite unreadable saved progress with an empty document.
      throw StateError('Your saved progress could not be read.');
    }
  }

  @override
  Future<void> save(Map<String, DuaProgress> progress) => writeValue(
    key,
    jsonEncode({
      'version': 1,
      'lessons': progress.map((id, p) => MapEntry(id, p.toMap())),
    }),
  );
}

/// Three meanings for the check step: the lesson's own and two from other
/// lessons in the same volume, in a fixed order that varies per lesson.
List<String> meaningChoices(DuaLesson lesson, List<DuaLesson> volume) {
  final others = volume.where((l) => l.id != lesson.id).toList();
  final i = volume.indexWhere((l) => l.id == lesson.id);
  final picks = <String>[];
  for (var k = 0; picks.length < 2 && k < others.length; k++) {
    final o = others[(i + k * 3) % others.length];
    if (o.english != lesson.english && !picks.contains(o.english)) {
      picks.add(o.english);
    }
  }
  final slot = lesson.number % (picks.length + 1);
  return [...picks]..insert(slot, lesson.english);
}
