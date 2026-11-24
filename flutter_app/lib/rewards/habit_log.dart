import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../data/checklist_cloud.dart';
import 'rewards.dart' show RewardStorage, DeviceRewardStorage, dayKey;

/// Streak goals a child works towards; reaching one is celebrated once.
const habitStreakGoals = [3, 7, 14, 30, 40];

/// How many past days (besides today) a child may still fill in, so a
/// forgotten tick can be fixed without rewriting older history.
const habitEditableDays = 1;

/// How far back a device fetches the server copy on each visit.
const habitCloudDays = 60;

/// How many days back the server still accepts a change (firestore.rules
/// allows three, measured in UTC; two keeps clear of time-zone edges).
const habitCloudGraceDays = 2;

/// One learner's record for a daily checklist: for each day, which items
/// were done.
@immutable
class HabitRecord {
  const HabitRecord({
    this.days = const {},
    this.bestStreak = 0,
    this.confirmed = const {},
  });

  /// Day key (yyyy-mm-dd) → item ids done that day.
  final Map<String, Set<String>> days;
  final int bestStreak;

  /// Day key → the items a parent saw and confirmed that day.
  final Map<String, Set<String>> confirmed;

  Set<String> on(DateTime day) => days[dayKey(day)] ?? const {};
  int countOn(DateTime day) => on(day).length;

  /// Whether a parent has confirmed everything ticked on [day].
  bool confirmedOn(DateTime day) {
    final ticked = on(day);
    final seen = confirmed[dayKey(day)] ?? const <String>{};
    return ticked.isNotEmpty && seen.containsAll(ticked);
  }

  /// Days in a row with at least [goal] items done, ending today — or
  /// yesterday while today is still in progress.
  int streakOn(DateTime now, int goal) {
    var day = _day(now);
    if (countOn(day) < goal) day = DateTime(day.year, day.month, day.day - 1);
    var streak = 0;
    while (countOn(day) >= goal) {
      streak++;
      day = DateTime(day.year, day.month, day.day - 1);
    }
    return streak;
  }

  /// Items done in the seven days ending [now].
  int weekCount(DateTime now) {
    final today = _day(now);
    var total = 0;
    for (var i = 0; i < 7; i++) {
      total += countOn(DateTime(today.year, today.month, today.day - i));
    }
    return total;
  }

  /// Days of [now]'s Monday-to-Sunday week with anything done.
  int daysThisWeek(DateTime now) {
    final today = _day(now);
    final monday = DateTime(
      today.year,
      today.month,
      today.day - (today.weekday - 1),
    );
    var total = 0;
    for (var i = 0; i < 7; i++) {
      if (countOn(DateTime(monday.year, monday.month, monday.day + i)) > 0) {
        total++;
      }
    }
    return total;
  }
}

/// What a tick changed, so the screen can celebrate it.
@immutable
class HabitTick {
  const HabitTick({
    required this.done,
    required this.dayComplete,
    required this.streak,
    this.goalReached,
  });
  final bool done;

  /// True when this tick just finished every item for the day.
  final bool dayComplete;
  final int streak;

  /// The streak goal this tick reached for the first time, if any.
  final int? goalReached;
}

/// A daily checklist (salah, Quran, duas, hadith, good deeds…) for the
/// learner using the app now.
///
/// Ticks are saved on the device first, so a child can always tick, even
/// offline. For a signed-in learner they are also sent to a [ChecklistCloud];
/// days not yet sent are remembered and retried on the next visit, and the
/// server copy is taken for every other day, so the same child sees the same
/// record on every device.
class HabitLog extends ChangeNotifier {
  HabitLog(
    this.id, {
    required this.items,
    RewardStorage? storage,
    DateTime Function()? clock,
  }) : storage = storage ?? DeviceRewardStorage(),
       clock = clock ?? DateTime.now;

  static final _shared = <String, HabitLog>{};

  /// Forgets every app-wide log, so each test starts from nothing.
  @visibleForTesting
  static void resetShared() => _shared.clear();

  /// The app-wide log for checklist [id] with [items] ticks a day.
  static HabitLog of(String id, {required int items}) =>
      _shared.putIfAbsent(id, () => HabitLog(id, items: items));

  final String id;

  /// How many items make a full day.
  final int items;
  final RewardStorage storage;
  final DateTime Function() clock;

  String? _scope;
  ChecklistCloud? _cloud;
  HabitRecord _record = const HabitRecord();
  Set<String> _pending = {};
  Future<void>? _loading;

  String? get scope => _scope;
  HabitRecord get record => _record;

  /// Days ticked on this device that the server does not have yet.
  Set<String> get pendingDays => Set.unmodifiable(_pending);

  String _key(String scope) =>
      'imaan.habits.v1.$id.${Uri.encodeComponent(scope)}';

  /// Switches to [scope]'s record, loading it once. With [cloud], the
  /// record is also kept on the server; a call without one keeps the cloud
  /// already attached to the same scope.
  Future<void> use(String scope, {ChecklistCloud? cloud}) {
    final sameCloud = cloud == null || cloud.learnerId == _cloud?.learnerId;
    if (_scope == scope && sameCloud && _loading != null) return _loading!;
    _scope = scope;
    if (cloud != null || !sameCloud) _cloud = cloud;
    _record = const HabitRecord();
    _pending = {};
    return _loading = _load(scope, _cloud);
  }

  /// Fetches the server copy again (a parent may have confirmed since).
  Future<void> refresh() async {
    final scope = _scope, cloud = _cloud;
    if (scope == null || cloud == null) return;
    await _loading;
    await _syncDown(scope, cloud);
  }

  Future<void> _load(String scope, ChecklistCloud? cloud) async {
    var days = <String, Set<String>>{};
    var confirmed = <String, Set<String>>{};
    var best = 0;
    var pending = <String>{};
    try {
      final text = await storage.read(_key(scope));
      if (text != null) {
        final m = jsonDecode(text);
        if (m is Map) {
          days = _readDays(m['days']);
          confirmed = _readDays(m['confirmed']);
          if (m['bestStreak'] case final int b) best = b;
          if (m['pending'] case final List<dynamic> p) {
            pending = {
              for (final d in p)
                if (d is String) d,
            };
          }
        }
      }
    } catch (_) {
      // Unreadable storage: start fresh rather than block the child.
    }
    if (_scope != scope) return;
    _record = HabitRecord(days: days, bestStreak: best, confirmed: confirmed);
    _pending = pending;
    notifyListeners();
    if (cloud != null) await _syncDown(scope, cloud);
  }

  Future<void> _syncDown(String scope, ChecklistCloud cloud) async {
    final today = _day(clock());
    final from = dayKey(
      DateTime(today.year, today.month, today.day - habitCloudDays),
    );
    Map<String, Map<String, Set<String>>> server;
    try {
      server = await cloud.loadSince(from);
    } catch (_) {
      return; // Offline: the device copy stays in use.
    }
    if (_scope != scope || _cloud != cloud) return;
    // The server wins for every day this device has nothing new for.
    final days = {
      for (final e in _record.days.entries)
        if (e.key.compareTo(from) < 0 || _pending.contains(e.key))
          e.key: e.value,
    };
    // What a parent confirmed is only ever known from the server.
    final confirmed = {
      for (final e in _record.confirmed.entries)
        if (e.key.compareTo(from) < 0) e.key: e.value,
    };
    for (final e in server.entries) {
      final seen = e.value[confirmedKey(id)];
      if (seen != null && seen.isNotEmpty) confirmed[e.key] = seen;
      if (_pending.contains(e.key)) continue;
      final ticks = e.value[id];
      if (ticks != null && ticks.isNotEmpty) days[e.key] = ticks;
    }
    final merged = HabitRecord(days: days);
    final streak = merged.streakOn(clock(), items);
    _record = HabitRecord(
      days: days,
      bestStreak: streak > _record.bestStreak ? streak : _record.bestStreak,
      confirmed: confirmed,
    );
    notifyListeners();
    await _saveLocal(scope);
    await _push(scope, cloud);
  }

  Future<void> _pushing = Future.value();

  /// Sends every day the server has not got yet, one send at a time, so a
  /// quick second tap can never be overtaken by the first.
  Future<void> _push(String scope, ChecklistCloud cloud) =>
      _pushing = _pushing.then((_) => _pushNow(scope, cloud));

  Future<void> _pushNow(String scope, ChecklistCloud cloud) async {
    final today = _day(clock());
    final oldest = dayKey(
      DateTime(today.year, today.month, today.day - habitCloudGraceDays),
    );
    for (final day in _pending.toList()..sort()) {
      if (_scope != scope) return;
      if (day.compareTo(oldest) < 0) {
        // The server only accepts recent days; this one stays on the device.
        _pending = {..._pending}..remove(day);
        continue;
      }
      final sent = _record.days[day] ?? const <String>{};
      try {
        await cloud.save(day, id, sent);
      } catch (_) {
        return; // Still offline; kept for next time.
      }
      if (_scope != scope) return;
      // A tap while sending changed the day again: send it on the next turn.
      if (identical(_record.days[day] ?? const <String>{}, sent)) {
        _pending = {..._pending}..remove(day);
      }
    }
    await _saveLocal(scope);
  }

  Future<void> _saveLocal(String scope) async {
    try {
      await storage.write(
        _key(scope),
        jsonEncode({
          'days': {
            for (final e in _record.days.entries)
              if (e.value.isNotEmpty) e.key: e.value.toList(),
          },
          'bestStreak': _record.bestStreak,
          if (_record.confirmed.isNotEmpty)
            'confirmed': {
              for (final e in _record.confirmed.entries)
                e.key: e.value.toList(),
            },
          if (_pending.isNotEmpty) 'pending': _pending.toList(),
        }),
      );
    } catch (_) {
      // Kept in memory for this visit.
    }
  }

  bool canEdit(DateTime day) {
    final age = _day(clock()).difference(_day(day)).inDays;
    return age >= 0 && age <= habitEditableDays;
  }

  /// Ticks or unticks [item] on [day]. Returns null when the day is locked.
  Future<HabitTick?> toggle(String item, {DateTime? day}) async {
    final scope = _scope ?? 'guest';
    await use(scope);
    final now = clock();
    final when = _day(day ?? now);
    if (!canEdit(when)) return null;
    final key = dayKey(when);
    final current = {...?_record.days[key]};
    final done = !current.contains(item);
    done ? current.add(item) : current.remove(item);
    final days = {..._record.days, key: current};
    final streak = HabitRecord(days: days).streakOn(now, items);
    int? goal;
    for (final g in habitStreakGoals) {
      if (streak >= g && _record.bestStreak < g) goal = g;
    }
    _record = HabitRecord(
      days: days,
      bestStreak: streak > _record.bestStreak ? streak : _record.bestStreak,
      confirmed: _record.confirmed,
    );
    final cloud = _cloud;
    if (cloud != null) _pending = {..._pending, key};
    notifyListeners();
    await _saveLocal(scope);
    if (cloud != null) await _push(scope, cloud);
    return HabitTick(
      done: done,
      dayComplete: done && current.length == items,
      streak: streak,
      goalReached: goal,
    );
  }
}

Map<String, Set<String>> _readDays(Object? raw) {
  final days = <String, Set<String>>{};
  if (raw is! Map) return days;
  for (final e in raw.entries) {
    final list = e.value;
    if (e.key is! String || list is! List) continue;
    final set = {
      for (final v in list)
        if (v is String) v,
    };
    if (set.isNotEmpty) days[e.key as String] = set;
  }
  return days;
}

DateTime _day(DateTime t) {
  final d = t.toLocal();
  return DateTime(d.year, d.month, d.day);
}
