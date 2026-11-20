import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

const learningJourneyPreview = bool.fromEnvironment('LEARNING_JOURNEY_PREVIEW');
const learningJourneyRelease = bool.fromEnvironment('LEARNING_JOURNEY_RELEASE');
const learningJourneyEnabled = learningJourneyPreview || learningJourneyRelease;

enum JourneyLane {
  parentLed('3–5', 'Adult-led'),
  guided('6–8', 'Guided'),
  core('9–11', 'Core'),
  advanced('12–14', 'Advanced');

  const JourneyLane(this.ages, this.label);
  final String ages, label;

  List<JourneyLevel> eligibleLevels(List<JourneyLevel> catalogue) {
    final allowed = {for (final level in catalogue.where(includes)) level.id};
    return catalogue
        .where(
          (level) =>
              allowed.contains(level.id) &&
              (!level.comparison || level.stations.every(allowed.contains)),
        )
        .toList();
  }

  bool includes(JourneyLevel level) {
    if (this == parentLed) {
      return level.number <= 60 &&
          (level.world == 'DUA' ||
              level.world == 'QUR' ||
              level.world == 'HAJ');
    }
    if (level.world != 'RHD' || level.stations.isNotEmpty) return true;
    final volume = int.tryParse(level.sourceUnit.split('-')[1].substring(1));
    return volume != null &&
        volume <=
            switch (this) {
              parentLed || guided => 1,
              core => 3,
              advanced => 4,
            };
  }
}

class JourneyLevel {
  const JourneyLevel({
    required this.id,
    required this.number,
    required this.title,
    required this.world,
    required this.sourceUnit,
    required this.sourceReference,
    required this.brief,
    this.stations = const [],
  });

  final String id, title, world, sourceUnit, sourceReference;
  final int number;

  final List<String> stations;
  final Map<String, String> brief;

  String get difficulty => brief['difficulty']!;
  bool get checkpoint => brief['levelType'] == 'MILESTONE_CHECKPOINT';
  bool get cumulative => const {60, 200, 600, 1000}.contains(number);
  bool get comparison => stations.length == 2;
}

Future<Map<String, dynamic>> _loadManifest() async {
  final asset = await rootBundle.loadString('assets/data/journey-preview.json');
  final json = jsonDecode(asset) as Map<String, dynamic>;
  if (json['schema'] != 2) {
    throw const FormatException('Unsupported journey catalogue');
  }
  return json;
}

Future<String> journeyReleaseHash() async {
  final hash = (await _loadManifest())['releaseHash'];
  if (hash is! String || !RegExp(r'^[0-9a-f]{64}$').hasMatch(hash)) {
    throw const FormatException('Invalid Journey release');
  }
  return hash;
}

Future<List<JourneyLevel>> loadJourneyPreview() async {
  final json = await _loadManifest();
  return [
    for (final level in json['levels'] as List)
      JourneyLevel(
        id: level['id'] as String,
        number: level['number'] as int,
        title: level['title'] as String,
        world: level['world'] as String,
        sourceUnit: level['sourceUnit'] as String,
        sourceReference: level['sourceReference'] as String,
        brief: Map<String, String>.unmodifiable(
          (level['brief'] as Map).cast<String, String>(),
        ),
        stations: (level['stations'] as List?)?.cast<String>() ?? const [],
      ),
  ];
}

const _reviewDays = [1, 3, 7];

class JourneyProgress {
  const JourneyProgress({
    required this.completedAt,
    required this.nextReviewAt,
    this.reviewCount = 0,
  });

  final DateTime completedAt;
  final DateTime? nextReviewAt;
  final int reviewCount;

  JourneyProgress merge(JourneyProgress other) {
    final latest = reviewCount > other.reviewCount
        ? this
        : reviewCount < other.reviewCount
        ? other
        : (nextReviewAt != null &&
              other.nextReviewAt != null &&
              nextReviewAt!.isAfter(other.nextReviewAt!))
        ? other
        : this;
    return JourneyProgress(
      completedAt: completedAt.isBefore(other.completedAt)
          ? completedAt
          : other.completedAt,
      nextReviewAt: latest.nextReviewAt,
      reviewCount: latest.reviewCount,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is JourneyProgress &&
      completedAt == other.completedAt &&
      nextReviewAt == other.nextReviewAt &&
      reviewCount == other.reviewCount;

  @override
  int get hashCode => Object.hash(completedAt, nextReviewAt, reviewCount);
}

class JourneyRecord {
  const JourneyRecord({
    this.levels = const {},
    this.capstoneStations = const {},
  });

  final Map<String, JourneyProgress> levels;
  final Set<int> capstoneStations;

  JourneyRecord finishStation(int index) => JourneyRecord(
    levels: levels,
    capstoneStations: {...capstoneStations, index},
  );

  JourneyRecord merge(JourneyRecord other) => JourneyRecord(
    levels: {
      ...levels,
      for (final entry in other.levels.entries)
        entry.key: levels[entry.key]?.merge(entry.value) ?? entry.value,
    },
    capstoneStations:
        levels.containsKey('IA-1000') || other.levels.containsKey('IA-1000')
        ? const {}
        : {...capstoneStations, ...other.capstoneStations},
  );

  bool unlocked(List<JourneyLevel> catalogue, JourneyLevel level) => catalogue
      .takeWhile((item) => item.id != level.id)
      .every((item) => levels.containsKey(item.id));

  bool due(JourneyLevel level, DateTime now) {
    final date = levels[level.id]?.nextReviewAt;
    return date != null && !date.isAfter(now);
  }

  JourneyLevel? next(List<JourneyLevel> catalogue, DateTime now) {
    JourneyLevel? review;
    for (final level in catalogue) {
      if (!levels.containsKey(level.id)) return review ?? level;
      if (!due(level, now)) continue;
      if (review == null ||
          levels[level.id]!.nextReviewAt!.isBefore(
            levels[review.id]!.nextReviewAt!,
          )) {
        review = level;
      }
    }
    return review;
  }

  JourneyRecord finish(JourneyLevel level, DateTime now) {
    final previous = levels[level.id];
    if (previous != null && !due(level, now)) return this;
    final completedAt = previous?.completedAt ?? now.toUtc();
    final reviewCount = previous == null ? 0 : previous.reviewCount + 1;
    return JourneyRecord(
      capstoneStations: level.number == 1000 ? const {} : capstoneStations,
      levels: {
        ...levels,
        level.id: JourneyProgress(
          completedAt: completedAt,
          reviewCount: reviewCount,
          nextReviewAt: reviewCount < _reviewDays.length
              ? now.toUtc().add(Duration(days: _reviewDays[reviewCount]))
              : null,
        ),
      },
    );
  }

  factory JourneyRecord.decode(String value) {
    final json = jsonDecode(value) as Map<String, dynamic>;
    if (json['version'] != 1) {
      throw const FormatException('Unknown progress version');
    }
    final levels = <String, JourneyProgress>{};
    for (final entry in (json['levels'] as Map<String, dynamic>).entries) {
      final item = entry.value as Map<String, dynamic>;
      final count = item['reviews'] as int;
      final next = item['nextReviewAt'] as String?;
      if (count < 0 ||
          count > _reviewDays.length ||
          (next == null) != (count == _reviewDays.length)) {
        throw const FormatException('Invalid review progress');
      }
      levels[entry.key] = JourneyProgress(
        completedAt: DateTime.parse(item['completedAt'] as String).toUtc(),
        nextReviewAt: next == null ? null : DateTime.parse(next).toUtc(),
        reviewCount: count,
      );
    }
    final stations = <int>{
      for (final station in json['capstoneStations'] as List? ?? const [])
        if (station is int && station >= 0 && station < 8) station,
    };
    return JourneyRecord(
      levels: levels,
      capstoneStations: levels.containsKey('IA-1000') ? const {} : stations,
    );
  }

  String encode() => jsonEncode({
    'version': 1,
    if (capstoneStations.isNotEmpty)
      'capstoneStations': capstoneStations.toList(),
    'levels': {
      for (final entry in levels.entries)
        entry.key: {
          'completedAt': entry.value.completedAt.toIso8601String(),
          'reviews': entry.value.reviewCount,
          'nextReviewAt': entry.value.nextReviewAt?.toIso8601String(),
        },
    },
  });
}

abstract interface class JourneyStore {
  Future<JourneyRecord> load();
  Future<JourneyRecord> save(JourneyRecord record);
}

class DeviceJourneyStore implements JourneyStore {
  DeviceJourneyStore(String scope)
    : _key = 'imaan.journey.v1.${Uri.encodeComponent(scope)}';

  final String _key;
  final _preferences = SharedPreferencesAsync();

  @override
  Future<JourneyRecord> load() async {
    final value = await _preferences.getString(_key);
    return value == null ? const JourneyRecord() : JourneyRecord.decode(value);
  }

  @override
  Future<JourneyRecord> save(JourneyRecord record) async {
    await _preferences.setString(_key, record.encode());
    return record;
  }
}
