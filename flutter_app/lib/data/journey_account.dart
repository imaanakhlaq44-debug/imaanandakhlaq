import 'package:cloud_firestore/cloud_firestore.dart';

import 'learning_journey.dart';

Future<bool> journeyReleaseApproved(FirebaseFirestore db) async {
  try {
    final hash = await journeyReleaseHash();
    final publication = await db
        .collection('journey_publications')
        .doc(hash)
        .get(const GetOptions(source: Source.server))
        .timeout(const Duration(seconds: 5));
    return publication.data()?['active'] == true;
  } catch (_) {
    return false;
  }
}

Future<List<JourneyLevel>> loadPublishedJourney() async {
  if (!await journeyReleaseApproved(FirebaseFirestore.instance)) {
    throw StateError('The Journey package has not been approved for release.');
  }
  return loadJourneyPreview();
}

class JourneyPreferences {
  const JourneyPreferences({
    this.sync = false,
    this.supported = false,
    this.sessionMinutes = 0,
    this.lane,
  });

  factory JourneyPreferences.fromMap(Map<String, dynamic>? data) =>
      JourneyPreferences(
        sync: data?['sync'] == true,
        supported: data?['supported'] == true,
        sessionMinutes: data?['sessionMinutes'] as int? ?? 0,
        lane: JourneyLane.values
            .where((item) => item.name == data?['ageLane'])
            .firstOrNull,
      );

  final bool sync, supported;
  final int sessionMinutes;
  final JourneyLane? lane;

  JourneyPreferences copyWith({
    bool? sync,
    bool? supported,
    int? sessionMinutes,
  }) => JourneyPreferences(
    sync: sync ?? this.sync,
    supported: supported ?? this.supported,
    sessionMinutes: sessionMinutes ?? this.sessionMinutes,
    lane: lane,
  );

  Map<String, dynamic> toMap() => {
    'sync': sync,
    'supported': supported,
    'sessionMinutes': sessionMinutes,
    if (lane != null) 'ageLane': lane!.name,
  };

  static DocumentReference<Map<String, dynamic>> document(
    FirebaseFirestore db,
    String learnerId,
  ) => db.collection('journey_preferences').doc(learnerId);
}

class FirebaseJourneyStore implements JourneyStore {
  FirebaseJourneyStore(this._db, this._learnerId)
    : _local = DeviceJourneyStore('learner:$_learnerId');

  final FirebaseFirestore _db;
  final String _learnerId;
  final DeviceJourneyStore _local;
  JourneyPreferences preferences = const JourneyPreferences();
  bool upToDate = false;
  final _confirmed = <String, JourneyProgress>{};
  static const _networkBudget = Duration(seconds: 4);

  CollectionReference<Map<String, dynamic>> get _levels =>
      _db.collection('journey_progress').doc(_learnerId).collection('levels');

  static JourneyProgress _read(Map<String, dynamic> data) => JourneyProgress(
    completedAt: (data['completedAt'] as Timestamp).toDate().toUtc(),
    nextReviewAt: (data['nextReviewAt'] as Timestamp?)?.toDate().toUtc(),
    reviewCount: data['reviews'] as int,
  );

  static Map<String, dynamic> _write(JourneyProgress value) => {
    'completedAt': Timestamp.fromDate(value.completedAt),
    'nextReviewAt': value.nextReviewAt == null
        ? null
        : Timestamp.fromDate(value.nextReviewAt!),
    'reviews': value.reviewCount,
  };

  @override
  Future<JourneyRecord> load() async {
    final local = await _local.load();
    try {
      final settings = await JourneyPreferences.document(
        _db,
        _learnerId,
      ).get().timeout(_networkBudget);
      preferences = JourneyPreferences.fromMap(settings.data());
      if (!preferences.sync) return local;
      final cloud = await _levels
          .get(const GetOptions(source: Source.server))
          .timeout(_networkBudget);
      _confirmed
        ..clear()
        ..addEntries(
          cloud.docs.map((doc) => MapEntry(doc.id, _read(doc.data()))),
        );
      final merged = local.merge(JourneyRecord(levels: _confirmed));
      await _local.save(merged);
      upToDate = !_needsSync(merged);
      return merged;
    } catch (_) {
      upToDate = false;
      return local;
    }
  }

  bool _needsSync(JourneyRecord record) => record.levels.entries.any(
    (level) => level.value != _confirmed[level.key],
  );

  @override
  Future<JourneyRecord> save(JourneyRecord record) async {
    await _local.save(record);
    if (!preferences.sync || !_needsSync(record)) return record;
    upToDate = false;
    try {
      // Retrying a save on another device keeps the strongest review state.
      // Save a bounded batch per visit so older device history can catch up
      // without making a new completion wait for hundreds of writes.
      final pending = record.levels.entries
          .toList()
          .reversed
          .where((entry) => entry.value != _confirmed[entry.key])
          .take(20);
      final saved = await Future.wait([
        for (final entry in pending)
          _saveOne(
            entry.key,
            entry.value,
          ).then((value) => MapEntry(entry.key, value)),
      ]).timeout(_networkBudget);
      _confirmed.addEntries(saved);
      final merged = record.merge(JourneyRecord(levels: _confirmed));
      await _local.save(merged);
      upToDate = !_needsSync(merged);
      return merged;
    } catch (_) {
      // Device progress remains usable and can be retried from the map.
      return record;
    }
  }

  Future<JourneyProgress> _saveOne(String id, JourneyProgress local) =>
      _db.runTransaction((transaction) async {
        final doc = _levels.doc(id);
        final snapshot = await transaction.get(doc);
        final data = snapshot.data();
        final saved = data == null ? null : _read(data);
        final merged = saved == null ? local : local.merge(saved);
        if (merged != saved) {
          transaction.set(doc, _write(merged));
        }
        return merged;
      }, timeout: _networkBudget);
}
