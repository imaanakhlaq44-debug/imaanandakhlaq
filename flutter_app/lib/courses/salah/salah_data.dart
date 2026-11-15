import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Data for My Salah Journey, read from
/// `assets/data/courses/salah-journey.json`. That file is generated
/// word for word from the content owner's Salah manual (see README.md), so
/// nothing religious is written in Dart.

const salahAsset = 'assets/data/courses/salah-journey.json';

List<String> _strings(Object? v) =>
    v == null ? const [] : List<String>.from(v as List);

class SourceLink {
  const SourceLink(this.label, this.url);
  final String label, url;
  factory SourceLink.fromMap(Map m) =>
      SourceLink(m['label'] as String, m['url'] as String);
}

List<SourceLink> _links(Object? v) => v == null
    ? const []
    : (v as List).map((m) => SourceLink.fromMap(m as Map)).toList();

/// A flattened table from the manual. The first row is the header.
class SalahTable {
  const SalahTable({
    required this.title,
    required this.rows,
    this.note,
    required this.source,
  });
  final String title, source;
  final String? note;
  final List<List<String>> rows;
  factory SalahTable.fromMap(Map m) => SalahTable(
    title: m['title'] as String,
    source: m['source'] as String,
    note: m['note'] as String?,
    rows: (m['rows'] as List).map((r) => _strings(r)).toList(),
  );
}

class SalahCheck {
  const SalahCheck({
    required this.question,
    required this.options,
    required this.correct,
    required this.feedback,
    required this.sourceQuestion,
  });
  final String question, feedback, sourceQuestion;
  final List<String> options;
  final int correct;
  factory SalahCheck.fromMap(Map m) => SalahCheck(
    question: m['question'] as String,
    options: _strings(m['options']),
    correct: m['correct'] as int,
    feedback: m['feedback'] as String,
    sourceQuestion: m['sourceQuestion'] as String,
  );
}

class SalahMission {
  const SalahMission({
    required this.id,
    required this.world,
    required this.title,
    required this.scene,
    required this.learn,
    required this.check,
    required this.action,
    required this.evidence,
    required this.guardrail,
    required this.recitations,
    required this.links,
    this.table,
  });
  final String id, world, title, scene, learn, action, evidence, guardrail;
  final SalahCheck check;
  final List<String> recitations;
  final List<SourceLink> links;
  final SalahTable? table;

  /// Step names, in order. Missions without linked words skip "Words".
  List<String> get steps => [
    'Story',
    'Learn',
    if (recitations.isNotEmpty) 'Words',
    'Check',
    'Practise',
  ];
  int get checkStep => steps.indexOf('Check');

  factory SalahMission.fromMap(Map m) => SalahMission(
    id: m['id'] as String,
    world: m['world'] as String,
    title: m['title'] as String,
    scene: m['scene'] as String,
    learn: m['learn'] as String,
    check: SalahCheck.fromMap(m['check'] as Map),
    action: m['action'] as String,
    evidence: m['evidence'] as String,
    guardrail: m['guardrail'] as String,
    recitations: _strings(m['recitations']),
    links: _links(m['links']),
    table: m['table'] == null ? null : SalahTable.fromMap(m['table'] as Map),
  );
}

class SalahWorld {
  const SalahWorld({
    required this.id,
    required this.code,
    required this.title,
    required this.opening,
    required this.optional,
    this.discover,
    this.evidence,
    this.outcome,
    this.teachingFlow = const [],
    this.guidance = const [],
    this.recitationsNote,
    this.adultNote,
  });
  final String id, code, title, opening;
  final bool optional;
  final String? discover, evidence, outcome, recitationsNote, adultNote;
  final List<String> teachingFlow, guidance;
  factory SalahWorld.fromMap(Map m) => SalahWorld(
    id: m['id'] as String,
    code: m['code'] as String,
    title: m['title'] as String,
    opening: m['opening'] as String,
    optional: m['optional'] as bool,
    discover: m['discover'] as String?,
    evidence: m['evidence'] as String?,
    outcome: m['outcome'] as String?,
    teachingFlow: _strings(m['teachingFlow']),
    guidance: _strings(m['guidance']),
    recitationsNote: m['recitationsNote'] as String?,
    adultNote: m['adultNote'] as String?,
  );
}

class SalahRecitation {
  const SalahRecitation({
    required this.id,
    required this.title,
    required this.arabic,
    required this.meaning,
    required this.meaningUrdu,
    required this.memorization,
    required this.source,
    required this.editorialNote,
    required this.links,
    required this.quran,
    this.usedWhere,
    this.meaningChild,
  });
  final String id, title, arabic, meaning, meaningUrdu, memorization;
  final String source, editorialNote;
  final String? usedWhere, meaningChild;
  final List<SourceLink> links;
  final bool quran;
  factory SalahRecitation.fromMap(Map m) => SalahRecitation(
    id: m['id'] as String,
    title: m['title'] as String,
    arabic: m['arabic'] as String,
    meaning: m['meaning'] as String,
    meaningUrdu: m['meaningUrdu'] as String,
    memorization: m['memorization'] as String,
    source: m['source'] as String,
    editorialNote: m['editorialNote'] as String,
    links: _links(m['links']),
    quran: m['quran'] as bool,
    usedWhere: m['usedWhere'] as String?,
    meaningChild: m['meaningChild'] as String?,
  );
}

class FiqhTopic {
  const FiqhTopic(this.topic, this.difference, this.rule);
  final String topic, difference, rule;
}

class SalahFiqh {
  const SalahFiqh({
    required this.disclaimer,
    required this.topics,
    required this.parentNote,
    required this.noProfile,
    required this.rafChild,
    required this.rafAdult,
  });
  final String disclaimer, parentNote, noProfile, rafChild, rafAdult;
  final List<FiqhTopic> topics;
  factory SalahFiqh.fromMap(Map m) => SalahFiqh(
    disclaimer: m['disclaimer'] as String,
    parentNote: m['parentNote'] as String,
    noProfile: m['noProfile'] as String,
    rafChild: m['rafChild'] as String,
    rafAdult: m['rafAdult'] as String,
    topics: (m['topics'] as List)
        .map(
          (t) => FiqhTopic(
            t['topic'] as String,
            t['difference'] as String,
            t['rule'] as String,
          ),
        )
        .toList(),
  );
}

class SalahCourseData {
  const SalahCourseData({
    required this.worlds,
    required this.missions,
    required this.recitations,
    required this.fiqh,
    required this.tryAgain,
    required this.tasbihNotice,
    required this.tasbihPreNotice,
    required this.document,
    required this.reviewNote,
  });
  final List<SalahWorld> worlds;
  final List<SalahMission> missions;
  final List<SalahRecitation> recitations;
  final SalahFiqh fiqh;
  final String tryAgain, tasbihNotice, tasbihPreNotice, document, reviewNote;

  SalahWorld world(String id) => worlds.firstWhere((w) => w.id == id);
  SalahRecitation recitation(String id) =>
      recitations.firstWhere((r) => r.id == id);
  List<SalahMission> missionsIn(String world) =>
      missions.where((m) => m.world == world).toList();

  /// Missions every learner works through; Salat al-Tasbih is optional and
  /// never needed to finish the journey.
  List<SalahMission> get coreMissions =>
      missions.where((m) => !world(m.world).optional).toList();

  factory SalahCourseData.fromJson(String text) {
    final m = jsonDecode(text) as Map;
    return SalahCourseData(
      worlds: (m['worlds'] as List)
          .map((w) => SalahWorld.fromMap(w as Map))
          .toList(),
      missions: (m['missions'] as List)
          .map((w) => SalahMission.fromMap(w as Map))
          .toList(),
      recitations: (m['recitations'] as List)
          .map((w) => SalahRecitation.fromMap(w as Map))
          .toList(),
      fiqh: SalahFiqh.fromMap(m['fiqh'] as Map),
      tryAgain: m['tryAgain'] as String,
      tasbihNotice: m['tasbihNotice'] as String,
      tasbihPreNotice: m['tasbihPreNotice'] as String,
      document: (m['source'] as Map)['document'] as String,
      reviewNote: m['reviewNote'] as String,
    );
  }

  static SalahCourseData? _loaded;
  static Future<SalahCourseData>? _loading;
  static Future<SalahCourseData> load() {
    if (_loaded != null) return SynchronousFuture(_loaded!);
    return _loading ??= rootBundle.loadString(salahAsset).then((text) {
      return _loaded = SalahCourseData.fromJson(text);
    });
  }
}

// ───────────────────────────── Progress ─────────────────────────────

class SalahProgress {
  const SalahProgress({
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
  SalahProgress copyWith({
    int? step,
    int? choice,
    bool clearChoice = false,
    DateTime? completedAt,
    String? reflection,
  }) => SalahProgress(
    step: step ?? this.step,
    choice: clearChoice ? null : choice ?? this.choice,
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
  factory SalahProgress.fromMap(Map<String, dynamic> m) => SalahProgress(
    step: m['step'] is int ? (m['step'] as int).clamp(0, 4) : 0,
    choice: m['choice'] is int && m['choice'] >= 0 && m['choice'] < 4
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

abstract class SalahProgressStore {
  Future<Map<String, SalahProgress>> load();
  Future<void> save(Map<String, SalahProgress> progress);
}

/// Saves progress on this device only, one document per learner [scope].
/// No points and nothing is sent to Firebase.
class DeviceSalahProgressStore implements SalahProgressStore {
  DeviceSalahProgressStore({
    required String scope,
    required this.readValue,
    required this.writeValue,
  }) : key = 'imaan.salah.v1.${Uri.encodeComponent(scope)}';
  factory DeviceSalahProgressStore.forLearner(String scope) {
    final prefs = SharedPreferencesAsync();
    return DeviceSalahProgressStore(
      scope: scope,
      readValue: prefs.getString,
      writeValue: prefs.setString,
    );
  }
  final String key;
  final Future<String?> Function(String) readValue;
  final Future<void> Function(String, String) writeValue;

  @override
  Future<Map<String, SalahProgress>> load() async {
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
          SalahProgress.fromMap(Map<String, dynamic>.from(item)),
        );
      });
    } catch (_) {
      // Never overwrite unreadable progress with an empty document.
      throw StateError(
        'Your saved progress could not be read. Please try again.',
      );
    }
  }

  @override
  Future<void> save(Map<String, SalahProgress> progress) => writeValue(
    key,
    jsonEncode({
      'version': 1,
      'missions': progress.map((id, p) => MapEntry(id, p.toMap())),
    }),
  );
}
