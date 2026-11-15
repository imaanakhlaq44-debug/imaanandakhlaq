import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Journey to the Holy Cities, loaded from assets/data/courses/hajj-course.json.
///
/// The JSON is generated from the guide text by tool/gen_hajj_course.dart, so
/// every curriculum string here is the source's own wording.
class HajjCourse {
  HajjCourse(this.raw)
    : worlds = [
        for (final w in raw['worlds'] as List)
          HajjWorld(Map<String, dynamic>.from(w)),
      ],
      missions = {
        for (final m in raw['missions'] as List)
          m['id'] as String: HajjMission(Map<String, dynamic>.from(m)),
      },
      duas = [
        for (final d in raw['duas'] as List)
          HajjDua(Map<String, dynamic>.from(d)),
      ],
      adventures = [
        for (final a in raw['adventures'] as List)
          HajjAdventure(Map<String, dynamic>.from(a)),
      ];

  final Map<String, dynamic> raw;
  final List<HajjWorld> worlds;
  final Map<String, HajjMission> missions;
  final List<HajjDua> duas;
  final List<HajjAdventure> adventures;

  String text(String key) => raw[key] as String;
  List<String> strings(String key) => List<String>.from(raw[key] as List);
  List<Map<String, dynamic>> maps(String key, [Map<String, dynamic>? from]) => [
    for (final m in (from ?? raw)[key] as List) Map<String, dynamic>.from(m),
  ];
  Map<String, dynamic> get parent => Map<String, dynamic>.from(raw['parent']);

  HajjWorld world(String id) => worlds.firstWhere((w) => w.id == id);
  HajjDua dua(String id) => duas.firstWhere((d) => d.id == id);
  Map<String, dynamic>? source(String id) =>
      maps('sources').where((s) => s['id'] == id).firstOrNull;

  /// The scripted storyboard scene for a world (section 8), if any.
  Map<String, dynamic>? scene(String worldId) =>
      maps('scenes').where((s) => s['world'] == worldId).firstOrNull;

  static HajjCourse? _loaded;
  static Future<HajjCourse>? _loading;
  static Future<HajjCourse> load() {
    if (_loaded != null) return SynchronousFuture(_loaded!);
    return _loading ??= rootBundle
        .loadString('assets/data/courses/hajj-course.json')
        .then((text) => _loaded = HajjCourse(jsonDecode(text)));
  }
}

class HajjAdventure {
  HajjAdventure(Map<String, dynamic> m)
    : id = m['id'],
      title = m['title'],
      use = m['use'],
      gate = m['gate'],
      worldIds = (m['worlds'] as String).split(',');
  final String id, title, use;
  final String? gate;
  final List<String> worldIds;
}

class HajjWorld {
  HajjWorld(Map<String, dynamic> m)
    : id = m['id'],
      title = m['title'],
      storyBeat = m['storyBeat'],
      missionIds = List<String>.from(m['missions']);
  final String id, title, storyBeat;
  final List<String> missionIds;
}

class HajjCheck {
  HajjCheck(Map<String, dynamic> m)
    : id = m['id'],
      question = m['question'],
      answer = m['answer'],
      source = m['source'],
      feedback = m['feedback'];
  final String id, question, answer, source;
  final String? feedback;

  /// Questions whose source answer begins with Yes or No are asked as a
  /// two-button choice; others are "think, then reveal".
  bool? get yesNo => answer.startsWith('Yes')
      ? true
      : answer.startsWith('No')
      ? false
      : null;
}

class HajjInteraction {
  HajjInteraction(Map<String, dynamic> m)
    : type = m['type'],
      items = List<String>.from(m['items'] ?? const []),
      count = m['count'] ?? 0,
      labels = List<String>.from(m['labels'] ?? const []),
      good = m['good'],
      other = m['other'],
      from = m['from'];
  final String type;
  final List<String> items, labels;
  final int count;
  final String? good, other;
  final String from;
}

class HajjMission {
  HajjMission(Map<String, dynamic> m)
    : id = m['id'],
      worldId = m['world'],
      title = m['title'],
      teach = m['teach'],
      play = m['play'],
      extend = m['extend'],
      action = m['action'],
      evidence = List<String>.from(m['evidence']),
      duaIds = List<String>.from(m['duas']),
      checks = [
        for (final c in m['checks'] as List)
          HajjCheck(Map<String, dynamic>.from(c)),
      ],
      interaction = m['interaction'] == null
          ? null
          : HajjInteraction(Map<String, dynamic>.from(m['interaction']));
  final String id, worldId, title, teach, play, extend, action;
  final List<String> evidence, duaIds;
  final List<HajjCheck> checks;
  final HajjInteraction? interaction;

  /// Story, Learn, Dua echo (when a dua is linked), Try it, Daily action.
  List<String> get steps => [
    'Story',
    'Learn',
    if (duaIds.isNotEmpty) 'Dua echo',
    'Try it',
    'Daily action',
  ];
}

class HajjDua {
  HajjDua(Map<String, dynamic> m)
    : id = m['id'],
      title = m['title'],
      arabic = m['arabic'],
      meaning = m['meaning'],
      source = m['source'],
      note = m['note'],
      shortEcho = m['shortEcho'];
  final String id, title, arabic, meaning, source, note;
  final String? shortEcho;
}

/// Age bands from section 3 of the guide.
const hajjAges = ['3–5', '6–9', '10–14'];

class HajjMissionProgress {
  const HajjMissionProgress({
    this.step = 0,
    this.learnedAt,
    this.parentMarked = false,
    this.reflection,
  });
  final int step;

  /// "Learning completed" (the second of the guide's three completion states).
  final DateTime? learnedAt;

  /// "Parent-marked real action": only a grown-up sets this, never worship.
  final bool parentMarked;

  /// Optional private Muhasabah answer: 'yes' or 'again' ("I need another try").
  final String? reflection;
  bool get learned => learnedAt != null;

  HajjMissionProgress copyWith({
    int? step,
    DateTime? learnedAt,
    bool? parentMarked,
    String? reflection,
  }) => HajjMissionProgress(
    step: step ?? this.step,
    learnedAt: learnedAt ?? this.learnedAt,
    parentMarked: parentMarked ?? this.parentMarked,
    reflection: reflection ?? this.reflection,
  );

  Map<String, dynamic> toMap() => {
    'step': step,
    if (learnedAt != null) 'learnedAt': learnedAt!.toUtc().toIso8601String(),
    if (parentMarked) 'parentMarked': true,
    if (reflection != null) 'reflection': reflection,
  };

  factory HajjMissionProgress.fromMap(Map<String, dynamic> m) =>
      HajjMissionProgress(
        step: m['step'] is int ? (m['step'] as int).clamp(0, 4) : 0,
        learnedAt: m['learnedAt'] is String
            ? DateTime.tryParse(m['learnedAt'])
            : null,
        parentMarked: m['parentMarked'] == true,
        reflection: const ['yes', 'again'].contains(m['reflection'])
            ? m['reflection']
            : null,
      );
}

/// Everything this course keeps for one learner, on this device only.
class HajjProgress {
  const HajjProgress({
    this.age = '6–9',
    this.missions = const {},
    this.duas = const {},
    this.days = const {},
  });
  final String age;
  final Map<String, HajjMissionProgress> missions;

  /// Dua id → when it was last practised in the Dua Studio.
  final Map<String, DateTime> duas;

  /// 40-day path days the learner chose to tick (private, non-punitive).
  final Set<int> days;

  HajjMissionProgress mission(String id) =>
      missions[id] ?? const HajjMissionProgress();
  int get learnedCount => missions.values.where((m) => m.learned).length;

  HajjProgress copyWith({
    String? age,
    Map<String, HajjMissionProgress>? missions,
    Map<String, DateTime>? duas,
    Set<int>? days,
  }) => HajjProgress(
    age: age ?? this.age,
    missions: missions ?? this.missions,
    duas: duas ?? this.duas,
    days: days ?? this.days,
  );

  HajjProgress withMission(String id, HajjMissionProgress p) =>
      copyWith(missions: {...missions, id: p});

  Map<String, dynamic> toMap() => {
    'version': 1,
    'age': age,
    'missions': missions.map((id, p) => MapEntry(id, p.toMap())),
    'duas': duas.map((id, d) => MapEntry(id, d.toUtc().toIso8601String())),
    'days': (days.toList()..sort()),
  };

  factory HajjProgress.fromMap(Map<String, dynamic> m) {
    if (m['version'] != 1 || m['missions'] is! Map) {
      throw const FormatException();
    }
    return HajjProgress(
      age: hajjAges.contains(m['age']) ? m['age'] : '6–9',
      missions: (m['missions'] as Map).map(
        (id, p) => MapEntry(
          id as String,
          HajjMissionProgress.fromMap(Map<String, dynamic>.from(p as Map)),
        ),
      ),
      duas: {
        for (final e in ((m['duas'] as Map?) ?? const {}).entries)
          '${e.key}': ?DateTime.tryParse('${e.value}'),
      },
      days: {
        for (final d in (m['days'] as List?) ?? const [])
          if (d is int && d >= 1 && d <= 40) d,
      },
    );
  }
}

abstract class HajjProgressStore {
  Future<HajjProgress> load();
  Future<void> save(HajjProgress progress);
}

/// Same pattern as DeviceHadithProgressStore: one JSON document per learner
/// scope in shared preferences. No points and nothing leaves the device.
class DeviceHajjProgressStore implements HajjProgressStore {
  DeviceHajjProgressStore({
    required String scope,
    required this.readValue,
    required this.writeValue,
  }) : key = 'imaan.hajj.v1.${Uri.encodeComponent(scope)}';
  factory DeviceHajjProgressStore.forLearner(String scope) {
    final prefs = SharedPreferencesAsync();
    return DeviceHajjProgressStore(
      scope: scope,
      readValue: prefs.getString,
      writeValue: prefs.setString,
    );
  }
  final String key;
  final Future<String?> Function(String) readValue;
  final Future<void> Function(String, String) writeValue;

  @override
  Future<HajjProgress> load() async {
    final text = await readValue(key);
    if (text == null) return const HajjProgress();
    try {
      return HajjProgress.fromMap(Map<String, dynamic>.from(jsonDecode(text)));
    } catch (_) {
      // Never overwrite unreadable saved progress with an empty document.
      throw StateError(
        'Your saved progress could not be read. Please try again.',
      );
    }
  }

  @override
  Future<void> save(HajjProgress progress) =>
      writeValue(key, jsonEncode(progress.toMap()));
}

/// Shared state for the course screens: content, progress and saving.
class HajjController extends ChangeNotifier {
  HajjController({
    required this.course,
    required this.store,
    required this.progress,
  });
  final HajjCourse course;
  final HajjProgressStore store;
  HajjProgress progress;

  /// Saves [next]; on failure the previous progress stays and the error is
  /// rethrown so the screen can say so.
  Future<void> save(HajjProgress next) async {
    await store.save(next);
    progress = next;
    notifyListeners();
  }
}
