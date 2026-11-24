import 'package:flutter/foundation.dart';

import '../data/checklist_cloud.dart';
import 'habit_log.dart';
import 'rewards.dart' show RewardStorage;

/// The five daily prayers, in order through the day.
enum Prayer { fajr, zuhr, asr, maghrib, isha }

/// Streak goals a child works towards; reaching one is celebrated once.
const prayerStreakGoals = habitStreakGoals;

/// One learner's prayer record: for each day, which prayers were prayed.
@immutable
class PrayerRecord {
  const PrayerRecord(this._habits);
  final HabitRecord _habits;

  Set<Prayer> on(DateTime day) => {
    for (final name in _habits.on(day))
      for (final p in Prayer.values)
        if (p.name == name) p,
  };
  int countOn(DateTime day) => on(day).length;
  bool fullOn(DateTime day) => countOn(day) == Prayer.values.length;
  int get bestStreak => _habits.bestStreak;

  /// Whether a parent has confirmed everything ticked on [day].
  bool confirmedOn(DateTime day) => _habits.confirmedOn(day);

  /// Days in a row with all five prayers, ending today — or yesterday while
  /// today is still in progress, so the streak does not vanish each morning.
  int streakOn(DateTime now) => _habits.streakOn(now, Prayer.values.length);

  /// Total prayers ticked in the seven days ending [now].
  int weekCount(DateTime now) => _habits.weekCount(now);
}

/// What a tick changed, so the screen can celebrate it.
@immutable
class PrayerTick {
  const PrayerTick({
    required this.prayed,
    required this.dayComplete,
    required this.streak,
    this.goalReached,
  });
  final bool prayed;
  final bool dayComplete;
  final int streak;
  final int? goalReached;
}

/// The prayer tracker for the learner using the app now: the `salah`
/// checklist, saved like every other [HabitLog].
class PrayerLog extends ChangeNotifier {
  PrayerLog({RewardStorage? storage, DateTime Function()? clock})
    : habits = HabitLog(
        'salah',
        items: Prayer.values.length,
        storage: storage,
        clock: clock,
      ) {
    habits.addListener(notifyListeners);
  }

  static PrayerLog instance = PrayerLog();

  final HabitLog habits;

  DateTime Function() get clock => habits.clock;
  String? get scope => habits.scope;
  PrayerRecord get record => PrayerRecord(habits.record);

  Future<void> use(String scope, {ChecklistCloud? cloud}) =>
      habits.use(scope, cloud: cloud);

  Future<void> refresh() => habits.refresh();

  bool canEdit(DateTime day) => habits.canEdit(day);

  /// Ticks or unticks [prayer] on [day]. Returns null when the day is locked.
  Future<PrayerTick?> toggle(Prayer prayer, {DateTime? day}) async {
    final t = await habits.toggle(prayer.name, day: day);
    if (t == null) return null;
    return PrayerTick(
      prayed: t.done,
      dayComplete: t.dayComplete,
      streak: t.streak,
      goalReached: t.goalReached,
    );
  }
}
