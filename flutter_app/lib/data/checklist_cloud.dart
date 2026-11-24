import 'package:cloud_firestore/cloud_firestore.dart';

/// Where a signed-in learner's daily checklists are kept on the server, so
/// they follow the child to another device and parents can see them.
///
/// One document per day holds every checklist for that day:
/// `daily_checklists/{learnerId}/days/{yyyy-mm-dd}` with a list of ticked
/// item ids per checklist (`salah`, `quran`, `duas`, `hadith`, `deeds`,
/// `challenge`). A parent's confirmation is stored on the same day as
/// `confirmed` (checklist id → the items the parent saw) and `confirmedAt`.
abstract class ChecklistCloud {
  /// Identifies the learner, so the same cloud is not loaded twice.
  String get learnerId;

  /// Day key → checklist id → ticked items, for days on or after [from].
  /// What a parent confirmed comes under [confirmedKey] of the checklist.
  Future<Map<String, Map<String, Set<String>>>> loadSince(String from);

  /// Replaces one checklist's ticks for one day.
  Future<void> save(String day, String checklist, Set<String> items);

  /// Records that a parent saw [ticks] (checklist id → items) on [day].
  Future<void> confirm(String day, Map<String, Set<String>> ticks);
}

/// Where a checklist's confirmed items sit in a loaded day.
String confirmedKey(String checklist) => 'confirmed:$checklist';

/// Checklist ids the server accepts (see firestore.rules).
const checklistIds = ['salah', 'quran', 'duas', 'hadith', 'deeds', 'challenge'];

class FirebaseChecklistCloud implements ChecklistCloud {
  FirebaseChecklistCloud(this._db, this.learnerId);

  final FirebaseFirestore _db;
  @override
  final String learnerId;
  static const _networkBudget = Duration(seconds: 4);

  // Every checklist loads at once from the map; loads running at the same
  // time share one read, and a later visit reads afresh.
  final _loads = <String, Future<Map<String, Map<String, Set<String>>>>>{};

  CollectionReference<Map<String, dynamic>> get _days =>
      _db.collection('daily_checklists').doc(learnerId).collection('days');

  @override
  Future<Map<String, Map<String, Set<String>>>> loadSince(String from) {
    final running = _loads[from];
    if (running != null) return running;
    final load = _loads[from] = _load(from);
    load
        .then<void>((_) {}, onError: (Object _) {})
        .whenComplete(() => _loads.remove(from));
    return load;
  }

  Future<Map<String, Map<String, Set<String>>>> _load(String from) async {
    final snapshot = await _days
        .where(FieldPath.documentId, isGreaterThanOrEqualTo: from)
        .get()
        .timeout(_networkBudget);
    Set<String> strings(List<dynamic> list) => {
      for (final v in list)
        if (v is String) v,
    };
    return {
      for (final doc in snapshot.docs)
        doc.id: {
          for (final id in checklistIds)
            if (doc.data()[id] case final List<dynamic> list) id: strings(list),
          if (doc.data()['confirmed'] case final Map<String, dynamic> seen)
            for (final id in checklistIds)
              if (seen[id] case final List<dynamic> list)
                confirmedKey(id): strings(list),
        },
    };
  }

  @override
  Future<void> save(String day, String checklist, Set<String> items) => _days
      .doc(day)
      .set({
        checklist: items.toList()..sort(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true))
      .timeout(_networkBudget);

  @override
  Future<void> confirm(String day, Map<String, Set<String>> ticks) => _days
      .doc(day)
      .set({
        // Replaced whole, so an item the child later unticked drops out.
        'confirmed': {
          for (final e in ticks.entries)
            if (e.value.isNotEmpty) e.key: e.value.toList()..sort(),
        },
        'confirmedAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(mergeFields: ['confirmed', 'confirmedAt', 'updatedAt']))
      .timeout(_networkBudget);
}

/// An in-memory server, for tests.
class MemoryChecklistCloud implements ChecklistCloud {
  MemoryChecklistCloud(this.learnerId);
  @override
  final String learnerId;
  final days = <String, Map<String, Set<String>>>{};
  bool offline = false;
  int saves = 0;

  @override
  Future<Map<String, Map<String, Set<String>>>> loadSince(String from) async {
    if (offline) throw StateError('offline');
    return {
      for (final e in days.entries)
        if (e.key.compareTo(from) >= 0)
          e.key: {
            for (final c in e.value.entries) c.key: {...c.value},
          },
    };
  }

  @override
  Future<void> save(String day, String checklist, Set<String> items) async {
    if (offline) throw StateError('offline');
    saves++;
    (days[day] ??= {})[checklist] = {...items};
  }

  @override
  Future<void> confirm(String day, Map<String, Set<String>> ticks) async {
    if (offline) throw StateError('offline');
    final d = days[day] ??= {};
    d.removeWhere((k, _) => k.startsWith('confirmed:'));
    for (final e in ticks.entries) {
      if (e.value.isNotEmpty) d[confirmedKey(e.key)] = {...e.value};
    }
  }
}
