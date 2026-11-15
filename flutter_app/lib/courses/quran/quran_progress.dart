import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Mastery is a multi-observation state (source §4.3). Only [retained] needs
/// a delayed review; final correctness is certified by an adult separately
/// ([PassageProgress.approvedAt]).
enum Mastery { practicing, withHelp, independent, retained }

/// How the child's recitation went when they first recite from memory.
enum RecallResult { onMyOwn, withHelp, stillPractising }

/// The three review outcomes of the source's revision table.
enum ReviewResult { confident, prompting, relearn }

class ReviewRecord {
  const ReviewRecord(this.at, this.result, {this.byAdult = false});
  final DateTime at;
  final ReviewResult result;
  final bool byAdult;
  Map<String, dynamic> toMap() => {
    'at': at.toUtc().toIso8601String(),
    'result': result.name,
    if (byAdult) 'byAdult': true,
  };
  static ReviewRecord? fromMap(Object? m) {
    if (m is! Map) return null;
    final at = m['at'] is String ? DateTime.tryParse(m['at']) : null;
    final r = ReviewResult.values.where((v) => v.name == m['result']);
    if (at == null || r.isEmpty) return null;
    return ReviewRecord(at, r.first, byAdult: m['byAdult'] == true);
  }
}

class PassageProgress {
  const PassageProgress({
    this.step = 0,
    this.repetitions = 0,
    this.chunksDone = const {},
    this.mastery,
    this.firstRecallAt,
    this.intervalIndex = 0,
    this.nextReview,
    this.lastReview,
    this.reviews = const [],
    this.approvedAt,
    this.reassigned = false,
  });

  /// Current step of the six-step lesson (0 = Hear it … 5 = Keep it).
  final int step;
  final int repetitions;
  final Set<int> chunksDone;

  /// null until the child has started practising this passage.
  final Mastery? mastery;

  /// First independent recall: the review schedule starts here.
  final DateTime? firstRecallAt;
  final int intervalIndex;
  final DateTime? nextReview, lastReview;
  final List<ReviewRecord> reviews;

  /// Set by a parent/teacher on the device. Never set by the child.
  final DateTime? approvedAt;

  /// A parent/teacher asked the child to learn this again.
  final bool reassigned;

  bool get started => mastery != null || step > 0 || repetitions > 0;
  bool isDue(DateTime now) => nextReview != null && !nextReview!.isAfter(now);

  PassageProgress copyWith({
    int? step,
    int? repetitions,
    Set<int>? chunksDone,
    Mastery? mastery,
    DateTime? firstRecallAt,
    bool clearFirstRecall = false,
    int? intervalIndex,
    DateTime? nextReview,
    bool clearNextReview = false,
    DateTime? lastReview,
    List<ReviewRecord>? reviews,
    DateTime? approvedAt,
    bool clearApproval = false,
    bool? reassigned,
  }) => PassageProgress(
    step: step ?? this.step,
    repetitions: repetitions ?? this.repetitions,
    chunksDone: chunksDone ?? this.chunksDone,
    mastery: mastery ?? this.mastery,
    firstRecallAt: clearFirstRecall
        ? null
        : firstRecallAt ?? this.firstRecallAt,
    intervalIndex: intervalIndex ?? this.intervalIndex,
    nextReview: clearNextReview ? null : nextReview ?? this.nextReview,
    lastReview: lastReview ?? this.lastReview,
    reviews: reviews ?? this.reviews,
    approvedAt: clearApproval ? null : approvedAt ?? this.approvedAt,
    reassigned: reassigned ?? this.reassigned,
  );

  Map<String, dynamic> toMap() {
    String? t(DateTime? d) => d?.toUtc().toIso8601String();
    return {
      'step': step,
      if (repetitions > 0) 'repetitions': repetitions,
      if (chunksDone.isNotEmpty) 'chunksDone': (chunksDone.toList()..sort()),
      if (mastery != null) 'mastery': mastery!.name,
      if (firstRecallAt != null) 'firstRecallAt': t(firstRecallAt),
      'intervalIndex': intervalIndex,
      if (nextReview != null) 'nextReview': t(nextReview),
      if (lastReview != null) 'lastReview': t(lastReview),
      if (reviews.isNotEmpty) 'reviews': [for (final r in reviews) r.toMap()],
      if (approvedAt != null) 'approvedAt': t(approvedAt),
      if (reassigned) 'reassigned': true,
    };
  }

  factory PassageProgress.fromMap(Map<String, dynamic> m) {
    DateTime? d(String k) => m[k] is String ? DateTime.tryParse(m[k]) : null;
    int i(String k, int max) => m[k] is int ? (m[k] as int).clamp(0, max) : 0;
    final mastery = Mastery.values.where((v) => v.name == m['mastery']);
    return PassageProgress(
      step: i('step', 5),
      repetitions: i('repetitions', 1 << 30),
      chunksDone: {
        for (final c in (m['chunksDone'] is List ? m['chunksDone'] : const []))
          if (c is int && c >= 0) c,
      },
      mastery: mastery.isEmpty ? null : mastery.first,
      firstRecallAt: d('firstRecallAt'),
      intervalIndex: i('intervalIndex', 64),
      nextReview: d('nextReview'),
      lastReview: d('lastReview'),
      reviews: [
        for (final r in (m['reviews'] is List ? m['reviews'] : const []))
          ?ReviewRecord.fromMap(r),
      ],
      approvedAt: d('approvedAt'),
      reassigned: m['reassigned'] == true,
    );
  }
}

class QuranProgress {
  const QuranProgress({
    this.experience,
    this.paused = false,
    this.passages = const {},
  });

  /// Chosen experience (Picture & Audio / Guided Reciter / Independent
  /// Explorer). Proficiency, not age, decides it.
  final String? experience;

  /// A parent/teacher paused the review schedule: nothing shows as due.
  final bool paused;
  final Map<String, PassageProgress> passages;

  PassageProgress of(String id) => passages[id] ?? const PassageProgress();
  QuranProgress withPassage(String id, PassageProgress p) => QuranProgress(
    experience: experience,
    paused: paused,
    passages: {...passages, id: p},
  );
  QuranProgress copyWith({String? experience, bool? paused}) => QuranProgress(
    experience: experience ?? this.experience,
    paused: paused ?? this.paused,
    passages: passages,
  );

  /// Passage ids whose review is due, oldest first. Empty while paused.
  List<String> due(DateTime now) {
    if (paused) return const [];
    final ids = [
      for (final e in passages.entries)
        if (e.value.isDue(now)) e.key,
    ];
    ids.sort((a, b) => passages[a]!.nextReview!.compareTo(passages[b]!.nextReview!));
    return ids;
  }

  Map<String, dynamic> toMap() => {
    'version': 1,
    if (experience != null) 'experience': experience,
    if (paused) 'paused': true,
    'passages': passages.map((id, p) => MapEntry(id, p.toMap())),
  };
  factory QuranProgress.fromMap(Map<String, dynamic> m) {
    if (m['version'] != 1 || m['passages'] is! Map) {
      throw const FormatException();
    }
    return QuranProgress(
      experience: m['experience'] is String ? m['experience'] as String : null,
      paused: m['paused'] == true,
      passages: (m['passages'] as Map).map((id, item) {
        if (id is! String || item is! Map) throw const FormatException();
        return MapEntry(id, PassageProgress.fromMap(Map<String, dynamic>.from(item)));
      }),
    );
  }
}

/// The memorisation engine of source §4.3 as plain functions, so the rules
/// are testable without widgets. Intervals come from the course data.
class RevisionEngine {
  const RevisionEngine(this.intervalsDays);
  final List<int> intervalsDays;

  DateTime _after(DateTime now, int index) => now.add(
    Duration(days: intervalsDays[index.clamp(0, intervalsDays.length - 1)]),
  );

  /// The first "Recall it" with an adult listening.
  PassageProgress recall(PassageProgress p, RecallResult r, DateTime now) {
    final retained = p.mastery == Mastery.retained;
    switch (r) {
      case RecallResult.onMyOwn:
        return p.copyWith(
          mastery: retained ? Mastery.retained : Mastery.independent,
          firstRecallAt: p.firstRecallAt ?? now,
          intervalIndex: retained ? p.intervalIndex : 0,
          nextReview: retained ? p.nextReview : _after(now, 0),
          reassigned: false,
        );
      case RecallResult.withHelp:
        // Not yet an independent recall: practise again tomorrow.
        return p.copyWith(
          mastery: retained ? Mastery.retained : Mastery.withHelp,
          nextReview: retained ? p.nextReview : _after(now, 1),
        );
      case RecallResult.stillPractising:
        return p.copyWith(
          mastery: retained ? Mastery.retained : Mastery.practicing,
        );
    }
  }

  /// A review from the Revision Garden or by a parent/teacher.
  PassageProgress review(
    PassageProgress p,
    ReviewResult r,
    DateTime now, {
    bool byAdult = false,
  }) {
    final log = [...p.reviews, ReviewRecord(now, r, byAdult: byAdult)];
    final history = log.length > 30 ? log.sublist(log.length - 30) : log;
    switch (r) {
      case ReviewResult.confident:
        final next = (p.intervalIndex + 1).clamp(0, intervalsDays.length - 1);
        final first = p.firstRecallAt ?? now;
        // "Retained After Review" must be a DELAYED recall, never the same
        // sitting as the first success.
        final delayed = now.difference(first) >= const Duration(days: 1);
        return p.copyWith(
          mastery: delayed ? Mastery.retained : Mastery.independent,
          firstRecallAt: first,
          intervalIndex: next,
          nextReview: _after(now, next),
          lastReview: now,
          reviews: history,
          reassigned: false,
        );
      case ReviewResult.prompting:
        // Shorten the interval; revisit the ayah and bridge tomorrow at most.
        final next = (p.intervalIndex - 1).clamp(1, intervalsDays.length - 1);
        return p.copyWith(
          mastery: Mastery.withHelp,
          intervalIndex: next,
          nextReview: _after(now, next),
          lastReview: now,
          reviews: history,
        );
      case ReviewResult.relearn:
        // Back to listen + echo: the lesson restarts at "Hear it".
        return p.copyWith(
          step: 0,
          mastery: Mastery.practicing,
          clearFirstRecall: true,
          intervalIndex: 0,
          clearNextReview: true,
          lastReview: now,
          reviews: history,
          clearApproval: true,
        );
    }
  }

  /// A parent/teacher sends the passage back to be learned again.
  PassageProgress reassign(PassageProgress p, DateTime now) =>
      review(p, ReviewResult.relearn, now, byAdult: true)
          .copyWith(reassigned: true);
}

abstract class QuranProgressStore {
  Future<QuranProgress> load();
  Future<void> save(QuranProgress progress);
}

/// Device-only progress per learner scope, as DeviceHadithProgressStore.
/// No points and no Firebase writes.
class DeviceQuranProgressStore implements QuranProgressStore {
  DeviceQuranProgressStore({
    required String scope,
    required this.readValue,
    required this.writeValue,
  }) : key = 'imaan.quran.v1.${Uri.encodeComponent(scope)}';
  factory DeviceQuranProgressStore.forLearner(String scope) {
    // Created on first use, so a missing platform plugin surfaces as a
    // load/save error the screen can show, not a crash while building.
    SharedPreferencesAsync? prefs;
    SharedPreferencesAsync p() => prefs ??= SharedPreferencesAsync();
    return DeviceQuranProgressStore(
      scope: scope,
      readValue: (k) => p().getString(k),
      writeValue: (k, v) => p().setString(k, v),
    );
  }
  final String key;
  final Future<String?> Function(String) readValue;
  final Future<void> Function(String, String) writeValue;

  @override
  Future<QuranProgress> load() async {
    final text = await readValue(key);
    if (text == null) return const QuranProgress();
    try {
      return QuranProgress.fromMap(
        Map<String, dynamic>.from(jsonDecode(text) as Map),
      );
    } catch (_) {
      // Never overwrite unreadable saved progress with an empty document.
      throw StateError('Your saved progress could not be read.');
    }
  }

  @override
  Future<void> save(QuranProgress progress) =>
      writeValue(key, jsonEncode(progress.toMap()));
}
