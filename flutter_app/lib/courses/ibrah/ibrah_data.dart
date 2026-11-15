import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// One piece of source text shown on a screen. Kinds: `h` heading, `p`
/// paragraph, `kv` labelled line, `ar` Arabic. Text is verbatim from the
/// IBRAH document (see lib/courses/ibrah/README.md).
class IbrahBlock {
  const IbrahBlock(this.kind, this.text, [this.label]);
  final String kind, text;
  final String? label;
  factory IbrahBlock.fromMap(Map m) =>
      IbrahBlock(m['t'] as String, m['text'] as String, m['label'] as String?);
}

class IbrahEvidence {
  const IbrahEvidence({required this.arabic, this.reference, this.meaning});
  final String arabic;
  final String? reference, meaning;
  factory IbrahEvidence.fromMap(Map m) => IbrahEvidence(
    arabic: m['arabic'] as String,
    reference: m['reference'] as String?,
    meaning: m['meaning'] as String?,
  );
}

class IbrahChoice {
  const IbrahChoice(this.letter, this.text, this.correct, this.feedback);
  final String letter, text;
  final bool correct;
  final String? feedback;
}

class IbrahStory {
  const IbrahStory({
    required this.id,
    required this.number,
    required this.title,
    required this.subtitle,
    required this.blocks,
  });
  final String id, title;
  final String? subtitle;
  final int number;
  final List<IbrahBlock> blocks;
}

class IbrahMission {
  const IbrahMission({
    required this.id,
    required this.number,
    required this.title,
    required this.story,
    required this.discover,
    required this.evidence,
    required this.question,
    required this.choices,
    required this.action,
    required this.remember,
  });
  final String id, title, question, action;
  final int number;
  final int? story;
  final List<IbrahBlock> discover, remember;
  final List<IbrahEvidence> evidence;
  final List<IbrahChoice> choices;
}

class IbrahVolume {
  const IbrahVolume({
    required this.id,
    required this.number,
    required this.prophet,
    required this.prophetArabic,
    required this.heading,
    required this.title,
    required this.themes,
    required this.reviewNote,
    required this.introduction,
    required this.stories,
    required this.missions,
    required this.review,
    required this.synthesis,
    required this.sourceDocument,
  });
  final String id, prophet, prophetArabic, heading, title, themes, reviewNote;
  final String sourceDocument;
  final int number;
  final List<String> introduction;
  final List<IbrahStory> stories;
  final List<IbrahMission> missions;
  final List<IbrahEvidence> review;
  final List<IbrahBlock> synthesis;

  List<IbrahMission> missionsFor(int story) =>
      missions.where((m) => m.story == story).toList();

  factory IbrahVolume.fromMap(Map m) {
    List<IbrahBlock> blocks(Object? v) => [
      for (final b in (v as List? ?? const [])) IbrahBlock.fromMap(b as Map),
    ];
    List<IbrahEvidence> ev(Object? v) => [
      for (final b in (v as List? ?? const [])) IbrahEvidence.fromMap(b as Map),
    ];
    return IbrahVolume(
      id: m['id'] as String,
      number: m['number'] as int,
      prophet: m['prophet'] as String,
      prophetArabic: m['prophetArabic'] as String,
      heading: m['heading'] as String,
      title: m['title'] as String,
      themes: m['themes'] as String,
      reviewNote: m['reviewNote'] as String,
      introduction: List<String>.from(m['introduction'] as List),
      sourceDocument: (m['source'] as Map)['document'] as String,
      stories: [
        for (final s in m['stories'] as List)
          IbrahStory(
            id: s['id'] as String,
            number: s['number'] as int,
            title: s['title'] as String,
            subtitle: s['subtitle'] as String?,
            blocks: blocks(s['blocks']),
          ),
      ],
      missions: [
        for (final x in m['missions'] as List)
          IbrahMission(
            id: x['id'] as String,
            number: x['number'] as int,
            title: x['title'] as String,
            story: x['story'] as int?,
            discover: blocks(x['discover']),
            evidence: ev(x['evidence']),
            question: x['question'] as String,
            action: x['action'] as String,
            remember: blocks(x['remember']),
            choices: [
              for (final c in x['choices'] as List)
                IbrahChoice(
                  c['letter'] as String,
                  c['text'] as String,
                  c['correct'] as bool,
                  c['feedback'] as String?,
                ),
            ],
          ),
      ],
      review: ev(m['review']),
      synthesis: blocks(m['synthesis']),
    );
  }
}

/// A prophet card on the course home: enough to draw it without loading the
/// whole volume.
class IbrahVolumeSummary {
  const IbrahVolumeSummary({
    required this.id,
    required this.number,
    required this.prophet,
    required this.prophetArabic,
    required this.title,
    required this.themes,
    required this.file,
    required this.stories,
    required this.missions,
  });
  final String id, prophet, prophetArabic, title, themes, file;
  final int number, stories, missions;
}

/// Loads `assets/data/courses/ibrah-*.json` once per app run.
class IbrahLibrary {
  IbrahLibrary._();
  static const indexAsset = 'assets/data/courses/ibrah-index.json';
  static List<IbrahVolumeSummary>? _index;
  static final _volumes = <String, IbrahVolume>{};

  static Future<List<IbrahVolumeSummary>> index() async {
    if (_index != null) return SynchronousFuture(_index!);
    final data = jsonDecode(await rootBundle.loadString(indexAsset)) as Map;
    return _index = [
      for (final v in data['volumes'] as List)
        IbrahVolumeSummary(
          id: v['id'] as String,
          number: v['number'] as int,
          prophet: v['prophet'] as String,
          prophetArabic: v['prophetArabic'] as String,
          title: v['title'] as String,
          themes: v['themes'] as String,
          file: v['file'] as String,
          stories: v['stories'] as int,
          missions: v['missions'] as int,
        ),
    ];
  }

  static Future<IbrahVolume> volume(IbrahVolumeSummary s) async {
    final hit = _volumes[s.id];
    if (hit != null) return SynchronousFuture(hit);
    final v = IbrahVolume.fromMap(
      jsonDecode(await rootBundle.loadString(s.file)) as Map,
    );
    return _volumes[s.id] = v;
  }
}

// ---- progress (device only, per learner scope) ----------------------------

const ibrahReflections = ['practised', 'learning', 'skip'];

class IbrahMissionProgress {
  const IbrahMissionProgress({
    this.step = 0,
    this.choice,
    this.completedAt,
    this.reflection,
  });
  final int step;
  final int? choice;
  final DateTime? completedAt;
  final String? reflection;
  bool get done => completedAt != null;

  IbrahMissionProgress copyWith({
    int? step,
    int? choice,
    DateTime? completedAt,
    String? reflection,
  }) => IbrahMissionProgress(
    step: step ?? this.step,
    choice: choice ?? this.choice,
    completedAt: completedAt ?? this.completedAt,
    reflection: reflection ?? this.reflection,
  );

  Map<String, dynamic> toMap() => {
    'step': step,
    'choice': ?choice,
    'completedAt': ?completedAt?.toUtc().toIso8601String(),
    'reflection': ?reflection,
  };

  factory IbrahMissionProgress.fromMap(Map m) => IbrahMissionProgress(
    step: m['step'] is int ? (m['step'] as int).clamp(0, 3) : 0,
    choice: m['choice'] is int && m['choice'] >= 0 && m['choice'] < 4
        ? m['choice'] as int
        : null,
    completedAt: m['completedAt'] is String
        ? DateTime.tryParse(m['completedAt'] as String)
        : null,
    reflection: ibrahReflections.contains(m['reflection'])
        ? m['reflection'] as String
        : null,
  );
}

/// Everything saved for one learner. Keys are `<volumeId>/<storyId|missionId>`.
class IbrahProgress {
  const IbrahProgress({
    this.storiesRead = const {},
    this.missions = const {},
    this.reviewed = const {},
  });
  final Set<String> storiesRead;
  final Map<String, IbrahMissionProgress> missions;
  final Map<String, DateTime> reviewed;

  static String key(String volumeId, String itemId) => '$volumeId/$itemId';

  IbrahMissionProgress mission(String volumeId, String missionId) =>
      missions[key(volumeId, missionId)] ?? const IbrahMissionProgress();

  bool storyRead(String volumeId, String storyId) =>
      storiesRead.contains(key(volumeId, storyId));

  int missionsDone(String volumeId) => missions.entries
      .where((e) => e.key.startsWith('$volumeId/') && e.value.done)
      .length;

  int storiesDone(String volumeId) =>
      storiesRead.where((k) => k.startsWith('$volumeId/')).length;

  IbrahProgress withStory(String volumeId, String storyId) => IbrahProgress(
    storiesRead: {...storiesRead, key(volumeId, storyId)},
    missions: missions,
    reviewed: reviewed,
  );

  IbrahProgress withMission(
    String volumeId,
    String missionId,
    IbrahMissionProgress p,
  ) => IbrahProgress(
    storiesRead: storiesRead,
    missions: {...missions, key(volumeId, missionId): p},
    reviewed: reviewed,
  );

  IbrahProgress withReview(String volumeId, DateTime at) => IbrahProgress(
    storiesRead: storiesRead,
    missions: missions,
    reviewed: {...reviewed, volumeId: at},
  );

  Map<String, dynamic> toMap() => {
    'version': 1,
    'stories': storiesRead.toList()..sort(),
    'missions': missions.map((k, v) => MapEntry(k, v.toMap())),
    'reviewed': reviewed.map(
      (k, v) => MapEntry(k, v.toUtc().toIso8601String()),
    ),
  };

  factory IbrahProgress.fromMap(Map m) {
    if (m['version'] != 1 ||
        m['stories'] is! List ||
        m['missions'] is! Map ||
        m['reviewed'] is! Map) {
      throw const FormatException();
    }
    return IbrahProgress(
      storiesRead: {for (final s in m['stories'] as List) s as String},
      missions: (m['missions'] as Map).map(
        (k, v) => MapEntry(k as String, IbrahMissionProgress.fromMap(v as Map)),
      ),
      reviewed: {
        for (final e in (m['reviewed'] as Map).entries)
          e.key as String: ?DateTime.tryParse('${e.value}'),
      },
    );
  }
}

abstract class IbrahProgressStore {
  Future<IbrahProgress> load();
  Future<void> save(IbrahProgress progress);
}

/// Saved on this device only (no points, no Firebase), one document per
/// learner scope, the same way DeviceHadithProgressStore works.
class DeviceIbrahProgressStore implements IbrahProgressStore {
  DeviceIbrahProgressStore({
    required String scope,
    required this.readValue,
    required this.writeValue,
  }) : key = 'imaan.ibrah.v1.${Uri.encodeComponent(scope)}';

  factory DeviceIbrahProgressStore.forLearner(String scope) {
    final prefs = SharedPreferencesAsync();
    return DeviceIbrahProgressStore(
      scope: scope,
      readValue: prefs.getString,
      writeValue: prefs.setString,
    );
  }

  final String key;
  final Future<String?> Function(String) readValue;
  final Future<void> Function(String, String) writeValue;

  @override
  Future<IbrahProgress> load() async {
    final text = await readValue(key);
    if (text == null) return const IbrahProgress();
    try {
      return IbrahProgress.fromMap(jsonDecode(text) as Map);
    } catch (_) {
      // Do not overwrite unreadable existing progress with an empty document.
      throw StateError(
        'Your saved progress could not be read. Please try again.',
      );
    }
  }

  @override
  Future<void> save(IbrahProgress progress) =>
      writeValue(key, jsonEncode(progress.toMap()));
}

/// Shared by every IBRAH screen of one learner so each sees the same saves.
class IbrahProgressController extends ChangeNotifier {
  IbrahProgressController(this.store);
  final IbrahProgressStore store;
  IbrahProgress progress = const IbrahProgress();

  Future<void> load() async {
    progress = await store.load();
    notifyListeners();
  }

  /// Saves [next]; returns false (and keeps the old state) when saving fails.
  Future<bool> save(IbrahProgress next) async {
    try {
      await store.save(next);
    } catch (_) {
      return false;
    }
    progress = next;
    notifyListeners();
    return true;
  }
}
