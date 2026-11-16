import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Shared, gentle rewards for the Individual courses: stars for finishing a
/// lesson or mission, a badge for finishing a whole world or volume, and a
/// daily learning streak.
///
/// Guardrail from the course manuals: rewards are for *learning* steps only.
/// There are no points for acts of worship themselves and no leaderboard;
/// everything stays on this device for the current learner.

/// One earned badge: a world, volume or journey finished.
@immutable
class RewardBadge {
  const RewardBadge({
    required this.id,
    required this.course,
    required this.title,
    required this.earnedAt,
  });

  /// `<course>/<group>`, e.g. `duas/volume-01`.
  final String id;

  /// Course key, e.g. `duas` (see [rewardCourseNames]).
  final String course;
  final String title;
  final DateTime earnedAt;

  Map<String, dynamic> toMap() => {
    'id': id,
    'course': course,
    'title': title,
    'earnedAt': earnedAt.toUtc().toIso8601String(),
  };

  static RewardBadge? fromMap(Object? m) {
    if (m is! Map) return null;
    final id = m['id'], course = m['course'], title = m['title'];
    if (id is! String || course is! String || title is! String) return null;
    return RewardBadge(
      id: id,
      course: course,
      title: title,
      earnedAt:
          DateTime.tryParse('${m['earnedAt']}') ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
    );
  }
}

/// Display names for the course keys used in badges.
const rewardCourseNamesUrdu = {
  'quran': 'قرآن',
  'hadith': 'حدیث',
  'duas': 'دعائیں',
  'salah': 'نماز',
  'tafsir': 'تفسیر',
  'ibrah': 'قصص الانبیاء',
  'hajj': 'حج و عمرہ',
  'taleem': 'تعلیم الاسلام',
};

const rewardCourseNames = {
  'quran': 'Qur’an',
  'hadith': 'Hadith',
  'duas': 'Duas',
  'salah': 'Salah',
  'tafsir': 'Tafsir',
  'ibrah': 'Prophet Stories',
  'hajj': 'Hajj & Umrah',
  'taleem': 'Taleem-ul-Islam',
};

/// Everything earned by one learner on this device.
@immutable
class RewardState {
  const RewardState({
    this.itemStars = const {},
    this.badges = const [],
    this.streak = 0,
    this.bestStreak = 0,
    this.lastDay,
  });

  /// Stars per finished item, keyed `<course>/<item>`. Each item counts once.
  final Map<String, int> itemStars;
  final List<RewardBadge> badges;
  final int streak, bestStreak;

  /// Local date (yyyy-mm-dd) of the last finished item.
  final String? lastDay;

  int get stars => itemStars.values.fold(0, (a, b) => a + b);
  int get finished => itemStars.length;
  bool hasBadge(String id) => badges.any((b) => b.id == id);

  /// The streak as it stands [today]: it lapses once a whole day is missed.
  int streakOn(DateTime today) {
    final last = lastDay == null ? null : DateTime.tryParse(lastDay!);
    if (last == null) return 0;
    final gap = _day(today).difference(last).inDays;
    return gap <= 1 ? streak : 0;
  }

  bool learnedOn(DateTime today) => lastDay == dayKey(today);

  Map<String, dynamic> toMap() => {
    'version': 1,
    'itemStars': itemStars,
    'badges': [for (final b in badges) b.toMap()],
    'streak': streak,
    'bestStreak': bestStreak,
    'lastDay': ?lastDay,
  };

  static RewardState fromMap(Object? m) {
    if (m is! Map || m['version'] != 1) return const RewardState();
    final stars = <String, int>{};
    final raw = m['itemStars'];
    if (raw is Map) {
      raw.forEach((k, v) {
        if (k is String && v is int) stars[k] = v.clamp(1, 3);
      });
    }
    final badges = <RewardBadge>[
      if (m['badges'] is List)
        for (final b in m['badges'] as List) ?RewardBadge.fromMap(b),
    ];
    int n(Object? v) => v is int && v >= 0 ? v : 0;
    return RewardState(
      itemStars: stars,
      badges: badges,
      streak: n(m['streak']),
      bestStreak: n(m['bestStreak']),
      lastDay: m['lastDay'] is String ? m['lastDay'] as String : null,
    );
  }
}

/// What one finished item earned, for the celebration.
@immutable
class RewardResult {
  const RewardResult({
    required this.stars,
    required this.totalStars,
    required this.streak,
    required this.streakGrew,
    this.badge,
  });
  final int stars, totalStars, streak;
  final bool streakGrew;
  final RewardBadge? badge;
}

String dayKey(DateTime t) {
  final d = t.toLocal();
  String two(int v) => v.toString().padLeft(2, '0');
  return '${d.year}-${two(d.month)}-${two(d.day)}';
}

DateTime _day(DateTime t) {
  final d = t.toLocal();
  return DateTime(d.year, d.month, d.day);
}

/// Where a learner's rewards are kept. Swappable for tests.
abstract class RewardStorage {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
}

class DeviceRewardStorage implements RewardStorage {
  // Created on first use, inside the ledger's try/catch, so a missing
  // platform implementation (widget tests) never crashes the app.
  SharedPreferencesAsync? _p;
  SharedPreferencesAsync get _prefs => _p ??= SharedPreferencesAsync();
  @override
  Future<String?> read(String key) async => _prefs.getString(key);
  @override
  Future<void> write(String key, String value) async =>
      _prefs.setString(key, value);
}

class MemoryRewardStorage implements RewardStorage {
  final data = <String, String>{};
  @override
  Future<String?> read(String key) async => data[key];
  @override
  Future<void> write(String key, String value) async => data[key] = value;
}

/// The app-wide rewards ledger for the learner who is using the app now.
///
/// Course screens are pushed as separate routes, so they reach the ledger
/// through [Rewards.instance] rather than an inherited widget. The shell sets
/// the learner with [use]; course screens call [finish].
class Rewards extends ChangeNotifier {
  Rewards({RewardStorage? storage, DateTime Function()? clock})
    : storage = storage ?? DeviceRewardStorage(),
      clock = clock ?? DateTime.now;

  static Rewards instance = Rewards();

  final RewardStorage storage;
  final DateTime Function() clock;

  String? _scope;
  RewardState _state = const RewardState();
  Future<void>? _loading;

  String? get scope => _scope;
  RewardState get state => _state;

  String _key(String scope) => 'imaan.rewards.v1.${Uri.encodeComponent(scope)}';

  /// Switches to [scope]'s rewards (loading them once).
  Future<void> use(String scope) {
    if (_scope == scope && _loading != null) return _loading!;
    _scope = scope;
    _state = const RewardState();
    return _loading = _load(scope);
  }

  Future<void> _load(String scope) async {
    RewardState next = const RewardState();
    try {
      final text = await storage.read(_key(scope));
      if (text != null) next = RewardState.fromMap(jsonDecode(text));
    } catch (_) {
      // Unreadable or unavailable storage: start fresh, never block learning.
    }
    if (_scope != scope) return;
    _state = next;
    notifyListeners();
  }

  /// Records a finished lesson or mission and returns what it earned, or
  /// null when [item] was already finished before (each counts once).
  ///
  /// [mistakes] lowers the stars (3 → 1, never below one): every finished
  /// step is worth something. When [group] and [groupItems] are given and
  /// every item of the group is now finished, the group's badge is earned.
  Future<RewardResult?> finish({
    required String course,
    required String item,
    int mistakes = 0,
    String? group,
    String? groupTitle,
    Iterable<String>? groupItems,
  }) async {
    final scope = _scope ?? 'guest';
    await use(scope);
    final key = '$course/$item';
    if (_state.itemStars.containsKey(key)) return null;
    final stars = (3 - mistakes).clamp(1, 3);
    final now = clock();
    final today = dayKey(now);
    final current = _state.streakOn(now);
    final grew = !_state.learnedOn(now);
    final streak = grew ? current + 1 : current;
    final itemStars = {..._state.itemStars, key: stars};
    RewardBadge? badge;
    if (group != null && groupItems != null) {
      final id = '$course/$group';
      final all = groupItems.toList();
      final done =
          all.isNotEmpty &&
          all.every((i) => itemStars.containsKey('$course/$i'));
      if (done && !_state.hasBadge(id)) {
        badge = RewardBadge(
          id: id,
          course: course,
          title: groupTitle ?? group,
          earnedAt: now.toUtc(),
        );
      }
    }
    _state = RewardState(
      itemStars: itemStars,
      badges: [..._state.badges, ?badge],
      streak: streak,
      bestStreak: streak > _state.bestStreak ? streak : _state.bestStreak,
      lastDay: today,
    );
    notifyListeners();
    try {
      await storage.write(_key(scope), jsonEncode(_state.toMap()));
    } catch (_) {
      // Kept in memory for this visit; the lesson itself is already saved.
    }
    return RewardResult(
      stars: stars,
      totalStars: _state.stars,
      streak: streak,
      streakGrew: grew,
      badge: badge,
    );
  }
}
